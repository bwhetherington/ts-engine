import {WorldManager, Unit, Tank, KillEvent} from 'core/entity';
import {clamp, Queue} from 'core/util';
import {MovementDirection} from 'core/input';
import {NetworkManager} from 'core/net';
import {LogManager} from 'core/log';
import {RNGManager} from 'core/random';
import {Data} from 'core/serialize';
import { Vector, VectorLike } from 'core/geometry';
import { BLACK, GraphicsContext, rgb } from 'core/graphics';
import { Iterator } from 'core/iterator';
import { GraphicsPipeline } from 'core/graphics/pipe';

const log = LogManager.forFile(__filename);

export class Enemy extends Tank {
  public static typeName: string = 'Enemy';

  private target?: Unit;
  private moveQueue: Queue<Vector> = new Queue();

  public isActive: boolean = true;

  public constructor() {
    super();
    this.type = Enemy.typeName;
    this.turnSpeed = Math.PI * 4;

    this.setName('Gunner');
    this.setWeapon('Gun');

    if (this.label) {
      this.label.tag = ' [AI]';
    }

    this.setMaxLife(40);
    this.setXPWorth(10);

    if (NetworkManager.isServer()) {
      // Select target
      this.selectTarget();
      this.streamInterval(1)
        .forEach(() => {
          this.selectTarget();
        });
      this.streamEvents<KillEvent>('KillEvent')
        .filter(
          (event) => this.target?.id === event.data.targetID
        )
        .forEach(() => this.selectTarget());
    }
  }

  public damage(amount: number, source?: Unit): void {
    super.damage(amount, source);
    if (NetworkManager.isServer() && source) {
      this.target = source;
      this.moveTo(source.position);
    }
  }

  public moveTo(targetPoint: Vector): void {
    const path = WorldManager.findPath(this.position, targetPoint);
    if (path) {
      this.followPath(path);
    }
  }

  private selectTarget(): void {
    // Select the closest unit
    const [target] = WorldManager.getEntities()
      .filter((entity) => this !== entity)
      .filterMap((entity) => (entity instanceof Unit ? entity : undefined))
      .map<[Unit | undefined, number]>((entity) => [
        entity,
        entity.position.distanceTo(this.position),
      ])
      .fold(
        [<Unit | undefined>undefined, Number.POSITIVE_INFINITY],
        (min, cur) => {
          if (cur[1] < min[1]) {
            return cur;
          } else {
            return min;
          }
        }
      );
    if (target) {
      log.trace('select target ' + target.toString());
      this.target = target;
      this.moveTo(target.position);
    }
  }

  private moveToTarget(): void {
    // Check if we're within range of the target unit
    const distanceToTarget = this.target?.position?.distanceToXYSquared(this.position.x, this.position.y);
    if (distanceToTarget !== undefined && distanceToTarget <= (100 * 100)) {
      this.moveQueue = new Queue();
      this.setThrusting(0);
      return;
    }

    const targetPoint = this.moveQueue.peek();
    const closeEnough = this.boundingBox.width * 1.5;

    if (targetPoint) {
      if (this.position.distanceToXYSquared(targetPoint.x, targetPoint.y) < (closeEnough * closeEnough)) {
        // Close enough
        this.moveQueue.dequeue();
        this.setThrusting(0);
      } else {
        this.targetAngle = this.position.angleTo(targetPoint);
        this.weaponAngle = this.targetAngle;
        this.setThrusting(1);
      }
    } else {
      this.setThrusting(0);
      this.targetAngle = this.angle;
    }
  }

  public step(dt: number): void {
    super.step(dt);

    if (NetworkManager.isServer()) {
      // Reset movement
      this.setThrusting(0);
      this.moveToTarget();

      if (this.isActive) {
        const {target} = this;
        if (target && target.isAlive) {
          // Point cannon at target
          const angle = this.position.angleTo(target.position);
          this.weaponAngle = angle;
          this.fire(this.weaponAngle);
        }
      }
    }
  }

  public serialize(): Data {
    return {
      ...super.serialize(),
      isActive: this.isActive,
    };
  }

  public followPath(path: Iterable<Vector>): void {
    this.moveQueue = new Queue();
    for (const point of path) {
      this.moveQueue.enqueue(point);
    }
  }

  public deserialize(data: Data, isInitialized?: boolean): void {
    super.deserialize(data, isInitialized);
    const {isActive} = data;

    if (typeof isActive === 'boolean') {
      this.isActive = isActive;
    }
  }

  public render(ctx: GraphicsContext): void {
    super.render(ctx);

    // Draw path
    if (!this.moveQueue.isEmpty()) {
      const points: VectorLike[] = [
        this.position,
        ...this.moveQueue.iterator()
      ];
      GraphicsPipeline.pipe()
        .rotate(-this.angle)
        .translate(-this.position.x, -this.position.y)
        .run(ctx, (ctx) => {
          ctx.path(points, rgb(0, 0, 0));
        });
      
    }
  }
}

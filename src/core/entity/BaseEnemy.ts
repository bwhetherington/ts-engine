import {KillEvent, Tank, Unit, WorldManager} from '@/core/entity';
import {Queue} from '@/core/util';
import {NetworkManager} from '@/core/net';
import {LogManager} from '@/core/log';
import {Data} from '@/core/serialize';
import {Vector, VectorLike} from '@/core/geometry';
import {GraphicsContext, randomColor, rgb} from '@/core/graphics';
import {GraphicsPipeline} from '@/core/graphics/pipe';
import {EventManager} from '@/core/event';
import {RNGManager} from '@/core/random';

const log = LogManager.forFile(__filename);

export class BaseEnemy extends Tank {
  public static typeName: string = 'BaseEnemy';

  private target?: Unit;
  private moveQueue: Queue<Vector> = new Queue();

  public isActive: boolean = true;

  public constructor() {
    super();
    this.type = BaseEnemy.typeName;
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
      this.setColor(randomColor());
      this.selectTarget();
      EventManager.sleep(RNGManager.nextFloat(0.5, 3)).then(() => {
        this.streamInterval(1).forEach(() => {
          this.selectTarget();
        });
      });
      this.streamEvents(KillEvent)
        .filter((event) => this.target?.id === event.data.targetId)
        .forEach(() => this.selectTarget());
    }
  }

  public moveTo(targetPoint: Vector) {
    // const path = WorldManager.findPath(this.position, targetPoint);
    const path = [this.position, targetPoint];
    if (path) {
      this.followPath(path);
    }
  }

  private selectTarget() {
    // Select the closest unit
    const [target] = WorldManager.getEntities()
      .filter((entity) => this !== entity)
      .filterMap((entity) => (entity instanceof Unit ? entity : undefined))
      .filter((unit) => this.isHostileTo(unit))
      // .filter((entity) => this.canSeeTarget(entity))
      .map<[Unit | undefined, number]>((entity) => [
        entity,
        entity.position.distanceTo(this.position),
      ])
      .fold(
        [undefined as Unit | undefined, Number.POSITIVE_INFINITY],
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

  private moveToTarget() {
    // Check if we're within range of the target unit
    const distanceToTarget = this.target?.position?.distanceToXYSquared(
      this.position.x,
      this.position.y
    );
    if (distanceToTarget !== undefined && distanceToTarget <= 100 * 100) {
      this.moveQueue = new Queue();
      this.setThrusting(0);
      return;
    }

    const targetPoint = this.moveQueue.peek();
    const closeEnough = this.boundingBox.width * 1.5;

    if (targetPoint) {
      if (
        this.position.distanceToXYSquared(targetPoint.x, targetPoint.y) <
        closeEnough * closeEnough
      ) {
        // Close enough
        this.moveQueue.dequeue();
        if (this.moveQueue.isEmpty()) {
          this.setThrusting(0);
        }
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

  public override step(dt: number) {
    super.step(dt);

    if (NetworkManager.isServer()) {
      // Reset movement
      this.setThrusting(0);
      this.moveToTarget();

      if (this.isActive) {
        const {target} = this;
        if (target?.isAlive()) {
          // Point cannon at target
          const angle = this.position.angleTo(target.position);
          this.weaponAngle = angle;
          this.fire(this.weaponAngle);
        }
      }
    }
  }

  public override serialize(): Data {
    return {
      ...super.serialize(),
      isActive: this.isActive,
    };
  }

  public followPath(path: Iterable<Vector>) {
    this.moveQueue = new Queue();
    for (const point of path) {
      this.moveQueue.enqueue(point);
    }
  }

  public override deserialize(data: Data, isInitialized?: boolean) {
    super.deserialize(data, isInitialized);
    const {isActive} = data;

    if (typeof isActive === 'boolean') {
      this.isActive = isActive;
    }
  }

  public override render(ctx: GraphicsContext) {
    super.render(ctx);

    // Draw path
    if (!this.moveQueue.isEmpty()) {
      const points: VectorLike[] = [
        this.position,
        ...this.moveQueue.iterator(),
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

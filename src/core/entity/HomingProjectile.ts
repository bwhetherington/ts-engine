import {Projectile, Entity, WorldManager, Unit} from '@/core/entity';
import {EventManager} from '@/core/event';
import {DirectionVector, Rectangle, Vector} from '@/core/geometry';
import {NetworkManager} from '@/core/net';
import {Data} from '@/core/serialize';
import {isUUID} from '@/core/uuid';

const SEARCH_RADIUS = 250;

export class HomingProjectile extends Projectile {
  public static typeName: string = 'HomingProjectile';

  public override velocity: DirectionVector = new DirectionVector();
  public maxSpeed: number = 1;
  public turnSpeed: number = 1;

  private target?: Entity;
  private isHoming: boolean = false;

  public constructor() {
    super();
    this.type = HomingProjectile.typeName;
    this.friction = 0;
    this.onCreate();
  }

  private async onCreate(): Promise<void> {
    await EventManager.sleep(0.2);
    this.isHoming = true;
  }

  private selectTarget(): Entity | undefined {
    if (NetworkManager.isServer()) {
      const [target] = WorldManager.query(
        new Rectangle(
          SEARCH_RADIUS * 2,
          SEARCH_RADIUS * 2,
          this.position.x - SEARCH_RADIUS,
          this.position.y - SEARCH_RADIUS
        )
      )
        .filter((entity) => !(this.parent === entity || this === entity))
        .filter(
          (entity) => entity.position.distanceTo(this.position) < SEARCH_RADIUS
        )
        .filterMap((entity) => (entity instanceof Unit ? entity : undefined))
        .filter((unit) => unit.isAlive())
        .filter(
          (unit) => this.parent === undefined || this.parent.isHostileTo(unit)
        )
        .filter((unit) => !this.hitEntities.has(unit.id))
        .map<[Unit | undefined, number]>((unit) => [
          unit,
          unit.position.distanceTo(this.position),
        ])
        .fold(
          [undefined as Unit | undefined, Number.POSITIVE_INFINITY],
          (min, cur) => (cur[1] < min[1] ? cur : min)
        );
      this.target = target;
      return target;
    } else {
      return this.target;
    }
  }

  public override step(dt: number) {
    if (NetworkManager.isServer() && this.isHoming) {
      const target = this.selectTarget();
      if (target) {
        Vector.BUFFER.set(target.position);
        Vector.BUFFER.add(this.position, -1);
        Vector.BUFFER.magnitude = this.turnSpeed;
        this.velocity.add(Vector.BUFFER);
      }

      if (this.velocity.magnitudeSquared > this.maxSpeed * this.maxSpeed) {
        this.velocity.magnitude = this.maxSpeed;
      }
    }

    super.step(dt);
    this.angle = this.velocity.direction;
  }

  public override serialize(): Data {
    return {
      ...super.serialize(),
      maxSpeed: this.maxSpeed,
      turnSpeed: this.turnSpeed,
      targetId: this.target?.id,
    };
  }

  public override deserialize(data: Data) {
    super.deserialize(data);

    const {maxSpeed, turnSpeed, targetId} = data;

    if (typeof maxSpeed === 'number') {
      this.maxSpeed = maxSpeed;
    }

    if (typeof turnSpeed === 'number') {
      this.turnSpeed = turnSpeed;
    }

    if (isUUID(targetId)) {
      this.target = WorldManager.getEntity(targetId);
    }
  }
}

import {CollisionLayer, Entity} from '@/core/entity';
import {Vector} from '@/core/geometry';
import {clamp} from '@/core/util';

const FOLLOW_SPEED: number = 20;
const SNAP_DISTANCE: number = 0.25;
const SNAP_DISTANCE2: number = SNAP_DISTANCE * SNAP_DISTANCE;

export class Follow extends Entity {
  public static typeName: string = 'Follow';

  public parent?: Entity;
  public isPersistent: boolean = false;

  // Represents how what fraction of the distance towards its parent entity
  // this will travel per second
  private followSpeed: number = FOLLOW_SPEED;

  public constructor() {
    super();
    this.collisionLayer = CollisionLayer.Effect;
    this.doSync = false;
    this.isCollidable = false;
    this.isVisible = false;
  }

  public override step(dt: number) {
    super.step(dt);

    if (!(this.parent?.isAlive() || this.isPersistent)) {
      this.markForDelete();
      return;
    }

    if (!this.parent) {
      return;
    }

    // Move closer to parent entity
    if (
      this.position.distanceToXYSquared(
        this.parent.position.x,
        this.parent.position.y
      ) <= SNAP_DISTANCE2
    ) {
      this.setPosition(this.parent.position);
      return;
    }

    Vector.BUFFER.set(this.parent.position);
    Vector.BUFFER.add(this.position, -1);
    const increment = clamp(this.followSpeed * dt, 0, 1);
    this.addPosition(Vector.BUFFER, increment);
  }

  public follow(entity: Entity, speed: number = FOLLOW_SPEED) {
    this.parent = entity;
    this.setPosition(entity.position);
    this.followSpeed = speed;
  }

  public unfollow() {
    this.parent = undefined;
  }

  public override shouldUpdateLocally(): boolean {
    return true;
  }
}

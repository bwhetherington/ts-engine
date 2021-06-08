import {Entity, CollisionLayer} from 'core/entity';
import {clamp} from 'core/util';

const FOLLOW_SPEED: number = 20;
const SNAP_DISTANCE: number = 1;
const SNAP_DISTANCE2: number = SNAP_DISTANCE * SNAP_DISTANCE;

export class Follow extends Entity {
  public static typeName: string = 'Follow';

  private parent?: Entity;

  // Represents how what fraction of the distance towards its parent entity
  // this will travel per second
  private followSpeed: number = FOLLOW_SPEED;

  public constructor() {
    super();
    this.collisionLayer = CollisionLayer.Effect;
    this.doSync = false;
    this.isCollidable = false;
    this.isVisible = false;
    console.log('follow created');
  }

  public step(dt: number): void {
    super.step(dt);

    if (!this.parent?.isAlive()) {
      console.log('delete follow');
      this.markForDelete();
      return;
    }

    // Move closer to parent entity
    if (this.position.distanceToXYSquared(this.parent.position.x, this.parent.position.y) <= SNAP_DISTANCE2) {
      this.setPosition(this.parent.position);
      return;
    }

    this.vectorBuffer.set(this.parent.position);
    this.vectorBuffer.add(this.position, -1);
    const increment = clamp(this.followSpeed * dt, 0, 1);
    this.addPosition(this.vectorBuffer, increment);

  }

  public initialize(
    entity: Entity,
    speed: number = FOLLOW_SPEED,
  ): void {
    this.parent = entity;
    this.followSpeed = speed;
  }

  public shouldUpdateLocally(): boolean {
    return true;
    // return !!this.parent?.shouldUpdateLocally();
  }
}

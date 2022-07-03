import {Entity, Follow, WorldManager} from '@/core/entity';
import {Bounded, Rectangle, Vector} from '@/core/geometry';
import {LogManager} from '@/core/log';

const log = LogManager.forFile(__filename);

const TARGET_HEIGHT = 700;

export class CameraManager implements Bounded {
  public boundingBox: Rectangle;
  public scale: number = 1;
  private followEntity?: Follow;

  constructor() {
    this.boundingBox = new Rectangle(400, 300);
  }

  public initialize() {
    log.debug('CameraManager initialized');
    this.followEntity = WorldManager.spawn(Follow);
    if (this.followEntity) {
      this.followEntity.isPersistent = true;
    }
  }

  public isInFrame(bounded: Bounded): boolean {
    return this.boundingBox.intersects(bounded.boundingBox);
  }

  public setSize(width: number, height: number) {
    const {centerX, centerY} = this.boundingBox;

    this.scale = height / TARGET_HEIGHT;

    this.boundingBox.width = width / this.scale;
    this.boundingBox.height = height / this.scale;
    this.setTargetXY(centerX, centerY);
  }

  public setTargetXY(x: number, y: number) {
    this.boundingBox.centerX = x;
    this.boundingBox.centerY = y;
  }

  public setTarget(v: Vector) {
    this.setTargetXY(v.x, v.y);
  }

  public update() {
    if (this.followEntity) {
      this.setTarget(this.followEntity.position);
    }
  }

  public follow(entity: Entity) {
    this.followEntity?.follow(entity, 10);
  }

  public unfollow() {
    this.followEntity?.unfollow();
  }

  public toWorldSpace(x: number, y: number): Vector {
    return new Vector(
      x / this.scale + this.boundingBox.x,
      y / this.scale + this.boundingBox.y
    );
  }

  public toScreenSpace(x: number, y: number): Vector {
    return new Vector(
      (x - this.boundingBox.x) * this.scale,
      (y - this.boundingBox.y) * this.scale
    );
  }
}

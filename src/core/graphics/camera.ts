import {Rectangle, Vector, Bounded} from 'core/geometry';
import {Entity, Follow, WorldManager} from 'core/entity';
import {LogManager} from 'core/log';

const log = LogManager.forFile(__filename);

const TARGET_HEIGHT = 100;

export interface CameraTransform {
  scale: number;
  tx: number;
  ty: number;
}

export class CameraManager implements Bounded {
  public boundingBox: Rectangle;
  public scale: number = 1;
  private followEntity?: Entity;

  constructor() {
    this.boundingBox = new Rectangle(400, 300);
  }

  public initialize() {
    log.debug('CameraManager initialized');
    // this.followEntity = WorldManager.spawn(Follow);
    // if (this.followEntity) {
    //   this.followEntity.isPersistent = true;
    // }
  }

  public isInFrame(bounded: Bounded): boolean {
    return this.boundingBox.intersects(bounded.boundingBox);
  }

  public setSize(width: number, height: number): void {
    const {centerX, centerY} = this.boundingBox;
    this.boundingBox.width = width;
    this.boundingBox.height = height;
    this.setTargetXY(centerX, centerY);
  }

  public setTargetXY(x: number, y: number): void {
    this.boundingBox.centerX = x;
    this.boundingBox.centerY = y;
  }

  public setTarget(v: Vector): void {
    this.setTargetXY(v.x, v.y);
  }

  public update() {
    if (this.followEntity) {
      const {x, y} = this.followEntity.position;
      this.setTargetXY(Math.floor(x), Math.floor(y));
    }
  }

  public follow(entity: Entity): void {
    this.followEntity = entity;
    // this.followEntity?.follow(entity, 5);
  }

  public unfollow(): void {
    delete this.followEntity;
    // this.followEntity?.unfollow();
  }

  public toWorldSpace(x: number, y: number): Vector {
    const vec = new Vector(
      x / this.scale + this.boundingBox.x,
      y / this.scale + this.boundingBox.y
    );
    return vec;
  }

  public toScreenSpace(x: number, y: number): Vector {
    return new Vector(
      (x - this.boundingBox.x) * this.scale,
      (y - this.boundingBox.y) * this.scale
    );
  }
}

import { Rectangle, Vector, Bounded } from 'core/geometry';
import { Entity } from 'core/entity';
import { LogManager } from 'core/log';

const log = LogManager.forFile(__filename);

const TARGET_HEIGHT = 800;

export class CameraManager implements Bounded {
  public boundingBox: Rectangle;
  public scale: number = 1;
  private targetEntity?: Entity;

  constructor() {
    this.boundingBox = new Rectangle(400, 300);
  }

  public initialize() {
    log.debug('CameraManager initialized');
  }

  public setSize(width: number, height: number): void {
    const { centerX, centerY } = this.boundingBox;

    this.scale = height / TARGET_HEIGHT;

    this.boundingBox.width = width / this.scale;
    this.boundingBox.height = height / this.scale;
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
    if (this.targetEntity) {
      const { centerX, centerY } = this.targetEntity.boundingBox;
      this.setTargetXY(centerX, centerY);
    }
  }

  public follow(entity: Entity): void {
    this.targetEntity = entity;
  }

  public unfollow(): void {
    delete this.targetEntity;
  }

  public toWorldSpace(x: number, y: number): Vector {
    return new Vector(x / this.scale + this.boundingBox.x, y / this.scale + this.boundingBox.y);
  }

  public toScreenSpace(x: number, y: number): Vector {
    return new Vector((x - this.boundingBox.x) * this.scale, (y - this.boundingBox.y) * this.scale);
  }
}

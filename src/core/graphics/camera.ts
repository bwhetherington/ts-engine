import { Rectangle, Vector, Bounded } from 'core/geometry';
import { Entity } from 'core/entity';
import { EM, Event, StepEvent } from 'core/event';

export class CameraManager implements Bounded {
  public boundingBox: Rectangle;
  private targetEntity?: Entity;

  constructor() {
    this.boundingBox = new Rectangle(400, 300);
  }

  public initialize() {
    EM.addListener('StepEvent', (event: Event<StepEvent>) => {
      this.step(event.data.dt);
    });
  }

  public setSize(width: number, height: number): void {
    const { centerX, centerY } = this.boundingBox;
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

  private step(dt: number) {
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

  public translateMouse(x: number, y: number): Vector {
    return new Vector(x + this.boundingBox.x, y + this.boundingBox.y);
  }
}

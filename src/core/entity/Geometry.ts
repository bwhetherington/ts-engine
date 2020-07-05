import { Entity } from 'core/entity';
import { Rectangle } from 'core/util';
import { GraphicsContext } from 'core/graphics';

export class Geometry extends Entity {
  public constructor(rect: Rectangle) {
    super();
    this.boundingBox = rect;
    this.setPositionXY(rect.x, rect.y);
    this.collisionLayer = 'geometry';
  }

  // public render(ctx: GraphicsContext): void {
  //   const { x, y, width, height } = this.boundingBox;
  //   ctx.rect(x, y, width, height, this.color);
  // }
}

import { Entity } from 'core/entity';
import { Rectangle } from 'core/geometry';
import { GraphicsContext } from 'core/graphics';
import { CollisionLayer } from './util';

export const WALL_COLOR = { red: 0.85, green: 0.85, blue: 0.85 };

export class Geometry extends Entity {
  public static typeName: string = 'Geometry';

  public static fromRectangle(rect: Rectangle): Geometry {
    const entity = new Geometry();
    entity.boundingBox = rect;
    entity.setPositionXY(rect.x, rect.y);

    return entity;
  }

  public constructor() {
    super();
    this.type = Geometry.typeName;
    this.collisionLayer = CollisionLayer.Geometry;
    this.color = WALL_COLOR;
  }

  // public render(ctx: GraphicsContext): void {
  //   const { x, y, width, height } = this.boundingBox;
  //   ctx.rect(x, y, width, height, this.color);
  // }
}


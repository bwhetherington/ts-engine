import {Entity} from 'core/entity';
import {Rectangle} from 'core/geometry';
import {CollisionLayer} from './util';

export const WALL_COLOR = {red: 0.85, green: 0.85, blue: 0.85};

export class Geometry extends Entity {
  public static typeName: string = 'Geometry';

  public static fromRectangle(rect: Rectangle): Geometry {
    const entity = new Geometry();
    entity.boundingBox = rect;
    entity.setPositionXY(rect.centerX, rect.centerY);

    return entity;
  }

  public constructor() {
    super();
    this.type = Geometry.typeName;
    this.collisionLayer = CollisionLayer.Geometry;
    this.setColor(WALL_COLOR);
    this.isSpatial = true;
  }
}

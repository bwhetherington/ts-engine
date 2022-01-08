import {Entity} from 'core/entity';
import {Rectangle} from 'core/geometry';
import {Color, GraphicsContext} from 'core/graphics';
import {GraphicsPipeline} from 'core/graphics/pipe';
import {ThemeManager} from 'core/theme';
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
    this.isSpatial = true;
  }

  public override getColor(): Color {
    return ThemeManager.current.foregroundColor;
  }

  public override render(ctx: GraphicsContext) {
    const {width, height} = this.boundingBox;
    GraphicsPipeline.pipe().run(ctx, (ctx) => {
      ctx.rect(-width / 2, -height / 2, width, height, this.getColor());
    });
  }
}

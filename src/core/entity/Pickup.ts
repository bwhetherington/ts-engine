import {CollisionLayer, Entity, BaseHero} from 'core/entity';
import {
  BLACK,
  Color,
  GraphicsContext,
  randomColor,
  reshade,
  WHITE,
} from 'core/graphics';
import {GraphicsPipeline} from 'core/graphics/pipe';
import {LogManager} from 'core/log';
import {NetworkManager} from 'core/net';

const log = LogManager.forFile(__filename);

export class Pickup extends Entity {
  public static typeName: string = 'Pickup';
  public innerColor: Color = BLACK;

  constructor() {
    super();
    this.collisionLayer = CollisionLayer.Unit;
  }

  public override setColor(color: Color): void {
    super.setColor(color);
    this.innerColor = reshade(color, -0.15);
  }

  public override render(ctx: GraphicsContext): void {
    super.render(ctx);

    GraphicsPipeline.pipe()
      .options({
        doStroke: false,
        doFill: true,
      })
      .run(ctx, (ctx) => {
        ctx.ellipse(-5, -5, 10, 10, this.innerColor);
      });
  }

  public override collide(other: Entity): void {
    if (
      NetworkManager.isServer() &&
      other instanceof BaseHero &&
      this.canPickUp(other)
    ) {
      this.onPickup(other);
    }
  }

  protected canPickUp(_unit: BaseHero): boolean {
    return true;
  }

  protected onPickup(_unit: BaseHero): void {
    log.info('pickup');
    this.markForDelete();
  }
}

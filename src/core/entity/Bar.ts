import {Data} from 'core/serialize';
import {GraphicsContext} from 'core/graphics';
import {rgb, rgba} from 'core/graphics/color';
import {CollisionLayer, Entity} from 'core/entity';
import {GraphicsPipeline} from 'core/graphics/pipe';
import {clamp} from 'core/util';

export class Bar extends Entity {
  public static typeName: string = 'Bar';

  public progress: number = 1;
  public isStatic: boolean = true;

  constructor() {
    super();
    this.type = Bar.typeName;
    this.isCollidable = false;
    this.isVisible = true;
    this.collisionLayer = CollisionLayer.HUD;
    this.boundingBox.width = 65;
    this.boundingBox.height = 8;
    this.friction = 0;
  }

  public override serialize(): Data {
    return {
      ...super.serialize(),
      progress: this.progress,
    };
  }

  public override deserialize(data: Data): void {
    super.deserialize(data);

    const {progress} = data;
    if (typeof progress === 'number') {
      this.progress = progress;
    }
  }

  public override render(ctx: GraphicsContext): void {
    if (0 < this.progress && this.progress < 1) {
      const lineWidth = 4;
      const progress = clamp(this.progress, 0, 1);

      GraphicsPipeline.pipe()
        .options({
          lineWidth,
          ignoreScale: true,
          uniformColor: true,
        })
        .run(ctx, (ctx) => {
          ctx.rect(
            -this.boundingBox.width / 2,
            -this.boundingBox.height / 2,
            this.boundingBox.width,
            this.boundingBox.height,
            rgba(0.25, 0.25, 0.25, 0.8)
          );
        });
      GraphicsPipeline.pipe()
        .options({
          lineWidth,
          ignoreScale: true,
        })
        .run(ctx, (ctx) => {
          ctx.rect(
            -this.boundingBox.width / 2,
            -this.boundingBox.height / 2,
            this.boundingBox.width * progress,
            this.boundingBox.height,
            rgba(0.3, 0.9, 0.3, 0.8),
            this.boundingBox.width
          );
        });
    }
  }
}

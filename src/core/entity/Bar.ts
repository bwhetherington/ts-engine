import {Data} from 'core/serialize';
import {GraphicsContext, PIXEL_SIZE} from 'core/graphics';
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
    this.boundingBox.width = 8;
    this.boundingBox.height = 1;
    this.friction = 0;
  }

  public serialize(): Data {
    return {
      ...super.serialize(),
      progress: this.progress,
    };
  }

  public deserialize(data: Data): void {
    super.deserialize(data);

    const {progress} = data;
    if (typeof progress === 'number') {
      this.progress = progress;
    }
  }

  public render(ctx: GraphicsContext): void {
    if (0 < this.progress) {
      const lineWidth = 1;
      const progress = clamp(this.progress, 0, 1);

      GraphicsPipeline.pipe()
        .options({
          lineWidth,
          // ignoreScale: true,
          uniformColor: true,
          doStroke: false,
          doFill: true,
        })
        .run(ctx, (ctx) => {
          ctx.rect(
            -Math.floor(this.boundingBox.width / 2),
            -Math.floor(this.boundingBox.height / 2),
            this.boundingBox.width,
            this.boundingBox.height,
            rgb(0.0625, 0.0625, 0.0625)
          );
        });
      GraphicsPipeline.pipe()
        .options({
          lineWidth,
          doStroke: false,
        })
        .run(ctx, (ctx) => {
          ctx.rect(
            -Math.floor(this.boundingBox.width / 2),
            -Math.floor(this.boundingBox.height / 2),
            Math.ceil(this.boundingBox.width * progress),
            this.boundingBox.height,
            rgb(0.1, 0.9, 0.1),
            this.boundingBox.width
          );
        });
    }
  }
}

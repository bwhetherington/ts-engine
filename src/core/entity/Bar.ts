import {Data} from 'core/serialize';
import {GraphicsContext} from 'core/graphics';
import {rgb, rgba} from 'core/graphics/color';
import {CollisionLayer, Entity} from 'core/entity';
import {GraphicsPipeline} from 'core/graphics/pipe';
import {clamp} from 'core/util';

const BORDER_COLOR = rgb(0.25, 0.25, 0.25);
const BAR_COLOR = rgb(0.2, 0.9, 0.2);
const FOLLOW_COLOR = rgb(0.85, 1, 0.85);

export class Bar extends Entity {
  public static typeName: string = 'Bar';

  public progress: number = 1;
  public isStatic: boolean = true;

  private followProgress: number = 1;

  constructor() {
    super();
    this.type = Bar.typeName;
    this.isCollidable = false;
    this.isVisible = true;
    this.collisionLayer = CollisionLayer.HUD;
    this.boundingBox.width = 70;
    this.boundingBox.height = 12;
    this.friction = 0;
  }

  public override step(dt: number) {
    super.step(dt);
    this.followProgress = Math.max(this.followProgress - dt, this.progress);
  }

  public override serialize(): Data {
    return {
      ...super.serialize(),
      progress: this.progress,
    };
  }

  public override deserialize(data: Data) {
    super.deserialize(data);

    const {progress} = data;
    if (typeof progress === 'number') {
      this.progress = progress;
    }
  }

  public override render(ctx: GraphicsContext) {
    if (0 < this.progress && this.progress < 1) {
      const lineWidth = 6;
      const progress = clamp(this.progress, 0, 1);

      GraphicsPipeline.pipe()
        .options({
          ignoreScale: true,
          uniformColor: true,
          doFill: true,
          doStroke: false,
        })
        .run(ctx, (ctx) => {
          // Outline
          ctx.rect(
            -this.boundingBox.width / 2,
            -this.boundingBox.height / 2,
            this.boundingBox.width,
            this.boundingBox.height,
            BORDER_COLOR
          );
          const innerWidth = this.boundingBox.width - lineWidth;
          const innerHeight = this.boundingBox.height - lineWidth;

          if (this.followProgress > this.progress) {
            ctx.rect(
              -innerWidth / 2,
              -innerHeight / 2,
              innerWidth * this.followProgress,
              innerHeight,
              FOLLOW_COLOR,
              innerWidth
            );
          }

          ctx.rect(
            -innerWidth / 2,
            -innerHeight / 2,
            innerWidth * progress,
            innerHeight,
            BAR_COLOR,
            innerWidth
          );
        });

      // GraphicsPipeline.pipe()
      //   .options({
      //     lineWidth,
      //     ignoreScale: true,
      //     uniformColor: true,
      //   })
      //   .run(ctx, (ctx) => {
      //     ctx.roundRect(
      //       -this.boundingBox.width / 2,
      //       -this.boundingBox.height / 2,
      //       this.boundingBox.width,
      //       this.boundingBox.height,
      //       this.boundingBox.height / 3,
      //       rgba(0.25, 0.25, 0.25, 0.8)
      //     );
      //   });
      // GraphicsPipeline.pipe()
      //   .options({
      //     lineWidth,
      //     ignoreScale: true,
      //   })
      //   .run(ctx, (ctx) => {
      //     ctx.roundRect(
      //       -this.boundingBox.width / 2,
      //       -this.boundingBox.height / 2,
      //       this.boundingBox.width * progress,
      //       this.boundingBox.height,
      //       this.boundingBox.height / 3,
      //       rgba(0.3, 0.9, 0.3, 0.8),
      //       this.boundingBox.width
      //     );
      //   });
    }
  }
}

import {Data} from 'core/serialize';
import {GraphicsContext} from 'core/graphics';
import {rgb, rgba} from 'core/graphics/color';
import {CollisionLayer, Entity} from 'core/entity';

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
    if (this.progress < 1) {
      const lineWidth = 3;
      ctx
        .withOptions(
          {
            lineWidth,
            doStroke: true,
            doFill: true,
            ignoreScale: true,
          },
          (ctx) => {
            ctx.rect(
              -this.boundingBox.width / 2,
              -this.boundingBox.height / 2,
              this.boundingBox.width,
              this.boundingBox.height,
              rgba(0.35, 0.35, 0.35, 0.75)
            );
          }
        )
        .withOptions(
          {
            lineWidth,
            doStroke: true,
            doFill: true,
            ignoreScale: true,
          },
          (ctx) => {
            const padding = 0;
            ctx.rect(
              -this.boundingBox.width / 2 + padding,
              -this.boundingBox.height / 2 + padding,
              (this.boundingBox.width - 2 * padding) * this.progress,
              this.boundingBox.height - 2 * padding,
              rgb(0.4, 1, 0.4),
              this.boundingBox.width
            );
          }
        );
    }
  }
}

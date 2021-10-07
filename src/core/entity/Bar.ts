import {Data} from 'core/serialize';
import {GraphicsContext, PIXEL_SIZE} from 'core/graphics';
import {rgb, rgba, WHITE} from 'core/graphics/color';
import {CollisionLayer, Entity} from 'core/entity';
import {GraphicsPipeline} from 'core/graphics/pipe';
import {clamp} from 'core/util';
import {DEFAULT_BACKGROUND_COLOR, DEFAULT_FILL_COLOR} from 'core/ui';

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
    this.boundingBox.width = 12;
    this.boundingBox.height = 4;
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
    if (0 < this.progress && this.progress < 1) {
      const lineWidth = 1;
      const progress = clamp(this.progress, 0, 1);

      // ctx.rawRect(
      //   -Math.floor(this.boundingBox.width / 2),
      //   -Math.floor(this.boundingBox.height / 2),
      //   this.boundingBox.width,
      //   this.boundingBox.height,
      //   WHITE,
      // );
      ctx.rawRect(
        -Math.floor(this.boundingBox.width / 2) + 1,
        -Math.floor(this.boundingBox.height / 2) + 1,
        this.boundingBox.width - 2,
        this.boundingBox.height - 2,
        DEFAULT_BACKGROUND_COLOR
      );
      ctx.rawRect(
        -Math.floor(this.boundingBox.width / 2) + 1,
        -Math.floor(this.boundingBox.height / 2) + 1,
        Math.ceil(this.boundingBox.width * progress) - 2,
        this.boundingBox.height - 2,
        DEFAULT_FILL_COLOR
      );
    }
  }
}

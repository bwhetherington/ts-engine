import { Entity } from './Entity';
import { EventManager } from 'core/event';
import { TextUpdateEvent, TextRemoveEvent } from 'core/text';
import { Data } from 'core/serialize';
import { GraphicsContext } from 'core/graphics';
import { WHITE, BLACK, rgb, rgba } from 'core/graphics/color';
import { CollisionLayer } from './util';

export class Bar extends Entity {
  public static typeName: string = 'Bar';

  public progress: number = 1;
  public isStatic: boolean = true;

  constructor() {
    super();
    this.type = Bar.typeName;
    this.isCollidable = false;
    this.isVisible = true;
    this.collisionLayer = CollisionLayer.Effect;
    this.boundingBox.width = 40;
    this.boundingBox.height = 6;
  }

  public serialize(): Data {
    return {
      ...super.serialize(),
      progress: this.progress,
    };
  }

  public deserialize(data: Data): void {
    super.deserialize(data);

    const { progress } = data;
    if (typeof progress === 'number') {
      this.progress = progress;
    }
  }

  public render(ctx: GraphicsContext): void {
    ctx.translate(this.position.x, this.position.y);
    ctx.pushOptions({
      lineWidth: 2,
      doStroke: true,
      doFill: true,
    });
    ctx.rect(
      -this.boundingBox.width / 2,
      -this.boundingBox.height / 2,
      this.boundingBox.width,
      this.boundingBox.height,
      rgba(0.35, 0.35, 0.35, 0.67)
    );
    ctx.popOptions();
    ctx.pushOptions({
      lineWidth: 3,
      doStroke: false,
      doFill: true,
    });
    const padding = 1;
    ctx.rect(
      -this.boundingBox.width / 2 + padding,
      -this.boundingBox.height / 2 + padding,
      (this.boundingBox.width - 2 * padding) * this.progress,
      this.boundingBox.height - 2 * padding,
      rgb(0.4, 1, 0.4)
    );
    ctx.popOptions();
    ctx.translate(-this.position.x, -this.position.y);
  }
}

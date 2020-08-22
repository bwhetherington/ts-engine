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
    this.boundingBox.width = 65;
    this.boundingBox.height = 10;
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
    const lineWidth = 4;
    ctx.translate(this.position.x, this.position.y);
    ctx.pushOptions({
      lineWidth,
      doStroke: true,
      doFill: true,
      ignoreScale: true,
    });
    ctx.rect(
      -this.boundingBox.width / 2,
      -this.boundingBox.height / 2,
      this.boundingBox.width,
      this.boundingBox.height,
      rgba(0.35, 0.35, 0.35, 0.75)
    );
    ctx.popOptions();
    ctx.pushOptions({
      lineWidth,
      doStroke: true,
      doFill: true,
      ignoreScale: true,
    });
    const padding = 0;
    ctx.rect(
      -this.boundingBox.width / 2 + padding,
      -this.boundingBox.height / 2 + padding,
      (this.boundingBox.width - 2 * padding) * this.progress,
      this.boundingBox.height - 2 * padding,
      rgb(0.4, 1, 0.4),
      this.boundingBox.width
    );
    ctx.popOptions();
    ctx.translate(-this.position.x, -this.position.y);
  }
}

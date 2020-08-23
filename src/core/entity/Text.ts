import { Entity } from './Entity';
import { EventManager } from 'core/event';
import { TextUpdateEvent, TextRemoveEvent } from 'core/text';
import { Data } from 'core/serialize';
import { GraphicsContext } from 'core/graphics';
import { WHITE, BLACK, rgb } from 'core/graphics/color';
import { CollisionLayer } from './util';

export class Text extends Entity {
  public static typeName: string = 'Text';

  public text: string = '';
  public tag?: string;
  public isStatic: boolean = true;

  constructor() {
    super();
    this.type = Text.typeName;
    this.isCollidable = false;
    this.isVisible = true;
    this.collisionLayer = CollisionLayer.HUD;
    this.friction = 35;
  }

  public step(dt: number): void {
    super.step(dt);
  }

  public cleanup(): void {
    super.cleanup();
  }

  public serialize(): Data {
    return {
      ...super.serialize(),
      text: this.text,
      label: this.tag,
    };
  }

  public deserialize(data: Data): void {
    super.deserialize(data);

    const { text, tag } = data;
    if (typeof text === 'string') {
      this.text = text;
    }
    if (typeof tag === 'string') {
      this.tag = tag;
    }
  }

  public render(ctx: GraphicsContext): void {
    ctx.pushOptions({
      lineWidth: 6,
    });
    ctx.text(this.position.x, this.position.y, this.text, {
      size: 26,
      color: this.getColor(),
    });
    ctx.popOptions();
  }
}

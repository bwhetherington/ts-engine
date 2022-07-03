import {TextColor, isTextColor} from '@/core/chat';
import {TextFormatter} from '@/core/chat/format';
import {CollisionLayer, Entity} from '@/core/entity';
import {GraphicsContext} from '@/core/graphics';
import {GraphicsPipeline} from '@/core/graphics/pipe';
import {Data} from '@/core/serialize';

import {Config, ConfigManager} from '../config';

export class Text extends Entity {
  public static typeName: string = 'Text';

  protected static config = new Config();
  protected static formatter: TextFormatter = new TextFormatter('$text');

  public text: string = '';
  public textColor: TextColor = 'none';
  public textSize: number = 24;
  public tag?: string;
  public isStatic: boolean = true;

  constructor() {
    super();
    this.type = Text.typeName;
    this.isCollidable = false;
    this.isVisible = true;
    this.collisionLayer = CollisionLayer.HUD;
    this.friction = 0;
  }

  public override serialize(): Data {
    return {
      ...super.serialize(),
      text: this.text,
      textColor: this.textColor,
      textSize: this.textSize,
      label: this.tag,
    };
  }

  public static override initializeType(): void {
    this.config = ConfigManager.getConfig('TextEntityConfig');
    this.formatter = new TextFormatter(this.config.get('format'));
  }

  public override deserialize(data: Data) {
    super.deserialize(data);

    const {text, tag, textColor, textSize} = data;
    if (typeof text === 'string') {
      this.text = text;
    }
    if (typeof tag === 'string') {
      this.tag = tag;
    }
    if (isTextColor(textColor)) {
      this.textColor = textColor;
    }
    if (typeof textSize === 'number') {
      this.textSize = textSize;
    }
  }

  public override render(ctx: GraphicsContext) {
    const components = Text.formatter.format({
      color: this.textColor,
      text: this.text,
      tag: this.tag,
    });
    GraphicsPipeline.pipe()
      .options({lineWidth: 6, doStroke: true, doFill: true})
      .run(ctx, (ctx) => {
        ctx.textComponents(0, 0, components, {
          size: this.textSize,
        });
      });
  }
}

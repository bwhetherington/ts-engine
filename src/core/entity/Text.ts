import {Data} from 'core/serialize';
import {GraphicsContext} from 'core/graphics';
import {CollisionLayer, Entity} from 'core/entity';
import {GraphicsPipeline} from 'core/graphics/pipe';
import {TextFormatter} from 'core/chat/format';
import {isTextColor, TextColor} from 'core/chat';

const TEXT_FORMAT = '{color=$color|$text}';
const TEXT_FORMATTER = new TextFormatter(TEXT_FORMAT);

export class Text extends Entity {
  public static typeName: string = 'Text';

  public text: string = '';
  public textColor: TextColor = 'none';
  public textSize: number = 10;
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

  public serialize(): Data {
    return {
      ...super.serialize(),
      text: this.text,
      textColor: this.textColor,
      textSize: this.textSize,
      label: this.tag,
    };
  }

  public deserialize(data: Data): void {
    super.deserialize(data);

    const {text, tag, textColor, textSize} = data;
    if (typeof text === 'string') {
      this.text = text;
    }
    if (typeof tag === 'string') {
      this.tag = tag;
    }
    if (isTextColor(textColor)) {
      this.textColor = textColor as TextColor;
    }
    if (typeof textSize === 'number') {
      this.textSize = textSize;
    }
  }

  public render(ctx: GraphicsContext): void {
    GraphicsPipeline.pipe()
      .run(ctx, (ctx) => {
        ctx.text(0, 0, this.text, {});
      });
  }
}

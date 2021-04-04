import {Data} from 'core/serialize';
import {GraphicsContext} from 'core/graphics';
import {CollisionLayer, Entity} from 'core/entity';
import {GraphicsPipeline} from 'core/graphics/pipe';
import {TextFormatter} from 'core/chat/format';
import {isTextColor, TextColor} from 'core/chat';

const TEXT_FORMAT = '{color=$color|$text}{color=grey,style=small|$tag}';
const TEXT_FORMATTER = new TextFormatter(TEXT_FORMAT);

export class Text extends Entity {
  public static typeName: string = 'Text';

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

  public override deserialize(data: Data): void {
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

  public override render(ctx: GraphicsContext): void {
    const components = TEXT_FORMATTER.format({
      color: this.textColor,
      text: this.text,
      tag: this.tag,
    });
    GraphicsPipeline.pipe()
      .options({lineWidth: 6})
      .run(ctx, (ctx) => {
        ctx.textComponents(0, 0, components, {
          size: this.textSize,
        });
      });
  }
}

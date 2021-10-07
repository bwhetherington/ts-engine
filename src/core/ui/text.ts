import {Vector} from 'core/geometry';
import {FONTS, GraphicsContext, SPACE_WIDTH} from 'core/graphics';
import {Widget, Alignment, TemplateWidget, WidgetProps, Column} from 'core/ui';

interface TextProps {
  text: string;
  color?: 'red' | 'yellow' | 'white' | 'grey';
}

export class Text extends Widget<TextProps> {
  protected measure(ctx: GraphicsContext): Vector {
    const width = ctx.measureText(this.props.text);
    const height = 5;
    return new Vector(width, height);
  }

  public render(ctx: GraphicsContext): void {
    const {x: width} = this.measure(ctx);
    const xOffset = Math.ceil(width / 2);
    ctx.text(xOffset, 0, this.props.text, {
      fontColor: this.props.color ?? 'white',
    });
  }
}

interface ParagraphProps extends TextProps {
  maxWidth: number;
  lineSpacing?: number;
  alignment?: Alignment;
}

const WORD_SPLIT_REGEX = /\s+/;

export class Paragraph extends TemplateWidget<ParagraphProps> {
  private lines: string[] = [];

  constructor(props: WidgetProps<ParagraphProps>) {
    super(props);

    const font = FONTS.get('pixels');
    if (!font) {
      return;
    }

    const lines: string[] = [];
    const words = props.text.split(WORD_SPLIT_REGEX);

    let currentLine = '';
    let currentLength = -SPACE_WIDTH;

    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      const wordLength = SPACE_WIDTH + font.measureString(word);

      if (currentLength + wordLength > this.props.maxWidth) {
        if (currentLength === -SPACE_WIDTH) {
          // If the first word is too long for a line, then nothing will
          // work
          return;
        }

        // Reset the current line and attempt to place the word in a new line
        lines.push(currentLine);
        currentLength = -SPACE_WIDTH;
        currentLine = '';
        i -= 1;
        continue;
      }

      currentLine += ' ' + word;
      currentLength += SPACE_WIDTH + wordLength;
    }

    this.lines = lines;
  }

  protected renderTemplate(): Widget<any> {
    return new Column({
      spacing: this.props.lineSpacing ?? 1,
      alignment: this.props.alignment ?? Alignment.Begin,
      children: this.lines.map((line) => new Text({text: line})),
    });
  }
}

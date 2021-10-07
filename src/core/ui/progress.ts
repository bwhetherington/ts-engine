import {Vector} from 'core/geometry';
import {BLACK, Color, GraphicsContext, hex, WHITE} from 'core/graphics';
import {Widget, functionalWidget, Row, Text} from 'core/ui';
import {clamp} from 'core/util';

const DEFAULT_HEIGHT = 7;
const DEFAULT_WIDTH = 40;
export const DEFAULT_FILL_COLOR = hex('59c135');
export const DEFAULT_BACKGROUND_COLOR = hex('24523b');

interface ProgressBarProps {
  width?: number;
  height?: number;
  color?: Color;
  backgroundColor?: Color;
  current: number;
  maximum: number;
}

export class ProgressBar extends Widget<ProgressBarProps> {
  protected measure(_ctx: GraphicsContext): Vector {
    const {width = DEFAULT_WIDTH, height = DEFAULT_HEIGHT} = this.props;
    return new Vector(width, height);
  }

  public render(ctx: GraphicsContext): void {
    const {
      color = DEFAULT_FILL_COLOR,
      backgroundColor = DEFAULT_BACKGROUND_COLOR,
      width = DEFAULT_WIDTH,
      height = DEFAULT_HEIGHT,
      current,
      maximum,
    } = this.props;
    const progress = clamp(current / maximum, 0, 1);
    const barWidth = Math.floor(progress * (width - 2));

    // Outline
    ctx.rawRect(0, 0, width, height, WHITE);

    // Background
    ctx.rawRect(1, 1, width - 2, height - 2, backgroundColor);

    // Bar
    ctx.rawRect(1, 1, barWidth, height - 2, color);
  }
}

interface LabelProps {
  current: number;
  maximum: number;
}

const Label = functionalWidget(
  (props: LabelProps) =>
    new Row({
      spacing: 1,
      children: [
        new Text({
          text: '' + props.current,
          color: 'white',
        }),
        new Text({
          text: '/',
          color: 'grey',
        }),
        new Text({
          text: '' + props.maximum,
          color: 'white',
        }),
      ],
    })
);

export const LabeledProgressBar = functionalWidget(
  (props: ProgressBarProps) =>
    new Row({
      spacing: 2,
      children: [
        new Label({
          current: Math.round(props.current),
          maximum: Math.round(props.maximum),
        }),
        new ProgressBar({
          ...props,
        }),
      ],
    })
);

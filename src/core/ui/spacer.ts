import {Vector} from 'core/geometry';
import {GraphicsContext} from 'core/graphics';
import {Widget} from 'core/ui';

interface SpacerProps {
  width: number;
  height: number;
}

export class Spacer extends Widget<SpacerProps> {
  protected measure(_ctx: GraphicsContext): Vector {
    return new Vector(this.props.width, this.props.height);
  }

  public render(_ctx: GraphicsContext): void {}
}

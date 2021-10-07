import {Vector} from 'core/geometry';
import {GraphicsContext, rgb, WHITE} from 'core/graphics';
import {Widget} from 'core/ui';

export enum Alignment {
  Begin,
  Middle,
  End,
}

interface SeriesProps {
  spacing: number;
  alignment?: Alignment;
}

abstract class AbstractSeriesWidget extends Widget<SeriesProps> {
  protected getOffset(parent: number, child: number): number {
    const alignment = this.props.alignment ?? Alignment.Middle;
    switch (alignment) {
      case Alignment.Begin:
        return 0;
      case Alignment.Middle:
        return Math.floor((parent - child) / 2);
      case Alignment.End:
        return Math.floor(parent - child);
    }
  }
}

export class Row extends AbstractSeriesWidget {
  protected measure(ctx: GraphicsContext): Vector {
    let width = 0;
    let height = 0;
    for (const child of this.children) {
      const {x: childWidth, y: childHeight} = child.getSize(ctx);
      width += childWidth + this.props.spacing;
      if (childHeight > height) {
        height = childHeight;
      }
    }
    if (width > 0) {
      width -= this.props.spacing;
    }
    return new Vector(width, height);
  }

  public render(ctx: GraphicsContext): void {
    const {y: height} = this.getSize(ctx);
    ctx.withFrame((ctx) => {
      for (const child of this.children) {
        const {x: childWidth, y: childHeight} = child.getSize(ctx);
        const heightOffset = this.getOffset(height, childHeight);
        ctx.translate(0, heightOffset);
        child.render(ctx);
        ctx.translate(childWidth + this.props.spacing, -heightOffset);
      }
    });
  }
}

export class Column extends AbstractSeriesWidget {
  protected measure(ctx: GraphicsContext): Vector {
    let width = 0;
    let height = 0;
    for (const child of this.children) {
      const {x: childWidth, y: childHeight} = child.getSize(ctx);
      height += childHeight + this.props.spacing;
      if (childWidth > width) {
        width = childWidth;
      }
    }
    if (width > 0) {
      height -= this.props.spacing;
    }
    return new Vector(width, height);
  }

  public render(ctx: GraphicsContext): void {
    const {x: width} = this.getSize(ctx);
    const alignment = this.props.alignment ?? Alignment.Middle;
    ctx.withFrame((ctx) => {
      for (const child of this.children) {
        const {x: childWidth, y: childHeight} = child.getSize(ctx);
        const widthOffset = this.getOffset(width, childWidth);
        ctx.translate(widthOffset, 0);
        child.render(ctx);
        ctx.translate(-widthOffset, childHeight + this.props.spacing);
      }
    });
  }
}

interface SeparatorProps {
  width: number;
}

const GREY = rgb(0.5, 0.5, 0.5);

export class Separator extends Widget<SeparatorProps> {
  public measure(_ctx: GraphicsContext): Vector {
    return new Vector(this.props.width, 1);
  }

  public render(ctx: GraphicsContext): void {
    ctx.rawRect(0, 0, this.props.width, 1, WHITE);
  }
}

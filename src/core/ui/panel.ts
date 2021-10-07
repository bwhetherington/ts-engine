import {Vector} from 'core/geometry';
import {GraphicsContext} from 'core/graphics';
import {Widget} from 'core/ui';

const PADDING = 3;
const LINE_PADDING = 2;

export class Panel extends Widget {
  protected measure(ctx: GraphicsContext): Vector {
    let totalHeight = 0;
    let maxWidth = 0;

    for (const child of this.children) {
      const {x: width, y: height} = child.getSize(ctx);
      if (width > maxWidth) {
        maxWidth = width;
      }
      totalHeight += height;
      // Include line padding
      totalHeight += LINE_PADDING;
    }

    if (totalHeight > 0) {
      totalHeight -= LINE_PADDING;
    }

    return new Vector(maxWidth + 2 * PADDING, totalHeight + 2 * PADDING);
  }

  public render(ctx: GraphicsContext): void {
    const {x: width, y: height} = this.getSize(ctx);

    ctx.withFrame((ctx) => {
      // Draw background
      ctx.box(0, 0, width, height);
      ctx.translate(PADDING, PADDING);

      // Draw children
      for (const child of this.children) {
        const {x: childWidth, y: childHeight} = child.getSize(ctx);

        // Center child horizontally
        const x = Math.floor((width - childWidth - 2 * PADDING) / 2);
        ctx.translate(x, 0);
        child.render(ctx);
        ctx.translate(-x, childHeight + LINE_PADDING);
      }
    });
  }
}

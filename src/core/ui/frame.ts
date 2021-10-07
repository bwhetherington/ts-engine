import {Vector} from 'core/geometry';
import {CameraManager, GraphicsContext} from 'core/graphics';
import {functionalWidget, Widget} from 'core/ui';

interface FrameProps {
  padding: number;
  topLeft?: Widget<any>;
  top?: Widget<any>;
  topRight?: Widget<any>;
  left?: Widget<any>;
  right?: Widget<any>;
  bottomLeft?: Widget<any>;
  bottom?: Widget<any>;
  bottomRight?: Widget<any>;
}

export class Frame extends Widget<FrameProps> {
  protected measure(_ctx: GraphicsContext, _parent?: Widget<any>): Vector {
    return new Vector(
      CameraManager.boundingBox.width,
      CameraManager.boundingBox.height
    );
  }

  public render(ctx: GraphicsContext): void {
    const {
      padding,
      topLeft,
      top,
      topRight,
      left,
      right,
      bottomLeft,
      bottom,
      bottomRight,
    } = this.props;

    const {x: width, y: height} = this.getSize(ctx);

    // Render top components
    if (topLeft) {
      const tx = padding;
      const ty = padding;
      ctx.withFrame((ctx) => {
        ctx.translate(tx, ty);
        topLeft.render(ctx);
      });
    }
    if (top) {
      const {x: childWidth} = top.getSize(ctx, this);
      const tx = Math.floor((width - childWidth) / 2);
      const ty = padding;
      ctx.withFrame((ctx) => {
        ctx.translate(tx, ty);
        top.render(ctx);
      });
    }
    if (topRight) {
      const {x: childWidth} = topRight.getSize(ctx, this);
      const tx = width - childWidth - padding;
      const ty = padding;
      ctx.withFrame((ctx) => {
        ctx.translate(tx, ty);
        topRight.render(ctx);
      });
    }
    if (left) {
      const {y: childHeight} = left.getSize(ctx, this);
      const tx = padding;
      const ty = Math.floor((height - childHeight) / 2);
      ctx.withFrame((ctx) => {
        ctx.translate(tx, ty);
        left.render(ctx);
      });
    }
    if (right) {
      const {x: childWidth, y: childHeight} = right.getSize(ctx, this);
      const tx = width - childWidth - padding;
      const ty = Math.floor((height - childHeight) / 2);
      ctx.withFrame((ctx) => {
        ctx.translate(tx, ty);
        right.render(ctx);
      });
    }
    if (bottomLeft) {
      const {y: childHeight} = bottomLeft.getSize(ctx, this);
      const tx = padding;
      const ty = height - childHeight - padding;
      ctx.withFrame((ctx) => {
        ctx.translate(tx, ty);
        bottomLeft.render(ctx);
      });
    }
    if (bottom) {
      const {x: childWidth, y: childHeight} = bottom.getSize(ctx, this);
      const tx = Math.floor((width - childWidth) / 2);
      const ty = height - childHeight - padding;
      ctx.withFrame((ctx) => {
        ctx.translate(tx, ty);
        bottom.render(ctx);
      });
    }
    if (bottomRight) {
      const {x: childWidth, y: childHeight} = bottomRight.getSize(ctx, this);
      const tx = width - childWidth - padding;
      const ty = height - childHeight - padding;
      ctx.withFrame((ctx) => {
        ctx.translate(tx, ty);
        bottomRight.render(ctx);
      });
    }
  }
}

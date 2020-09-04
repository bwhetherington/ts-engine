import { GraphicsContext, GraphicsOptions } from '.';
import { GraphicsProc } from './context';

export class GraphicsPipeline {
  protected parent?: GraphicsPipeline;

  public constructor(parent?: GraphicsPipeline) {
    this.parent = parent;
  }

  public static pipe(): GraphicsPipeline {
    return new GraphicsPipeline();
  }

  public run(ctx: GraphicsContext, proc: GraphicsProc): void {
    if (this.parent) {
      this.parent.run(ctx, (ctx) => {
        this.runInternal(ctx, proc);
      });
    } else {
      proc(ctx);
    }
  }

  protected runInternal(ctx: GraphicsContext, proc: GraphicsProc): void {
    proc(ctx);
  }

  public alpha(alpha: number, isFancy: boolean = false): GraphicsPipeline {
    let parent: GraphicsPipeline = this;
    if (isFancy) {
      parent = this.options({ useFancyAlpha: isFancy });
    }
    return new AlphaPipeline(alpha, parent);
  }

  public options(options: Partial<GraphicsOptions>): GraphicsPipeline {
    return new OptionsPipeline(options, this);
  }

  public translate(tx: number, ty: number): GraphicsPipeline {
    return new TranslatePipeline(tx, ty, this);
  }

  public scale(scale: number): GraphicsPipeline {
    return new ScalePipeline(scale, this);
  }

  public rotate(angle: number): GraphicsPipeline {
    return new RotatePipeline(angle, this);
  }

  public chain(pipeline: GraphicsPipeline): GraphicsPipeline {
    let current = pipeline;
    while (current.parent !== undefined) {
      // Find top parent
      current = current.parent;
    }
    current.parent = this;
    return pipeline;
  }
}

class AlphaPipeline extends GraphicsPipeline {
  private alphaInternal: number;

  public constructor(alpha: number, parent?: GraphicsPipeline) {
    super(parent);
    this.alphaInternal = alpha;
  }

  protected runInternal(ctx: GraphicsContext, proc: GraphicsProc): void {
    ctx.withAlpha(this.alphaInternal, proc);
  }
}

class OptionsPipeline extends GraphicsPipeline {
  private optionsInternal: Partial<GraphicsOptions>;

  public constructor(
    options: Partial<GraphicsOptions>,
    parent?: GraphicsPipeline
  ) {
    super(parent);
    this.optionsInternal = options;
  }

  protected runInternal(ctx: GraphicsContext, proc: GraphicsProc): void {
    ctx.withOptions(this.optionsInternal, proc);
  }
}

class ScalePipeline extends GraphicsPipeline {
  private scaleInternal: number;

  public constructor(scale: number, parent?: GraphicsPipeline) {
    super(parent);
    this.scaleInternal = scale;
  }

  protected runInternal(ctx: GraphicsContext, proc: GraphicsProc): void {
    ctx.scale(this.scaleInternal);
    proc(ctx);
    ctx.scale(1 / this.scaleInternal);
  }
}

class TranslatePipeline extends GraphicsPipeline {
  private tx: number;
  private ty: number;

  public constructor(tx: number, ty: number, parent?: GraphicsPipeline) {
    super(parent);
    this.tx = tx;
    this.ty = ty;
  }

  protected runInternal(ctx: GraphicsContext, proc: GraphicsProc): void {
    ctx.translate(this.tx, this.ty);
    proc(ctx);
    ctx.translate(-this.tx, -this.ty);
  }
}

class RotatePipeline extends GraphicsPipeline {
  private angle: number;

  public constructor(angle: number, parent?: GraphicsPipeline) {
    super(parent);
    this.angle = angle;
  }

  protected runInternal(ctx: GraphicsContext, proc: GraphicsProc): void {
    ctx.rotate(this.angle);
    proc(ctx);
    ctx.rotate(-this.angle);
  }
}

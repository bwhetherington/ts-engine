import { GraphicsContext, GraphicsOptions } from ".";
import { GraphicsProc } from "./context";

export class GraphicsPipeline {
  protected ctx: GraphicsContext;
  protected parent?: GraphicsPipeline;

  public constructor(ctx: GraphicsContext, parent?: GraphicsPipeline) {
    this.ctx = ctx;
    this.parent = parent;
  }

  public run(proc: GraphicsProc): void {
    if (this.parent) {
      const oldCtx = this.ctx;
      this.parent.run((ctx) => {
        this.ctx = ctx;
        this.runInternal(proc);
        this.ctx = oldCtx;
      });
    } else {
      proc(this.ctx);
    }
  }

  protected runInternal(proc: GraphicsProc): void {
    proc(this.ctx);
  }

  public alpha(alpha: number, isFancy: boolean = false): GraphicsPipeline {
    let parent: GraphicsPipeline = this;
    if (isFancy) {
      parent = this.options({ useFancyAlpha: isFancy })
    }
    return new AlphaPipeline(alpha, this.ctx, parent);
  }

  public options(options: Partial<GraphicsOptions>): GraphicsPipeline {
    return new OptionsPipeline(options, this.ctx, this);
  }

  public translate(tx: number, ty: number): GraphicsPipeline {
    return new TranslatePipeline(tx, ty, this.ctx, this);
  }

  public scale(scale: number): GraphicsPipeline {
    return new ScalePipeline(scale, this.ctx, this);
  }
}

class AlphaPipeline extends GraphicsPipeline {
  private alphaInternal: number;

  public constructor(alpha: number, ctx: GraphicsContext, parent?: GraphicsPipeline) {
    super(ctx, parent);
    this.alphaInternal = alpha;
  }

  protected runInternal(proc: GraphicsProc): void {
    this.ctx.withAlpha(this.alphaInternal, proc);
  }
}

class OptionsPipeline extends GraphicsPipeline {
  private optionsInternal: Partial<GraphicsOptions>;

  public constructor(options: Partial<GraphicsOptions>, ctx: GraphicsContext, parent?: GraphicsPipeline) {
    super(ctx, parent);
    this.optionsInternal = options;
  }

  protected runInternal(proc: GraphicsProc): void {
    this.ctx.withOptions(this.optionsInternal, proc);
  }
}

class ScalePipeline extends GraphicsPipeline {
  private scaleInternal: number;

  public constructor(scale: number, ctx: GraphicsContext, parent?: GraphicsPipeline) {
    super(ctx, parent);
    this.scaleInternal = scale;
  }

  protected runInternal(proc: GraphicsProc): void {
    this.ctx.scale(this.scaleInternal);
    proc(this.ctx);
    this.ctx.scale(1 / this.scaleInternal);
  }
}

class TranslatePipeline extends GraphicsPipeline {
  private tx: number;
  private ty: number;

  public constructor(tx: number, ty: number, ctx: GraphicsContext, parent?: GraphicsPipeline) {
    super(ctx, parent);
    this.tx = tx;
    this.ty = ty;
  }

  protected runInternal(proc: GraphicsProc): void {
    this.ctx.translate(this.tx, this.ty);
    proc(this.ctx);
    this.ctx.translate(-this.tx, -this.ty);
  }
}
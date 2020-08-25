import {
  Color,
  toCss,
  reshade,
  invert,
  TextStyle,
  GraphicsContext,
  GraphicsOptions,
  CameraManager,
} from 'core/graphics';
import { BLACK, WHITE } from 'core/graphics/color';
import { GraphicsProc } from 'core/graphics/context';
import { Vector } from 'core/geometry';

interface Options {
  width: number;
  height: number;
  isFullScreen: boolean;
}

function createFontString(font: string, size: number, scale: number): string {
  const fontSize = size / scale;
  return `bold ${fontSize}px ${font}`;
}

const DEFAULT_OPTIONS: Options = {
  width: 600,
  height: 400,
  isFullScreen: false,
};

export class HDCanvas implements GraphicsContext {
  private canvas?: HTMLCanvasElement;
  private hidden?: HDCanvas;
  private width: number = 1;
  private height: number = 1;
  private ratio: number = 1;
  private scale: number = 1;
  private translation: Vector = new Vector();

  private options: GraphicsOptions = {
    lineWidth: 5,
    doStroke: true,
    doFill: true,
  };
  private optionsStack: Partial<GraphicsOptions>[] = [];

  private curContext?: CanvasRenderingContext2D;

  constructor(options: Options = DEFAULT_OPTIONS, isParent: boolean = true) {
    const { width, height, isFullScreen } = options;

    this.canvas = document.createElement('canvas');
    if (this.canvas) {
      this.setSize(width, height);

      // Set up auto scaling
      let ctx;
      if ((ctx = this.getContext())) {
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
      }
    }

    if (isParent) {
      this.hidden = new HDCanvas(options, false);
    }
  }

  private setRound(ctx: CanvasRenderingContext2D): void {
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }

  private setSquare(ctx: CanvasRenderingContext2D): void {
    ctx.lineCap = 'square';
    ctx.lineJoin = 'miter';
  }

  public setOptions(options: Partial<GraphicsOptions>): void {
    if (options.lineWidth !== undefined) {
      this.options.lineWidth = options.lineWidth;
    }
    if (options.doStroke !== undefined) {
      this.options.doStroke = options.doStroke;
    }
    if (options.doFill !== undefined) {
      this.options.doFill = options.doFill;
    }
    this.options.ignoreScale = !!options.ignoreScale;
    // this.hidden?.setOptions(options);
  }

  public pushOptions(options: Partial<GraphicsOptions>): void {
    this.optionsStack.push(options);
    this.setOptions(options);
    this.hidden?.pushOptions(options);
  }

  public popOptions(): Partial<GraphicsOptions> | undefined {
    const options = this.optionsStack.pop();
    this.setOptions(this.optionsStack[this.optionsStack.length - 1]);
    this.hidden?.popOptions();
    return options;
  }

  public setSize(w: number, h: number, ratio?: number) {
    this.width = w;
    this.height = h;
    const { canvas: element } = this;
    if (element) {
      ratio = ratio ?? window.devicePixelRatio ?? 1;
      this.ratio = ratio;
      const scale = this.ratio;
      element.width = w * scale;
      element.height = h * scale;
      element.style.width = w + 'px';
      element.style.height = h + 'px';
      const ctx = element.getContext('2d');
      if (ctx) {
        ctx.setTransform(scale, 0, 0, scale, 0, 0);
        ctx.imageSmoothingEnabled = true;
      }
    }
    if (this.hidden) {
      CameraManager.setSize(w, h);
      this.hidden.setSize(w * this.ratio, h * this.ratio, 1);
    }
  }

  public attachTo(parent: HTMLElement) {
    if (this.canvas) {
      parent.appendChild(this.canvas);
    }
  }

  public getContext(): CanvasRenderingContext2D | undefined {
    return this.canvas?.getContext('2d') ?? undefined;
  }

  public begin() {
    this.curContext = this.getContext();
    this.resetTransform();
    this.clear();
    this.hidden?.begin();
  }

  public clear(color?: Color) {
    const ctx = this.curContext;
    if (ctx) {
      ctx.clearRect(0, 0, this.width, this.height);
      if (color) {
        if (this.canvas) {
          this.canvas.style.backgroundColor = toCss(color);
        }
      }
    }
    this.hidden?.clear(color);
  }

  public text(x: number, y: number, text: string, style: TextStyle) {
    const ctx = this.curContext;
    if (ctx) {
      const scale = this.scale;
      const { font = 'Roboto Mono', size = 12, color = WHITE } = style;
      ctx.beginPath();
      ctx.lineWidth = this.options.lineWidth / scale;
      ctx.fillStyle = toCss(color);
      ctx.strokeStyle = toCss(reshade(color, 0.35));
      ctx.textAlign = 'center';
      ctx.font = createFontString(font, size, scale);
      this.setRound(ctx);
      ctx.strokeText(text, x, y);
      ctx.fillText(text, x, y);
      ctx.closePath();
    }
  }

  public ellipse(x: number, y: number, w: number, h: number, color: Color) {
    const ctx = this.curContext;
    if (ctx) {
      ctx.beginPath();
      ctx.fillStyle = toCss(color);
      ctx.strokeStyle = toCss(reshade(color));
      ctx.lineWidth = this.options.lineWidth;
      this.setRound(ctx);
      ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, 2 * Math.PI);
      if (this.options.doFill) {
        ctx.fill();
      }
      if (this.options.doStroke) {
        ctx.stroke();
      }
      ctx.closePath();
    }
  }

  public rect(
    x: number,
    y: number,
    w: number,
    h: number,
    color: Color,
    fullW?: number
  ) {
    const ctx = this.curContext;
    if (ctx) {
      ctx.beginPath();
      ctx.fillStyle = toCss(color);
      ctx.strokeStyle = toCss(reshade(color));

      ctx.lineWidth = this.options.lineWidth;

      this.setRound(ctx);

      const fullWidth = fullW ?? w;

      if (this.options.ignoreScale) {
        ctx.lineWidth /= this.scale;
        const newWidth = fullWidth / this.scale;
        const newHeight = h / this.scale;
        x += (fullWidth - newWidth) / 2;
        y += (h - newHeight) / 2;
        w /= this.scale;
        h /= this.scale;
      }

      ctx.rect(x, y, w, h);
      if (this.options.doFill) {
        ctx.fill();
      }
      if (this.options.doStroke) {
        ctx.stroke();
      }
      ctx.closePath();
    }
  }

  public translate(x: number, y: number) {
    const ctx = this.curContext;
    if (ctx) {
      ctx.translate(x, y);
      this.translation.addXY(x, y);
    }
    this.hidden?.translate(x, y);
  }

  public rotate(angle: number) {
    const ctx = this.curContext;
    if (ctx) {
      ctx.rotate(angle);
    }
    this.hidden?.rotate(angle);
  }

  public resetTransform(ratio = this.ratio) {
    const ctx = this.curContext;
    if (ctx) {
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      this.scale = 1;
      this.translation.setXY(0, 0);
    }
    this.hidden?.resetTransform();
  }

  public setScale(scale: number): void {
    this.curContext?.scale(scale, scale);
    this.scale *= scale;
    this.hidden?.setScale(scale);
  }

  public line(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    color: Color
  ): void {
    const ctx = this.curContext;
    if (ctx) {
      ctx.strokeStyle = toCss(color);
      ctx.lineWidth = this.options.lineWidth;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.closePath();
      ctx.stroke();
    }
  }

  public withOptions(
    options: Partial<GraphicsOptions>,
    proc: GraphicsProc
  ): GraphicsContext {
    this.pushOptions(options);
    proc(this);
    this.popOptions();
    return this;
  }

  public withAlpha(
    alpha: number,
    proc: (ctx: GraphicsContext) => void
  ): GraphicsContext {
    const ctx = this.curContext;
    if (ctx && this.hidden && this.hidden.canvas) {
      const oldAlpha = ctx.globalAlpha;
      this.hidden.begin();
      ctx.globalAlpha = alpha;
      // proc(this);
      const { scale, translation: { x, y } } = this;
      const dw = (this.hidden.width - this.width) / 2;
      const dh = (this.hidden.height - this.height) / 2;
      this.hidden.translate(x + dw, y + dh);
      this.hidden.setScale(scale);
      proc(this.hidden);
      this.setScale(1 / scale);
      // this.translate(-x, -y);
      ctx.drawImage(this.hidden.canvas, -x - dw, -y - dh);
      // this.translate(x, y);
      this.setScale(scale);
      ctx.globalAlpha = oldAlpha;
    }
    return this;
  }
}

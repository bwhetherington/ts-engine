import {
  Color,
  toCss,
  reshade,
  invert,
  TextStyle,
  GraphicsContext,
  GraphicsOptions,
  CM,
} from 'core/graphics';

interface Options {
  width: number;
  height: number;
  isFullScreen: boolean;
}

function createFontString(font: string, size: string): string {
  return `${size} ${font}`;
}

const DEFAULT_OPTIONS: Options = {
  width: 600,
  height: 400,
  isFullScreen: false,
};

export class HDCanvas implements GraphicsContext {
  private element?: HTMLCanvasElement;
  private width: number = 1;
  private height: number = 1;
  private ratio: number = 1;

  private options: GraphicsOptions = {
    lineWidth: 5,
    doStroke: true,
    doFill: true,
  };

  private curContext?: CanvasRenderingContext2D;

  constructor(options: Options = DEFAULT_OPTIONS) {
    const { width, height, isFullScreen } = options;

    this.element = document.createElement('canvas');
    if (this.element) {
      if (isFullScreen) {
        // document.addEventListener("resive", event => {
        //   event.
        // });
      } else {
        this.setSize(width, height);
      }

      // Set up auto scaling
    }
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
  }

  public setSize(w: number, h: number) {
    this.width = w;
    this.height = h;
    const { element } = this;
    if (element) {
      const ratio = window.devicePixelRatio ?? 1;
      this.ratio = ratio;
      element.width = w * ratio;
      element.height = h * ratio;
      element.style.width = w + 'px';
      element.style.height = h + 'px';
      element.getContext('2d')?.setTransform(ratio, 0, 0, ratio, 0, 0);
    }
    CM.setSize(w, h);
  }

  public attachTo(parent: HTMLElement) {
    if (this.element) {
      parent.appendChild(this.element);
    }
  }

  public getContext(): CanvasRenderingContext2D | undefined {
    return this.element?.getContext('2d') ?? undefined;
  }

  public begin() {
    this.curContext = this.getContext();
    this.resetTransform();
    this.clear();
  }

  public clear() {
    const ctx = this.curContext;
    if (ctx) {
      ctx.clearRect(0, 0, this.width, this.height);
    }
  }

  public text(x: number, y: number, text: string, style: TextStyle) {
    const ctx = this.curContext;
    if (ctx) {
      const { font = 'sans-serif', size = '12px', color } = style;
      const colorCss = color ? toCss(color) : 'black';

      ctx.beginPath();
      // ctx.lineWidth = 1;
      // ctx.fillStyle = "black";
      ctx.fillStyle = colorCss;
      ctx.font = createFontString(font, size);
      ctx.fillText(text, x, y);
    }
  }

  public ellipse(x: number, y: number, w: number, h: number, color: Color) {
    const ctx = this.curContext;
    if (ctx) {
      ctx.beginPath();
      ctx.fillStyle = toCss(color);
      ctx.strokeStyle = toCss(reshade(color));
      ctx.lineWidth = this.options.lineWidth;
      ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, 2 * Math.PI);
      if (this.options.doFill) {
        ctx.fill();
      }
      if (this.options.doStroke) {
        ctx.stroke();
      }
    }
  }

  public rect(x: number, y: number, w: number, h: number, color: Color) {
    const ctx = this.curContext;
    if (ctx) {
      ctx.beginPath();

      // ctx.fillStyle = toCss(color);
      ctx.fillStyle = toCss(color);
      ctx.strokeStyle = toCss(reshade(color));
      // console.log(ctx.fillStyle, ctx.strokeStyle);
      ctx.lineWidth = this.options.lineWidth;
      ctx.rect(x, y, w, h);
      if (this.options.doFill) {
        ctx.fill();
      }
      if (this.options.doStroke) {
        ctx.stroke();
      }
    }
  }

  public translate(x: number, y: number) {
    const ctx = this.curContext;
    if (ctx) {
      ctx.translate(x, y);
    }
  }

  public rotate(angle: number) {
    const ctx = this.curContext;
    if (ctx) {
      ctx.rotate(angle);
    }
  }

  public resetTransform() {
    const ctx = this.curContext;
    if (ctx) {
      ctx.setTransform(this.ratio, 0, 0, this.ratio, 0, 0);
    }
  }
}

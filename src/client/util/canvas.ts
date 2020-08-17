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
  private scale: number = 1;

  private options: GraphicsOptions = {
    lineWidth: 5,
    doStroke: true,
    doFill: true,
  };
  private optionsStack: Partial<GraphicsOptions>[] = [];

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

  public pushOptions(options: Partial<GraphicsOptions>): void {
    this.optionsStack.push(options);
    this.setOptions(options);
  }

  public popOptions(): Partial<GraphicsOptions> | undefined {
    const options = this.optionsStack.pop();
    this.setOptions(this.optionsStack[this.optionsStack.length - 1]);
    return options;
  }

  public setSize(w: number, h: number) {
    this.width = w;
    this.height = h;
    const { element } = this;
    if (element) {
      const ratio = window.devicePixelRatio ?? 1;
      this.ratio = ratio;
      const scale = this.ratio * this.scale;
      element.width = w * scale;
      element.height = h * scale;
      element.style.width = w + 'px';
      element.style.height = h + 'px';
      const ctx = element.getContext('2d');
      if (ctx) {
        ctx.setTransform(scale, 0, 0, scale, 0, 0);
        ctx.imageSmoothingEnabled = false;
      }
    }
    CameraManager.setSize(w, h);
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

  public clear(color?: Color) {
    const ctx = this.curContext;
    if (ctx) {
      ctx.clearRect(0, 0, this.width, this.height);
      if (color) {
        if (this.element) {
          this.element.style.backgroundColor = toCss(color);
        }
      }
    }
  }

  public text(x: number, y: number, text: string, style: TextStyle) {
    const ctx = this.curContext;
    if (ctx) {
      const { font = 'sans-serif', size = '12px', color } = style;
      const colorCss = color ? toCss(color) : 'black';

      ctx.beginPath();
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
      ctx.fillStyle = toCss(color);
      ctx.strokeStyle = toCss(reshade(color));
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
      ctx.setTransform(
        this.ratio * this.scale,
        0,
        0,
        this.ratio * this.scale,
        0,
        0
      );
    }
  }

  public setScale(scale: number): void {
    this.curContext?.scale(scale, scale);
  }
}

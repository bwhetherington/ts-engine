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
import {BLACK, COLOR_MAPPING, WHITE} from 'core/graphics/color';
import {GraphicsProc} from 'core/graphics/context';
import {Vector, Bounds, Matrix, VectorLike} from 'core/geometry';
import {GraphicsPipeline} from 'core/graphics/pipe';
import {TextColor, TextComponents} from 'core/chat';

interface Options {
  width: number;
  height: number;
  isFullScreen?: boolean;
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
  private scaleValue: number = 1;
  private translation: Vector = new Vector();
  public bounds?: Bounds;

  public transform: Matrix = new Matrix().identity();
  private src: Matrix = new Matrix();
  private dst: Matrix = new Matrix();

  private options: GraphicsOptions = {
    lineWidth: 4,
    uniformColor: false,
    doStroke: true,
    doFill: true,
  };
  private optionsStack: Partial<GraphicsOptions>[] = [];
  private curContext?: CanvasRenderingContext2D;

  constructor(
    element: HTMLCanvasElement,
    options: Options = DEFAULT_OPTIONS,
    isParent: boolean = true
  ) {
    const {width, height, isFullScreen} = options;

    this.canvas = element;
    if (this.canvas) {
      this.setSize(width, height);

      // Set up auto scaling
      let ctx;
      if ((ctx = this.getContext())) {
        ctx.lineCap = 'square';
        ctx.lineJoin = 'round';
      }

      this.pushOptions({
        lineWidth: 4,
        doFill: true,
        doStroke: true,
      });
    }

    if (isParent) {
      this.hidden = HDCanvas.create(options, false);
      this.hidden.bounds = new Bounds();
    }
  }

  public static create(
    options: Options = DEFAULT_OPTIONS,
    isParent: boolean = true
  ): HDCanvas {
    const canvas = document.createElement('canvas');
    return new HDCanvas(canvas, options, isParent);
  }

  public get isHidden(): boolean {
    return !this.hidden;
  }

  public getWidth(): number {
    return this.width;
  }

  public getHeight(): number {
    return this.height;
  }

  private setRound(ctx: CanvasRenderingContext2D): void {
    ctx.lineCap = 'square';
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
    this.options.useFancyAlpha = !!options.useFancyAlpha;
    this.options.uniformColor = !!options.uniformColor;
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
    const {canvas: element} = this;
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

  private getFillColor(color: Color): string {
    return toCss(color);
  }

  private getStrokeColor(color: Color, amount: number = 0.2): string {
    return this.options.uniformColor
      ? toCss(color)
      : toCss(reshade(color, amount));
  }

  private setStyles(
    ctx: CanvasRenderingContext2D,
    color: Color,
    amount: number = 0.2
  ): void {
    ctx.fillStyle = this.getFillColor(color);
    ctx.strokeStyle = this.getStrokeColor(color, amount);
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
    this.bounds?.clear();
    this.hidden?.clear(color);
  }

  public textComponents(
    x: number,
    y: number,
    components: TextComponents,
    style: TextStyle
  ): void {
    const ctx = this.curContext;
    if (ctx) {
      const scaleValue = this.scaleValue;
      const {font = 'Roboto Mono', size = 12} = style;
      ctx.lineWidth = this.options.lineWidth / scaleValue;
      ctx.textAlign = 'left';
      ctx.font = createFontString(font, size, scaleValue);
      this.setRound(ctx);

      // Compute width
      let totalWidth = 0;
      for (const component of components) {
        const text =
          (typeof component === 'string' ? component : component?.content) ??
          '';
        const width = ctx.measureText(text).width;
        totalWidth += width;
      }

      let xOffset = -totalWidth / 2;
      for (const component of components) {
        const text =
          (typeof component === 'string' ? component : component?.content) ??
          '';
        const colorString: TextColor =
          (typeof component === 'string' ? 'none' : component?.style?.color) ??
          'none';
        const color = COLOR_MAPPING[colorString];

        this.setStyles(ctx, color, 0.35);

        ctx.strokeText(text, x + xOffset, y);
        ctx.fillText(text, x + xOffset, y);

        const width = ctx.measureText(text).width;
        xOffset += width;
      }
    }
  }

  public text(x: number, y: number, text: string, style: TextStyle) {
    const ctx = this.curContext;
    if (ctx) {
      const scaleValue = this.scaleValue;
      const {font = 'Roboto Mono', size = 12, color = WHITE} = style;
      ctx.lineWidth = this.options.lineWidth / scaleValue;
      this.setStyles(ctx, color);
      ctx.textAlign = 'center';
      ctx.font = createFontString(font, size, scaleValue);
      this.setRound(ctx);
      ctx.strokeText(text, x, y);
      ctx.fillText(text, x, y);

      // Add text to bounds
      if (this.bounds) {
        const width = ctx.measureText(text).width;
        const height = size;
        this.bounds?.insertRawTransformed(
          x - width / 2,
          y - height / 2,
          width,
          height,
          this.transform
        );
      }
    }
  }

  public ellipse(x: number, y: number, w: number, h: number, color: Color) {
    const ctx = this.curContext;
    if (ctx) {
      this.setStyles(ctx, color);
      ctx.lineWidth = this.options.lineWidth;
      this.setRound(ctx);
      ctx.beginPath();
      ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, 2 * Math.PI);
      ctx.closePath();
      if (this.options.doFill) {
        ctx.fill();
      }
      if (this.options.doStroke) {
        ctx.stroke();
      }
      this.bounds?.insertRawTransformed(x, y, w, h, this.transform);
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
      this.setStyles(ctx, color);

      ctx.lineWidth = this.options.lineWidth;

      this.setRound(ctx);

      const fullWidth = fullW ?? w;

      if (this.options.ignoreScale) {
        ctx.lineWidth /= this.scaleValue;
        const newWidth = fullWidth / this.scaleValue;
        const newHeight = h / this.scaleValue;
        x += (fullWidth - newWidth) / 2;
        y += (h - newHeight) / 2;
        w /= this.scaleValue;
        h /= this.scaleValue;
      }
      ctx.beginPath();
      ctx.rect(x, y, w, h);
      if (this.options.doFill) {
        ctx.fill();
      }
      if (this.options.doStroke) {
        ctx.stroke();
      }
      ctx.closePath();
      this.bounds?.insertRawTransformed(x, y, w, h, this.transform);
    }
  }

  public trapezoid(
    centerX: number,
    centerY: number,
    bottomWidth: number,
    topWidth: number,
    height: number,
    color: Color
  ): void {
    const ctx = this.curContext;
    if (ctx) {
      // Compute vertices of trapezoid
      const topLeft = {
        y: centerY - topWidth / 2,
        x: centerX + height / 2,
      };
      const topRight = {
        y: centerY + topWidth / 2,
        x: centerX + height / 2,
      };
      const bottomLeft = {
        y: centerY - bottomWidth / 2,
        x: centerX - height / 2,
      };
      const bottomRight = {
        y: centerY + bottomWidth / 2,
        x: centerX - height / 2,
      };
      const vertices = [topLeft, topRight, bottomRight, bottomLeft];

      // Draw vertices as polygon
      this.polygon(vertices, color);

      // Compute bounds
      const width = Math.max(topWidth, bottomWidth);

      this.bounds?.insertRawTransformed(
        centerX - width / 2,
        centerY - height / 2,
        width,
        height,
        this.transform
      );
    }
  }

  public regularPolygon(
    centerX: number,
    centerY: number,
    vertexCount: number,
    radius: number,
    color: Color
  ): void {
    const vertices = [];
    for (let i = 0; i < vertexCount; i++) {
      const angle = (i / vertexCount) * (2 * Math.PI);
      const x = Math.cos(angle) * radius + centerX;
      const y = Math.sin(angle) * radius + centerY;
      vertices.push({x, y});
    }
    this.polygon(vertices, color);
    this.bounds?.insertRawTransformed(
      centerX - radius,
      centerY - radius,
      radius * 2,
      radius * 2,
      this.transform
    );
  }

  public polygon(vertices: VectorLike[], color: Color): void {
    const ctx = this.curContext;
    if (ctx) {
      this.setStyles(ctx, color);

      ctx.lineWidth = this.options.lineWidth;

      this.setRound(ctx);

      const {x, y} = vertices[0];

      ctx.beginPath();
      ctx.moveTo(x, y);
      for (let i = 1; i < vertices.length + 1; i++) {
        const vertex = vertices[i % vertices.length];
        ctx.lineTo(vertex.x, vertex.y);
      }
      ctx.closePath();

      if (this.options.doFill) {
        ctx.fill();
      }
      if (this.options.doStroke) {
        ctx.stroke();
      }
    }
  }

  public translate(x: number, y: number) {
    this.src.translate(x, y);
    this.transform.multiply(this.src, this.dst);
    this.transform.set(this.dst);

    const ctx = this.curContext;
    if (ctx) {
      ctx.translate(x, y);
      this.translation.addXY(x, y);
    }
    this.hidden?.translate(x, y);
  }

  public rotate(angle: number) {
    this.src.rotate(angle);
    this.transform.multiply(this.src, this.dst);
    this.transform.set(this.dst);

    const ctx = this.curContext;
    if (ctx) {
      ctx.rotate(angle);
    }
    this.hidden?.rotate(angle);
  }

  public resetTransform(ratio = this.ratio) {
    this.transform.identity();
    const ctx = this.curContext;
    if (ctx) {
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      this.scaleValue = 1;
      this.translation.setXY(0, 0);
    }
    this.hidden?.resetTransform();
  }

  public scale(scale: number): void {
    this.src.scale(scale, scale);
    this.transform.multiply(this.src, this.dst);
    this.transform.set(this.dst);

    this.curContext?.scale(scale, scale);
    this.scaleValue *= scale;
    this.hidden?.scale(scale);
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
    if (this.options.useFancyAlpha) {
      return this.withAlphaFancy(alpha, proc);
    } else {
      return this.withAlphaCheap(alpha, proc);
    }
  }

  private withAlphaCheap(
    alpha: number,
    proc: (ctx: GraphicsContext) => void
  ): GraphicsContext {
    const ctx = this.curContext;
    if (ctx) {
      const old = ctx.globalAlpha;
      ctx.globalAlpha = alpha;
      proc(this);
      ctx.globalAlpha = old;
    }
    return this;
  }

  private withAlphaFancy(
    alpha: number,
    proc: (ctx: GraphicsContext) => void
  ): GraphicsContext {
    if (alpha < 1) {
      if (this.hidden?.bounds) {
        const ctx = this.curContext;
        if (ctx && this.hidden && this.hidden.canvas) {
          const oldAlpha = ctx.globalAlpha;
          this.hidden.width = this.width * this.ratio;
          this.hidden.height = this.height * this.ratio;
          this.hidden.begin();
          ctx.globalAlpha = alpha;

          const {
            scaleValue,
            translation: {x, y},
          } = this;
          const dw = (this.hidden.width - this.width) / 2;
          const dh = (this.hidden.height - this.height) / 2;
          this.hidden.translate(x + dw, y + dh);
          this.hidden.scale(scaleValue);
          proc(this.hidden);
          let {
            x: sx,
            y: sy,
            width: sw,
            height: sh,
          } = this.hidden.bounds.boundingBox;
          this.scale(1 / scaleValue);
          const padding = 7;
          sx -= padding;
          sy -= padding;
          sw += padding * 2;
          sh += padding * 2;

          ctx.drawImage(
            this.hidden.canvas,
            sx,
            sy,
            sw,
            sh,
            sx - x - dw,
            sy - y - dh,
            sw,
            sh
          );
          this.scale(scaleValue);
          ctx.globalAlpha = oldAlpha;
        }
      }
    } else {
      proc(this);
    }
    return this;
  }
}

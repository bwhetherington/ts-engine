import {
  Color,
  toCss,
  reshade,
  TextStyle,
  GraphicsContext,
  GraphicsOptions,
  CameraManager,
  GameImage,
  Sprite,
  PIXEL_SIZE,
  Font,
  FONTS,
} from 'core/graphics';
import {BLACK, COLOR_MAPPING, WHITE} from 'core/graphics/color';
import {GraphicsProc, ShadowStyle} from 'core/graphics/context';
import {Vector, Bounds, Matrix3, VectorLike} from 'core/geometry';
import {TextColor, TextComponent, TextComponents} from 'core/chat';
import {threadId} from 'worker_threads';

interface Options {
  width: number;
  height: number;
  isFullScreen?: boolean;
}

function createFontString(font: string, size: number, scale: number): string {
  const fontSize = size / scale;
  return `${fontSize}pt ${font}`;
}

const DEFAULT_OPTIONS: Options = {
  width: 600,
  height: 400,
  isFullScreen: false,
};

function isSmall(component: string | TextComponent | null): boolean {
  return (
    typeof component === 'object' &&
    (component?.style?.styles?.includes('small') ?? false)
  );
}

type FontColor = 'white' | 'yellow' | 'red' | 'grey';

type CanvasOperation = (ctx: CanvasRenderingContext2D) => void;

const COLOR_FILTERS: Record<FontColor, CanvasOperation> = {
  white(ctx: CanvasRenderingContext2D) {
    ctx.filter = 'none';
  },
  yellow(ctx: CanvasRenderingContext2D) {
    ctx.filter = 'sepia() saturate(100000%)';
  },
  red(ctx: CanvasRenderingContext2D) {
    ctx.filter =
      'sepia() saturate(100000%) invert(100%) hue-rotate(120deg) brightness(95%) saturate(65%)';
  },
  grey(ctx: CanvasRenderingContext2D) {
    ctx.globalAlpha = 0.5;
  },
};

export class HDCanvas implements GraphicsContext {
  private canvas?: HTMLCanvasElement;
  private hidden?: HDCanvas;
  private width: number = 1;
  private height: number = 1;
  private ratio: number = 1;
  private scaleValue: number = 1;
  private translation: Vector = new Vector();
  private font?: Font;
  public bounds?: Bounds;

  public transform: Matrix3 = new Matrix3().identity();
  private src: Matrix3 = new Matrix3();
  private dst: Matrix3 = new Matrix3();

  private pixelBuffer?: HTMLCanvasElement;

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
    this.pixelBuffer = document.createElement('canvas');

    if (this.canvas) {
      this.setSize(width, height);

      // Set up auto scaling
      let ctx;
      if ((ctx = this.curContext)) {
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

  public setFont(font: string): void {
    this.font = FONTS.get(font);
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
      this.ratio = 1;
      const aspect = h / w;
      const bufH = 192;
      const bufW = Math.floor(bufH / aspect);
      element.width = bufW;
      element.height = bufH;
      element.style.width = w + 'px';
      element.style.height = h + 'px';
      CameraManager.setSize(bufW, bufH);
      CameraManager.scale = w / bufW;
    }
    if (this.hidden) {
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

  private getStrokeColor(color: Color, amount: number = -0.5): string {
    return this.options.uniformColor
      ? toCss(color)
      : toCss(reshade(color, amount));
  }

  private setStyles(
    ctx: CanvasRenderingContext2D,
    color: Color,
    amount: number = -0.2
  ): void {
    ctx.fillStyle = this.getFillColor(color);
    ctx.strokeStyle = this.getStrokeColor(color, amount);
  }

  public clear(color?: Color) {
    const baseCtx = this.canvas?.getContext('2d');
    if (baseCtx) {
      baseCtx.clearRect(0, 0, this.width, this.height);
    }

    const ctx = this.curContext;
    if (this.pixelBuffer && ctx) {
      ctx.clearRect(0, 0, this.pixelBuffer.width, this.pixelBuffer.height);
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
      ctx.save();
      const scaleValue = 1;
      const {size = 10, font = 'Pixels'} = style;
      ctx.lineWidth = 2;
      ctx.textAlign = 'left';
      ctx.filter = 'contrast(0%)';

      const normalFont = createFontString(font, size, scaleValue);
      const smallFont = createFontString(font, size - 10, scaleValue);
      ctx.font = normalFont;

      // this.setRound(ctx);
      ctx.lineCap = 'square';
      ctx.lineJoin = 'miter';

      // Compute width
      let totalWidth = 0;
      for (const component of components) {
        const text =
          (typeof component === 'string' ? component : component?.content) ??
          '';
        if (isSmall(component)) {
          ctx.font = smallFont;
        } else {
          ctx.font = normalFont;
        }
        const width = Math.round(ctx.measureText(text).width);
        totalWidth += width;
      }

      let xOffset = Math.floor(-totalWidth / 2);
      for (const component of components) {
        const text =
          (typeof component === 'string' ? component : component?.content) ??
          '';
        const colorString: TextColor =
          (typeof component === 'string' ? 'none' : component?.style?.color) ??
          'none';
        const color = COLOR_MAPPING[colorString];

        const componentIsSmall = isSmall(component);
        ctx.font = normalFont;

        this.setStyles(ctx, color, -0.5);
        ctx.fillText(text, x + xOffset, y);

        const width = ctx.measureText(text).width;
        xOffset += Math.ceil(width);
      }
      ctx.restore();
    }
  }

  public text(
    x: number,
    y: number,
    text: string,
    {fontColor = 'white'}: TextStyle
  ) {
    const ctx = this.curContext;
    if (!(ctx && this.font)) {
      return;
    }

    const filter = COLOR_FILTERS[fontColor];

    ctx.save();
    filter?.(ctx);
    this.font.render(this, text, x, y);
    ctx.restore();
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

  public roundRect(
    x: number,
    y: number,
    w: number,
    h: number,
    r: number,
    color: Color,
    fullW?: number
  ): void {
    const ctx = this.curContext;
    if (!ctx) {
      return;
    }

    x = Math.floor(x);
    y = Math.floor(y);
    w = Math.floor(w);
    h = Math.floor(h);
    r = Math.floor(r);

    this.setStyles(ctx, color);
    ctx.lineWidth = this.options.lineWidth;
    this.setRound(ctx);

    if (w < 2 * r) {
      r = w / 2;
    }
    if (h < 2 * r) {
      r = h / 2;
    }

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
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();

    if (this.options.doFill) {
      ctx.fill();
    }
    if (this.options.doStroke) {
      ctx.stroke();
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

      // x = Math.floor(x / PIXEL_SIZE) * PIXEL_SIZE;
      // y = Math.floor(y / PIXEL_SIZE) * PIXEL_SIZE;
      // w = Math.floor(w / PIXEL_SIZE) * PIXEL_SIZE;
      // h = Math.floor(h / PIXEL_SIZE) * PIXEL_SIZE;
      // if (fullW) {
      //   fullW = Math.floor(fullW / PIXEL_SIZE) * PIXEL_SIZE;
      // }

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

  public rawRect(x: number, y: number, w: number, h: number, c: Color): void {
    const ctx = this.curContext;
    if (!ctx) {
      return;
    }

    ctx.save();
    ctx.fillStyle = toCss(c);
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.fill();
    ctx.closePath();

    ctx.restore();
  }

  public box(x: number, y: number, w: number, h: number): void {
    const ctx = this.curContext;
    if (!ctx) {
      return;
    }
    ctx.save();
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.fill();
    ctx.closePath();
    ctx.fillStyle = '#122020';
    ctx.beginPath();
    ctx.rect(x + 1, y + 1, w - 2, h - 2);
    ctx.fill();
    ctx.closePath();
    ctx.restore();
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
    color: Color,
    angleOffset?: number
  ): void {
    if (angleOffset === undefined) {
      angleOffset = 0;
    }
    const vertices = [];
    for (let i = 0; i < vertexCount; i++) {
      const angle = (i / vertexCount) * (2 * Math.PI) + angleOffset;
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
        this.bounds?.insertPointTransformed(x, y, this.transform);
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

  public path(points: Iterable<VectorLike>, color: Color): void {
    const ctx = this.curContext;
    if (ctx) {
      this.setStyles(ctx, color);
      ctx.lineWidth = this.options.lineWidth;
      this.setRound(ctx);
      ctx.beginPath();
      ctx.lineCap = 'round';

      let hasStarted = false;
      let lastX = 0;
      let lastY = 0;
      for (const {x, y} of points) {
        if (hasStarted) {
          const cpx = (x + lastX) / 2;
          const cpy = (y + lastY) / 2;
          ctx.quadraticCurveTo(cpx, cpy, x, y);
          ctx.lineTo(x, y);
        } else {
          ctx.moveTo(x, y);
          hasStarted = true;
        }

        lastX = x;
        lastY = y;
      }

      ctx.stroke();
    }
  }

  public translate(x: number, y: number) {
    x = Math.floor(x);
    y = Math.floor(y);
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
    const ctx = this.canvas?.getContext('2d');
    if (ctx) {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      this.scaleValue = 1;
      this.translation.setXY(0, 0);
    }
    const pixCtx = this.curContext;
    if (pixCtx) {
      pixCtx.resetTransform();
    }
    this.hidden?.resetTransform();
  }

  public scale(scale: number): void {
    this.src.scale(scale, scale);
    this.transform.multiply(this.src, this.dst);
    this.transform.set(this.dst);

    const ctx = this.canvas?.getContext('2d');
    if (ctx) {
      this.curContext?.scale(scale, scale);
      this.scaleValue *= scale;
      this.hidden?.scale(scale);
    }
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

  public withShadow(
    {color, size}: ShadowStyle,
    proc: GraphicsProc
  ): GraphicsContext {
    const ctx = this.curContext;
    if (ctx) {
      const {shadowColor, shadowBlur} = ctx;
      ctx.shadowColor = toCss(color);
      ctx.shadowBlur = size;
      proc(this);
      ctx.shadowColor = shadowColor;
      ctx.shadowBlur = shadowBlur;
    }
    return this;
  }

  public image(
    image: GameImage,
    dx: number,
    dy: number,
    dw: number,
    dh: number,
    sx: number,
    sy: number,
    sw: number,
    sh: number,
    shadowOffset?: VectorLike
  ): void {
    const ctx = this.curContext;
    if (!ctx) {
      return;
    }

    (sx = Math.floor(sx)),
      (sy = Math.floor(sy)),
      (sw = Math.ceil(sw)),
      (sh = Math.ceil(sh)),
      (dx = Math.floor(dx)),
      (dy = Math.floor(dy)),
      (dw = Math.ceil(dw)),
      (dh = Math.ceil(dh));

    if (sw === 0 || sh === 0 || dw === 0 || dh === 0) {
      return;
    }

    // Draw shadow
    if (shadowOffset) {
      const {x: ox, y: oy} = shadowOffset;
      ctx.save();
      ctx.translate(ox, oy);
      ctx.filter = 'brightness(0%)';
      ctx.globalAlpha = 0.5;
      ctx.drawImage(image, sx, sy, sw, sh, dx, dy, dw, dh);
      ctx.restore();
    }

    ctx.save();
    // ctx.resetTransform();
    // ctx.imageSmoothingEnabled = false;
    ctx.drawImage(image, sx, sy, sw, sh, dx, dy, dw, dh);
    ctx.restore();
  }

  public sprite(sprite: Sprite): void {
    const ctx = this.curContext;
    if (!ctx) {
      return;
    }

    sprite.render(ctx);
  }

  public drawPixelBuffer(): void {
    // const ctx = this.canvas?.getContext('2d');
    // if (!(this.canvas && ctx && this.pixelBuffer)) {
    //   return;
    // }
    // const canvas = this.canvas;
    // const buf = this.pixelBuffer;
    // ctx.save();
    // ctx.resetTransform();
    // ctx.imageSmoothingEnabled = false;
    // const scale = (this.canvas.width * this.ratio) / buf.width;
    // const offsetX = Math.floor((canvas.width - buf.width * scale));
    // const offsetY = Math.floor((canvas.height - buf.height * scale));
    // CameraManager.transform = {
    //   scale,
    //   tx: -(canvas.width - buf.width) * this.ratio / 2,
    //   ty: -(canvas.width - buf.width) * this.ratio / 2,
    // };
    // ctx.drawImage(
    //   buf,
    //   0,
    //   0,
    //   buf.width,
    //   buf.height,
    //   0,
    //   0,
    //   canvas.width,
    //   canvas.height,
    //   // offsetX,
    //   // offsetY,
    //   // buf.width * scale,
    //   // buf.height * scale
    // );
    // ctx.restore();
  }

  public measureText(text: string): number {
    return this.font?.measureString(text) ?? 0;
  }

  public withFrame(proc: GraphicsProc): void {
    const ctx = this.curContext;
    if (!ctx) {
      return;
    }

    ctx.save();
    proc(this);
    ctx.restore();
  }
}

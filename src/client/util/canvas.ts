interface Options {
  width: number;
  height: number;
  isFullScreen: boolean;
}

const DEFAULT_OPTIONS: Options = {
  width: 600,
  height: 400,
  isFullScreen: false,
};

export class HDCanvas {
  private element?: HTMLCanvasElement;
  private width: number = 1;
  private height: number = 1;
  private ratio: number = 1;

  public fill?: string;
  public stroke?: string;
  public lineWidth?: number = 1;

  private curContext?: CanvasRenderingContext2D;

  constructor(options: Options = DEFAULT_OPTIONS) {
    const { width, height, isFullScreen } = options;

    this.element = document.createElement("canvas");
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

  private setSize(w: number, h: number): void {
    this.width = w;
    this.height = h;
    const { element } = this;
    if (element) {
      const ratio = window.devicePixelRatio ?? 1;
      this.ratio = ratio;
      element.width = w * ratio;
      element.height = h * ratio;
      element.style.width = w + "px";
      element.style.height = h + "px";
      element.getContext("2d")?.setTransform(ratio, 0, 0, ratio, 0, 0);
    }
  }

  public attachTo(parent: HTMLElement): void {
    if (this.element) {
      console.log("bar");
      parent.appendChild(this.element);
    }
  }

  public getContext(): CanvasRenderingContext2D | undefined {
    return this.element?.getContext("2d") ?? undefined;
  }

  public begin(): boolean {
    this.curContext = this.getContext();
    this.clear();
    return this.curContext !== undefined;
  }

  public clear(): boolean {
    const ctx = this.curContext;
    if (ctx) {
      ctx.clearRect(0, 0, this.width, this.height);
      return true;
    }
    return false;
  }

  public rect(x: number, y: number, w: number, h: number): boolean {
    const ctx = this.curContext;
    if (ctx) {
      ctx.beginPath();
      ctx.strokeStyle = this.stroke ?? "black";
      ctx.fillStyle = this.fill ?? "black";
      ctx.lineWidth = this.lineWidth ?? 1;
      ctx.rect(x, y, w, h);
      ctx.fill();
      ctx.stroke();
      return true;
    }
    return false;
  }

  public ellipse(x: number, y: number, w: number, h: number): boolean {
    const ctx = this.curContext;
    if (ctx) {
      return true;
    }
    return false;
  }
}

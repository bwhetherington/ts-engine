import { Color } from 'core/graphics/color';

export interface TextStyle {
  font?: string;
  size?: number;
  color?: Color;
}

export interface GraphicsOptions {
  lineWidth: number;
  doStroke: boolean;
  doFill: boolean;
  ignoreScale?: boolean;
}

export interface GraphicsContext {
  setOptions(options: Partial<GraphicsOptions>): void;
  pushOptions(options: Partial<GraphicsOptions>): void;
  popOptions(): Partial<GraphicsOptions> | undefined;

  begin(): void;
  clear(color?: Color): void;
  text(x: number, y: number, text: string, style: TextStyle): void;
  ellipse(x: number, y: number, w: number, h: number, color: Color): void;
  rect(x: number, y: number, w: number, h: number, color: Color, fullW?: number): void;
  line(x1: number, y1: number, x2: number, y2: number, color: Color): void;
  translate(x: number, y: number): void;
  rotate(angle: number): void;
  setScale(scale: number): void;
  resetTransform(): void;

  withOptions(options: Partial<GraphicsOptions>, proc: (ctx: GraphicsContext) => void): void;
}

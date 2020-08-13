import { Color } from 'core/graphics/color';

export interface TextStyle {
  font?: string;
  size?: string;
  color?: Color;
}

export interface GraphicsOptions {
  lineWidth: number;
  doStroke: boolean;
  doFill: boolean;
}

export interface GraphicsContext {
  setOptions(options: Partial<GraphicsOptions>): void;
  pushOptions(options: Partial<GraphicsOptions>): void;
  popOptions(): Partial<GraphicsOptions> | undefined;

  begin(): void;
  clear(color?: Color): void;
  text(x: number, y: number, text: string, style: TextStyle): void;
  ellipse(x: number, y: number, w: number, h: number, color: Color): void;
  rect(x: number, y: number, w: number, h: number, color: Color): void;
  translate(x: number, y: number): void;
  rotate(angle: number): void;
  setScale(scale: number): void;
  resetTransform(): void;
}

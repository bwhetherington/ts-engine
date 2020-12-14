import { Vector, VectorLike } from 'core/geometry';
import { Color } from 'core/graphics/color';
import { GraphicsPipeline } from 'core/graphics/pipe';

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
  useFancyAlpha?: boolean;
}

export type GraphicsProc = (ctx: GraphicsContext) => void;

export interface GraphicsContext {
  setOptions(options: Partial<GraphicsOptions>): void;
  pushOptions(options: Partial<GraphicsOptions>): void;
  popOptions(): Partial<GraphicsOptions> | undefined;

  begin(): void;
  clear(color?: Color): void;
  text(x: number, y: number, text: string, style: TextStyle): void;
  ellipse(x: number, y: number, w: number, h: number, color: Color): void;
  rect(
    x: number,
    y: number,
    w: number,
    h: number,
    color: Color,
    fullW?: number
  ): void;
  trapezoid(
    centerX: number,
    centerY: number,
    bottomWidth: number,
    topWidth: number,
    height: number,
    color: Color
  ): void;
  polygon(vertices: VectorLike[], color: Color): void;
  regularPolygon(
    x: number,
    y: number,
    vertexCount: number,
    radius: number,
    color: Color
  ): void;
  line(x1: number, y1: number, x2: number, y2: number, color: Color): void;
  translate(x: number, y: number): void;
  rotate(angle: number): void;
  scale(scale: number): void;
  resetTransform(): void;

  withAlpha(alpha: number, proc: GraphicsProc): GraphicsContext;
  withOptions(
    options: Partial<GraphicsOptions>,
    proc: (ctx: GraphicsContext) => void
  ): GraphicsContext;
}

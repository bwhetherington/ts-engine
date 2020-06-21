export interface Color {
  red: number;
  green: number;
  blue: number;
  alpha?: number;
}

function toColorInt(color: number): number {
  return Math.round(color * 255);
}

export function toCss(color: Color): string {
  const { red, green, blue, alpha = 100 } = color;
  const redInt = toColorInt(red);
  const greenInt = toColorInt(green);
  const blueInt = toColorInt(blue);
  const out =
    "rgba(" + redInt + ", " + greenInt + ", " + blueInt + ", " + alpha + ")";
  // console.log(out);
  return out;
}

function clamp(x: number): number {
  return Math.min(Math.max(x, 0), 1);
}

export function reshade(color: Color, amount: number = 0.2): Color {
  const { red, green, blue, alpha } = color;
  return {
    red: clamp(red - amount),
    green: clamp(green - amount),
    blue: clamp(blue - amount),
    alpha,
  };
}

export function invert(color: Color): Color {
  const { red, green, blue, alpha } = color;
  return {
    red: 1 - red,
    green: 1 - green,
    blue: 1 - blue,
    alpha,
  };
}

export const BLACK: Color = { red: 0, green: 0, blue: 0 };
export const WHITE: Color = { red: 1, green: 1, blue: 1 };

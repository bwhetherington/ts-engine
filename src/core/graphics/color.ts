import { RNGManager } from 'core/random';

export interface Color {
  red: number;
  green: number;
  blue: number;
  alpha?: number;
}

export function randomColor(
  saturation: number = 0.65,
  value: number = 0.9
): Color {
  const hue = RNGManager.nextFloat(0, 360);
  return hsv(hue, saturation, value);
}

const RED_LIGHTNESS = 0.2126;
const GREEN_LIGHTNESS = 0.7152;
const BLUE_LIGHTNESS = 0.0722;

export function hsva(
  hue: number,
  saturation: number,
  value: number,
  alpha: number
): Color {
  const c = value * saturation;
  const x = c * (1 - Math.abs(((hue / 60) % 2) - 1));
  const m = value - c;

  let r = 0;
  let g = 0;
  let b = 0;

  const sextant = Math.floor(hue / 60) % 6;
  switch (sextant) {
    case 0:
      r = c;
      g = x;
      break;
    case 1:
      r = x;
      g = c;
      break;
    case 2:
      g = c;
      b = x;
      break;
    case 3:
      g = x;
      b = c;
      break;
    case 4:
      r = x;
      b = c;
      break;
    case 5:
      r = c;
      b = x;
      break;
  }

  // Weight red green and blue according to lightness
  r += m;
  g += m;
  b += m;

  return {
    red: r,
    green: g,
    blue: b,
    alpha,
  };
}

export function hsv(hue: number, saturation: number, value: number): Color {
  return hsva(hue, saturation, value, 1);
}

export function rgb(red: number, green: number, blue: number): Color {
  return { red, green, blue, alpha: 1 };
}

export function rgba(
  red: number,
  green: number,
  blue: number,
  alpha: number
): Color {
  return { red, green, blue, alpha };
}

export function isColor(input: any): input is Color {
  if (input) {
    const { red, green, blue, alpha } = input;
    return (
      typeof red === 'number' &&
      typeof green === 'number' &&
      typeof blue === 'number' &&
      (alpha === undefined || typeof alpha === 'number')
    );
  } else {
    return false;
  }
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
    'rgba(' + redInt + ', ' + greenInt + ', ' + blueInt + ', ' + alpha + ')';
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

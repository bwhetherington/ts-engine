import {TextColor} from 'core/chat';
import {RNGManager} from 'core/random';
import { HashMap, Key } from 'core/util/map';

export interface Color {
  red: number;
  green: number;
  blue: number;
  alpha?: number;
}

export interface ColorHSV {
  hue: number;
  saturation: number;
  value: number;
  alpha?: number;
}

export const COLOR_MAPPING: Record<TextColor, Color> = {
  none: rgb(1, 1, 1),
  grey: rgba(1, 1, 1, 0.75),
  red: rgb(1, 0.4, 0.4),
  orange: rgb(0.9, 0.6, 0.3),
  yellow: rgb(0.9, 0.9, 0.3),
  green: rgb(0.3, 0.6, 0.3),
  aqua: rgb(0.3, 0.8, 1),
  blue: rgb(0.5, 0.5, 1),
  purple: rgb(0.9, 0.3, 0.9),
};

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

export function fromRGB(color: Color): ColorHSV {
  const {red, green, blue, alpha} = color;

  const cMax = Math.max(red, green, blue);
  const cMin = Math.min(red, green, blue);

  const delta = cMax - cMin;
  let hue;
  switch (cMax) {
    case red:
      hue = (60 * ((green - blue) / delta) + 360) % 360;
      break;
    case green:
      hue = (60 * ((blue - red) / delta) + 120) % 360;
      break;
    case blue:
      hue = (60 * ((red - green) / delta) + 240) % 360;
      break;
    default:
      hue = 0;
      break;
  }

  let saturation;
  if (cMax === 0) {
    saturation = 0;
  } else {
    saturation = delta / cMax;
  }

  const value = cMax;

  return {
    hue,
    saturation,
    value,
    alpha
  }
}

export function fromHSV(color: ColorHSV): Color {
  const {hue, saturation, value, alpha} = color;
  return hsva(hue, saturation, value, alpha ?? 1);
}

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
  return {red, green, blue, alpha: 1};
}

export function rgba(
  red: number,
  green: number,
  blue: number,
  alpha: number
): Color {
  return {red, green, blue, alpha};
}

export function isColor(input: any): input is Color {
  if (input) {
    const {red, green, blue, alpha} = input;
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
  const {red, green, blue, alpha = 100} = color;
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

class ColorShade implements Key {
  public constructor(
    public color: Color,
    public shade: number,
  ) {}

    public hash(): number {
      const {red, green, blue, alpha = 1} = this.color;
      const r = Math.floor(red * 255);
      const g = Math.floor(green * 255);
      const b = Math.floor(blue * 255);
      const a = Math.floor(alpha * 255);
      const s = Math.floor(this.shade * 255);
      return r + g * 127 + b * 337 + a * 743 + s * 1237;
    }

    public equals(other: any): boolean {
      const {color = {}, shade} = other;
      const {red, green, blue, alpha = 1} = color;
      return this.color.red === red && this.color.green === green && this.color.blue === blue && (this.color.alpha === undefined || this.color.alpha === alpha) && this.shade === shade;
    }
}

const COLOR_RESHADE_MAP: HashMap<ColorShade, Color> = new HashMap();

export function reshade(color: Color, amount: number = 0.2): Color {
  const shade = new ColorShade(color, amount);
  const existing = COLOR_RESHADE_MAP.get(shade);
  if (existing) {
    return existing;
  } else {
    const {hue, saturation, value, alpha} = fromRGB(color);
    const reshaded = hsva(hue, saturation, clamp(value - amount), alpha ?? 1);
    COLOR_RESHADE_MAP.insert(shade, reshaded);
    return reshaded;
  }
}

export function invert(color: Color): Color {
  const {red, green, blue, alpha} = color;
  return {
    red: 1 - red,
    green: 1 - green,
    blue: 1 - blue,
    alpha,
  };
}

export const BLACK: Color = {red: 0, green: 0, blue: 0};
export const WHITE: Color = {red: 1, green: 1, blue: 1};

import {TextColor} from 'core/chat';
import {RNGManager} from 'core/random';
import {HashMap, Key} from 'core/util/map';

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
  grey: rgb(0.95, 0.95, 0.95),
  red: hsv(0, 0.65, 1),
  orange: hsv(30, 0.65, 1),
  yellow: hsv(60, 0.65, 1),
  green: rgb(120, 0.65, 1),
  aqua: hsv(170, 0.65, 1),
  blue: hsv(220, 0.65, 1),
  purple: hsv(300, 0.65, 1),
};

export const COLORS: Color[] = [
  fromHSV({hue: 0, value: 0.85, saturation: 0.6}),
  fromHSV({hue: 20, value: 0.8, saturation: 0.65}),
  fromHSV({hue: 40, value: 0.8, saturation: 0.7}),
  fromHSV({hue: 60, value: 0.9, saturation: 0.7}),
  fromHSV({hue: 80, value: 0.8, saturation: 0.7}),
  fromHSV({hue: 100, value: 0.75, saturation: 0.75}),
  fromHSV({hue: 120, value: 0.7, saturation: 0.8}),
  fromHSV({hue: 140, value: 0.75, saturation: 0.75}),
  fromHSV({hue: 160, value: 0.8, saturation: 0.7}),
  fromHSV({hue: 180, value: 0.85, saturation: 0.7}),
  fromHSV({hue: 200, value: 0.9, saturation: 0.5}),
  fromHSV({hue: 220, value: 0.9, saturation: 0.45}),
  fromHSV({hue: 240, value: 0.9, saturation: 0.5}),
  fromHSV({hue: 260, value: 0.9, saturation: 0.45}),
  fromHSV({hue: 280, value: 0.9, saturation: 0.5}),
  fromHSV({hue: 300, value: 0.9, saturation: 0.5}),
  fromHSV({hue: 320, value: 0.9, saturation: 0.5}),
  fromHSV({hue: 340, value: 0.85, saturation: 0.55}),
];

export const COLOR_NAMES: Record<string, Color> = {
  red: COLORS[0],
  yellow: COLORS[60 / 20],
  green: COLORS[120 / 20],
  cyan: COLORS[180 / 20],
  blue: COLORS[240 / 20],
  magenta: COLORS[300 / 20],
  white: fromHSV({hue: 0, value: 0.95, saturation: 0}),
  black: fromHSV({hue: 0, value: 0.25, saturation: 0}),
};

type ColorKey = string | number | Color;

export function randomColor(): Color {
  const i = RNGManager.nextInt(0, COLORS.length);
  return {...COLORS[i]};
}

// const RED_LIGHTNESS = 0.2126;
// const GREEN_LIGHTNESS = 0.7152;
// const BLUE_LIGHTNESS = 0.0722;

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
    alpha,
  };
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
  const RED_LIGHTNESS = 0.314;
  const GREEN_LIGHTNESS = 0.512;
  const BLUE_LIGHTNESS = 0.174;

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

export function tryColor(input: any): Color | undefined {
  if (typeof input === 'number') {
    return COLORS[input];
  }

  if (typeof input === 'string') {
    return COLOR_NAMES[input];
  }

  if (isColor(input)) {
    return input;
  }

  const {hue, saturation, value, alpha} = input;
  if (
    typeof hue === 'number' &&
    typeof saturation === 'number' &&
    typeof value === 'number' &&
    (alpha === undefined || typeof alpha === 'number')
  ) {
    return hsva(hue, saturation, value, alpha ?? 1);
  }
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
  public constructor(public color: Color, public shade: number) {}

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
    return (
      this.color.red === red &&
      this.color.green === green &&
      this.color.blue === blue &&
      (this.color.alpha === undefined || this.color.alpha === alpha) &&
      this.shade === shade
    );
  }
}

const COLOR_RESHADE_MAP: HashMap<ColorShade, Color> = new HashMap();

export function reshade(color: Color, amount: number = -0.2): Color {
  const shade = new ColorShade(color, amount);
  const existing = COLOR_RESHADE_MAP.get(shade);
  if (existing) {
    return existing;
  } else {
    const {hue, saturation, value, alpha} = fromRGB(color);
    const newValue = value + amount;
    const excess = Math.max(0, newValue - 1);
    const reshaded = hsva(
      hue,
      clamp(saturation - excess),
      clamp(newValue),
      alpha ?? 1
    );
    COLOR_RESHADE_MAP.insert(shade, reshaded);

    // const {red, green, blue, alpha} = color;
    // const reshaded = {
    //   red: clamp(red + amount),
    //   green: clamp(green + amount),
    //   blue: clamp(blue + amount),
    //   alpha
    // };
    // COLOR_RESHADE_MAP.insert(shade, reshaded);
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

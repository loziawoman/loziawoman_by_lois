// Pure colour maths for garment recolouring. No DOM access, so it can be unit tested.

export type RGB = { r: number; g: number; b: number };
export type HSL = { h: number; s: number; l: number };

export const clamp = (value: number, min = 0, max = 1) => Math.max(min, Math.min(max, value));

export const smoothStep = (value: number) => {
  const t = clamp(value);
  return t * t * (3 - 2 * t);
};

export function parseHex(value: string): RGB | null {
  const hex = value.replace('#', '').trim();
  if (!/^[0-9a-f]{6}$/i.test(hex)) return null;
  return { r: parseInt(hex.slice(0, 2), 16), g: parseInt(hex.slice(2, 4), 16), b: parseInt(hex.slice(4, 6), 16) };
}

export function rgbToHsl({ r, g, b }: RGB): HSL {
  const red = r / 255, green = g / 255, blue = b / 255;
  const max = Math.max(red, green, blue), min = Math.min(red, green, blue);
  const lightness = (max + min) / 2;
  const delta = max - min;
  if (delta === 0) return { h: 0, s: 0, l: lightness };

  const saturation = lightness > 0.5 ? delta / (2 - max - min) : delta / (max + min);
  let hue: number;
  if (max === red) hue = (green - blue) / delta + (green < blue ? 6 : 0);
  else if (max === green) hue = (blue - red) / delta + 2;
  else hue = (red - green) / delta + 4;
  return { h: hue * 60, s: saturation, l: lightness };
}

export function hslToRgb({ h, s, l }: HSL): RGB {
  if (s === 0) {
    const channel = Math.round(l * 255);
    return { r: channel, g: channel, b: channel };
  }
  const hue = h / 360;
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const toChannel = (t: number) => {
    let v = t;
    if (v < 0) v += 1;
    if (v > 1) v -= 1;
    if (v < 1 / 6) return p + (q - p) * 6 * v;
    if (v < 1 / 2) return q;
    if (v < 2 / 3) return p + (q - p) * (2 / 3 - v) * 6;
    return p;
  };
  return { r: Math.round(toChannel(hue + 1 / 3) * 255), g: Math.round(toChannel(hue) * 255), b: Math.round(toChannel(hue - 1 / 3) * 255) };
}

export const luminance = ({ r, g, b }: RGB) => 0.2126 * r + 0.7152 * g + 0.0722 * b;

export function hueDistance(first: number, second: number) {
  const distance = Math.abs(first - second);
  return Math.min(distance, 360 - distance);
}

export function isSkinLike({ r, g, b }: RGB) {
  const warm = r > g && g > b;
  const range = r - b;
  return warm && range > 18 && range < 125 && g > 35 && r > 55;
}

/**
 * Rebuilds a garment pixel in the target colour from its luminance, so folds, highlights and shadows survive.
 * A hue rotation cannot do this: black has no hue to rotate. `relativeLuminance` is the pixel's brightness within the
 * garment (0 = darkest fabric, 1 = brightest). `weight` is the mask strength (0 = untouched, 1 = fully recoloured).
 */
export function recolourPixel(source: RGB, targetHsl: HSL, relativeLuminance: number, weight: number): RGB {
  const lightness = clamp(targetHsl.l * (0.52 + relativeLuminance * 0.9), 0.025, 0.94);
  const saturation = clamp(targetHsl.s * (0.76 + relativeLuminance * 0.24));
  const recoloured = hslToRgb({ h: targetHsl.h, s: saturation, l: lightness });
  const highlight = clamp((luminance(source) - 226) / 29) * 0.18;
  const mix = clamp(weight);
  const blend = (original: number, next: number) => Math.round(original * (1 - mix) + (next * (1 - highlight) + 255 * highlight) * mix);
  return { r: blend(source.r, recoloured.r), g: blend(source.g, recoloured.g), b: blend(source.b, recoloured.b) };
}

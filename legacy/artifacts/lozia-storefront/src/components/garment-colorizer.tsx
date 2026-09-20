import { useEffect, useRef, useState } from 'react';

type Props = {
  src: string;
  target: string;
  original: string;
  originalHex?: string;
  alt: string;
  className?: string;
  mask?: string;
};

type RGB = { r: number; g: number; b: number };
type HSL = { h: number; s: number; l: number };

const outputCache = new Map<string, string>();
const imageCache = new Map<string, Promise<HTMLImageElement>>();

const clamp = (value: number, min = 0, max = 1) =>
  Math.max(min, Math.min(max, value));

const smoothStep = (value: number) => {
  const t = clamp(value);
  return t * t * (3 - 2 * t);
};

function loadImage(src: string) {
  const cached = imageCache.get(src);
  if (cached) return cached;

  const promise = new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new window.Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });

  imageCache.set(src, promise);
  return promise;
}

function parseHex(value: string): RGB | null {
  const hex = value.replace('#', '').trim();
  if (!/^[0-9a-f]{6}$/i.test(hex)) return null;
  return {
    r: Number.parseInt(hex.slice(0, 2), 16),
    g: Number.parseInt(hex.slice(2, 4), 16),
    b: Number.parseInt(hex.slice(4, 6), 16),
  };
}

function rgbToHsl({ r, g, b }: RGB): HSL {
  const red = r / 255;
  const green = g / 255;
  const blue = b / 255;
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const lightness = (max + min) / 2;
  const delta = max - min;

  if (delta === 0) return { h: 0, s: 0, l: lightness };

  const saturation =
    lightness > 0.5
      ? delta / (2 - max - min)
      : delta / (max + min);
  let hue = 0;

  if (max === red) hue = (green - blue) / delta + (green < blue ? 6 : 0);
  else if (max === green) hue = (blue - red) / delta + 2;
  else hue = (red - green) / delta + 4;

  return { h: hue * 60, s: saturation, l: lightness };
}

function hslToRgb({ h, s, l }: HSL): RGB {
  if (s === 0) {
    const channel = Math.round(l * 255);
    return { r: channel, g: channel, b: channel };
  }

  const hue = h / 360;
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const hueToChannel = (t: number) => {
    let value = t;
    if (value < 0) value += 1;
    if (value > 1) value -= 1;
    if (value < 1 / 6) return p + (q - p) * 6 * value;
    if (value < 1 / 2) return q;
    if (value < 2 / 3) return p + (q - p) * (2 / 3 - value) * 6;
    return p;
  };

  return {
    r: Math.round(hueToChannel(hue + 1 / 3) * 255),
    g: Math.round(hueToChannel(hue) * 255),
    b: Math.round(hueToChannel(hue - 1 / 3) * 255),
  };
}

function luminance({ r, g, b }: RGB) {
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function hueDistance(first: number, second: number) {
  const distance = Math.abs(first - second);
  return Math.min(distance, 360 - distance);
}

function isSkinLike({ r, g, b }: RGB) {
  const warm = r > g && g > b;
  const range = r - b;
  return warm && range > 18 && range < 125 && g > 35 && r > 55;
}

function drawToCanvas(image: HTMLImageElement, width: number, height: number) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) throw new Error('Canvas 2D context is not available');
  context.drawImage(image, 0, 0, width, height);
  return { canvas, context };
}

async function readMask(maskSrc: string, width: number, height: number) {
  const maskImage = await loadImage(maskSrc);
  const { context } = drawToCanvas(maskImage, width, height);
  const pixels = context.getImageData(0, 0, width, height).data;
  const values = new Float32Array(width * height);

  for (let pixel = 0; pixel < values.length; pixel += 1) {
    const offset = pixel * 4;
    const alpha = pixels[offset + 3] / 255;
    const grayscale =
      (pixels[offset] + pixels[offset + 1] + pixels[offset + 2]) / 765;
    values[pixel] = alpha * grayscale;
  }

  return values;
}

function automaticMask(
  pixels: Uint8ClampedArray,
  width: number,
  height: number,
  original: RGB,
) {
  const values = new Float32Array(width * height);
  const originalHsl = rgbToHsl(original);
  const originalIsDark = luminance(original) < 72 || originalHsl.l < 0.28;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const pixel = y * width + x;
      const offset = pixel * 4;
      const source = {
        r: pixels[offset],
        g: pixels[offset + 1],
        b: pixels[offset + 2],
      };
      const sourceHsl = rgbToHsl(source);
      const sourceLuminance = luminance(source);
      let confidence = 0;

      if (originalIsDark) {
        // A black garment has little chroma, so hue matching is not useful.
        // The spatial prior avoids pulling in the dark hair, floor, and wall.
        const centerPrior = 1 - clamp(Math.abs(x / width - 0.53) / 0.38);
        const garmentHeight = smoothStep((y / height - 0.24) / 0.15) *
          (1 - smoothStep((y / height - 0.84) / 0.1));
        const darkFabric = clamp((150 - sourceLuminance) / 120);
        const neutralFabric = 1 - clamp((sourceHsl.s - 0.08) / 0.42);
        confidence = centerPrior * garmentHeight * darkFabric * neutralFabric;
      } else {
        const hueScore = 1 - clamp(
          hueDistance(sourceHsl.h, originalHsl.h) /
            (originalHsl.s > 0.35 ? 72 : 48),
        );
        const saturationScore =
          originalHsl.s < 0.12
            ? 1
            : clamp(sourceHsl.s / Math.max(0.15, originalHsl.s * 0.45));
        const distance = Math.sqrt(
          ((source.r - original.r) / 255) ** 2 +
            ((source.g - original.g) / 255) ** 2 +
            ((source.b - original.b) / 255) ** 2,
        );
        const colorScore = 1 - clamp(distance / 0.58);
        confidence = Math.max(hueScore, colorScore * 0.85) * saturationScore;

        // Skin tones are a known automatic-segmentation collision. A mask is
        // still recommended for close-toned or complicated production images.
        if (isSkinLike(source) && originalHsl.h < 48) confidence *= 0.2;
      }

      values[pixel] = smoothStep((confidence - 0.26) / 0.5);
    }
  }

  return values;
}

async function recolorImage({
  src,
  target,
  originalHex,
  mask,
}: {
  src: string;
  target: string;
  originalHex: string;
  mask?: string;
}) {
  const image = await loadImage(src);
  const width = image.naturalWidth;
  const height = image.naturalHeight;
  const { canvas, context } = drawToCanvas(image, width, height);
  const sourcePixels = context.getImageData(0, 0, width, height);
  const source = sourcePixels.data;
  const original = parseHex(originalHex) ?? { r: 64, g: 64, b: 64 };
  const targetRgb = parseHex(target);
  if (!targetRgb) throw new Error(`Invalid target colour: ${target}`);

  // Let the browser paint once before the CPU-bound pixel pass.
  await new Promise<void>((resolve) => {
    const idleWindow = window as typeof window & {
      requestIdleCallback?: (
        callback: () => void,
        options?: { timeout: number },
      ) => number;
    };
    if (idleWindow.requestIdleCallback) {
      idleWindow.requestIdleCallback(() => resolve(), { timeout: 80 });
    } else {
      window.requestAnimationFrame(() => resolve());
    }
  });

  const segmentation = mask
    ? await readMask(mask, width, height)
    : automaticMask(source, width, height, original);
  const targetHsl = rgbToHsl(targetRgb);
  let minLuminance = 255;
  let maxLuminance = 0;

  for (let pixel = 0; pixel < segmentation.length; pixel += 1) {
    if (segmentation[pixel] < 0.2) continue;
    const offset = pixel * 4;
    const sourceLuminance = luminance({
      r: source[offset],
      g: source[offset + 1],
      b: source[offset + 2],
    });
    minLuminance = Math.min(minLuminance, sourceLuminance);
    maxLuminance = Math.max(maxLuminance, sourceLuminance);
  }

  const luminanceRange = Math.max(12, maxLuminance - minLuminance);
  for (let pixel = 0; pixel < segmentation.length; pixel += 1) {
    const weight = segmentation[pixel];
    if (weight < 0.02) continue;

    const offset = pixel * 4;
    const sourceLuminance = luminance({
      r: source[offset],
      g: source[offset + 1],
      b: source[offset + 2],
    });
    const relativeLuminance = clamp(
      (sourceLuminance - minLuminance) / luminanceRange,
    );
    const preservedLightness = clamp(
      targetHsl.l * (0.52 + relativeLuminance * 0.9),
      0.025,
      0.94,
    );
    const preservedSaturation = clamp(
      targetHsl.s * (0.76 + relativeLuminance * 0.24),
    );
    const recolored = hslToRgb({
      h: targetHsl.h,
      s: preservedSaturation,
      l: preservedLightness,
    });
    const highlight = clamp((sourceLuminance - 226) / 29) * 0.18;
    const mix = clamp(weight);

    source[offset] = Math.round(
      source[offset] * (1 - mix) +
        (recolored.r * (1 - highlight) + 255 * highlight) * mix,
    );
    source[offset + 1] = Math.round(
      source[offset + 1] * (1 - mix) +
        (recolored.g * (1 - highlight) + 255 * highlight) * mix,
    );
    source[offset + 2] = Math.round(
      source[offset + 2] * (1 - mix) +
        (recolored.b * (1 - highlight) + 255 * highlight) * mix,
    );
  }

  context.putImageData(sourcePixels, 0, 0);
  return canvas.toDataURL('image/webp', 0.92);
}

export function GarmentColorizer({
  src,
  target,
  original,
  originalHex,
  alt,
  className = '',
  mask,
}: Props) {
  const [output, setOutput] = useState(src);
  const [processing, setProcessing] = useState(false);
  const outputRef = useRef(src);

  useEffect(() => {
    let cancelled = false;
    const sourceHex = originalHex ?? '#404040';
    const cacheKey = `${src}|${target}|${sourceHex}|${mask ?? 'automatic'}`;
    const isOriginal =
      original.toLowerCase() === target.toLowerCase() ||
      sourceHex.toLowerCase() === target.toLowerCase();

    if (isOriginal) {
      outputRef.current = src;
      setOutput(src);
      setProcessing(false);
      return () => {
        cancelled = true;
      };
    }

    const cached = outputCache.get(cacheKey);
    if (cached) {
      outputRef.current = cached;
      setOutput(cached);
      setProcessing(false);
      return () => {
        cancelled = true;
      };
    }

    setProcessing(true);
    recolorImage({ src, target, originalHex: sourceHex, mask })
      .then((result) => {
        if (cancelled) return;
        outputCache.set(cacheKey, result);
        outputRef.current = result;
        setOutput(result);
        setProcessing(false);
      })
      .catch(() => {
        if (cancelled) return;
        // Keep the last rendered colour rather than flashing back to the base.
        setOutput(outputRef.current || src);
        setProcessing(false);
      });

    return () => {
      cancelled = true;
    };
  }, [src, target, original, originalHex, mask]);

  return (
    <>
      <img
        src={output}
        alt={alt}
        className={`${className} transition-opacity duration-300 ${
          processing ? 'opacity-90' : 'opacity-100'
        }`}
        aria-busy={processing}
      />
      <canvas className="hidden" aria-hidden="true" />
    </>
  );
}
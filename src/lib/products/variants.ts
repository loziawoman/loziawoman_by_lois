import type { ProductColour, ProductSize, ProductVariant } from '@/types';

export const findVariant = (variants: ProductVariant[], colourId: string, sizeId: string): ProductVariant | undefined =>
  variants.find((v) => v.colourId === colourId && v.sizeId === sizeId);

/** A combination can be bought only if the variant exists, is active and has stock. */
export const isPurchasable = (variant: ProductVariant | undefined): variant is ProductVariant =>
  Boolean(variant && variant.isActive && variant.available > 0);

export const isSizeAvailable = (variants: ProductVariant[], colourId: string, sizeId: string): boolean =>
  isPurchasable(findVariant(variants, colourId, sizeId));

export const isColourAvailable = (variants: ProductVariant[], colourId: string): boolean =>
  variants.some((v) => v.colourId === colourId && isPurchasable(v));

export type Selection = { colourId: string; sizeId: string };

/**
 * Chooses a valid starting selection: the requested colour if it is offered (else the first in stock, else the first),
 * then the first size that is in stock for that colour.
 */
export function initialSelection(
  variants: ProductVariant[], colours: ProductColour[], sizes: ProductSize[], requestedColourId?: string,
): Selection {
  const requested = colours.find((c) => c.id === requestedColourId);
  const colour = requested ?? colours.find((c) => isColourAvailable(variants, c.id)) ?? colours[0];
  if (!colour) return { colourId: '', sizeId: sizes[0]?.id ?? '' };
  const size = sizes.find((s) => isSizeAvailable(variants, colour.id, s.id)) ?? sizes[0];
  return { colourId: colour.id, sizeId: size?.id ?? '' };
}

/** After the colour changes, keep the size if it still works, otherwise move to the first size that does. */
export function selectColour(variants: ProductVariant[], sizes: ProductSize[], current: Selection, colourId: string): Selection {
  if (isSizeAvailable(variants, colourId, current.sizeId)) return { colourId, sizeId: current.sizeId };
  const fallback = sizes.find((s) => isSizeAvailable(variants, colourId, s.id));
  return { colourId, sizeId: fallback?.id ?? current.sizeId };
}

/** Price to show on cards: the lowest active price, and whether prices differ across variants. */
export function displayPrice(basePrice: number, variants: ProductVariant[]): { price: number; from: boolean } {
  const prices = variants.filter((v) => v.isActive).map((v) => v.price);
  if (prices.length === 0) return { price: basePrice, from: false };
  const min = Math.min(...prices);
  return { price: min, from: prices.some((p) => p !== min) };
}

export const hasStock = (variants: ProductVariant[]): boolean => variants.some(isPurchasable);

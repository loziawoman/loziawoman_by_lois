import type { ProductColour, ProductDiscount, ProductSize, ProductVariant } from '@/types';

export const findVariant = (variants: ProductVariant[], colourId: string, sizeId: string): ProductVariant | undefined =>
  variants.find((v) => v.colourId === colourId && v.sizeId === sizeId);

/** A combination can be bought only if the variant exists, is active and has stock. */
export const isPurchasable = (variant: ProductVariant | undefined): variant is ProductVariant =>
  Boolean(variant && variant.isActive && variant.available > 0);

export const isSizeAvailable = (variants: ProductVariant[], colourId: string, sizeId: string): boolean =>
  isPurchasable(findVariant(variants, colourId, sizeId));

export const isColourAvailable = (variants: ProductVariant[], colourId: string): boolean =>
  variants.some((v) => v.colourId === colourId && isPurchasable(v));



/** Sale prices are rounded to the nearest ₦1,000 for clean storefront pricing. */
export const roundSalePrice = (value: number): number => Math.max(0, Math.round(value / 1000) * 1000);

/**
 * A fixed discount value is the FINAL sale price, not an amount to subtract.
 * Example: ₦120,000 normal price + fixed sale price ₦80,000 => ₦80,000 sale price and 33% off.
 * Percentage discounts are applied to each variant's normal price.
 */
export function discountedPrice(normalPrice: number, discount?: ProductDiscount): number {
  if (!discount?.enabled || discount.value <= 0) return normalPrice;
  if (discount.type === 'fixed') return Math.min(normalPrice, roundSalePrice(discount.value));
  const percentage = Math.min(100, Math.max(0, discount.value));
  return roundSalePrice(normalPrice * (1 - percentage / 100));
}

export function discountPercentage(normalPrice: number, salePrice: number): number {
  if (normalPrice <= 0 || salePrice >= normalPrice) return 0;
  return Math.max(0, Math.round(((normalPrice - salePrice) / normalPrice) * 100));
}

export type DisplayPrice = {
  price: number;
  originalPrice: number;
  discountPercent: number;
  discounted: boolean;
  from: boolean;
};

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

/** Price to show on cards, including an optional product-wide sale. */
export function displayPrice(basePrice: number, variants: ProductVariant[], discount?: ProductDiscount): DisplayPrice {
  const normalPrices = variants.filter((v) => v.isActive).map((v) => v.price);
  const normals = normalPrices.length ? normalPrices : [basePrice];
  const sales = normals.map((price) => discountedPrice(price, discount));
  const originalPrice = Math.min(...normals);
  const price = Math.min(...sales);
  const discounted = price < originalPrice;
  return {
    price,
    originalPrice,
    discountPercent: discounted ? discountPercentage(originalPrice, price) : 0,
    discounted,
    from: new Set(sales).size > 1,
  };
}

export const hasStock = (variants: ProductVariant[]): boolean => variants.some(isPurchasable);

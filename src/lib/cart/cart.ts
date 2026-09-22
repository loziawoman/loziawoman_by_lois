import type { CartItem } from '@/types';

export const MAX_LINE_QUANTITY = 10;

export const clampQuantity = (quantity: number): number =>
  Number.isFinite(quantity) ? Math.min(MAX_LINE_QUANTITY, Math.max(1, Math.floor(quantity))) : 1;

export function addToCart(items: CartItem[], item: CartItem): CartItem[] {
  const quantity = clampQuantity(item.quantity);
  const index = items.findIndex((existing) => existing.variantId === item.variantId);
  if (index < 0) return [...items, { ...item, quantity }];
  return items.map((existing, i) => (i === index ? { ...existing, quantity: clampQuantity(existing.quantity + quantity) } : existing));
}

export function setQuantity(items: CartItem[], variantId: string, quantity: number): CartItem[] {
  if (quantity < 1) return items.filter((item) => item.variantId !== variantId);
  return items.map((item) => (item.variantId === variantId ? { ...item, quantity: clampQuantity(quantity) } : item));
}

export const removeFromCart = (items: CartItem[], variantId: string): CartItem[] => items.filter((item) => item.variantId !== variantId);

export const cartCount = (items: CartItem[]): number => items.reduce((sum, item) => sum + item.quantity, 0);

/** Display subtotal only. Checkout never trusts it. */
export const cartSubtotal = (items: CartItem[]): number => items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);

function isCartItem(value: unknown): value is CartItem {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.variantId === 'string' && typeof v.productId === 'string' && typeof v.slug === 'string' &&
    typeof v.name === 'string' && typeof v.colourName === 'string' && typeof v.sizeName === 'string' &&
    typeof v.unitPrice === 'number' && typeof v.quantity === 'number' && typeof v.image === 'string'
  );
}

/** Reads a stored cart defensively: anything malformed is dropped rather than crashing the page. */
export function parseStoredCart(raw: string | null): CartItem[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isCartItem).map((item) => ({ ...item, quantity: clampQuantity(item.quantity) }));
  } catch {
    return [];
  }
}

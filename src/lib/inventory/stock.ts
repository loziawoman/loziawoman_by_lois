/** Stock maths shared by the storefront and the admin. The database enforces the same rules atomically; this mirrors them. */

export type StockLevel = { stockQuantity: number; reservedQuantity: number };

export const availableQuantity = ({ stockQuantity, reservedQuantity }: StockLevel): number =>
  Math.max(0, stockQuantity - reservedQuantity);

export type StockCheck = { ok: true } | { ok: false; reason: 'INVALID_QUANTITY' | 'INSUFFICIENT_STOCK' };

/** Can `quantity` units be reserved right now? */
export function canReserve(level: StockLevel, quantity: number): StockCheck {
  if (!Number.isInteger(quantity) || quantity < 1) return { ok: false, reason: 'INVALID_QUANTITY' };
  if (availableQuantity(level) < quantity) return { ok: false, reason: 'INSUFFICIENT_STOCK' };
  return { ok: true };
}

export type AdjustmentCheck =
  | { ok: true; next: number }
  | { ok: false; reason: 'NO_CHANGE' | 'NEGATIVE_STOCK' | 'BELOW_RESERVED' | 'INVALID_DELTA' };

/** Validates a manual stock change: never negative, never below what customers have already reserved. */
export function checkAdjustment(level: StockLevel, delta: number): AdjustmentCheck {
  if (!Number.isInteger(delta)) return { ok: false, reason: 'INVALID_DELTA' };
  if (delta === 0) return { ok: false, reason: 'NO_CHANGE' };
  const next = level.stockQuantity + delta;
  if (next < 0) return { ok: false, reason: 'NEGATIVE_STOCK' };
  if (next < level.reservedQuantity) return { ok: false, reason: 'BELOW_RESERVED' };
  return { ok: true, next };
}

export const LOW_STOCK_THRESHOLD = 3;

export type StockStatus = { kind: 'out' | 'low' | 'in'; label: string };

/** Text and state for a variant. The label never relies on colour alone. */
export function stockStatus(available: number, threshold = LOW_STOCK_THRESHOLD): StockStatus {
  if (available <= 0) return { kind: 'out', label: 'Sold out' };
  if (available <= threshold) return { kind: 'low', label: `Only ${available} left` };
  return { kind: 'in', label: 'In stock' };
}

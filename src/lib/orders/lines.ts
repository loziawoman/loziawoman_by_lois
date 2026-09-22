import { availableQuantity } from '@/lib/inventory/stock';

export type RequestedItem = { variantId: string; quantity: number };

/** What the database says about a variant. This, never the browser, decides price and availability. */
export type VariantRecord = {
  id: string;
  productId: string;
  productName: string;
  colourName: string;
  sizeName: string;
  sku: string;
  unitPrice: number;
  stockQuantity: number;
  reservedQuantity: number;
  isActive: boolean;
  productPublished: boolean;
};

export type OrderLine = {
  variantId: string;
  productId: string;
  productName: string;
  colourName: string;
  sizeName: string;
  sku: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
};

export type LineProblem = {
  variantId: string;
  code: 'VARIANT_NOT_FOUND' | 'VARIANT_UNAVAILABLE' | 'INSUFFICIENT_STOCK';
  available?: number;
};

export const MAX_UNITS_PER_VARIANT = 10;

/** Combines repeated variants into one line. */
export function mergeRequestedItems(items: RequestedItem[]): RequestedItem[] {
  const totals = new Map<string, number>();
  for (const item of items) totals.set(item.variantId, (totals.get(item.variantId) ?? 0) + item.quantity);
  return [...totals.entries()].map(([variantId, quantity]) => ({ variantId, quantity: Math.min(quantity, MAX_UNITS_PER_VARIANT) }));
}

/**
 * Prices and validates the requested items against authoritative variant records.
 * Any price the client may have sent is never an input to this function.
 */
export function buildOrderLines(
  requested: RequestedItem[],
  records: VariantRecord[],
): { lines: OrderLine[]; problems: LineProblem[] } {
  const byId = new Map(records.map((record) => [record.id, record]));
  const lines: OrderLine[] = [];
  const problems: LineProblem[] = [];

  for (const item of mergeRequestedItems(requested)) {
    const record = byId.get(item.variantId);
    if (!record) {
      problems.push({ variantId: item.variantId, code: 'VARIANT_NOT_FOUND' });
      continue;
    }
    if (!record.isActive || !record.productPublished) {
      problems.push({ variantId: item.variantId, code: 'VARIANT_UNAVAILABLE' });
      continue;
    }
    const available = availableQuantity(record);
    if (available < item.quantity) {
      problems.push({ variantId: item.variantId, code: 'INSUFFICIENT_STOCK', available });
      continue;
    }
    lines.push({
      variantId: record.id,
      productId: record.productId,
      productName: record.productName,
      colourName: record.colourName,
      sizeName: record.sizeName,
      sku: record.sku,
      unitPrice: record.unitPrice,
      quantity: item.quantity,
      lineTotal: round2(record.unitPrice * item.quantity),
    });
  }
  return { lines, problems };
}

export const round2 = (value: number): number => Math.round(value * 100) / 100;

export function computeOrderTotals(lines: OrderLine[], shippingFee: number): { subtotal: number; shippingFee: number; total: number } {
  const subtotal = round2(lines.reduce((sum, line) => sum + line.lineTotal, 0));
  const fee = round2(Math.max(0, shippingFee));
  return { subtotal, shippingFee: fee, total: round2(subtotal + fee) };
}

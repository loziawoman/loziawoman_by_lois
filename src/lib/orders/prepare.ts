import type { ShippingRates } from '@/types';
import type { CheckoutInput } from '@/lib/validation/checkout';
import { calculateShippingFee } from '@/lib/shipping/fee';
import { buildOrderLines, computeOrderTotals, type LineProblem, type OrderLine, type VariantRecord } from './lines';
import { generateOrderNumber, type RandomSource } from './number';
import { createOrderToken } from './token';

export type PreparedOrder =
  | { ok: false; problems: LineProblem[] }
  | { ok: true; orderNumber: string; token: string; tokenHash: string; lines: OrderLine[]; totals: { subtotal: number; shippingFee: number; total: number } };

/**
 * Turns a validated checkout request plus authoritative database records into a priced order.
 * The request carries variant ids and quantities only; every amount here is computed from `records` and `rates`.
 */
export function prepareOrder(args: {
  input: CheckoutInput;
  records: VariantRecord[];
  rates: ShippingRates;
  now?: Date;
  random?: RandomSource;
}): PreparedOrder {
  const { lines, problems } = buildOrderLines(args.input.items, args.records);
  if (problems.length > 0) return { ok: false, problems };

  const subtotal = computeOrderTotals(lines, 0).subtotal;
  const shippingFee = calculateShippingFee(args.rates, args.input.delivery.state, subtotal);
  const totals = computeOrderTotals(lines, shippingFee);
  const { token, hash } = createOrderToken();
  return { ok: true, orderNumber: generateOrderNumber(args.now, args.random), token, tokenHash: hash, lines, totals };
}

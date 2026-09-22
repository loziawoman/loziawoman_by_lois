import type { ShippingRates } from '@/types';

/** Delivery fee for an order. Kept separate from the product subtotal everywhere it is shown or stored. */
export function calculateShippingFee(rates: ShippingRates, state: string, subtotal: number): number {
  if (rates.freeAbove !== null && subtotal >= rates.freeAbove) return 0;
  const fee = rates.byState[state] ?? rates.defaultFee;
  return Number.isFinite(fee) && fee > 0 ? fee : 0;
}

import type { FulfillmentStatus, PaymentStatus } from '@/types';

export type OrderState = { payment: PaymentStatus; fulfillment: FulfillmentStatus };

export type PaymentEvent = 'submit' | 'verify' | 'reject' | 'refund';

/**
 * Payment state machine (mirrors the SQL functions). Returns the next status, or null when the move is not allowed.
 * `submit` is the customer saying "I have paid". It can never produce VERIFIED: only an admin `verify` can.
 */
export function nextPaymentStatus(state: OrderState, event: PaymentEvent): PaymentStatus | null {
  const cancelled = state.fulfillment === 'CANCELLED';
  switch (event) {
    case 'submit':
      return !cancelled && (state.payment === 'PENDING' || state.payment === 'REJECTED' || state.payment === 'SUBMITTED') ? 'SUBMITTED' : null;
    case 'verify':
      return !cancelled && (state.payment === 'PENDING' || state.payment === 'SUBMITTED') ? 'VERIFIED' : null;
    case 'reject':
      return !cancelled && (state.payment === 'PENDING' || state.payment === 'SUBMITTED') ? 'REJECTED' : null;
    case 'refund':
      return cancelled && state.payment === 'VERIFIED' ? 'REFUNDED' : null;
  }
}

/** Fulfilment moves forward one step at a time, and only once payment is verified. */
export function canMoveFulfillment(state: OrderState, next: FulfillmentStatus): boolean {
  if (next === 'CANCELLED') return state.fulfillment === 'PENDING' || state.fulfillment === 'PROCESSING';
  if (state.payment !== 'VERIFIED') return false;
  return (
    (state.fulfillment === 'PROCESSING' && next === 'SHIPPED') ||
    (state.fulfillment === 'SHIPPED' && next === 'DELIVERED')
  );
}

export type OrderAction = 'verify_payment' | 'reject_payment' | 'mark_shipped' | 'mark_delivered' | 'cancel' | 'refund';

/** Which buttons an admin should see for an order. */
export function availableActions(state: OrderState): OrderAction[] {
  const actions: OrderAction[] = [];
  if (nextPaymentStatus(state, 'verify')) actions.push('verify_payment');
  if (nextPaymentStatus(state, 'reject')) actions.push('reject_payment');
  if (canMoveFulfillment(state, 'SHIPPED')) actions.push('mark_shipped');
  if (canMoveFulfillment(state, 'DELIVERED')) actions.push('mark_delivered');
  if (canMoveFulfillment(state, 'CANCELLED')) actions.push('cancel');
  if (nextPaymentStatus(state, 'refund')) actions.push('refund');
  return actions;
}

/** One plain-language status for customers and list views. */
export function describeOrder(state: OrderState): string {
  if (state.payment === 'REFUNDED') return 'Refunded';
  if (state.fulfillment === 'CANCELLED') return 'Cancelled';
  if (state.fulfillment === 'DELIVERED') return 'Delivered';
  if (state.fulfillment === 'SHIPPED') return 'Shipped';
  if (state.payment === 'VERIFIED') return 'Processing';
  if (state.payment === 'SUBMITTED') return 'Payment under review';
  if (state.payment === 'REJECTED') return 'Payment needs attention';
  return 'Awaiting payment';
}

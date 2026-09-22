import { test } from 'node:test';
import assert from 'node:assert/strict';
import { authorize, can } from '@/lib/auth/permissions';
import { availableQuantity, canReserve, checkAdjustment, stockStatus } from '@/lib/inventory/stock';
import { addToCart, cartCount, cartSubtotal, clampQuantity, parseStoredCart, setQuantity } from '@/lib/cart/cart';
import { findVariant, initialSelection, isPurchasable, selectColour } from '@/lib/products/variants';
import { buildOrderLines, computeOrderTotals, mergeRequestedItems } from '@/lib/orders/lines';
import { prepareOrder } from '@/lib/orders/prepare';
import { checkoutSchema } from '@/lib/validation/checkout';
import { availableActions, canMoveFulfillment, describeOrder, nextPaymentStatus } from '@/lib/orders/status';
import { calculateShippingFee } from '@/lib/shipping/fee';
import { colours, record, sizes, V1, V2, V3, variant } from './fixtures';
import type { AdminUser, CartItem, ShippingRates } from '@/types';

const item = (over: Partial<CartItem> = {}): CartItem => ({
  variantId: V1, productId: 'p1', slug: 'the-noir-skirt', name: 'The Noir Skirt', colourName: 'Burgundy', sizeName: 'M', unitPrice: 72000, quantity: 1, image: '/x.jpg', ...over,
});

// ---- variant selection & unavailable variants
test('a variant is purchasable only when active and in stock', () => {
  assert.equal(isPurchasable(variant('c-black', 's-m', 2)), true);
  assert.equal(isPurchasable(variant('c-black', 's-m', 0)), false);
  assert.equal(isPurchasable(variant('c-black', 's-m', 5, false)), false);
  assert.equal(isPurchasable(undefined), false);
});

test('initial selection skips sold-out colours and sizes', () => {
  const variants = [
    variant('c-black', 's-s', 0), variant('c-black', 's-m', 0), variant('c-black', 's-l', 0),
    variant('c-burg', 's-s', 0), variant('c-burg', 's-m', 3), variant('c-burg', 's-l', 1),
  ];
  assert.deepEqual(initialSelection(variants, colours, sizes), { colourId: 'c-burg', sizeId: 's-m' });
  assert.deepEqual(initialSelection(variants, colours, sizes, 'c-black'), { colourId: 'c-black', sizeId: 's-s' });
});

test('changing colour keeps the size when possible and otherwise moves to an available one', () => {
  const variants = [variant('c-black', 's-m', 4), variant('c-burg', 's-m', 0), variant('c-burg', 's-l', 2)];
  assert.deepEqual(selectColour(variants, sizes, { colourId: 'c-burg', sizeId: 's-l' }, 'c-black'), { colourId: 'c-black', sizeId: 's-m' });
  assert.deepEqual(selectColour(variants, sizes, { colourId: 'c-black', sizeId: 's-m' }, 'c-burg'), { colourId: 'c-burg', sizeId: 's-l' });
  assert.equal(findVariant(variants, 'c-burg', 's-m')?.available, 0);
});

// ---- stock validation
test('available stock excludes reservations and never goes negative', () => {
  assert.equal(availableQuantity({ stockQuantity: 5, reservedQuantity: 2 }), 3);
  assert.equal(availableQuantity({ stockQuantity: 1, reservedQuantity: 4 }), 0);
});

test('reservations are refused beyond available stock', () => {
  assert.deepEqual(canReserve({ stockQuantity: 5, reservedQuantity: 3 }, 2), { ok: true });
  assert.deepEqual(canReserve({ stockQuantity: 5, reservedQuantity: 3 }, 3), { ok: false, reason: 'INSUFFICIENT_STOCK' });
  assert.deepEqual(canReserve({ stockQuantity: 5, reservedQuantity: 0 }, 0), { ok: false, reason: 'INVALID_QUANTITY' });
});

test('manual stock changes cannot go negative or below reserved units', () => {
  const level = { stockQuantity: 5, reservedQuantity: 2 };
  assert.deepEqual(checkAdjustment(level, 3), { ok: true, next: 8 });
  assert.deepEqual(checkAdjustment(level, -3), { ok: true, next: 2 });
  assert.deepEqual(checkAdjustment(level, -4), { ok: false, reason: 'BELOW_RESERVED' });
  assert.deepEqual(checkAdjustment({ stockQuantity: 1, reservedQuantity: 0 }, -2), { ok: false, reason: 'NEGATIVE_STOCK' });
  assert.deepEqual(checkAdjustment(level, 0), { ok: false, reason: 'NO_CHANGE' });
  assert.deepEqual(checkAdjustment(level, 1.5), { ok: false, reason: 'INVALID_DELTA' });
});

test('stock status labels use words, not just colour', () => {
  assert.deepEqual(stockStatus(0), { kind: 'out', label: 'Sold out' });
  assert.equal(stockStatus(2).kind, 'low');
  assert.equal(stockStatus(2).label, 'Only 2 left');
  assert.equal(stockStatus(9).kind, 'in');
});

// ---- cart calculations
test('cart merges the same variant and caps quantities', () => {
  let cart = addToCart([], item({ quantity: 2 }));
  cart = addToCart(cart, item({ quantity: 3 }));
  cart = addToCart(cart, item({ variantId: V2, quantity: 1, unitPrice: 50000 }));
  assert.equal(cart.length, 2);
  assert.equal(cartCount(cart), 6);
  assert.equal(cartSubtotal(cart), 5 * 72000 + 50000);
  assert.equal(addToCart(cart, item({ quantity: 50 })).find((i) => i.variantId === V1)?.quantity, 10);
  assert.equal(clampQuantity(Number.NaN), 1);
});

test('setting a quantity below one removes the line', () => {
  const cart = setQuantity([item(), item({ variantId: V2 })], V1, 0);
  assert.deepEqual(cart.map((i) => i.variantId), [V2]);
});

test('a corrupt stored cart is ignored instead of crashing', () => {
  assert.deepEqual(parseStoredCart('not json'), []);
  assert.deepEqual(parseStoredCart('{"a":1}'), []);
  assert.deepEqual(parseStoredCart(JSON.stringify([{ variantId: 1 }, item({ quantity: 99 })])).map((i) => i.quantity), [10]);
  assert.deepEqual(parseStoredCart(null), []);
});

// ---- checkout totals & price tampering
const rates: ShippingRates = { defaultFee: 3000, byState: { Lagos: 2000 }, freeAbove: 200000, placeholder: false };

test('shipping is separate from the subtotal and follows the state', () => {
  assert.equal(calculateShippingFee(rates, 'Lagos', 50000), 2000);
  assert.equal(calculateShippingFee(rates, 'Kano', 50000), 3000);
  assert.equal(calculateShippingFee(rates, 'Kano', 250000), 0);
  assert.equal(calculateShippingFee({ defaultFee: 0, byState: {}, freeAbove: null, placeholder: true }, 'Lagos', 1), 0);
});

test('order lines are priced from the database records only', () => {
  const { lines, problems } = buildOrderLines(
    [{ variantId: V1, quantity: 2 }, { variantId: V2, quantity: 1 }],
    [record({ id: V1, unitPrice: 72000 }), record({ id: V2, unitPrice: 58000, productName: 'The Solene Top' })],
  );
  assert.deepEqual(problems, []);
  const totals = computeOrderTotals(lines, 2000);
  assert.deepEqual(totals, { subtotal: 202000, shippingFee: 2000, total: 204000 });
});

test('duplicate variants are merged before pricing', () => {
  assert.deepEqual(mergeRequestedItems([{ variantId: V1, quantity: 2 }, { variantId: V1, quantity: 3 }]), [{ variantId: V1, quantity: 5 }]);
});

const validRequest = {
  customer: { fullName: 'Ada Obi', email: 'Ada@Example.com', phone: '+234 801 234 5678' },
  delivery: { address: '12 Example Street', city: 'Ikeja', state: 'Lagos' },
  items: [{ variantId: V1, quantity: 1 }],
};

test('checkout accepts a normal request and normalises the email', () => {
  const parsed = checkoutSchema.safeParse(validRequest);
  assert.equal(parsed.success, true);
  if (parsed.success) assert.equal(parsed.data.customer.email, 'ada@example.com');
});

test('price tampering: the request schema rejects client-supplied prices, totals and statuses', () => {
  const attempts = [
    { ...validRequest, total: 1 },
    { ...validRequest, subtotal: 1 },
    { ...validRequest, paymentStatus: 'VERIFIED' },
    { ...validRequest, items: [{ variantId: V1, quantity: 1, price: 1 }] },
    { ...validRequest, items: [{ variantId: V1, quantity: 1, unitPrice: 1 }] },
    { ...validRequest, customer: { ...validRequest.customer, role: 'admin' } },
  ];
  for (const attempt of attempts) assert.equal(checkoutSchema.safeParse(attempt).success, false, JSON.stringify(attempt));
});

test('checkout rejects bad quantities, unknown states and malformed ids', () => {
  assert.equal(checkoutSchema.safeParse({ ...validRequest, items: [{ variantId: V1, quantity: 0 }] }).success, false);
  assert.equal(checkoutSchema.safeParse({ ...validRequest, items: [{ variantId: V1, quantity: 11 }] }).success, false);
  assert.equal(checkoutSchema.safeParse({ ...validRequest, items: [{ variantId: 'nope', quantity: 1 }] }).success, false);
  assert.equal(checkoutSchema.safeParse({ ...validRequest, delivery: { ...validRequest.delivery, state: 'Atlantis' } }).success, false);
  assert.equal(checkoutSchema.safeParse({ ...validRequest, items: [] }).success, false);
});

// ---- unavailable variants
test('unavailable, sold-out and unknown variants block the order', () => {
  const { lines, problems } = buildOrderLines(
    [{ variantId: V1, quantity: 3 }, { variantId: V2, quantity: 1 }, { variantId: V3, quantity: 1 }, { variantId: 'missing', quantity: 1 }],
    [
      record({ id: V1, stockQuantity: 4, reservedQuantity: 2 }), // only 2 left
      record({ id: V2, isActive: false }),
      record({ id: V3, productPublished: false }),
    ],
  );
  assert.equal(lines.length, 0);
  assert.deepEqual(problems.map((p) => p.code).sort(), ['INSUFFICIENT_STOCK', 'VARIANT_NOT_FOUND', 'VARIANT_UNAVAILABLE', 'VARIANT_UNAVAILABLE']);
  assert.equal(problems.find((p) => p.code === 'INSUFFICIENT_STOCK')?.available, 2);
});

// ---- order creation
test('preparing an order ignores browser values and builds a number, token and totals', () => {
  const parsed = checkoutSchema.parse({ ...validRequest, items: [{ variantId: V1, quantity: 2 }] });
  const prepared = prepareOrder({ input: parsed, records: [record({ id: V1, unitPrice: 72000 })], rates, now: new Date('2026-09-18T10:00:00Z') });
  assert.equal(prepared.ok, true);
  if (!prepared.ok) return;
  assert.match(prepared.orderNumber, /^LOZ-20260918-[A-Z2-9]{4}$/);
  assert.deepEqual(prepared.totals, { subtotal: 144000, shippingFee: 2000, total: 146000 });
  assert.notEqual(prepared.token, prepared.tokenHash);
  assert.equal(prepared.tokenHash.length, 64);
});

test('preparing an order fails cleanly when stock is short', () => {
  const parsed = checkoutSchema.parse({ ...validRequest, items: [{ variantId: V1, quantity: 6 }] });
  const prepared = prepareOrder({ input: parsed, records: [record({ id: V1, stockQuantity: 5 })], rates });
  assert.equal(prepared.ok, false);
});

// ---- payment state transitions
test('claiming payment never marks an order as paid', () => {
  const state = { payment: 'PENDING', fulfillment: 'PENDING' } as const;
  assert.equal(nextPaymentStatus(state, 'submit'), 'SUBMITTED');
  assert.notEqual(nextPaymentStatus(state, 'submit'), 'VERIFIED');
});

test('only verify moves a payment to VERIFIED, and only from pending or submitted', () => {
  assert.equal(nextPaymentStatus({ payment: 'SUBMITTED', fulfillment: 'PENDING' }, 'verify'), 'VERIFIED');
  assert.equal(nextPaymentStatus({ payment: 'REJECTED', fulfillment: 'PENDING' }, 'verify'), null);
  assert.equal(nextPaymentStatus({ payment: 'VERIFIED', fulfillment: 'PROCESSING' }, 'verify'), null);
  assert.equal(nextPaymentStatus({ payment: 'SUBMITTED', fulfillment: 'CANCELLED' }, 'verify'), null);
  assert.equal(nextPaymentStatus({ payment: 'REJECTED', fulfillment: 'PENDING' }, 'submit'), 'SUBMITTED');
  assert.equal(nextPaymentStatus({ payment: 'VERIFIED', fulfillment: 'PROCESSING' }, 'submit'), null);
  assert.equal(nextPaymentStatus({ payment: 'VERIFIED', fulfillment: 'CANCELLED' }, 'refund'), 'REFUNDED');
  assert.equal(nextPaymentStatus({ payment: 'VERIFIED', fulfillment: 'PROCESSING' }, 'refund'), null);
});

test('fulfilment needs verified payment and moves one step at a time', () => {
  assert.equal(canMoveFulfillment({ payment: 'SUBMITTED', fulfillment: 'PROCESSING' }, 'SHIPPED'), false);
  assert.equal(canMoveFulfillment({ payment: 'VERIFIED', fulfillment: 'PROCESSING' }, 'SHIPPED'), true);
  assert.equal(canMoveFulfillment({ payment: 'VERIFIED', fulfillment: 'PROCESSING' }, 'DELIVERED'), false);
  assert.equal(canMoveFulfillment({ payment: 'VERIFIED', fulfillment: 'SHIPPED' }, 'DELIVERED'), true);
  assert.equal(canMoveFulfillment({ payment: 'VERIFIED', fulfillment: 'SHIPPED' }, 'CANCELLED'), false);
  assert.equal(canMoveFulfillment({ payment: 'PENDING', fulfillment: 'PENDING' }, 'CANCELLED'), true);
});

test('admin actions and customer wording follow the state', () => {
  assert.deepEqual(availableActions({ payment: 'SUBMITTED', fulfillment: 'PENDING' }).sort(), ['cancel', 'reject_payment', 'verify_payment']);
  assert.deepEqual(availableActions({ payment: 'VERIFIED', fulfillment: 'PROCESSING' }).sort(), ['cancel', 'mark_shipped']);
  assert.equal(describeOrder({ payment: 'PENDING', fulfillment: 'PENDING' }), 'Awaiting payment');
  assert.equal(describeOrder({ payment: 'SUBMITTED', fulfillment: 'PENDING' }), 'Payment under review');
  assert.equal(describeOrder({ payment: 'VERIFIED', fulfillment: 'SHIPPED' }), 'Shipped');
});

// ---- authorization & admin protection
const user = (role: AdminUser['role']): AdminUser => ({ id: 'u1', email: 'x@y.z', role });

test('admin routes reject anonymous visitors and customers', () => {
  assert.deepEqual(authorize(null, 'orders:read'), { ok: false, status: 401, code: 'unauthenticated' });
  assert.deepEqual(authorize(user('customer'), 'orders:read'), { ok: false, status: 403, code: 'forbidden' });
  assert.deepEqual(authorize(user('customer'), 'catalog:read'), { ok: false, status: 403, code: 'forbidden' });
});

test('staff can work orders and stock but cannot verify payments or edit the catalogue', () => {
  assert.equal(authorize(user('staff'), 'orders:write').ok, true);
  assert.equal(authorize(user('staff'), 'inventory:write').ok, true);
  assert.equal(authorize(user('staff'), 'payments:verify').ok, false);
  assert.equal(authorize(user('staff'), 'catalog:write').ok, false);
  assert.equal(authorize(user('staff'), 'settings:write').ok, false);
});

test('admins verify payments; only super admins manage users', () => {
  assert.equal(can('admin', 'payments:verify'), true);
  assert.equal(can('admin', 'catalog:write'), true);
  assert.equal(can('admin', 'users:manage'), false);
  assert.equal(can('super_admin', 'users:manage'), true);
  assert.equal(can(null, 'orders:read'), false);
});

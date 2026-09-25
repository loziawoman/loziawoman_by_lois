import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { generateOrderNumber, isOrderNumber } from '@/lib/orders/number';
import { createOrderToken, hashToken, isPlausibleToken } from '@/lib/orders/token';
import { MAX_UPLOAD_BYTES, sniffFileType, validateUpload } from '@/lib/storage/validate';
import { createRateLimiter } from '@/lib/rate-limit';
import { clamp, hslToRgb, luminance, parseHex, recolourPixel, rgbToHsl } from '@/lib/colorizer/math';
import { filterProducts, mapProduct, type ProductRow } from '@/lib/products/mappers';
import { buildBankDetails, buildSiteSettings, whatsappHref } from '@/lib/settings/definitions';
import { productInputSchema, stockAdjustSchema, orderActionSchema } from '@/lib/validation/admin';
import { contactSchema, lookupSchema } from '@/lib/validation/checkout';

test('order numbers are human readable and unpredictable', () => {
  const fixed = generateOrderNumber(new Date('2026-09-18T00:00:00Z'), () => new Uint8Array([0, 1, 2, 3]));
  assert.equal(fixed, 'LOZ-20260918-ABCD');
  assert.equal(isOrderNumber(fixed), true);
  const seen = new Set(Array.from({ length: 200 }, () => generateOrderNumber()));
  assert.ok(seen.size > 190);
  assert.equal(isOrderNumber('LOZ-20260918-8F42'), true);
  assert.equal(isOrderNumber('LOZ-20260918-0000'), false);
});

test('order tokens are random and only their hash is stored', () => {
  const a = createOrderToken(), b = createOrderToken();
  assert.notEqual(a.token, b.token);
  assert.equal(a.hash, createHash('sha256').update(a.token).digest('hex'));
  assert.equal(hashToken(a.token), a.hash);
  assert.equal(isPlausibleToken(a.token), true);
  assert.equal(isPlausibleToken('short'), false);
});

const bytes = (...values: number[]) => new Uint8Array(values);
const JPEG = bytes(0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0);
const PNG = bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0);
const PDF = new TextEncoder().encode('%PDF-1.7 hello');
const WEBP = new TextEncoder().encode('RIFF\0\0\0\0WEBPVP8 ');

test('uploads are identified by content, not by the name or type the browser claims', () => {
  assert.equal(sniffFileType(JPEG), 'image/jpeg');
  assert.equal(sniffFileType(PNG), 'image/png');
  assert.equal(sniffFileType(WEBP), 'image/webp');
  assert.equal(sniffFileType(PDF), 'application/pdf');
  assert.equal(sniffFileType(new TextEncoder().encode('<script>alert(1)</script>')), null);
});

test('upload rules differ by purpose and enforce size', () => {
  assert.equal(validateUpload(JPEG, 'product-image').ok, true);
  assert.equal(validateUpload(PDF, 'product-image').ok, false);
  assert.equal(validateUpload(PDF, 'receipt').ok, true);
  assert.equal(validateUpload(JPEG, 'mask').ok, false);
  assert.equal(validateUpload(PNG, 'mask').ok, true);
  assert.equal(validateUpload(JPEG, 'receipt', 'image/png').ok, false);
  assert.equal(validateUpload(new Uint8Array(0), 'receipt').ok, false);
  const big = new Uint8Array(MAX_UPLOAD_BYTES + 1); big.set(JPEG);
  assert.equal(validateUpload(big, 'product-image').ok, false);
});

test('the rate limiter blocks bursts and recovers after the window', () => {
  let now = 0;
  const limiter = createRateLimiter({ limit: 3, windowMs: 1000, now: () => now });
  assert.equal(limiter.check('ip').allowed, true);
  assert.equal(limiter.check('ip').allowed, true);
  assert.equal(limiter.check('ip').allowed, true);
  const blocked = limiter.check('ip');
  assert.equal(blocked.allowed, false);
  assert.ok(blocked.retryAfterSeconds >= 1);
  assert.equal(limiter.check('other').allowed, true);
  now = 1500;
  assert.equal(limiter.check('ip').allowed, true);
});

test('recolouring rebuilds the colour from luminance, so black can become burgundy', () => {
  const burgundy = rgbToHsl(parseHex('#6f2637')!);
  const shadow = recolourPixel({ r: 12, g: 11, b: 11 }, burgundy, 0.05, 1);
  const highlight = recolourPixel({ r: 90, g: 88, b: 86 }, burgundy, 0.95, 1);
  // Both come out reddish, and the brighter fabric stays brighter: folds and shadows survive.
  for (const px of [shadow, highlight]) assert.ok(px.r > px.g && px.r > px.b);
  assert.ok(luminance(highlight) > luminance(shadow) + 20);
  // A zero-weight (masked out) pixel is untouched.
  assert.deepEqual(recolourPixel({ r: 200, g: 150, b: 120 }, burgundy, 0.5, 0), { r: 200, g: 150, b: 120 });
  // A hue rotation of pure black stays black; this does not.
  assert.ok(shadow.r > 12);
  assert.equal(parseHex('nope'), null);
  assert.equal(clamp(5), 1);
  const roundTrip = hslToRgb(rgbToHsl({ r: 111, g: 38, b: 55 }));
  assert.ok(Math.abs(roundTrip.r - 111) <= 1 && Math.abs(roundTrip.g - 38) <= 1);
});

const row = (over: Partial<ProductRow> = {}): ProductRow => ({
  id: 'p1', name: 'The Noir Skirt', slug: 'the-noir-skirt', description: 'd', short_description: 's', fabric: 'f', care: 'c',
  base_price: '72000.00', discount_enabled: false, discount_type: over.discount_type ?? 'fixed', discount_value: over.discount_value ?? 0, status: 'published', featured: true, original_colour_id: 'c1', created_at: '2026-01-02T00:00:00Z', updated_at: '2026-01-02T00:00:00Z',
  category: { id: 'k1', name: 'Bottoms', slug: 'bottoms', description: '', image_url: null, sort_order: 1 },
  images: [
    { id: 'i2', storage_path: 'products/p1/images/b.jpg', public_url: null, alt_text: '', sort_order: 1, is_primary: false, mask_storage_path: null, mask_public_url: null },
    { id: 'i1', storage_path: null, public_url: '/images/noir-skirt.jpg', alt_text: 'Front', sort_order: 0, is_primary: true, mask_storage_path: 'products/p1/masks/m.png', mask_public_url: null },
  ],
  colours: [{ sort_order: 2, colour: { id: 'c2', name: 'Burgundy', slug: 'burgundy', hex: '#6f2637', sort_order: 2 } }, { sort_order: 1, colour: { id: 'c1', name: 'Black', slug: 'black', hex: '#211e1c', sort_order: 1 } }],
  sizes: [{ sort_order: 2, size: { id: 's2', name: 'M', sort_order: 2 } }, { sort_order: 1, size: { id: 's1', name: 'S', sort_order: 1 } }],
  variants: [
    { id: 'v1', product_id: 'p1', colour_id: 'c1', size_id: 's1', sku: 'A', price: null, stock_quantity: 4, reserved_quantity: 1, is_active: true },
    { id: 'v2', product_id: 'p1', colour_id: 'c1', size_id: 's2', sku: 'B', price: '80000', stock_quantity: 0, reserved_quantity: 0, is_active: true },
  ],
  ...over,
});

test('database rows map to the storefront Product shape', () => {
  const p = mapProduct(row(), 'https://x.supabase.co/storage/v1/object/public/product-images/');
  assert.equal(p.basePrice, 72000);
  assert.deepEqual(p.images.map((i) => i.id), ['i1', 'i2']); // primary first
  assert.equal(p.images[0].maskSrc, 'https://x.supabase.co/storage/v1/object/public/product-images/products/p1/masks/m.png');
  assert.equal(p.images[1].src, 'https://x.supabase.co/storage/v1/object/public/product-images/products/p1/images/b.jpg');
  assert.equal(p.images[1].alt, 'The Noir Skirt');
  assert.deepEqual(p.colours.map((c) => c.name), ['Black', 'Burgundy']);
  assert.deepEqual(p.sizes.map((s) => s.name), ['S', 'M']);
  assert.equal(p.variants[0].price, 72000); // falls back to the base price
  assert.equal(p.variants[0].available, 3);
  assert.equal(p.variants[1].price, 80000);
  assert.equal(p.variants[1].available, 0);
});

test('shop filters and sorting work from URL-style filters', () => {
  const base = mapProduct(row(), '');
  const dress = mapProduct(row({ id: 'p2', slug: 'muse', name: 'The Muse Dress', base_price: 150000, featured: false, category: { id: 'k2', name: 'Dresses', slug: 'dresses', description: '', image_url: null, sort_order: 2 }, created_at: '2026-03-01T00:00:00Z', variants: [{ id: 'v9', product_id: 'p2', colour_id: 'c1', size_id: 's1', sku: 'Z', price: null, stock_quantity: 0, reserved_quantity: 0, is_active: true }] }), '');
  const all = [base, dress];
  assert.deepEqual(filterProducts(all, { category: 'dresses' }).map((p) => p.slug), ['muse']);
  assert.deepEqual(filterProducts(all, { colour: 'burgundy' }).map((p) => p.slug).sort(), ['muse', 'the-noir-skirt']);
  assert.deepEqual(filterProducts(all, { colour: 'emerald' }), []);
  assert.deepEqual(filterProducts(all, { size: 'XL' }), []);
  assert.deepEqual(filterProducts(all, { availability: 'in-stock' }).map((p) => p.slug), ['the-noir-skirt']);
  assert.deepEqual(filterProducts(all, { availability: 'sold-out' }).map((p) => p.slug), ['muse']);
  assert.deepEqual(filterProducts(all, { price: '100000-plus' }).map((p) => p.slug), ['muse']);
  assert.deepEqual(filterProducts(all, { q: 'MUSE' }).map((p) => p.slug), ['muse']);
  assert.deepEqual(filterProducts(all, { sort: 'newest' }).map((p) => p.slug), ['muse', 'the-noir-skirt']);
  assert.deepEqual(filterProducts(all, { sort: 'price-desc' }).map((p) => p.slug), ['muse', 'the-noir-skirt']);
  assert.deepEqual(filterProducts(all, {}).map((p) => p.slug), ['the-noir-skirt', 'muse']); // featured first
});

test('settings fall back to safe defaults and never invent business details', () => {
  const s = buildSiteSettings([{ key: 'whatsapp_number', value: 'not digits' }, { key: 'tagline', value: 'Hello' }]);
  assert.equal(s.tagline, 'Hello');
  assert.equal(s.whatsappNumber, ''); // invalid value ignored
  assert.equal(s.contactEmail, '');
  assert.equal(s.shippingRates.placeholder, true);
  assert.equal(s.policies.returns.isPlaceholder, true);
  assert.equal(buildBankDetails([]).configured, false);
  assert.equal(buildBankDetails([{ key: 'bank_name', value: 'B' }, { key: 'bank_account_name', value: 'A' }, { key: 'bank_account_number', value: '123' }]).configured, true);
  assert.equal(whatsappHref('', 'Hi there'), 'https://wa.me/?text=Hi%20there');
  assert.equal(whatsappHref('2348012345678', 'Hi'), 'https://wa.me/2348012345678?text=Hi');
});

test('admin input schemas reject bad data and unknown fields', () => {
  const ok = { name: 'X', slug: 'x', basePrice: 1000 };
  assert.equal(productInputSchema.safeParse(ok).success, true);
  assert.equal(productInputSchema.safeParse({ ...ok, slug: 'Bad Slug' }).success, false);
  assert.equal(productInputSchema.safeParse({ ...ok, basePrice: -1 }).success, false);
  assert.equal(productInputSchema.safeParse({ ...ok, role: 'admin' }).success, false);
  assert.equal(stockAdjustSchema.safeParse({ variantId: '11111111-1111-4111-8111-111111111111', delta: 2.5, reason: 'recount' }).success, false);
  assert.equal(orderActionSchema.safeParse({ action: 'reject_payment' }).success, false);
  assert.equal(orderActionSchema.safeParse({ action: 'reject_payment', reason: 'Amount does not match' }).success, true);
  assert.equal(orderActionSchema.safeParse({ action: 'set_paid' }).success, false);
});

test('public forms validate and catch the spam honeypot', () => {
  assert.equal(lookupSchema.safeParse({ orderNumber: 'loz-20260918-8f42', email: 'A@B.CO' }).success, true);
  assert.equal(lookupSchema.safeParse({ orderNumber: '12', email: 'a@b.co' }).success, false);
  assert.equal(contactSchema.safeParse({ name: 'Ada', email: 'a@b.co', message: 'Hello, do you restock?' }).success, true);
  assert.equal(contactSchema.safeParse({ name: 'Ada', email: 'a@b.co', message: 'Hello, do you restock?', website: 'spam.example' }).success, false);
});

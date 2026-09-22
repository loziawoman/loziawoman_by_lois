import type { ProductColour, ProductSize, ProductVariant } from '@/types';
import type { VariantRecord } from '@/lib/orders/lines';

export const V1 = '11111111-1111-4111-8111-111111111111';
export const V2 = '22222222-2222-4222-8222-222222222222';
export const V3 = '33333333-3333-4333-8333-333333333333';

export const record = (over: Partial<VariantRecord> & { id: string }): VariantRecord => ({
  productId: 'p1', productName: 'The Noir Skirt', colourName: 'Burgundy', sizeName: 'M', sku: 'SKU-' + over.id.slice(0, 4),
  unitPrice: 72000, stockQuantity: 5, reservedQuantity: 0, isActive: true, productPublished: true, ...over,
});

export const colours: ProductColour[] = [
  { id: 'c-black', name: 'Black', slug: 'black', hex: '#211e1c', sortOrder: 1 },
  { id: 'c-burg', name: 'Burgundy', slug: 'burgundy', hex: '#6f2637', sortOrder: 2 },
];
export const sizes: ProductSize[] = [
  { id: 's-s', name: 'S', sortOrder: 1 },
  { id: 's-m', name: 'M', sortOrder: 2 },
  { id: 's-l', name: 'L', sortOrder: 3 },
];
export const variant = (colourId: string, sizeId: string, available: number, isActive = true): ProductVariant => ({
  id: `${colourId}/${sizeId}`, productId: 'p1', colourId, sizeId, sku: `${colourId}-${sizeId}`, price: 72000,
  stockQuantity: available, reservedQuantity: 0, available, isActive,
});

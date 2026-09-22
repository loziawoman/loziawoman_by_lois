import { z } from 'zod';
import { hexField, money, slugField, uuid } from './common';

const text = (max: number) => z.string().trim().max(max);

export const productInputSchema = z
  .object({
    name: z.string().trim().min(1, 'Give the piece a name.').max(160),
    slug: slugField,
    description: text(4000).default(''),
    shortDescription: text(300).default(''),
    fabric: text(200).default(''),
    care: text(200).default(''),
    categoryId: uuid.nullable().default(null),
    basePrice: money,
    status: z.enum(['draft', 'published', 'archived']).default('draft'),
    featured: z.boolean().default(false),
    originalColourId: uuid.nullable().default(null),
    colourIds: z.array(uuid).max(40).default([]),
    sizeIds: z.array(uuid).max(20).default([]),
  })
  .strict();
export type ProductInput = z.infer<typeof productInputSchema>;
export const productPatchSchema = productInputSchema.partial();

export const variantInputSchema = z
  .object({
    productId: uuid,
    colourId: uuid,
    sizeId: uuid,
    sku: z.string().trim().min(2).max(60).regex(/^[A-Za-z0-9._-]+$/, 'SKUs use letters, numbers, dots, hyphens and underscores.'),
    price: money.nullable().default(null),
    stockQuantity: z.number().int().min(0).max(100_000).default(0),
    isActive: z.boolean().default(true),
  })
  .strict();
export const variantPatchSchema = z
  .object({ sku: variantInputSchema.shape.sku, price: money.nullable(), isActive: z.boolean() })
  .partial()
  .strict();
export const generateVariantsSchema = z.object({ productId: uuid }).strict();

export const stockAdjustSchema = z
  .object({ variantId: uuid, delta: z.number().int().min(-100_000).max(100_000), reason: z.string().trim().min(3, 'Add a short reason.').max(200) })
  .strict();

export const colourInputSchema = z.object({ name: text(60).min(1), slug: slugField, hex: hexField, sortOrder: z.number().int().default(0) }).strict();
export const sizeInputSchema = z.object({ name: text(20).min(1), sortOrder: z.number().int().default(0) }).strict();
export const categoryInputSchema = z
  .object({ name: text(80).min(1), slug: slugField, description: text(500).default(''), imageUrl: z.string().trim().max(2048).nullable().default(null), sortOrder: z.number().int().default(0) })
  .strict();

export const imagePatchSchema = z
  .object({ altText: text(300), isPrimary: z.literal(true), clearMask: z.literal(true) })
  .partial()
  .strict();
export const imageReorderSchema = z.object({ order: z.array(uuid).min(1).max(30) }).strict();

export const orderActionSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('verify_payment') }).strict(),
  z.object({ action: z.literal('reject_payment'), reason: text(300).min(3, 'Give the customer a reason.') }).strict(),
  z.object({ action: z.literal('mark_shipped'), carrier: text(80).optional(), tracking: text(120).optional() }).strict(),
  z.object({ action: z.literal('mark_delivered') }).strict(),
  z.object({ action: z.literal('cancel'), reason: text(300).min(3, 'Add a reason.') }).strict(),
  z.object({ action: z.literal('refund') }).strict(),
  z.object({ action: z.literal('add_note'), note: text(1000).min(1) }).strict(),
]);
export type OrderActionInput = z.infer<typeof orderActionSchema>;

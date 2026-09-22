import 'server-only';
import { attributeHandlers } from '@/lib/api/attributes';
import { categoryInputSchema, colourInputSchema, sizeInputSchema } from '@/lib/validation/admin';

export const colourHandlers = attributeHandlers({
  table: 'colours', entity: 'colour', schema: colourInputSchema,
  toRow: (i) => ({ name: i.name, slug: i.slug, hex: i.hex, sort_order: i.sortOrder }),
});

export const sizeHandlers = attributeHandlers({
  table: 'sizes', entity: 'size', schema: sizeInputSchema,
  toRow: (i) => ({ name: i.name, sort_order: i.sortOrder }),
});

export const categoryHandlers = attributeHandlers({
  table: 'categories', entity: 'category', schema: categoryInputSchema,
  toRow: (i) => ({ name: i.name, slug: i.slug, description: i.description, image_url: i.imageUrl, sort_order: i.sortOrder }),
});

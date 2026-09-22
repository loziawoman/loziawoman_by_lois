import type { Category, Product, ProductColour, ProductImage, ProductSize, ProductStatus, ProductVariant } from '@/types';
import { availableQuantity } from '@/lib/inventory/stock';

/** Embedded select used by every product query. Keep in step with ProductRow. */
export const PRODUCT_SELECT = `
  id, name, slug, description, short_description, fabric, care, base_price, status, featured, original_colour_id, created_at, updated_at,
  category:categories ( id, name, slug, description, image_url, sort_order ),
  images:product_images ( id, storage_path, public_url, alt_text, sort_order, is_primary, mask_storage_path, mask_public_url ),
  colours:product_colours ( sort_order, colour:colours ( id, name, slug, hex, sort_order ) ),
  sizes:product_sizes ( sort_order, size:sizes ( id, name, sort_order ) ),
  variants:product_variants ( id, product_id, colour_id, size_id, sku, price, stock_quantity, reserved_quantity, is_active )
`;

export type ProductRow = {
  id: string; name: string; slug: string; description: string; short_description: string; fabric: string; care: string;
  base_price: number | string; status: ProductStatus; featured: boolean; original_colour_id: string | null; created_at: string; updated_at: string;
  category: { id: string; name: string; slug: string; description: string; image_url: string | null; sort_order: number } | null;
  images: { id: string; storage_path: string | null; public_url: string | null; alt_text: string; sort_order: number; is_primary: boolean; mask_storage_path: string | null; mask_public_url: string | null }[] | null;
  colours: { sort_order: number; colour: { id: string; name: string; slug: string; hex: string; sort_order: number } | null }[] | null;
  sizes: { sort_order: number; size: { id: string; name: string; sort_order: number } | null }[] | null;
  variants: { id: string; product_id: string; colour_id: string; size_id: string; sku: string; price: number | string | null; stock_quantity: number; reserved_quantity: number; is_active: boolean }[] | null;
};

const bySort = <T extends { sortOrder: number }>(a: T, b: T) => a.sortOrder - b.sortOrder;

export function storageUrl(baseUrl: string, path: string | null, publicUrl: string | null): string | null {
  if (publicUrl) return publicUrl;
  if (path) return `${baseUrl}${path}`;
  return null;
}

export function mapCategory(row: NonNullable<ProductRow['category']>): Category {
  return { id: row.id, name: row.name, slug: row.slug, description: row.description, imageUrl: row.image_url, sortOrder: row.sort_order };
}

/** Turns an embedded database row into the Product the UI uses. `imageBaseUrl` is the public product-images bucket URL. */
export function mapProduct(row: ProductRow, imageBaseUrl: string): Product {
  const basePrice = Number(row.base_price);

  const images: ProductImage[] = (row.images ?? [])
    .map((image): ProductImage | null => {
      const src = storageUrl(imageBaseUrl, image.storage_path, image.public_url);
      if (!src) return null;
      return {
        id: image.id, src, alt: image.alt_text || row.name,
        maskSrc: storageUrl(imageBaseUrl, image.mask_storage_path, image.mask_public_url),
        sortOrder: image.sort_order, isPrimary: image.is_primary,
      };
    })
    .filter((image): image is ProductImage => image !== null)
    .sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary) || a.sortOrder - b.sortOrder);

  const colours: ProductColour[] = (row.colours ?? [])
    .flatMap((entry) => (entry.colour ? [{ ...entry.colour, sortOrder: entry.sort_order }] : []))
    .sort(bySort);

  const sizes: ProductSize[] = (row.sizes ?? [])
    .flatMap((entry) => (entry.size ? [{ id: entry.size.id, name: entry.size.name, sortOrder: entry.size.sort_order }] : []))
    .sort(bySort);

  const variants: ProductVariant[] = (row.variants ?? []).map((v) => ({
    id: v.id, productId: v.product_id, colourId: v.colour_id, sizeId: v.size_id, sku: v.sku,
    price: v.price === null ? basePrice : Number(v.price),
    stockQuantity: v.stock_quantity, reservedQuantity: v.reserved_quantity,
    available: availableQuantity({ stockQuantity: v.stock_quantity, reservedQuantity: v.reserved_quantity }),
    isActive: v.is_active,
  }));

  return {
    id: row.id, name: row.name, slug: row.slug, description: row.description, shortDescription: row.short_description,
    fabric: row.fabric, care: row.care, category: row.category ? mapCategory(row.category) : null,
    basePrice, status: row.status, featured: row.featured, originalColourId: row.original_colour_id,
    createdAt: row.created_at, updatedAt: row.updated_at, images, colours, sizes, variants,
  };
}

export type ProductFilters = {
  category?: string;
  colour?: string;
  size?: string;
  q?: string;
  price?: 'under-100000' | '100000-plus';
  availability?: 'in-stock' | 'sold-out';
  sort?: 'featured' | 'newest' | 'price-asc' | 'price-desc';
};

const inStock = (product: Product) => product.variants.some((v) => v.isActive && v.available > 0);
const lowestPrice = (product: Product) => Math.min(product.basePrice, ...product.variants.filter((v) => v.isActive).map((v) => v.price));

/** Shop filtering and sorting. Runs on the server from the URL's query string so every view is shareable. */
export function filterProducts(products: Product[], f: ProductFilters): Product[] {
  const q = f.q?.trim().toLowerCase();
  const filtered = products.filter((p) => {
    if (f.category && p.category?.slug !== f.category) return false;
    if (f.colour && !p.colours.some((c) => c.slug === f.colour)) return false;
    if (f.size && !p.sizes.some((s) => s.name === f.size)) return false;
    if (q && !`${p.name} ${p.category?.name ?? ''} ${p.shortDescription}`.toLowerCase().includes(q)) return false;
    if (f.price === 'under-100000' && !(lowestPrice(p) < 100000)) return false;
    if (f.price === '100000-plus' && !(lowestPrice(p) >= 100000)) return false;
    if (f.availability === 'in-stock' && !inStock(p)) return false;
    if (f.availability === 'sold-out' && inStock(p)) return false;
    return true;
  });

  const sorted = [...filtered];
  switch (f.sort) {
    case 'newest': sorted.sort((a, b) => b.createdAt.localeCompare(a.createdAt)); break;
    case 'price-asc': sorted.sort((a, b) => lowestPrice(a) - lowestPrice(b)); break;
    case 'price-desc': sorted.sort((a, b) => lowestPrice(b) - lowestPrice(a)); break;
    default: sorted.sort((a, b) => Number(b.featured) - Number(a.featured) || b.createdAt.localeCompare(a.createdAt));
  }
  return sorted;
}

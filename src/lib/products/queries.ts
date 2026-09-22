import 'server-only';
import { cache } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Category, Product, ProductColour, ProductSize } from '@/types';
import { productImageBaseUrl } from '@/lib/env';
import { createSupabasePublicClient } from '@/lib/supabase/public';
import { PRODUCT_SELECT, mapCategory, mapProduct, type ProductRow } from './mappers';

const toProducts = (rows: unknown): Product[] => {
  const base = productImageBaseUrl();
  return ((rows ?? []) as ProductRow[]).map((row) => mapProduct(row, base));
};

export const listPublishedProducts = cache(async (): Promise<Product[]> => {
  const { data, error } = await createSupabasePublicClient()
    .from('products').select(PRODUCT_SELECT).eq('status', 'published').order('created_at', { ascending: false });
  if (error) throw error;
  return toProducts(data);
});

export const getPublishedProduct = cache(async (slug: string): Promise<Product | null> => {
  const { data, error } = await createSupabasePublicClient()
    .from('products').select(PRODUCT_SELECT).eq('slug', slug).eq('status', 'published').maybeSingle();
  if (error) throw error;
  return data ? toProducts([data])[0] : null;
});

export async function listRelatedProducts(product: Product, limit = 4): Promise<Product[]> {
  const all = await listPublishedProducts();
  const others = all.filter((p) => p.id !== product.id);
  const sameCategory = others.filter((p) => p.category?.id && p.category.id === product.category?.id);
  return [...sameCategory, ...others.filter((p) => !sameCategory.includes(p))].slice(0, limit);
}

export const listCategories = cache(async (): Promise<Category[]> => {
  const { data, error } = await createSupabasePublicClient().from('categories').select('*').order('sort_order');
  if (error) throw error;
  return (data ?? []).map((row) => mapCategory(row));
});

export const listColours = cache(async (): Promise<ProductColour[]> => {
  const { data, error } = await createSupabasePublicClient().from('colours').select('*').order('sort_order');
  if (error) throw error;
  return (data ?? []).map((c) => ({ id: c.id, name: c.name, slug: c.slug, hex: c.hex, sortOrder: c.sort_order }));
});

export const listSizes = cache(async (): Promise<ProductSize[]> => {
  const { data, error } = await createSupabasePublicClient().from('sizes').select('*').order('sort_order');
  if (error) throw error;
  return (data ?? []).map((s) => ({ id: s.id, name: s.name, sortOrder: s.sort_order }));
});

/** Staff views use the signed-in client so drafts and archived pieces are visible and RLS still applies. */
export async function adminListProducts(supabase: SupabaseClient): Promise<Product[]> {
  const { data, error } = await supabase.from('products').select(PRODUCT_SELECT).order('created_at', { ascending: false });
  if (error) throw error;
  return toProducts(data);
}

export async function adminGetProduct(supabase: SupabaseClient, id: string): Promise<Product | null> {
  const { data, error } = await supabase.from('products').select(PRODUCT_SELECT).eq('id', id).maybeSingle();
  if (error) throw error;
  return data ? toProducts([data])[0] : null;
}

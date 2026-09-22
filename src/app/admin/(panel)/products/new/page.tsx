import type { Metadata } from 'next';
import { ProductForm } from '@/components/admin/product-form';
import { PageHeader } from '@/components/admin/ui';
import { requirePermission } from '@/lib/auth/session';

export const metadata: Metadata = { title: 'New product' };

export default async function NewProductPage() {
  const { supabase } = await requirePermission('catalog:write');
  const [categories, colours, sizes] = await Promise.all([
    supabase.from('categories').select('id, name').order('sort_order'),
    supabase.from('colours').select('id, name, hex').order('sort_order'),
    supabase.from('sizes').select('id, name').order('sort_order'),
  ]);
  return (
    <>
      <PageHeader title="New product" description="Start with the basics. You can add images and variants after saving." />
      <ProductForm categories={categories.data ?? []} colours={colours.data ?? []} sizes={sizes.data ?? []} />
    </>
  );
}

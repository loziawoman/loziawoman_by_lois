import type { Metadata } from 'next';
import { AttributeManager } from '@/components/admin/attribute-manager';
import { PageHeader } from '@/components/admin/ui';
import { requirePermission } from '@/lib/auth/session';

export const metadata: Metadata = { title: 'Colours, sizes & categories' };

export default async function AttributesPage() {
  const { supabase } = await requirePermission('catalog:write');
  const [colours, sizes, categories] = await Promise.all([
    supabase.from('colours').select('id, name, slug, hex, sort_order').order('sort_order'),
    supabase.from('sizes').select('id, name, sort_order').order('sort_order'),
    supabase.from('categories').select('id, name, slug, description, image_url, sort_order').order('sort_order'),
  ]);
  return (
    <>
      <PageHeader title="Colours, sizes & categories" description="Shared lists used by every product. Items still in use cannot be deleted." />
      <AttributeManager kind="colours" title="Colours" rows={colours.data ?? []} />
      <AttributeManager kind="sizes" title="Sizes" rows={sizes.data ?? []} />
      <AttributeManager kind="categories" title="Categories" rows={categories.data ?? []} />
    </>
  );
}

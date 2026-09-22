import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ImageManager } from '@/components/admin/image-manager';
import { ProductForm } from '@/components/admin/product-form';
import { DeleteProduct } from '@/components/admin/delete-product';
import { VariantManager } from '@/components/admin/variant-manager';
import { PageHeader, Panel } from '@/components/admin/ui';
import { requirePermission } from '@/lib/auth/session';
import { can } from '@/lib/auth/permissions';
import { adminGetProduct } from '@/lib/products/queries';
import { uuid } from '@/lib/validation/common';

export const metadata: Metadata = { title: 'Edit product' };

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { user, supabase } = await requirePermission('catalog:read');
  const parsed = uuid.safeParse((await params).id);
  if (!parsed.success) notFound();
  const product = await adminGetProduct(supabase, parsed.data);
  if (!product) notFound();
  const canWrite = can(user.role, 'catalog:write');

  const [categories, colours, sizes] = await Promise.all([
    supabase.from('categories').select('id, name').order('sort_order'),
    supabase.from('colours').select('id, name, hex').order('sort_order'),
    supabase.from('sizes').select('id, name').order('sort_order'),
  ]);

  return (
    <>
      <PageHeader title={product.name} description={`Status: ${product.status}`} actions={<>{product.status === 'published' && <Link className="underline-link mono" href={`/shop/${product.slug}`} target="_blank">View on shop</Link>}</>} />
      {!canWrite && <p role="note" className="mb-6 border border-[hsl(var(--border))] p-3 text-sm">You can view this product. Editing needs an admin account.</p>}
      <Panel title="Details"><ProductForm product={product} categories={categories.data ?? []} colours={colours.data ?? []} sizes={sizes.data ?? []} readOnly={!canWrite} /></Panel>
      <Panel title="Images"><ImageManager productId={product.id} images={product.images} readOnly={!canWrite} /></Panel>
      <Panel title="Variants, prices and stock"><VariantManager product={product} colours={colours.data ?? []} sizes={sizes.data ?? []} readOnly={!canWrite} canAdjustStock /></Panel>
      {canWrite && <Panel title="Remove"><DeleteProduct productId={product.id} name={product.name} /></Panel>}
    </>
  );
}

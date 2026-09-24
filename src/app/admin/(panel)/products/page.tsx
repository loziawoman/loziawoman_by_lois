import type { Metadata } from 'next';
import Link from 'next/link';
import { Empty, Pill, PageHeader, btnCls, btnGhostCls, cellCls, inputCls, Table } from '@/components/admin/ui';
import { requirePermission } from '@/lib/auth/session';
import { can } from '@/lib/auth/permissions';
import { naira } from '@/lib/format';
import { adminListProducts } from '@/lib/products/queries';
import { hasStock } from '@/lib/products/variants';

export const metadata: Metadata = { title: 'Products' };

export default async function ProductsPage({ searchParams }: { searchParams: Promise<{ q?: string; status?: string }> }) {
  const { user, supabase } = await requirePermission('catalog:read');
  const { q, status } = await searchParams;
  const term = q?.trim().toLowerCase();
  const products = (await adminListProducts(supabase)).filter((p) => (!status || p.status === status) && (!term || `${p.name} ${p.slug}`.toLowerCase().includes(term)));

  return (
    <>
      <PageHeader title="Products" description="Create, edit, publish and archive pieces." actions={can(user.role, 'catalog:write') ? <Link className="inline-flex min-h-10 items-center justify-center gap-2 bg-[hsl(var(--muted))] px-4 text-xs uppercase tracking-[.12em] text-[hsl(var(--primary-foreground))] disabled:opacity-40" href="/admin/products/new">New product</Link> : undefined} />
      <form className="mb-6 grid gap-3 sm:grid-cols-[2fr_1fr_auto_auto]" role="search">
        <input name="q" defaultValue={q} placeholder="Search by name or slug" aria-label="Search products" className={inputCls} />
        <select name="status" defaultValue={status ?? ''} aria-label="Status" className={inputCls}>
          <option value="">Any status</option><option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option>
        </select>
        <button className={btnCls} type="submit">Filter</button>
        <Link className={btnGhostCls} href="/admin/products">Clear</Link>
      </form>
      {products.length === 0 ? <Empty>No products yet.</Empty> : (
        <Table head={['Product', 'Category', 'Price', 'Status', 'Stock', 'Featured']}>
          {products.map((p) => (
            <tr key={p.id}>
              <td className={cellCls}><Link className="underline-link" href={`/admin/products/${p.id}`}>{p.name}</Link><br /><span className="text-xs text-[hsl(var(--muted-foreground))]">/{p.slug}</span></td>
              <td className={cellCls}>{p.category?.name ?? '—'}</td>
              <td className={cellCls}>{naira(p.basePrice)}</td>
              <td className={cellCls}><Pill tone={p.status === 'published' ? 'good' : p.status === 'archived' ? 'bad' : 'neutral'}>{p.status}</Pill></td>
              <td className={cellCls}>{p.variants.length === 0 ? <Pill tone="warn">No variants</Pill> : hasStock(p.variants) ? <Pill tone="good">In stock</Pill> : <Pill tone="bad">Sold out</Pill>}</td>
              <td className={cellCls}>{p.featured ? 'Yes' : '—'}</td>
            </tr>
          ))}
        </Table>
      )}
    </>
  );
}

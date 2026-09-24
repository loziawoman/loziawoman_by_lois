import type { Metadata } from 'next';
import Link from 'next/link';
import { Empty, PageHeader, btnCls, btnGhostCls, cellCls, inputCls, Table } from '@/components/admin/ui';
import { loadCustomers } from '@/lib/admin/queries';
import { requirePermission } from '@/lib/auth/session';
import { DeleteRecordButton } from '@/components/admin/delete-record-button';
import { formatDateTime } from '@/lib/format';

export const metadata: Metadata = { title: 'Customers' };

export default async function CustomersPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { supabase } = await requirePermission('customers:read');
  const { q } = await searchParams;
  const customers = await loadCustomers(supabase, q);
  return (
    <>
      <PageHeader title="Customers" description="People who have placed an order. Contact and delivery details are shown for fulfilment only." />
      <form className="mb-6 grid gap-3 sm:grid-cols-[2fr_auto_auto]" role="search">
        <input name="q" defaultValue={q} placeholder="Name, email or phone" aria-label="Search customers" className={inputCls} />
        <button className={btnCls} type="submit">Search</button><Link className={btnGhostCls} href="/admin/customers">Clear</Link>
      </form>
      {customers.length === 0 ? <Empty>No customers yet.</Empty> : (
        <Table head={['Name', 'Email', 'Phone', 'Orders', 'First order', '']}>
          {customers.map((c) => (
            <tr key={c.id}>
              <td className={cellCls}><Link className="underline-link" href={`/admin/customers/${c.id}`}>{c.fullName}</Link></td>
              <td className={cellCls}>{c.email}</td><td className={cellCls}>{c.phone}</td><td className={cellCls}>{c.orderCount}</td><td className={cellCls}>{formatDateTime(c.createdAt)}</td>
              <td className={cellCls}><DeleteRecordButton endpoint={`/api/admin/customers/${c.id}`} confirmText={`Delete ${c.fullName} and all of their orders? This cannot be undone.`} /></td>
            </tr>
          ))}
        </Table>
      )}
    </>
  );
}

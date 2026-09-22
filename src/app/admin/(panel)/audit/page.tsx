import type { Metadata } from 'next';
import { Empty, PageHeader, cellCls, Table } from '@/components/admin/ui';
import { loadAudit } from '@/lib/admin/queries';
import { requirePermission } from '@/lib/auth/session';
import { formatDateTime } from '@/lib/format';

export const metadata: Metadata = { title: 'Audit log' };

export default async function AuditPage() {
  const { supabase } = await requirePermission('audit:read');
  const rows = await loadAudit(supabase);
  return (
    <>
      <PageHeader title="Audit log" description="The most recent 200 admin and order actions. Secrets and personal details are never recorded here." />
      {rows.length === 0 ? <Empty>Nothing recorded yet.</Empty> : (
        <Table head={['When', 'Who', 'Action', 'Entity', 'Details']}>
          {rows.map((r) => (
            <tr key={r.id}>
              <td className={cellCls}>{formatDateTime(r.created_at)}</td>
              <td className={cellCls}>{r.actor_email ?? 'Customer / system'}</td>
              <td className={cellCls}>{r.action}</td>
              <td className={cellCls}>{r.entity}{r.entity_id ? <><br /><span className="text-xs text-[hsl(var(--muted-foreground))]">{r.entity_id.slice(0, 8)}</span></> : null}</td>
              <td className={cellCls}><code className="text-xs">{JSON.stringify(r.metadata)}</code></td>
            </tr>
          ))}
        </Table>
      )}
    </>
  );
}

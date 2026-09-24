import type { Metadata } from 'next';
import { Empty, PageHeader } from '@/components/admin/ui';
import { loadMessages } from '@/lib/admin/queries';
import { requirePermission } from '@/lib/auth/session';
import { can } from '@/lib/auth/permissions';
import { formatDateTime } from '@/lib/format';
import { MessageDeleteButton } from '@/components/admin/message-delete-button';

export const metadata: Metadata = { title: 'Messages' };

export default async function MessagesPage() {
  const { supabase, user } = await requirePermission('customers:read');
  const messages = await loadMessages(supabase);
  return (
    <>
      <PageHeader title="Messages" description="Messages sent through the contact form. Reply by email." />
      {messages.length === 0 ? <Empty>No messages yet.</Empty> : (
        <ul className="grid gap-4">
          {messages.map((m) => (
            <li key={m.id} className="border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5">
              <p className="text-sm"><strong>{m.name}</strong> · <a className="underline-link" href={`mailto:${m.email}`}>{m.email}</a> · <span className="text-[hsl(var(--muted-foreground))]">{formatDateTime(m.created_at)}</span></p>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-7">{m.message}</p>
              {can(user.role, 'settings:write') && <div className="mt-5"><MessageDeleteButton id={m.id} /></div>}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

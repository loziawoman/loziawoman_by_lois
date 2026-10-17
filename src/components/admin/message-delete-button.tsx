'use client';

import { useDialog } from '@/components/ui/dialog-provider';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiRequest } from '@/lib/api/client';
import { btnGhostCls } from './ui';

export function MessageDeleteButton({ id }: { id: string }) {
  const router = useRouter();
  const dialog = useDialog();
  const [busy, setBusy] = useState(false);
  const remove = async () => {
    const confirmed = await dialog.confirm({
      title: 'Delete this message?',
      message: 'This message will be deleted permanently.',
      confirmLabel: 'Delete message',
      tone: 'danger',
    });
    if (!confirmed) return;
    setBusy(true);
    const result = await apiRequest(`/api/admin/messages/${id}`, { method: 'DELETE' });
    setBusy(false);
    if (!result.ok) { await dialog.alert({ title: 'That did not work', message: result.message }); return; }
    router.refresh();
  };
  return <button type="button" disabled={busy} onClick={remove} className={`${btnGhostCls} border-red-300 text-red-700 hover:border-red-600`}>{busy ? 'Deleting…' : 'Delete message'}</button>;
}

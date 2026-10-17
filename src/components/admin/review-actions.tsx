'use client';

import { useDialog } from '@/components/ui/dialog-provider';
import { useState } from 'react';
import { apiRequest } from '@/lib/api/client';
import { btnGhostCls } from './ui';

export function ReviewActions({ id, status }: { id: string; status: string }) {
  const dialog = useDialog();
  const [busy, setBusy] = useState(false);

  async function update(nextStatus: 'visible' | 'hidden' | 'spotlight') {
    setBusy(true);
    const result = await apiRequest(`/api/admin/reviews/${id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ status: nextStatus }),
    });
    setBusy(false);
    if (!result.ok) await dialog.alert({ title: 'That did not work', message: result.message });
    else window.location.reload();
  }

  async function remove() {
    const confirmed = await dialog.confirm({
      title: 'Delete this review?',
      message: 'This review will be deleted permanently. To keep it but stop showing it, use Hide instead.',
      confirmLabel: 'Delete review',
      tone: 'danger',
    });
    if (!confirmed) return;
    setBusy(true);
    const result = await apiRequest(`/api/admin/reviews/${id}`, { method: 'DELETE' });
    setBusy(false);
    if (!result.ok) await dialog.alert({ title: 'That did not work', message: result.message });
    else window.location.reload();
  }

  return (
    <div className="flex flex-wrap gap-2">
      {status !== 'spotlight' && <button disabled={busy} className={btnGhostCls} onClick={() => void update('spotlight')}>Spotlight</button>}
      {status !== 'visible' && <button disabled={busy} className={btnGhostCls} onClick={() => void update('visible')}>Show</button>}
      {status !== 'hidden' && <button disabled={busy} className={btnGhostCls} onClick={() => void update('hidden')}>Hide</button>}
      <button disabled={busy} className={`${btnGhostCls} border-red-300 text-red-700`} onClick={() => void remove()}>Delete</button>
    </div>
  );
}

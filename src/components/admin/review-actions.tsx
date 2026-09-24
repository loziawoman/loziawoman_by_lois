'use client';

import { useState } from 'react';
import { apiRequest } from '@/lib/api/client';
import { btnGhostCls } from './ui';

export function ReviewActions({ id, status }: { id: string; status: string }) {
  const [busy, setBusy] = useState(false);

  async function update(nextStatus: 'visible' | 'hidden' | 'spotlight') {
    setBusy(true);
    const result = await apiRequest(`/api/admin/reviews/${id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ status: nextStatus }),
    });
    setBusy(false);
    if (!result.ok) window.alert(result.message);
    else window.location.reload();
  }

  async function remove() {
    if (!window.confirm('Delete this review permanently?')) return;
    setBusy(true);
    const result = await apiRequest(`/api/admin/reviews/${id}`, { method: 'DELETE' });
    setBusy(false);
    if (!result.ok) window.alert(result.message);
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

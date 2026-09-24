'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiRequest, jsonBody } from '@/lib/api/client';
import { btnCls, btnGhostCls } from './ui';

export function ReviewActions({ id, status }: { id: string; status: 'visible' | 'hidden' | 'spotlight' }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const update = async (next: 'visible' | 'hidden' | 'spotlight') => {
    setBusy(true);
    const result = await apiRequest(`/api/admin/reviews/${id}`, { method: 'PATCH', body: jsonBody({ status: next }) });
    setBusy(false);
    if (!result.ok) return window.alert(result.message);
    router.refresh();
  };
  const remove = async () => {
    if (!window.confirm('Delete this review permanently?')) return;
    setBusy(true);
    const result = await apiRequest(`/api/admin/reviews/${id}`, { method: 'DELETE' });
    setBusy(false);
    if (!result.ok) return window.alert(result.message);
    router.refresh();
  };
  return <div className="flex flex-wrap gap-2">
    {status !== 'spotlight' && <button disabled={busy} onClick={() => update('spotlight')} className={btnCls}>Spotlight</button>}
    {status !== 'visible' && <button disabled={busy} onClick={() => update('visible')} className={btnGhostCls}>Show</button>}
    {status !== 'hidden' && <button disabled={busy} onClick={() => update('hidden')} className={btnGhostCls}>Hide</button>}
    <button disabled={busy} onClick={remove} className={`${btnGhostCls} border-red-300 text-red-700`}>Delete</button>
  </div>;
}

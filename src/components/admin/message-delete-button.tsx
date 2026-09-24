'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiRequest } from '@/lib/api/client';
import { btnGhostCls } from './ui';

export function MessageDeleteButton({ id }: { id: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const remove = async () => {
    if (!window.confirm('Delete this message permanently?')) return;
    setBusy(true);
    const result = await apiRequest(`/api/admin/messages/${id}`, { method: 'DELETE' });
    setBusy(false);
    if (!result.ok) return window.alert(result.message);
    router.refresh();
  };
  return <button type="button" disabled={busy} onClick={remove} className={`${btnGhostCls} border-red-300 text-red-700 hover:border-red-600`}>{busy ? 'Deleting…' : 'Delete message'}</button>;
}

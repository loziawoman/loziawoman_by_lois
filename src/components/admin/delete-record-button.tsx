'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiRequest } from '@/lib/api/client';
import { btnGhostCls } from './ui';

export function DeleteRecordButton({
  endpoint,
  label = 'Delete',
  confirmText,
  redirectTo,
}: {
  endpoint: string;
  label?: string;
  confirmText: string;
  redirectTo?: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function remove() {
    if (!window.confirm(confirmText)) return;
    setBusy(true);
    const result = await apiRequest(endpoint, { method: 'DELETE' });
    setBusy(false);

    if (!result.ok) {
      window.alert(result.message);
      return;
    }

    if (redirectTo) router.replace(redirectTo);
    else router.refresh();
  }

  return (
    <button type="button" disabled={busy} onClick={() => void remove()}
      className={`${btnGhostCls} border-red-300 text-red-700`}>
      {busy ? 'Deleting…' : label}
    </button>
  );
}

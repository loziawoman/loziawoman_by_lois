'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiRequest } from '@/lib/api/client';
import { btnGhostCls } from './ui';

export function DeleteProduct({ productId, name }: { productId: string; name: string }) {
  const router = useRouter();
  const [message, setMessage] = useState('');
  const remove = async () => {
    if (!window.confirm(`Remove ${name}? Pieces that appear on past orders are archived instead of deleted.`)) return;
    const result = await apiRequest<{ archived: boolean }>(`/api/admin/products/${productId}`, { method: 'DELETE' });
    if (!result.ok) { setMessage(result.message); return; }
    router.push('/admin/products');
    router.refresh();
  };
  return (
    <div>
      <p className="mb-3 text-sm text-[hsl(var(--muted-foreground))]">Removing a piece deletes it and its files. If it has been ordered before, it is archived so order history stays intact.</p>
      <button type="button" onClick={remove} className={btnGhostCls} data-testid="button-delete-product">Delete or archive this product</button>
      {message && <p role="alert" className="mt-2 text-sm text-[hsl(var(--destructive))]">{message}</p>}
    </div>
  );
}

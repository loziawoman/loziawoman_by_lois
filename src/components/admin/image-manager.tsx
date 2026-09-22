'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { LoziaImage } from '@/components/lozia-image';
import { apiRequest, jsonBody } from '@/lib/api/client';
import type { ProductImage } from '@/types';
import { btnCls, btnGhostCls, inputCls } from './ui';

export function ImageManager({ productId, images, readOnly }: { productId: string; images: ProductImage[]; readOnly: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  const call = async (fn: () => Promise<{ ok: boolean; message?: string }>) => {
    setBusy(true); setMessage('');
    const result = await fn();
    setBusy(false);
    if (!result.ok) setMessage(result.message ?? 'That did not work.');
    else router.refresh();
  };

  const upload = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    if (!(data.get('mask') instanceof File) || (data.get('mask') as File).size === 0) data.delete('mask');
    void call(async () => {
      const r = await apiRequest(`/api/admin/products/${productId}/images`, { method: 'POST', body: data });
      if (r.ok) form.reset();
      return r.ok ? { ok: true } : { ok: false, message: r.message };
    });
  };

  const patch = (imageId: string, body: Record<string, unknown>) =>
    call(async () => { const r = await apiRequest(`/api/admin/products/${productId}/images/${imageId}`, { method: 'PATCH', body: jsonBody(body) }); return r.ok ? { ok: true } : { ok: false, message: r.message }; });

  const move = (index: number, direction: -1 | 1) => {
    const order = images.map((i) => i.id);
    const target = index + direction;
    if (target < 0 || target >= order.length) return;
    [order[index], order[target]] = [order[target], order[index]];
    void call(async () => { const r = await apiRequest(`/api/admin/products/${productId}/images`, { method: 'PUT', body: jsonBody({ order }) }); return r.ok ? { ok: true } : { ok: false, message: r.message }; });
  };

  const remove = (imageId: string) => {
    if (!window.confirm('Delete this image?')) return;
    void call(async () => { const r = await apiRequest(`/api/admin/products/${productId}/images/${imageId}`, { method: 'DELETE' }); return r.ok ? { ok: true } : { ok: false, message: r.message }; });
  };

  const uploadMask = (imageId: string, file: File | undefined) => {
    if (!file) return;
    const data = new FormData();
    data.set('mask', file);
    void call(async () => { const r = await apiRequest(`/api/admin/products/${productId}/images/${imageId}`, { method: 'PUT', body: data }); return r.ok ? { ok: true } : { ok: false, message: r.message }; });
  };

  return (
    <div>
      {images.length === 0 ? <p className="text-sm text-[hsl(var(--muted-foreground))]">No images yet. Upload the first one below; it becomes the main image.</p> : (
        <ul className="grid gap-4">
          {images.map((image, index) => (
            <li key={image.id} className="grid gap-4 border border-[hsl(var(--border))] p-3 sm:grid-cols-[96px_1fr]">
              <div className="relative h-32 w-24 bg-[hsl(var(--muted))]"><LoziaImage src={image.src} alt={image.alt} fill sizes="96px" className="object-cover" /></div>
              <div className="grid gap-2">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  {image.isPrimary ? <span className="mono bg-[hsl(var(--accent))] px-2 py-1">Main image</span> : !readOnly && <button type="button" disabled={busy} className={btnGhostCls} onClick={() => patch(image.id, { isPrimary: true })}>Make main</button>}
                  <span className="mono">{image.maskSrc ? 'Has colour mask' : 'No mask (automatic recolour)'}</span>
                </div>
                {!readOnly && (
                  <>
                    <label className="grid gap-1 text-xs"><span className="mono">Alt text</span>
                      <input defaultValue={image.alt} className={inputCls} onBlur={(e) => e.target.value !== image.alt && patch(image.id, { altText: e.target.value })} /></label>
                    <div className="flex flex-wrap gap-2">
                      <button type="button" className={btnGhostCls} disabled={busy || index === 0} onClick={() => move(index, -1)} aria-label="Move earlier">↑</button>
                      <button type="button" className={btnGhostCls} disabled={busy || index === images.length - 1} onClick={() => move(index, 1)} aria-label="Move later">↓</button>
                      <label className={`${btnGhostCls} cursor-pointer`}>{image.maskSrc ? 'Replace mask' : 'Add mask'}<input type="file" accept="image/png,image/webp" className="sr-only" onChange={(e) => uploadMask(image.id, e.target.files?.[0])} /></label>
                      {image.maskSrc && <button type="button" className={btnGhostCls} disabled={busy} onClick={() => patch(image.id, { clearMask: true })}>Remove mask</button>}
                      <button type="button" className={btnGhostCls} disabled={busy} onClick={() => remove(image.id)}>Delete</button>
                    </div>
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {!readOnly && (
        <form onSubmit={upload} className="mt-6 grid gap-3 border-t border-[hsl(var(--border))] pt-6">
          <label className="grid gap-1 text-sm"><span className="mono">Image (JPG, PNG, WebP or AVIF, up to 4 MB)</span><input name="file" type="file" required accept="image/jpeg,image/png,image/webp,image/avif" className="min-h-10 text-sm" /></label>
          <label className="grid gap-1 text-sm"><span className="mono">Alt text (describe the photo)</span><input name="alt" className={inputCls} maxLength={300} /></label>
          <label className="grid gap-1 text-sm"><span className="mono">Garment mask (optional, PNG or WebP)</span><input name="mask" type="file" accept="image/png,image/webp" className="min-h-10 text-sm" />
            <span className="text-xs text-[hsl(var(--muted-foreground))]">A white-on-black cut-out of the garment gives the cleanest colour changes.</span></label>
          <button type="submit" disabled={busy} className={`${btnCls} w-fit`} data-testid="button-upload-image">{busy ? 'Uploading…' : 'Upload image'}</button>
        </form>
      )}
      {message && <p role="alert" className="mt-3 text-sm text-[hsl(var(--destructive))]">{message}</p>}
    </div>
  );
}

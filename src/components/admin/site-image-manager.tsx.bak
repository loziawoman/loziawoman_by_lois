'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { LoziaImage } from '@/components/lozia-image';
import { apiRequest, jsonBody } from '@/lib/api/client';
import type { SiteImageKey, SiteImages } from '@/types';
import { SITE_IMAGE_KEYS, SITE_IMAGE_META } from '@/lib/content/site-images';
import { btnCls, btnGhostCls, inputCls, Panel } from './ui';

export function SiteImageManager({ images }: { images: SiteImages }) {
  const router = useRouter();
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  const call = async (key: SiteImageKey, fn: () => Promise<{ ok: boolean; message?: string }>) => {
    setBusyKey(key); setMessage('');
    const result = await fn();
    setBusyKey(null);
    setMessage(result.ok ? 'Saved.' : result.message ?? 'That did not work.');
    if (result.ok) router.refresh();
  };

  const upload = (key: SiteImageKey, event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    data.set('key', key);
    void call(key, async () => {
      const r = await apiRequest('/api/admin/site-images', { method: 'POST', body: data });
      if (r.ok) form.reset();
      return r.ok ? { ok: true } : { ok: false, message: r.message };
    });
  };

  const patch = (key: SiteImageKey, body: Record<string, unknown>) => call(key, async () => {
    const r = await apiRequest(`/api/admin/site-images/${key}`, { method: 'PATCH', body: jsonBody(body) });
    return r.ok ? { ok: true } : { ok: false, message: r.message };
  });

  const remove = (key: SiteImageKey) => {
    if (!window.confirm(`Reset ${SITE_IMAGE_META[key].label} to its built-in image?`)) return;
    void call(key, async () => {
      const r = await apiRequest(`/api/admin/site-images/${key}`, { method: 'DELETE' });
      return r.ok ? { ok: true } : { ok: false, message: r.message };
    });
  };

  return (
    <Panel title="Website images" id="website-images">
      <p className="mb-6 max-w-[760px] text-sm leading-6 text-[hsl(var(--muted-foreground))]">
        Replace the images used across the storefront without touching the code. Uploads work like product images and are stored in Supabase Storage. Resetting an image restores the built-in fallback.
      </p>
      <div className="grid gap-5 md:grid-cols-2">
        {SITE_IMAGE_KEYS.map((key) => {
          const image = images[key];
          const meta = SITE_IMAGE_META[key];
          const busy = busyKey === key;
          return (
            <article key={key} className="border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4">
              <div className="relative aspect-[4/3] overflow-hidden bg-[hsl(var(--muted))]">
                <LoziaImage src={image.src} alt={image.alt} fill sizes="(min-width: 768px) 40vw, 100vw" className="object-cover" />
              </div>
              <div className="mt-4">
                <h3 className="serif text-2xl">{meta.label}</h3>
                <p className="mt-1 text-xs leading-5 text-[hsl(var(--muted-foreground))]">{meta.description}</p>
                <label className="mt-4 grid gap-1 text-xs">
                  <span className="mono">Alt text</span>
                  <input defaultValue={image.alt} maxLength={300} className={inputCls} onBlur={(e) => e.target.value !== image.alt && patch(key, { alt: e.target.value })} />
                </label>
                <form onSubmit={(e) => upload(key, e)} className="mt-4 grid gap-3 border-t border-[hsl(var(--border))] pt-4">
                  <label className="grid gap-1 text-xs">
                    <span className="mono">Replace image (JPG, PNG, WebP or AVIF, up to 4 MB)</span>
                    <input name="file" type="file" required accept="image/jpeg,image/png,image/webp,image/avif" className="min-h-10 text-sm" />
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <button type="submit" disabled={busy} className={btnCls}>{busy ? 'Uploading…' : 'Upload / replace'}</button>
                    {image.storagePath && <button type="button" disabled={busy} className={btnGhostCls} onClick={() => remove(key)}>Reset to default</button>}
                  </div>
                </form>
              </div>
            </article>
          );
        })}
      </div>
      {message && <p role="status" className="mt-4 text-sm">{message}</p>}
    </Panel>
  );
}

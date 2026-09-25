'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { apiRequest, jsonBody } from '@/lib/api/client';
import { slugify } from '@/lib/format';
import type { Product } from '@/types';
import { btnCls, inputCls } from './ui';

type Option = { id: string; name: string; hex?: string };

export function ProductForm({ product, categories, colours, sizes, readOnly = false }: { product?: Product; categories: Option[]; colours: Option[]; sizes: Option[]; readOnly?: boolean }) {
  const router = useRouter();
  const [name, setName] = useState(product?.name ?? '');
  const [slug, setSlug] = useState(product?.slug ?? '');
  const [slugTouched, setSlugTouched] = useState(Boolean(product));
  const [colourIds, setColourIds] = useState<string[]>(product?.colours.map((c) => c.id) ?? []);
  const [sizeIds, setSizeIds] = useState<string[]>(product?.sizes.map((s) => s.id) ?? []);
  const [discountType, setDiscountType] = useState<'fixed' | 'percentage'>(product?.discount.type ?? 'percentage');
  const [discountEnabled, setDiscountEnabled] = useState(product?.discount.enabled ?? false);
  const [discountValue, setDiscountValue] = useState(String(product?.discount.value ?? 0));
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  const toggle = (list: string[], set: (v: string[]) => void, id: string) => set(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const f = new FormData(event.currentTarget);
    const text = (k: string) => String(f.get(k) ?? '');
    setBusy(true); setMessage(''); setErrors({});
    const body = {
      name: text('name'), slug: text('slug'), description: text('description'), shortDescription: text('shortDescription'), fabric: text('fabric'), care: text('care'),
      categoryId: text('categoryId') || null, basePrice: Number(text('basePrice')), status: text('status'), featured: f.get('featured') === 'on',
      originalColourId: text('originalColourId') || null, colourIds, sizeIds,
      discountEnabled: f.get('discountEnabled') === 'on',
      discountType: text('discountType') || 'percentage',
      discountValue: Number(text('discountValue') || 0),
    };
    const result = await apiRequest<{ id: string }>(product ? `/api/admin/products/${product.id}` : '/api/admin/products', { method: product ? 'PATCH' : 'POST', body: jsonBody(body) });
    setBusy(false);
    if (!result.ok) { setMessage(result.message); setErrors(result.fieldErrors); return; }
    if (product) { setMessage('Saved.'); router.refresh(); } else router.push(`/admin/products/${result.data.id}`);
  };

  const err = (k: string) => errors[k]?.[0] && <span role="alert" className="text-xs text-[hsl(var(--destructive))]">{errors[k][0]}</span>;

  return (
    <form onSubmit={submit} className="grid gap-5" noValidate>
      <fieldset disabled={readOnly || busy} className="grid gap-5">
        <div className="grid gap-5 md:grid-cols-2">
          <label className="grid gap-1 text-sm"><span className="mono">Name</span>
            <input name="name" required value={name} className={inputCls} onChange={(e) => { setName(e.target.value); if (!slugTouched) setSlug(slugify(e.target.value)); }} />{err('name')}</label>
          <label className="grid gap-1 text-sm"><span className="mono">Slug (web address)</span>
            <input name="slug" required value={slug} className={inputCls} onChange={(e) => { setSlug(e.target.value); setSlugTouched(true); }} />{err('slug')}</label>
        </div>
        <label className="grid gap-1 text-sm"><span className="mono">Short description</span><input name="shortDescription" defaultValue={product?.shortDescription} className={inputCls} maxLength={300} />{err('shortDescription')}</label>
        <label className="grid gap-1 text-sm"><span className="mono">Description</span><textarea name="description" rows={5} defaultValue={product?.description} className={inputCls} />{err('description')}</label>
        <div className="grid gap-5 md:grid-cols-2">
          <label className="grid gap-1 text-sm"><span className="mono">Fabric</span><input name="fabric" defaultValue={product?.fabric} className={inputCls} /></label>
          <label className="grid gap-1 text-sm"><span className="mono">Care</span><input name="care" defaultValue={product?.care} className={inputCls} /></label>
        </div>
        <div className="grid gap-5 md:grid-cols-4">
          <label className="grid gap-1 text-sm"><span className="mono">Base price (₦)</span><input name="basePrice" type="number" min={0} step="1" required defaultValue={product?.basePrice ?? ''} className={inputCls} />{err('basePrice')}</label>
          <label className="grid gap-1 text-sm"><span className="mono">Category</span>
            <select name="categoryId" defaultValue={product?.category?.id ?? ''} className={inputCls}><option value="">None</option>{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
          <label className="grid gap-1 text-sm"><span className="mono">Status</span>
            <select name="status" defaultValue={product?.status ?? 'draft'} className={inputCls}><option value="draft">Draft (hidden)</option><option value="published">Published</option><option value="archived">Archived (hidden)</option></select></label>
          <label className="flex min-h-10 items-center gap-2 self-end text-sm"><input type="checkbox" name="featured" defaultChecked={product?.featured} className="h-5 w-5" /> Featured on homepage</label>
        </div>

        <section className="grid gap-4 border border-[hsl(var(--border))] p-4" aria-labelledby="discount-heading">
          <div>
            <h3 id="discount-heading" className="mono">Flash sale / discount</h3>
            <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">Set a temporary sale price or percentage. Nothing changes on the shop until the switch is enabled.</p>
          </div>
          <label className="flex items-center gap-3 text-sm">
            <input type="checkbox" name="discountEnabled" checked={discountEnabled} onChange={(e) => setDiscountEnabled(e.target.checked)} className="h-5 w-5" />
            Show this discount on the shop
          </label>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-1 text-sm">
              <span className="mono">Discount type</span>
              <select name="discountType" value={discountType} onChange={(e) => setDiscountType(e.target.value as 'fixed' | 'percentage')} className={inputCls}>
                <option value="fixed">Fixed sale price</option>
                <option value="percentage">Percentage off</option>
              </select>
            </label>
            <label className="grid gap-1 text-sm">
              <span className="mono">{discountType === 'fixed' ? 'Sale price (₦)' : 'Discount (%)'}</span>
              <input name="discountValue" type="number" min={0} max={discountType === 'percentage' ? 100 : undefined} step="1" value={discountValue} onChange={(e) => setDiscountValue(e.target.value)} className={inputCls} />
              {err('discountValue')}
            </label>
          </div>
          <p className="text-xs text-[hsl(var(--muted-foreground))]">
            {discountType === 'fixed'
              ? 'Fixed sale price is the final price. Example: ₦120,000 normal → ₦80,000 sale = 33% off.'
              : 'Percentage discounts are applied to the normal variant price and rounded to the nearest ₦1,000.'}
          </p>
        </section>

        <fieldset className="grid gap-2"><legend className="mono">Colours offered</legend>
          <div className="flex flex-wrap gap-2">{colours.map((c) => (
            <label key={c.id} className={`flex min-h-10 cursor-pointer items-center gap-2 border px-3 text-sm ${colourIds.includes(c.id) ? 'border-[hsl(var(--primary))]' : 'border-[hsl(var(--border))]'}`}>
              <input type="checkbox" checked={colourIds.includes(c.id)} onChange={() => toggle(colourIds, setColourIds, c.id)} />
              <span className="h-4 w-4 rounded-full border" style={{ background: c.hex }} aria-hidden="true" />{c.name}
            </label>))}</div>
        </fieldset>
        <fieldset className="grid gap-2"><legend className="mono">Sizes offered</legend>
          <div className="flex flex-wrap gap-2">{sizes.map((s) => (
            <label key={s.id} className={`flex min-h-10 cursor-pointer items-center gap-2 border px-3 text-sm ${sizeIds.includes(s.id) ? 'border-[hsl(var(--primary))]' : 'border-[hsl(var(--border))]'}`}>
              <input type="checkbox" checked={sizeIds.includes(s.id)} onChange={() => toggle(sizeIds, setSizeIds, s.id)} />{s.name}
            </label>))}</div>
        </fieldset>
        <label className="grid gap-1 text-sm md:max-w-[320px]"><span className="mono">Colour the photos were shot in</span>
          <select name="originalColourId" defaultValue={product?.originalColourId ?? ''} className={inputCls}><option value="">Not set (colour preview off)</option>{colours.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
          <span className="text-xs text-[hsl(var(--muted-foreground))]">Needed for the live colour preview on the product page.</span></label>
      </fieldset>
      {!readOnly && (
        <div className="flex items-center gap-4">
          <button type="submit" disabled={busy} className={btnCls} data-testid="button-save-product">{busy ? 'Saving…' : product ? 'Save changes' : 'Create product'}</button>
          {message && <p role="status" className="text-sm">{message}</p>}
        </div>
      )}
    </form>
  );
}

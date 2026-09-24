'use client';

import { useState, type FormEvent, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { apiRequest, jsonBody } from '@/lib/api/client';
import type { PolicyContent, ShippingRates, SizeGuideContent, HomepageContent, SiteImages } from '@/types';
import { btnCls, btnGhostCls, inputCls, Panel } from './ui';
import { SiteImageManager } from './site-image-manager';

function useSave() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const save = async (values: Record<string, unknown>) => {
    setBusy(true); setMessage('');
    const r = await apiRequest('/api/admin/settings', { method: 'PUT', body: jsonBody({ values }) });
    setBusy(false);
    setMessage(r.ok ? 'Saved.' : r.message);
    if (r.ok) router.refresh();
  };
  return { busy, message, save };
}

function Footer({ busy, message }: { busy: boolean; message: string }) {
  return (
    <div className="mt-5 flex items-center gap-4">
      <button type="submit" disabled={busy} className={btnCls}>{busy ? 'Saving…' : 'Save'}</button>
      {message && <p role="status" className="text-sm">{message}</p>}
    </div>
  );
}

const Label = ({ text, children, hint }: { text: string; children: ReactNode; hint?: string }) => (
  <label className="grid gap-1 text-sm"><span className="mono">{text}</span>{children}{hint && <span className="text-xs text-[hsl(var(--muted-foreground))]">{hint}</span>}</label>
);

export type SimpleField = { key: string; label: string; kind?: 'text' | 'textarea' | 'number'; hint?: string };

/** A group of plain settings, one stored value per field. */
export function SimpleGroup({ id, title, note, fields, values }: { id?: string; title: string; note?: string; fields: SimpleField[]; values: Record<string, string | number> }) {
  const { busy, message, save } = useSave();
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    void save(Object.fromEntries(fields.map((f) => [f.key, f.kind === 'number' ? Number(data.get(f.key)) : String(data.get(f.key) ?? '').trim()])));
  };
  return (
    <Panel title={title} id={id}>
      {note && <p className="mb-4 text-sm text-[hsl(var(--muted-foreground))]">{note}</p>}
      <form onSubmit={submit} className="grid gap-4 md:grid-cols-2">
        {fields.map((f) => (
          <div key={f.key} className={f.kind === 'textarea' ? 'md:col-span-2' : ''}>
            <Label text={f.label} hint={f.hint}>
              {f.kind === 'textarea'
                ? <textarea name={f.key} rows={4} defaultValue={values[f.key]} className={inputCls} />
                : <input name={f.key} type={f.kind === 'number' ? 'number' : 'text'} defaultValue={values[f.key]} className={inputCls} />}
            </Label>
          </div>
        ))}
        <div className="md:col-span-2"><Footer busy={busy} message={message} /></div>
      </form>
    </Panel>
  );
}

export function HomepageGroup({ homepage, aboutStory }: { homepage: HomepageContent; aboutStory: string }) {
  const { busy, message, save } = useSave();
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const d = new FormData(event.currentTarget);
    const t = (k: string) => String(d.get(k) ?? '').trim();
    void save({
      homepage: { announcement: t('announcement'), eyebrow: t('eyebrow'), headline: t('headline'), italicHeadline: t('italicHeadline'), description: t('description'), ctaLabel: t('ctaLabel') },
      about_story: t('aboutStory'),
    });
  };
  return (
    <Panel title="Homepage and About">
      <form onSubmit={submit} className="grid gap-4 md:grid-cols-2">
        <div className="md:col-span-2"><Label text="Announcement bar (leave empty to hide)"><input name="announcement" defaultValue={homepage.announcement} className={inputCls} /></Label></div>
        <Label text="Eyebrow"><input name="eyebrow" defaultValue={homepage.eyebrow} className={inputCls} /></Label>
        <Label text="Button label"><input name="ctaLabel" defaultValue={homepage.ctaLabel} className={inputCls} /></Label>
        <Label text="Headline"><input name="headline" defaultValue={homepage.headline} className={inputCls} /></Label>
        <Label text="Headline (italic part)"><input name="italicHeadline" defaultValue={homepage.italicHeadline} className={inputCls} /></Label>
        <div className="md:col-span-2"><Label text="Intro"><textarea name="description" rows={2} defaultValue={homepage.description} className={inputCls} /></Label></div>
        <div className="md:col-span-2"><Label text="About page story paragraph"><textarea name="aboutStory" rows={4} defaultValue={aboutStory} className={inputCls} /></Label></div>
        <div className="md:col-span-2"><Footer busy={busy} message={message} /></div>
      </form>
    </Panel>
  );
}

export function ShippingGroup({ rates, reservationHours }: { rates: ShippingRates; reservationHours: number }) {
  const { busy, message, save } = useSave();
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const d = new FormData(event.currentTarget);
    const byState: Record<string, number> = {};
    for (const line of String(d.get('byState') ?? '').split('\n')) {
      const [state, fee] = line.split(':').map((s) => s.trim());
      if (state && fee !== undefined && fee !== '' && Number.isFinite(Number(fee))) byState[state] = Number(fee);
    }
    const freeAbove = String(d.get('freeAbove') ?? '').trim();
    void save({
      shipping_rates: { defaultFee: Number(d.get('defaultFee') || 0), byState, freeAbove: freeAbove === '' ? null : Number(freeAbove), placeholder: d.get('placeholder') === 'on' },
      reservation_hours: Number(d.get('reservationHours') || 48),
    });
  };
  return (
    <Panel title="Delivery fees and stock holds">
      <p className="mb-4 text-sm text-[hsl(var(--muted-foreground))]">Delivery is added to the order total at checkout. Until you enter real prices, keep &ldquo;prices are still placeholders&rdquo; ticked: customers will see &ldquo;To be confirmed&rdquo; instead of a fee.</p>
      <form onSubmit={submit} className="grid gap-4 md:grid-cols-2">
        <Label text="Default delivery fee (₦)"><input name="defaultFee" type="number" min={0} step="1" defaultValue={rates.defaultFee} className={inputCls} /></Label>
        <Label text="Free delivery from (₦, optional)"><input name="freeAbove" type="number" min={0} step="1" defaultValue={rates.freeAbove ?? ''} className={inputCls} /></Label>
        <div className="md:col-span-2"><Label text="Fee per state (one per line, e.g. Lagos: 2500)" hint="States not listed use the default fee."><textarea name="byState" rows={4} defaultValue={Object.entries(rates.byState).map(([s, f]) => `${s}: ${f}`).join('\n')} className={inputCls} /></Label></div>
        <label className="flex items-center gap-2 text-sm md:col-span-2"><input type="checkbox" name="placeholder" defaultChecked={rates.placeholder} className="h-5 w-5" /> Delivery prices are still placeholders</label>
        <Label text="Hold stock for unpaid orders (hours)" hint="After this long, unpaid orders are cancelled and their stock released (needs the scheduled job)."><input name="reservationHours" type="number" min={1} max={720} defaultValue={reservationHours} className={inputCls} /></Label>
        <div className="md:col-span-2"><Footer busy={busy} message={message} /></div>
      </form>
    </Panel>
  );
}

export function PolicyEditor({ settingKey, policy }: { settingKey: string; policy: PolicyContent }) {
  const { busy, message, save } = useSave();
  const [sections, setSections] = useState(policy.sections);
  const [intro, setIntro] = useState(policy.intro);
  const [title, setTitle] = useState(policy.title);
  const [placeholder, setPlaceholder] = useState(policy.isPlaceholder);
  const update = (i: number, patch: Partial<{ title: string; body: string }>) => setSections(sections.map((s, j) => (j === i ? { ...s, ...patch } : s)));

  return (
    <Panel title={`${policy.title} page`}>
      <form onSubmit={(e) => { e.preventDefault(); void save({ [settingKey]: { title, intro, isPlaceholder: placeholder, sections } }); }} className="grid gap-4">
        <div className="grid gap-4 md:grid-cols-2">
          <Label text="Page title"><input value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} /></Label>
          <label className="flex items-center gap-2 self-end text-sm"><input type="checkbox" checked={placeholder} onChange={(e) => setPlaceholder(e.target.checked)} className="h-5 w-5" /> Still a draft (shows a notice on the page)</label>
        </div>
        <Label text="Intro"><textarea rows={2} value={intro} onChange={(e) => setIntro(e.target.value)} className={inputCls} /></Label>
        {sections.map((s, i) => (
          <fieldset key={i} className="grid gap-2 border border-[hsl(var(--border))] p-3">
            <legend className="mono px-1">Section {i + 1}</legend>
            <input aria-label={`Section ${i + 1} title`} value={s.title} onChange={(e) => update(i, { title: e.target.value })} className={inputCls} />
            <textarea aria-label={`Section ${i + 1} text`} rows={3} value={s.body} onChange={(e) => update(i, { body: e.target.value })} className={inputCls} />
            <button type="button" className={`${btnGhostCls} w-fit`} onClick={() => setSections(sections.filter((_, j) => j !== i))}>Remove section</button>
          </fieldset>
        ))}
        <button type="button" className={`${btnGhostCls} w-fit`} onClick={() => setSections([...sections, { title: '', body: '' }])}>Add section</button>
        <Footer busy={busy} message={message} />
      </form>
    </Panel>
  );
}

export function SizeGuideEditor({ guide }: { guide: SizeGuideContent }) {
  const { busy, message, save } = useSave();
  const [rows, setRows] = useState(guide.rows);
  const [placeholder, setPlaceholder] = useState(guide.isPlaceholder);
  const [intro, setIntro] = useState(guide.intro);
  const [steps, setSteps] = useState(guide.howToMeasure.join('\n'));
  const setCell = (i: number, key: keyof SizeGuideContent['rows'][number], value: string) => setRows(rows.map((r, j) => (j === i ? { ...r, [key]: value } : r)));

  return (
    <Panel title="Size guide">
      <form onSubmit={(e) => { e.preventDefault(); void save({ size_guide: { intro, isPlaceholder: placeholder, howToMeasure: steps.split('\n').map((s) => s.trim()).filter(Boolean), rows } }); }} className="grid gap-4">
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={placeholder} onChange={(e) => setPlaceholder(e.target.checked)} className="h-5 w-5" /> These measurements are demonstration values, not official (shows a notice)</label>
        <Label text="Intro"><textarea rows={2} value={intro} onChange={(e) => setIntro(e.target.value)} className={inputCls} /></Label>
        <Label text="How to measure (one step per line)"><textarea rows={4} value={steps} onChange={(e) => setSteps(e.target.value)} className={inputCls} /></Label>
        <div className="grid gap-2">
          {rows.map((r, i) => (
            <div key={i} className="grid grid-cols-2 gap-2 sm:grid-cols-6">
              {(['size', 'bust', 'waist', 'hip', 'uk'] as const).map((key) => <input key={key} aria-label={`${key} for row ${i + 1}`} placeholder={key} value={r[key]} onChange={(e) => setCell(i, key, e.target.value)} className={inputCls} />)}
              <button type="button" className={btnGhostCls} onClick={() => setRows(rows.filter((_, j) => j !== i))}>Remove</button>
            </div>
          ))}
          <button type="button" className={`${btnGhostCls} w-fit`} onClick={() => setRows([...rows, { size: '', bust: '', waist: '', hip: '', uk: '' }])}>Add row</button>
        </div>
        <Footer busy={busy} message={message} />
      </form>
    </Panel>
  );
}


export function ReviewSettingsGroup({ enabled }: { enabled: boolean }) {
  const { busy, message, save } = useSave();
  const [value, setValue] = useState(enabled);

  return (
    <Panel title="Customer reviews">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void save({ review_submission_enabled: value });
        }}
        className="grid gap-4"
      >
        <label className="flex items-start gap-3 text-sm">
          <input
            type="checkbox"
            checked={value}
            onChange={(event) => setValue(event.target.checked)}
            className="mt-0.5 h-5 w-5"
          />
          <span>
            <span className="block">Allow customers to leave reviews</span>
            <span className="mt-1 block text-xs text-[hsl(var(--muted-foreground))]">
              When disabled, the &ldquo;Leave a review&rdquo; button and review form are hidden from customers. Existing reviews remain visible.
            </span>
          </span>
        </label>
        <Footer busy={busy} message={message} />
      </form>
    </Panel>
  );
}

export function SiteImagesGroup({ images }: { images: SiteImages }) {
  return <SiteImageManager images={images} />;
}

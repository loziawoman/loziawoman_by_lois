'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { apiRequest, jsonBody } from '@/lib/api/client';
import { slugify } from '@/lib/format';
import { btnCls, btnGhostCls, inputCls, Panel } from './ui';

type Kind = 'colours' | 'sizes' | 'categories';
type Row = Record<string, string | number | null>;
type Field = { key: string; label: string; type: 'text' | 'color' | 'number'; slugFrom?: boolean };

const FIELDS: Record<Kind, Field[]> = {
  colours: [{ key: 'name', label: 'Name', type: 'text' }, { key: 'slug', label: 'Slug', type: 'text', slugFrom: true }, { key: 'hex', label: 'Colour', type: 'color' }, { key: 'sort_order', label: 'Order', type: 'number' }],
  sizes: [{ key: 'name', label: 'Name', type: 'text' }, { key: 'sort_order', label: 'Order', type: 'number' }],
  categories: [{ key: 'name', label: 'Name', type: 'text' }, { key: 'slug', label: 'Slug', type: 'text', slugFrom: true }, { key: 'description', label: 'Description', type: 'text' }, { key: 'image_url', label: 'Image URL (optional)', type: 'text' }, { key: 'sort_order', label: 'Order', type: 'number' }],
};

/** Builds the API body (camelCase) from a form's values. */
function toBody(kind: Kind, v: Record<string, string>) {
  const order = Number(v.sort_order || 0);
  if (kind === 'colours') return { name: v.name, slug: v.slug, hex: v.hex || '#000000', sortOrder: order };
  if (kind === 'sizes') return { name: v.name, sortOrder: order };
  return { name: v.name, slug: v.slug, description: v.description ?? '', imageUrl: v.image_url ? v.image_url : null, sortOrder: order };
}

function RowForm({ kind, row, onDone }: { kind: Kind; row?: Row; onDone: (message: string) => void }) {
  const router = useRouter();
  const fields = FIELDS[kind];
  const [values, setValues] = useState<Record<string, string>>(() => Object.fromEntries(fields.map((f) => [f.key, String(row?.[f.key] ?? (f.type === 'color' ? '#000000' : ''))])));
  const [busy, setBusy] = useState(false);
  const [touchedSlug, setTouchedSlug] = useState(Boolean(row));
  const base = `/api/admin/${kind}`;

  const save = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    const r = await apiRequest(row ? `${base}/${row.id}` : base, { method: row ? 'PATCH' : 'POST', body: jsonBody(toBody(kind, values)) });
    setBusy(false);
    if (!r.ok) { onDone(r.message); return; }
    if (!row) setValues(Object.fromEntries(fields.map((f) => [f.key, f.type === 'color' ? '#000000' : ''])));
    onDone(row ? 'Saved.' : 'Added.');
    router.refresh();
  };

  const remove = async () => {
    if (!row || !window.confirm(`Delete ${row.name}?`)) return;
    setBusy(true);
    const r = await apiRequest(`${base}/${row.id}`, { method: 'DELETE' });
    setBusy(false);
    onDone(r.ok ? 'Deleted.' : r.message);
    if (r.ok) router.refresh();
  };

  return (
    <form onSubmit={save} className="flex flex-wrap items-end gap-3 border-b border-[hsl(var(--border))] py-3">
      {fields.map((f) => (
        <label key={f.key} className="grid gap-1 text-xs">
          <span className="mono">{f.label}</span>
          <input
            type={f.type} value={values[f.key]} required={f.key === 'name' || f.key === 'slug'}
            className={`${inputCls} ${f.type === 'color' ? 'w-16 p-1' : f.type === 'number' ? 'w-20' : 'min-w-[150px]'}`}
            onChange={(e) => {
              const next = { ...values, [f.key]: e.target.value };
              if (f.key === 'name' && !touchedSlug && 'slug' in values) next.slug = slugify(e.target.value);
              if (f.key === 'slug') setTouchedSlug(true);
              setValues(next);
            }}
          />
        </label>
      ))}
      <button type="submit" disabled={busy} className={btnCls}>{row ? 'Save' : 'Add'}</button>
      {row && <button type="button" disabled={busy} onClick={remove} className={btnGhostCls}>Delete</button>}
    </form>
  );
}

export function AttributeManager({ kind, title, rows }: { kind: Kind; title: string; rows: Row[] }) {
  const [message, setMessage] = useState('');
  return (
    <Panel title={title}>
      {rows.map((row) => <RowForm key={`${row.id}-${JSON.stringify(row)}`} kind={kind} row={row} onDone={setMessage} />)}
      <div className="mt-4"><p className="mono mb-1">Add new</p><RowForm kind={kind} onDone={setMessage} /></div>
      {message && <p role="status" className="mt-3 text-sm">{message}</p>}
    </Panel>
  );
}

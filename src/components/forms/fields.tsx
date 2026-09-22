import type { InputHTMLAttributes, TextareaHTMLAttributes } from 'react';

const base = 'border-b border-[hsl(var(--border))] bg-transparent px-1 py-3 text-sm outline-none focus:border-[hsl(var(--primary))] aria-[invalid=true]:border-[hsl(var(--destructive))]';

type Common = { label: string; error?: string; hint?: string };

export function TextField({ label, error, hint, id, ...props }: Common & InputHTMLAttributes<HTMLInputElement> & { id: string }) {
  return (
    <div className="grid gap-2 text-xs">
      <label htmlFor={id} className="mono">{label}</label>
      <input id={id} aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined} className={`${base} min-h-11`} {...props} />
      {hint && !error && <span id={`${id}-hint`} className="text-[hsl(var(--muted-foreground))]">{hint}</span>}
      {error && <span id={`${id}-error`} role="alert" className="text-[hsl(var(--destructive))]">{error}</span>}
    </div>
  );
}

export function TextArea({ label, error, hint, id, ...props }: Common & TextareaHTMLAttributes<HTMLTextAreaElement> & { id: string }) {
  return (
    <div className="grid gap-2 text-xs">
      <label htmlFor={id} className="mono">{label}</label>
      <textarea id={id} aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined} className={`${base} resize-none`} {...props} />
      {hint && !error && <span id={`${id}-hint`} className="text-[hsl(var(--muted-foreground))]">{hint}</span>}
      {error && <span id={`${id}-error`} role="alert" className="text-[hsl(var(--destructive))]">{error}</span>}
    </div>
  );
}

export const firstError = (errors: Record<string, string[]>, ...keys: string[]): string | undefined => {
  for (const key of keys) if (errors[key]?.[0]) return errors[key][0];
  return undefined;
};

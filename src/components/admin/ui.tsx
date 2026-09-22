import type { ReactNode } from 'react';
import type { FulfillmentStatus, PaymentStatus } from '@/types';

export const inputCls = 'min-h-10 w-full border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-3 py-2 text-sm outline-none focus:border-[hsl(var(--primary))]';
export const btnCls = 'inline-flex min-h-10 items-center justify-center gap-2 bg-[hsl(var(--primary))] px-4 text-xs uppercase tracking-[.12em] text-[hsl(var(--primary-foreground))] disabled:opacity-40';
export const btnGhostCls = 'inline-flex min-h-10 items-center justify-center gap-2 border border-[hsl(var(--border))] px-4 text-xs uppercase tracking-[.12em] hover:border-[hsl(var(--primary))] disabled:opacity-40';
export const cellCls = 'border-b border-[hsl(var(--border))] px-3 py-3 align-top';

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="serif text-4xl md:text-5xl">{title}</h1>
        {description && <p className="mt-2 max-w-[560px] text-sm text-[hsl(var(--muted-foreground))]">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Panel({ title, children, id }: { title?: string; children: ReactNode; id?: string }) {
  return (
    <section id={id} className="mb-8 border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 md:p-6">
      {title && <h2 className="serif mb-4 text-2xl">{title}</h2>}
      {children}
    </section>
  );
}

const tones: Record<string, string> = {
  good: 'bg-emerald-100 text-emerald-900', warn: 'bg-amber-100 text-amber-900', bad: 'bg-red-100 text-red-900', neutral: 'bg-stone-200 text-stone-800',
};
/** Status pills always carry text, never colour alone. */
export function Pill({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'good' | 'warn' | 'bad' | 'neutral' }) {
  return <span className={`inline-block px-2 py-1 text-[10px] uppercase tracking-[.1em] ${tones[tone]}`}>{children}</span>;
}

export const paymentTone = (s: PaymentStatus) => (s === 'VERIFIED' ? 'good' : s === 'REJECTED' ? 'bad' : s === 'SUBMITTED' ? 'warn' : 'neutral') as 'good' | 'warn' | 'bad' | 'neutral';
export const fulfillmentTone = (s: FulfillmentStatus) => (s === 'DELIVERED' ? 'good' : s === 'CANCELLED' ? 'bad' : s === 'SHIPPED' || s === 'PROCESSING' ? 'warn' : 'neutral') as 'good' | 'warn' | 'bad' | 'neutral';

export function Empty({ children }: { children: ReactNode }) {
  return <p className="border border-dashed border-[hsl(var(--border))] p-8 text-center text-sm text-[hsl(var(--muted-foreground))]">{children}</p>;
}

export function Table({ head, children }: { head: string[]; children: ReactNode }) {
  return (
    <div className="overflow-x-auto border border-[hsl(var(--border))] bg-[hsl(var(--card))]">
      <table className="w-full min-w-[640px] border-collapse text-left text-sm">
        <thead><tr className="bg-[hsl(var(--muted))]">{head.map((h) => <th key={h} scope="col" className="px-3 py-3 mono">{h}</th>)}</tr></thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

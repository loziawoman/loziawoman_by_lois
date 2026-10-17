import type { Metadata } from 'next';
import { PlaceholderNotice } from '@/components/content/policy-page';
import { getSiteSettings } from '@/lib/settings/queries';

export const metadata: Metadata = { title: 'Size guide', description: 'Find your LOZIA size.', alternates: { canonical: '/size-guide' } };
export const dynamic = 'force-dynamic';

export default async function SizeGuidePage() {
  const { sizeGuide } = await getSiteSettings();
  const { columns, rows } = sizeGuide;
  return (
    <main className="mx-auto max-w-[1000px] px-5 py-20 md:px-10 md:py-32">
      <span className="mono text-[hsl(var(--accent))]">Find your fit</span>
      <h1 className="serif mt-5 text-6xl md:text-8xl">Size guide.</h1>
      <p className="mt-6 max-w-[520px] text-sm leading-7 text-[hsl(var(--muted-foreground))]">{sizeGuide.intro}</p>
      {sizeGuide.isPlaceholder && <PlaceholderNotice what="The measurements below are demonstration values, not LOZIA's official sizing. This size chart" />}

      <div className="mt-14 overflow-x-auto">
        <table className="w-full border-collapse text-left text-sm" style={{ minWidth: `${Math.max(560, 120 + columns.length * 120)}px` }}>
          <caption className="sr-only">Body measurements by size</caption>
          <thead>
            <tr className="border-y border-[hsl(var(--border))]">
              <th scope="col" className="py-4 pr-4 mono">Size</th>
              {columns.map((c) => <th key={c.id} scope="col" className="py-4 pr-4 mono">{c.label}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-b border-[hsl(var(--border))]">
                <th scope="row" className="serif py-5 pr-4 text-xl font-normal">{r.size}</th>
                {columns.map((c) => <td key={c.id} className="py-5 pr-4">{r[c.id] ?? ''}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {sizeGuide.howToMeasure.length > 0 && (
        <section className="mt-16">
          <h2 className="serif text-3xl">How to measure</h2>
          <ol className="mt-5 grid gap-3 text-sm leading-7 text-[hsl(var(--muted-foreground))]">
            {sizeGuide.howToMeasure.map((step, i) => <li key={i}><span className="mono mr-3 text-[hsl(var(--accent))]">{String(i + 1).padStart(2, '0')}</span>{step}</li>)}
          </ol>
        </section>
      )}
    </main>
  );
}

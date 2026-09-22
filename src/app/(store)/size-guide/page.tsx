import type { Metadata } from 'next';
import { PlaceholderNotice } from '@/components/content/policy-page';
import { getSiteSettings } from '@/lib/settings/queries';

export const metadata: Metadata = { title: 'Size guide', description: 'Find your LOZIA size.', alternates: { canonical: '/size-guide' } };
export const dynamic = 'force-dynamic';

export default async function SizeGuidePage() {
  const { sizeGuide } = await getSiteSettings();
  return (
    <main className="mx-auto max-w-[1000px] px-5 py-20 md:px-10 md:py-32">
      <span className="mono text-[hsl(var(--accent))]">Find your fit</span>
      <h1 className="serif mt-5 text-6xl md:text-8xl">Size guide.</h1>
      <p className="mt-6 max-w-[520px] text-sm leading-7 text-[hsl(var(--muted-foreground))]">{sizeGuide.intro}</p>
      {sizeGuide.isPlaceholder && <PlaceholderNotice what="The measurements below are demonstration values, not LOZIA's official sizing. This size chart" />}

      <div className="mt-14 overflow-x-auto">
        <table className="w-full min-w-[560px] border-collapse text-left text-sm">
          <caption className="sr-only">Body measurements by size</caption>
          <thead>
            <tr className="border-y border-[hsl(var(--border))]">
              {['Size', 'Bust', 'Waist', 'Hip', 'UK'].map((h) => <th key={h} scope="col" className="py-4 mono">{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {sizeGuide.rows.map((r) => (
              <tr key={r.size} className="border-b border-[hsl(var(--border))]">
                <th scope="row" className="serif py-5 text-xl font-normal">{r.size}</th>
                <td className="py-5">{r.bust}</td><td className="py-5">{r.waist}</td><td className="py-5">{r.hip}</td><td className="py-5">{r.uk}</td>
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

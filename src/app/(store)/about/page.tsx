import type { Metadata } from 'next';
import { ContactSection } from '@/components/forms/contact-section';
import { LoziaImage } from '@/components/lozia-image';
import { getSiteSettings } from '@/lib/settings/queries';


export const metadata: Metadata = { title: 'About', description: 'The story and point of view behind LOZIA.', alternates: { canonical: '/about' } };
export const dynamic = 'force-dynamic';

export default async function AboutPage() {
  const s = await getSiteSettings();
  return (
    <main>
      <section className="bg-[hsl(var(--primary))] px-5 py-16 text-[hsl(var(--primary-foreground))] md:px-16 md:py-24">
        <div className="mx-auto grid max-w-[1280px] gap-10 md:grid-cols-[.9fr_1.1fr] md:items-center md:gap-20">
          <div>
            <span className="mono text-[hsl(var(--secondary))]">About LOZIA</span>
            <h1 className="serif mt-7 max-w-[850px] text-6xl leading-[.95] md:text-9xl">Clothing for<br /><i>becoming.</i></h1>
            <p className="mt-8 max-w-[420px] text-base leading-7 text-[hsl(var(--primary-foreground))]/70">An Abuja-born fashion label for the woman becoming more of herself, one considered piece at a time.</p>
          </div>
          <div className="relative aspect-[4/5] overflow-hidden bg-[hsl(var(--muted))]">
            <LoziaImage src={s.siteImages.about_hero.src} alt={s.siteImages.about_hero.alt} fill sizes="(min-width: 768px) 55vw, 100vw" loading="eager" className="object-cover object-top" />
            <div className="absolute inset-0 bg-gradient-to-t from-[hsl(var(--primary))]/45 via-transparent to-transparent" />
            <span className="absolute bottom-4 left-4 bg-[hsl(var(--card))]/90 px-3 py-2 mono text-[9px] text-[hsl(var(--foreground))]">The LOZIA woman</span>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1100px] px-5 py-20 md:grid md:grid-cols-[.8fr_1.2fr] md:gap-28 md:py-32">
        <div>
          <span className="mono text-[hsl(var(--accent))]">Our point of view</span>
          <LoziaImage src={s.siteImages.about_editorial.src} alt={s.siteImages.about_editorial.alt} width={1024} height={1024} className="h-full w-full object-cover object-top" />
        </div>
        <div>
          <p className="serif mt-10 text-4xl leading-tight md:mt-0 md:text-6xl">LOZIA is an Abuja-born fashion label built around a simple belief: what you wear should leave room for who you are.</p>
          <p className="mt-9 max-w-[560px] text-base leading-8 text-[hsl(var(--muted-foreground))]">{s.aboutStory}</p>
          <div className="mt-14 grid gap-8 border-t border-[hsl(var(--border))] pt-7 md:grid-cols-2">
            <div><span className="mono">01 / Abuja</span><p className="mt-3 text-sm leading-6">Our home informs our pace, our warmth, and our instinct for a little drama.</p></div>
            <div><span className="mono">02 / Considered</span><p className="mt-3 text-sm leading-6">Small runs, thoughtful fabrics, and silhouettes that earn their place in your wardrobe.</p></div>
          </div>
        </div>
      </section>

      <ContactSection settings={s} />
    </main>
  );
}

import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, MessageCircle } from 'lucide-react';
import { ContactSection } from '@/components/forms/contact-section';
import { LoziaImage } from '@/components/lozia-image';
import { getSiteSettings } from '@/lib/settings/queries';
import { whatsappHref } from '@/lib/settings/definitions';

export const metadata: Metadata = { title: 'Contact', description: 'Get in touch with the LOZIA studio.', alternates: { canonical: '/contact' } };
export const dynamic = 'force-dynamic';

export default async function ContactPage() {
  const settings = await getSiteSettings();
  return (
    <main>
      <section className="mx-auto max-w-[1200px] px-5 pt-10 pb-10 md:px-10 md:pt-10">
        <span className="mono text-[hsl(var(--accent))]">LOZIA information</span>
        <h1 className="serif mt-5 text-6xl md:text-8xl">Contact.</h1>
        <p className="mt-6 max-w-[520px] text-lg leading-8 text-[hsl(var(--muted-foreground))]">For orders, fittings and questions about a piece, write to us and we will reply as soon as we can.</p>
      </section>

      <section className="grid md:grid-cols-2">
        <div className="relative h-[600px] w-full">
          <LoziaImage src={settings.siteImages.contact_hero.src} alt={settings.siteImages.contact_hero.alt} fill sizes="(min-width: 768px) 50vw, 100vw" className="object-cover" />
        </div>
        <div className="flex items-center bg-[hsl(var(--accent))] p-10 md:p-20">
          <div>
            <h2 className="serif mt-5 text-5xl">Come<br />by.</h2>
            <p className="mt-6 max-w-[320px] text-sm leading-7">Looking for a custom order or a modification to one of our ready-to-wear pieces? Get in touch with us, and we’ll be happy to assist.</p>
            {(settings.studioLocation || settings.studioHours) && <p className="mt-6 text-sm">{settings.studioHours}{settings.studioHours && settings.studioLocation ? <br /> : null}{settings.studioLocation}</p>}
            <div className="mt-8 flex flex-wrap gap-5">
              {settings.contactEmail && <a href={`mailto:${settings.contactEmail}`} className="inline-flex min-h-11 items-center gap-2 border-b border-current pb-2 mono" data-testid="link-email-us">Email us <ArrowRight size={14} aria-hidden="true" /></a>}
            <p>Or use any of the contact methods below ↓</p>
            </div>
          </div>
        </div>
      </section>

      <ContactSection settings={settings} />
    </main>
  );
}

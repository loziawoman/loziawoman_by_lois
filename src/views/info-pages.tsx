import { ArrowRight, Mail, MapPin, MessageCircle } from 'lucide-react';
import Link from 'next/link';
import type { CmsPolicy, CmsSettings } from '@/lib/cms';

const eyebrows: Record<CmsPolicy['id'], string> = {
  shipping: 'The practical details',
  returns: 'The considered choice',
  privacy: 'A quiet promise',
};

export function PolicyPage({ policy }: { policy: CmsPolicy }) {
  return (
    <main className="mx-auto max-w-[1180px] px-5 py-14 md:px-10 md:py-24">
      <div className="grid gap-12 md:grid-cols-[.75fr_1.25fr] md:gap-24">
        <div>
          <span className="mono text-[hsl(var(--accent))]">{eyebrows[policy.id]}</span>
          <h1 className="serif mt-5 text-6xl md:text-8xl">{policy.name.trim()}.</h1>
          <p className="mt-7 max-w-[420px] text-base leading-7 text-[hsl(var(--muted-foreground))]">
            {policy.intro}
          </p>
          <Link href="/contact" className="mt-9 inline-flex items-center gap-3 border-b border-current pb-2 mono">
            Need a hand? Contact the studio <ArrowRight size={14} />
          </Link>
        </div>
        <div className="border-t border-[hsl(var(--border))]">
          {policy.sections.map((section, index) => (
            <section key={`${index}-${section.title}`} className="grid gap-5 border-b border-[hsl(var(--border))] py-8 md:grid-cols-[.4fr_1fr] md:gap-10">
              <span className="mono text-[hsl(var(--muted-foreground))]">{String(index + 1).padStart(2, '0')}</span>
              <div>
                <h2 className="serif text-3xl">{section.title}</h2>
                <p className="mt-4 text-sm leading-7 text-[hsl(var(--muted-foreground))]">{section.body}</p>
              </div>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}

export function ContactPage({ settings }: { settings: CmsSettings }) {
  const studioName = settings.city.split(',')[0]?.trim();
  return (
    <main>
      <section className="bg-[hsl(var(--primary))] px-5 py-20 text-[hsl(var(--primary-foreground))] md:px-16 md:py-32">
        <div className="mx-auto grid max-w-[1200px] gap-12 md:grid-cols-[1fr_.8fr] md:items-end">
          <div>
            <span className="mono text-[hsl(var(--secondary))]">The studio is here</span>
            <h1 className="serif mt-6 max-w-[760px] text-6xl leading-[.92] md:text-9xl">
              Come say <i>hello.</i>
            </h1>
            <p className="mt-8 max-w-[440px] text-base leading-7 text-[hsl(var(--primary-foreground))]/70">
              Questions about a size, a delivery or a piece you have been thinking about? Send us a message and we will reply from {studioName ? `the ${studioName} studio` : 'the studio'}.
            </p>
          </div>
          <div className="border-t border-[hsl(var(--primary-foreground))]/20 pt-6 md:border-l md:border-t-0 md:pl-8 md:pt-0">
            <a href={settings.whatsappUrl} target="_blank" rel="noreferrer" className="flex items-center gap-4 border border-[hsl(var(--secondary))] px-5 py-4 mono text-[hsl(var(--secondary))] transition-colors hover:bg-[hsl(var(--secondary))] hover:text-[hsl(var(--primary))]" data-testid="link-contact-whatsapp">
              <MessageCircle size={19} strokeWidth={1.4} />
              Message us on WhatsApp
              <ArrowRight className="ml-auto" size={15} />
            </a>
            <a href={`mailto:${settings.email}`} className="mt-3 flex items-center gap-4 border border-[hsl(var(--primary-foreground))]/25 px-5 py-4 mono text-[hsl(var(--primary-foreground))]/80 transition-colors hover:border-[hsl(var(--primary-foreground))] hover:text-[hsl(var(--primary-foreground))]" data-testid="link-contact-email">
              <Mail size={18} strokeWidth={1.4} />
              {settings.email}
              <ArrowRight className="ml-auto" size={15} />
            </a>
          </div>
        </div>
      </section>
      <section className="mx-auto grid max-w-[1200px] gap-10 px-5 py-16 md:grid-cols-3 md:px-10 md:py-24">
        <div>
          <MapPin className="text-[hsl(var(--accent))]" size={22} strokeWidth={1.2} />
          <h2 className="serif mt-5 text-3xl">Visit the studio.</h2>
          <p className="mt-3 text-sm leading-7 text-[hsl(var(--muted-foreground))]">{settings.city}<br />{settings.hours}</p>
        </div>
        <div>
          <MessageCircle className="text-[hsl(var(--accent))]" size={22} strokeWidth={1.2} />
          <h2 className="serif mt-5 text-3xl">WhatsApp.</h2>
          <p className="mt-3 text-sm leading-7 text-[hsl(var(--muted-foreground))]">{settings.whatsappDisplay}<br />Replies during studio hours.</p>
        </div>
        <div>
          <Mail className="text-[hsl(var(--accent))]" size={22} strokeWidth={1.2} />
          <h2 className="serif mt-5 text-3xl">Email.</h2>
          <p className="mt-3 text-sm leading-7 text-[hsl(var(--muted-foreground))]">{settings.email}<br />For order and studio enquiries.</p>
        </div>
      </section>
    </main>
  );
}
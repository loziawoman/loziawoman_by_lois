import { MessageCircle } from 'lucide-react';
import { whatsappHref } from '@/lib/settings/definitions';
import type { SiteSettings } from '@/types';
import { ContactForm } from './contact-form';

export function ContactSection({ settings }: { settings: SiteSettings }) {
  return (
    <section id="contact" className="scroll-mt-20 border-t border-[hsl(var(--border))] bg-[hsl(var(--muted))] px-5 py-20 md:px-10 md:py-28">
      <div className="mx-auto grid max-w-[1200px] gap-12 md:grid-cols-[.8fr_1.2fr]">
        <div>
          <span className="mono text-[hsl(var(--accent))]">Let’s connect</span>
          <h2 className="serif mt-4 text-6xl">Come say<br /><i>hello.</i></h2>
          <ul className="mt-8 space-y-2 text-sm text-[hsl(var(--muted-foreground))]">
            {settings.contactEmail && <li>Email · <a className="underline-link" href={`mailto:${settings.contactEmail}`}>{settings.contactEmail}</a></li>}
            {settings.instagramUrl && <li>Instagram · <a className="underline-link" href={settings.instagramUrl} target="_blank" rel="noopener noreferrer">Follow us</a></li>}
            {settings.tiktokUrl && <li>TikTok · <a className="underline-link" href={settings.tiktokUrl} target="_blank" rel="noopener noreferrer">Follow us</a></li>}
            {settings.studioLocation && <li>{settings.studioLocation}</li>}
            {settings.studioHours && <li>{settings.studioHours}</li>}
          </ul>
          <a href={whatsappHref(settings.whatsappNumber, settings.whatsappMessage)} target="_blank" rel="noopener noreferrer" className="mt-8 inline-flex min-h-12 items-center gap-3 border border-[hsl(var(--primary))] px-5 py-3 mono transition-colors hover:bg-[hsl(var(--primary))] hover:text-[hsl(var(--primary-foreground))]" data-testid="link-contact-section-whatsapp">
            <MessageCircle size={16} aria-hidden="true" /> Message on WhatsApp
          </a>
        </div>
        <ContactForm />
      </div>
    </section>
  );
}

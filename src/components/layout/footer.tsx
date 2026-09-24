import Link from 'next/link';
import { Instagram, Mail } from 'lucide-react';
import { LoziaImage } from '@/components/lozia-image';
import type { SiteSettings } from '@/types';
import { whatsappHref } from '@/lib/settings/definitions';

const link = 'inline-block py-1';

export function Footer({ settings }: { settings: SiteSettings }) {
  return (
    <footer className="bg-[hsl(var(--primary))] px-5 py-14 text-[hsl(var(--primary-foreground))] md:px-10">
      <div className="mx-auto grid max-w-[1440px] gap-12 md:grid-cols-[1.5fr_1fr_1fr_1.2fr]">
        <div>
          <Link
            href="/"
            className="flex items-center gap-1"
            data-testid="link-logo"
          >
          <LoziaImage src={settings.siteImages.logo.src} alt={settings.siteImages.logo.alt} width={36} height={36} className="h-7 w-7 rounded-full object-cover object-center" data-testid="img-brand-logo" />
            <span className="serif text-[25px] text-[hsl(var(--primary-foreground))]/65 tracking-[.24em]">OZIA</span>
          </Link>
          <p className="mt-4 max-w-[260px] text-sm leading-6 text-[hsl(var(--primary-foreground))]/65">
            {settings.tagline}
            {settings.studioLocation ? <><br />{settings.studioLocation}</> : null}
          </p>
        </div>
        <nav aria-label="Discover">
          <span className="mono text-[hsl(var(--secondary))]">Discover</span>
          <div className="mt-4 flex flex-col text-sm text-[hsl(var(--primary-foreground))]/75">
            <Link className={link} href="/shop" data-testid="footer-link-shop">Shop all</Link>
            <Link className={link} href="/about" data-testid="footer-link-about">Our story</Link>
            <Link className={link} href="/contact" data-testid="footer-link-contact">Contact</Link>
            <Link className={link} href="/size-guide" data-testid="footer-link-size">Size guide</Link>
          </div>
        </nav>
        <nav aria-label="Customer care">
          <span className="mono text-[hsl(var(--secondary))]">Care</span>
          <div className="mt-4 flex flex-col text-sm text-[hsl(var(--primary-foreground))]/75">
            <Link className={link} href="/shipping" data-testid="footer-link-shipping">Shipping</Link>
            <Link className={link} href="/returns" data-testid="footer-link-returns">Returns</Link>
            <Link className={link} href="/track-order" data-testid="footer-link-track">Track an order</Link>
            <Link className={link} href="/privacy" data-testid="footer-link-privacy">Privacy</Link>
            <Link className={link} href="/terms" data-testid="footer-link-terms">Terms</Link>
          </div>
        </nav>
        <div>
          <span className="mono text-[hsl(var(--secondary))]">Stay close</span>
          <div className="mt-4 flex flex-col gap-1 text-sm text-[hsl(var(--primary-foreground))]/75">
            {settings.instagramUrl && <a className={`${link} inline-flex items-center gap-2`} href={settings.instagramUrl} target="_blank" rel="noopener noreferrer"><Instagram size={15} aria-hidden="true" /> Instagram</a>}
            {settings.tiktokUrl && <a className={link} href={settings.tiktokUrl} target="_blank" rel="noopener noreferrer">TikTok</a>}
            {settings.contactEmail && <a className={`${link} inline-flex items-center gap-2`} href={`mailto:${settings.contactEmail}`}><Mail size={15} aria-hidden="true" /> {settings.contactEmail}</a>}
            <a className={link} href={whatsappHref(settings.whatsappNumber, settings.whatsappMessage)} target="_blank" rel="noopener noreferrer">WhatsApp</a>
          </div>
        </div>
      </div>
      <p className="mx-auto mt-12 max-w-[1440px] border-t border-[hsl(var(--primary-foreground))]/15 pt-6 text-xs text-[hsl(var(--primary-foreground))]/50">
        © {new Date().getFullYear()} {settings.brandName} • <a className={link} href="https://nex.is-a.dev" target="_blank" rel="noopener noreferrer">Powered by Nezer</a></p>
    </footer>
  );
}

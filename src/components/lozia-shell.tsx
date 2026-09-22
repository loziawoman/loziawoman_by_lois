'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowRight, ChevronDown, ChevronUp, Menu, MessageCircle, Minus, Plus, Search, ShoppingBag, X } from 'lucide-react';
import { LoziaImage } from '@/components/lozia-image';
import { naira } from '@/data/products';
import { useBag } from '@/hooks/use-store';
import { useCmsWorkspace } from '@/hooks/use-cms';

export function Header() {
  const bag = useBag();
  const location = usePathname();
  const [menu, setMenu] = useState(false);

  return (
    <header className="relative z-30 border-b border-[hsl(var(--border))] bg-[hsl(var(--background))]/95 backdrop-blur">
      <div className="mx-auto grid h-[74px] max-w-[1440px] grid-cols-2 items-center px-5 md:grid-cols-3 md:px-10">

        {/* LEFT — LOGO */}
        <div className="flex items-center">
          <Link
            href="/"
            className="flex items-center gap-1"
            data-testid="link-logo"
          >
            <LoziaImage
              src="/images/logo-nav.jpeg"
              alt="LOZIA"
              width={44}
              height={36}
              className="h-8 w-8 rounded-full object-cover"
            />

            <span className="serif text-[28px] tracking-[.24em]">
              OZIA
            </span>
          </Link>
        </div>

        {/* CENTER — DESKTOP NAVIGATION */}
        <nav
          className="hidden items-center justify-center gap-8 md:flex"
          aria-label="Primary navigation"
        >
          <Link
            className={`mono underline-link ${
              location === "/shop"
                ? "text-[hsl(var(--accent))]"
                : ""
            }`}
            href="/shop"
            data-testid="link-shop"
          >
            Shop
          </Link>

          <Link
            className={`mono underline-link ${
              location === "/about"
                ? "text-[hsl(var(--accent))]"
                : ""
            }`}
            href="/about"
            data-testid="link-about"
          >
            About
          </Link>

          <Link
            className={`mono underline-link ${
              location === "/contact"
                ? "text-[hsl(var(--accent))]"
                : ""
            }`}
            href="/contact"
            data-testid="link-contact"
          >
            Contact
          </Link>
        </nav>

        {/* RIGHT — DESKTOP SEARCH + BAG / MOBILE HAMBURGER */}
        <div className="flex items-center justify-end gap-4">

          {/* Desktop search */}
          <Link
            href="/shop"
            aria-label="Search"
            data-testid="link-search"
            className="hidden md:block"
          >
            <Search size={19} strokeWidth={1.3} />
          </Link>

          {/* Desktop bag */}
          <button
            onClick={() => bag.setOpen(true)}
            className="relative hidden items-center gap-2 mono md:flex"
            aria-label="Open shopping bag"
            data-testid="button-open-bag"
          >
            <span>Bag</span>

            <ShoppingBag
              size={20}
              strokeWidth={1.3}
            />

            {bag.count > 0 && (
              <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-[hsl(var(--accent))] px-1 text-[9px] text-white">
                {bag.count}
              </span>
            )}
          </button>

          {/* Mobile hamburger — RIGHT */}
          <button
            className="md:hidden"
            onClick={() => setMenu(!menu)}
            aria-label={menu ? "Close menu" : "Open menu"}
            data-testid="button-open-menu"
          >
            {menu ? (
              <X size={23} strokeWidth={1.3} />
            ) : (
              <Menu size={23} strokeWidth={1.3} />
            )}
          </button>
        </div>
      </div>

      {/* MOBILE MENU */}
      {menu && (
        <div className="border-t border-[hsl(var(--border))] px-5 py-7 md:hidden">
          <div className="flex flex-col gap-5">

            {/* Shop */}
            <Link
              className="serif text-9px"
              href="/shop"
              onClick={() => setMenu(false)}
              data-testid="mobile-link-shop"
            >
              Shop
            </Link>

            {/* About */}
            <Link
              className="serif text-9px"
              href="/about"
              onClick={() => setMenu(false)}
              data-testid="mobile-link-about"
            >
              About
            </Link>

            {/* Contact */}
            <Link
              className="serif text-9px"
              href="/contact"
              onClick={() => setMenu(false)}
              data-testid="mobile-link-contact"
            >
              Contact
            </Link>

            {/* Search */}
            <Link
              className="flex items-center gap-3 serif text-9px"
              href="/shop"
              onClick={() => setMenu(false)}
              data-testid="mobile-link-search"
            >
              <Search size={21} strokeWidth={1.3} />
              Search
            </Link>

            {/* Bag */}
            <button
              className="flex items-center gap-3 serif text-2xl text-left"
              onClick={() => {
                setMenu(false);
                bag.setOpen(true);
              }}
              aria-label="Open shopping bag"
              data-testid="mobile-button-bag"
            >
              <span className="relative">
                <ShoppingBag size={21} strokeWidth={1.3} />

                {bag.count > 0 && (
                  <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-[hsl(var(--accent))] px-1 text-[9px] text-white">
                    {bag.count}
                  </span>
                )}
              </span>

              Bag
            </button>

          </div>
        </div>
      )}
    </header>
  );
}

export function BagDrawer() {
  const bag = useBag();
  return <>
    {bag.open && <button aria-label="Close bag overlay" onClick={() => bag.setOpen(false)} className="fixed inset-0 z-40 bg-[hsl(var(--foreground))]/30" data-testid="button-close-bag-overlay" />}
    <aside className={`fixed right-0 top-0 z-50 flex h-[100dvh] w-full max-w-[450px] flex-col bg-[hsl(var(--card))] shadow-2xl transition-transform duration-300 ${bag.open ? 'translate-x-0' : 'translate-x-full'}`} aria-label="Shopping bag">
      <div className="flex items-center justify-between border-b border-[hsl(var(--border))] px-6 py-5"><div><span className="mono text-[hsl(var(--muted-foreground))]">Your edit</span><h2 className="serif mt-1 text-3xl">Shopping bag</h2></div><button onClick={() => bag.setOpen(false)} aria-label="Close shopping bag" data-testid="button-close-bag"><X size={21} strokeWidth={1.3} /></button></div>
      {bag.items.length === 0 ? <div className="flex flex-1 flex-col items-center justify-center px-10 text-center"><div className="mb-5 text-[hsl(var(--accent))]"><ShoppingBag size={42} strokeWidth={.8} /></div><h3 className="serif text-2xl">Nothing here yet.</h3><p className="mt-2 max-w-[240px] text-sm text-[hsl(var(--muted-foreground))]">Take your time. The collection is waiting.</p><Link href="/shop" onClick={() => bag.setOpen(false)} className="mt-7 border border-[hsl(var(--primary))] px-6 py-3 mono transition-colors hover:bg-[hsl(var(--primary))] hover:text-[hsl(var(--primary-foreground))]" data-testid="link-bag-shop">Explore the collection</Link></div> : <><div className="flex-1 overflow-y-auto px-6 py-4">{bag.items.map((item,index) => <div key={item.variantId} className="flex gap-4 border-b border-[hsl(var(--border))] py-5" data-testid={`row-bag-item-${item.productId}`}><div className="relative h-32 w-24 shrink-0 bg-[hsl(var(--muted))]"><LoziaImage src={item.image} alt={item.productName} fill sizes="96px" className="object-cover" /></div><div className="min-w-0 flex-1"><div className="flex justify-between gap-2"><div><p className="serif text-lg">{item.productName}</p><p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">{item.selectedColour} · {item.selectedSize}</p></div><button onClick={() => bag.remove(index)} className="text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]" aria-label={`Remove ${item.productName}`} data-testid={`button-remove-${item.productId}`}><X size={15} /></button></div><div className="mt-5 flex items-center justify-between"><div className="flex items-center border border-[hsl(var(--border))]"><button className="p-1.5" onClick={() => bag.update(index,item.quantity-1)} aria-label="Decrease quantity" data-testid={`button-decrease-${item.productId}`}><Minus size={13}/></button><span className="px-2 text-xs">{item.quantity}</span><button className="p-1.5" onClick={() => bag.update(index,item.quantity+1)} aria-label="Increase quantity" data-testid={`button-increase-${item.productId}`}><Plus size={13}/></button></div><span className="text-sm">{naira(item.unitPrice * item.quantity)}</span></div></div></div>)}</div><div className="border-t border-[hsl(var(--border))] px-6 py-6"><div className="flex justify-between"><span className="mono">Subtotal</span><span>{naira(bag.subtotal)}</span></div><p className="mt-2 text-xs text-[hsl(var(--muted-foreground))]">Delivery calculated at checkout.</p><Link href="/checkout" onClick={() => bag.setOpen(false)} className="mt-6 flex items-center justify-center gap-3 bg-[hsl(var(--primary))] px-5 py-4 mono text-[hsl(var(--primary-foreground))] hover:bg-[hsl(var(--accent))]" data-testid="link-checkout">Continue to checkout <ArrowRight size={15}/></Link></div></>}
    </aside>
  </>;
}

export function Footer() {
  const { settings } = useCmsWorkspace();
  return <footer className="bg-[hsl(var(--primary))] px-5 py-14 text-[hsl(var(--primary-foreground))] md:px-10">
    <div className="mx-auto grid max-w-[1440px] gap-12 md:grid-cols-[1.5fr_1fr_1fr_1.2fr]">
      <div>
        <Link
          href="/"
          className="flex items-center gap-1"
          data-testid="link-logo"
        >
        <LoziaImage
          src="/images/logo-nav.jpeg"
          alt="LOZIA"
          width={44}
          height={36}
          className="h-8 w-8 rounded-full object-cover"
        />

        <span className="serif text-[28px] tracking-[.24em] text-[hsl(var(--muted))]">
          OZIA
        </span>
        </Link>
        <p className="mt-4 max-w-[245px] text-sm leading-6 text-[hsl(var(--primary-foreground))]/65">{settings.footerLine}<br />Designed in Abuja. Made for everywhere.</p>
      </div>
      <div>
        <span className="mono text-[hsl(var(--secondary))]">Discover</span>
        <div className="mt-4 flex flex-col gap-3 text-sm text-[hsl(var(--primary-foreground))]/75">
          <Link href="/shop" data-testid="footer-link-shop">Shop all</Link>
          <Link href="/about" data-testid="footer-link-about">Our story</Link>
          <Link href="/contact" data-testid="footer-link-contact">Contact</Link>
          <Link href="/size-guide" data-testid="footer-link-size">Size guide</Link>
        </div>
      </div>
      <div>
        <span className="mono text-[hsl(var(--secondary))]">Care</span>
        <div className="mt-4 flex flex-col gap-3 text-sm text-[hsl(var(--primary-foreground))]/75">
          <Link href="/shipping" data-testid="footer-link-shipping">Shipping</Link>
          <Link href="/returns" data-testid="footer-link-returns">Returns</Link>
          <Link href="/privacy" data-testid="footer-link-privacy">Privacy</Link>
        </div>
      </div>
      <div>
        <span className="mono text-[hsl(var(--secondary))]">Stay close</span>
        <p className="mt-4 text-sm leading-6 text-[hsl(var(--primary-foreground))]/65">Notes on new pieces, studio days and things worth keeping.</p>
        <div className="mt-4 flex border-b border-[hsl(var(--primary-foreground))]/35 pb-2">
          <input className="w-full bg-transparent text-sm outline-none placeholder:text-[hsl(var(--primary-foreground))]/40" placeholder="Your email address" aria-label="Email address" data-testid="input-newsletter" />
          <button aria-label="Subscribe" data-testid="button-subscribe"><ArrowRight size={16} /></button>
        </div>
      </div>
    </div>
  </footer>;
}

export function WhatsAppFloat() {
  const { settings } = useCmsWorkspace();
  return <a href={settings.whatsappUrl} target="_blank" rel="noreferrer" className="fixed bottom-5 right-5 z-30 inline-flex items-center gap-2 rounded-full bg-[#2f6f55] px-4 py-3 text-xs text-white shadow-lg transition-transform hover:-translate-y-0.5" data-testid="floating-whatsapp"><MessageCircle size={17} strokeWidth={1.5} /><span className="hidden sm:inline">WhatsApp us</span></a>;
}

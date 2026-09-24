'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, ShoppingBag, X } from 'lucide-react';
import { LoziaImage } from '@/components/lozia-image';
import { useCart } from '@/hooks/use-cart';
import { useWishlist } from '@/hooks/use-wishlist';

const links = [
  { href: '/shop', label: 'Shop' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
  { href: '/#reviews', label: 'Reviews' },
];

function HeartIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden="true">
      <path d="M20.8 8.9c0 5.5-8.8 10.3-8.8 10.3S3.2 14.4 3.2 8.9A5.1 5.1 0 0 1 12 5.6a5.1 5.1 0 0 1 8.8 3.3Z" />
    </svg>
  );
}

function Logo({ logo, onClick }: { logo: string; onClick?: () => void }) {
  return (
    <Link href="/" onClick={onClick} className="flex items-center gap-1" data-testid="link-logo">
      <LoziaImage src={logo} alt="Logo" width={44} height={36} className="h-7 w-7 rounded-full object-cover object-center" />
      <span className="serif text-[25px] tracking-[.24em]">OZIA</span>
    </Link>
  );
}

export function Header({ brandName, logo }: { brandName: string; logo: string }) {
  const cart = useCart();
  const wishlist = useWishlist();
  const pathname = usePathname();
  const [menu, setMenu] = useState(false);

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-[hsl(var(--border))] bg-[hsl(var(--background))]/95 backdrop-blur">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:bg-[hsl(var(--card))] focus:px-4 focus:py-2"
      >
        Skip to content
      </a>

      <div className="mx-auto grid h-[74px] max-w-[1440px] grid-cols-2 items-center px-5 md:grid-cols-3 md:px-10">
        {/* LEFT — LOGO */}
        <div className="flex items-center">
          <span className="sr-only">{brandName}</span>
          <Logo logo={logo} />
        </div>

        {/* CENTER — DESKTOP NAVIGATION */}
        <nav
          className="hidden items-center justify-center gap-8 md:flex"
          aria-label="Primary navigation"
        >
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={
                pathname === link.href ? "page" : undefined
              }
              className={`mono underline-link ${
                pathname === link.href
                  ? "text-[hsl(var(--accent))]"
                  : ""
              }`}
              data-testid={`link-${link.label.toLowerCase()}`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* RIGHT — DESKTOP SEARCH + BAG / MOBILE HAMBURGER */}
        <div className="flex items-center justify-end gap-4">

          {/* Desktop favorites */}
          <Link
            href="/wishlist"
            className="relative hidden items-center gap-2 mono md:flex"
            aria-label={`Open favorites${wishlist.count > 0 ? `, ${wishlist.count} saved` : ''}`}
            data-testid="header-wishlist"
          >
            <span>Favorites</span>
            <span className="relative">
              <HeartIcon />
              {wishlist.count > 0 && (
                <span
                  aria-hidden="true"
                  className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-[hsl(var(--accent))] px-1 text-[9px] text-white"
                >
                  {wishlist.count}
                </span>
              )}
            </span>
          </Link>

          {/* Desktop bag */}
          <button
            onClick={() => cart.setOpen(true)}
            className="relative hidden items-center gap-2 mono md:flex"
            aria-label={`Open shopping bag${
              cart.count > 0
                ? `, ${cart.count} ${
                    cart.count === 1 ? "item" : "items"
                  }`
                : ""
            }`}
            data-testid="button-open-bag"
          >
            <span>Bag</span>

            <ShoppingBag size={20} strokeWidth={1.3} />

            {cart.count > 0 && (
              <span
                aria-hidden="true"
                className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-[hsl(var(--accent))] px-1 text-[9px] text-white"
              >
                {cart.count}
              </span>
            )}
          </button>

          {/* Mobile hamburger — RIGHT */}
          <button
            className="md:hidden"
            onClick={() => setMenu(!menu)}
            aria-label={menu ? "Close menu" : "Open menu"}
            aria-expanded={menu}
            aria-controls="mobile-menu"
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
        <nav
          id="mobile-menu"
          aria-label="Mobile navigation"
          className="border-t border-[hsl(var(--border))] px-5 py-7 md:hidden"
        >
          <div className="flex flex-col gap-5">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenu(false)}
                className="serif text-9px"
                data-testid={`mobile-link-${link.label.toLowerCase()}`}
              >
                {link.label}
              </Link>
            ))}

            <Link
              href="/wishlist"
              onClick={() => setMenu(false)}
              className="flex items-center gap-3 serif text-9px"
              data-testid="mobile-link-favorites"
            >
              <span className="relative">
                <HeartIcon />
                {wishlist.count > 0 && (
                  <span
                    aria-hidden="true"
                    className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-[hsl(var(--accent))] px-1 text-[9px] text-white"
                  >
                    {wishlist.count}
                  </span>
                )}
              </span>
              Favorites
            </Link>

            {/* Bag */}
            <button
              className="flex items-center gap-3 serif text-9px text-left"
              onClick={() => {
                setMenu(false);
                cart.setOpen(true);
              }}
              aria-label={`Open shopping bag${
                cart.count > 0
                  ? `, ${cart.count} ${
                      cart.count === 1 ? "item" : "items"
                    }`
                  : ""
              }`}
              data-testid="mobile-button-bag"
            >
              <span className="relative">
                <ShoppingBag size={21} strokeWidth={1.3} />

                {cart.count > 0 && (
                  <span
                    aria-hidden="true"
                    className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-[hsl(var(--accent))] px-1 text-[9px] text-white"
                  >
                    {cart.count}
                  </span>
                )}
              </span>

              Bag
            </button>
          </div>
        </nav>
      )}
    </header>
  );
}

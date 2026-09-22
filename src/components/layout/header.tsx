'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, Search, ShoppingBag, X } from 'lucide-react';
import { LoziaImage } from '@/components/lozia-image';
import { useCart } from '@/hooks/use-cart';

const links = [
  { href: '/shop', label: 'Shop' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
];

function Logo({ onClick }: { onClick?: () => void }) {
  return (
    <Link href="/" onClick={onClick} className="flex items-center gap-1" data-testid="link-logo">
      <LoziaImage src="/images/logo-nav.jpeg" alt="Logo" width={44} height={36} className="h-7 w-7 rounded-full object-cover object-center" />
      <span className="serif text-[25px] tracking-[.24em]">OZIA</span>
    </Link>
  );
}

export function Header({ brandName }: { brandName: string }) {
  const cart = useCart();
  const pathname = usePathname();
  const [menu, setMenu] = useState(false);

  return (
    <header className="relative z-30 border-b border-[hsl(var(--border))] bg-[hsl(var(--background))]/95 backdrop-blur">
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
          <Logo />
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

            {/* Search */}
            <Link
              href="/shop"
              onClick={() => setMenu(false)}
              className="flex items-center gap-3 serif text-9px"
              data-testid="mobile-link-search"
            >
              <Search size={21} strokeWidth={1.3} />
              Search
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

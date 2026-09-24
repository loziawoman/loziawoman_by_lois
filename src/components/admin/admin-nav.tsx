'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LoziaImage } from '@/components/lozia-image';
import { Menu, X } from 'lucide-react';
import { apiRequest } from '@/lib/api/client';

export type NavItem = { href: string; label: string };

export function AdminNav({ items, email, role }: { items: NavItem[]; email: string; role: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const signOut = async () => {
    await apiRequest('/api/auth/logout', { method: 'POST' });
    router.replace('/admin/login');
    router.refresh();
  };

  const links = (
    <nav aria-label="Admin" className="grid gap-1">
      {items.map((item) => {
        const active = item.href === '/admin' ? pathname === '/admin' : pathname.startsWith(item.href);
        return (
          <Link key={item.href} href={item.href} onClick={() => setOpen(false)} aria-current={active ? 'page' : undefined}
            className={`flex min-h-11 items-center px-3 text-sm ${active ? 'bg-[hsl(var(--muted-foreground))] text-[hsl(var(--primary-foreground))]' : 'hover:bg-[hsl(var(--muted))]'}`}>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <>
      <div className="flex items-center justify-between border-b border-[hsl(var(--border))] bg-[hsl(var(--card))] px-4 py-3 md:hidden">
        <Link href="/" className="flex items-center gap-1" data-testid="link-logo">
          <LoziaImage src="/images/logo-nav.jpeg" alt="Logo" width={36} height={36} className="h-5 w-5 rounded-full object-cover object-center" />
          <span className="serif text-xl tracking-[.2em]">OZIA</span>
        </Link>
        <button onClick={() => setOpen(!open)} aria-expanded={open} aria-controls="admin-menu" aria-label={open ? 'Close menu' : 'Open menu'} className="flex h-11 w-11 items-center justify-center">
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>
      <aside id="admin-menu" className={`${open ? 'block' : 'hidden'} border-b border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 md:fixed md:inset-y-0 md:left-0 md:z-40 md:fixed md:inset-y-0 md:left-0 md:z-40 md:block md:w-60 md:overflow-y-auto md:overflow-y-auto md:shrink-0 md:border-b-0 md:border-r`}>
        <Link href="/" className="flex items-center gap-1" data-testid="link-logo">
          <LoziaImage src="/images/logo-nav.jpeg" alt="Logo" width={44} height={36} className="h-7 w-7 mb-6 hidden md:block rounded-full object-cover object-center" />
          <span className="serif mb-6 hidden text-2xl tracking-[.2em] md:block">OZIA</span>
        </Link>
        {links}
        <div className="mt-8 border-t border-[hsl(var(--border))] pt-4 text-xs">
          <p className="truncate" title={email}>{email}</p>
          <p className="mono mt-1 text-[hsl(var(--muted-foreground))]">{role.replace('_', ' ')}</p>
          <button onClick={signOut} className="mono mt-3 min-h-10 underline-link" data-testid="button-sign-out">Sign out</button>
        </div>
      </aside>
    </>
  );
}

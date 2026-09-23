'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { Minus, Plus, ShoppingBag, X } from 'lucide-react';
import { LoziaImage } from '@/components/lozia-image';
import { useCart } from '@/hooks/use-cart';
import { MAX_LINE_QUANTITY } from '@/lib/cart/cart';
import { naira } from '@/lib/format';
import { track } from '@/lib/analytics';

export function CartDrawer() {
  const cart = useCart();
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!cart.open) return;
    closeRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') cart.setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [cart]);

  return (
    <>
      {cart.open && (
        <button aria-label="Close bag" tabIndex={-1} onClick={() => cart.setOpen(false)} className="fixed inset-0 z-40 bg-[hsl(var(--foreground))]/30" data-testid="button-close-bag-overlay" />
      )}
      <aside
        role="dialog"
        aria-modal={cart.open}
        aria-label="Shopping bag"
        aria-hidden={!cart.open}
        inert={!cart.open}
        className={`fixed right-0 top-0 z-50 flex h-[100dvh] w-full max-w-[450px] flex-col bg-[hsl(var(--card))] shadow-2xl transition-transform duration-300 motion-reduce:transition-none ${cart.open ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="flex items-center justify-between border-b border-[hsl(var(--border))] px-6 py-5">
          <div>
            <span className="mono text-[hsl(var(--muted-foreground))]">Your edit</span>
            <h2 className="serif mt-1 text-3xl">Shopping bag</h2>
          </div>
          <button ref={closeRef} onClick={() => cart.setOpen(false)} aria-label="Close shopping bag" className="flex h-11 w-11 items-center justify-center" data-testid="button-close-bag">
            <X size={21} strokeWidth={1.3} />
          </button>
        </div>

        {cart.items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-10 text-center">
            <div className="mb-5 text-[hsl(var(--accent))]"><ShoppingBag size={42} strokeWidth={0.8} /></div>
            <h3 className="serif text-2xl">Nothing here yet.</h3>
            <p className="mt-2 max-w-[240px] text-sm text-[hsl(var(--muted-foreground))]">Take your time. The collection is waiting.</p>
            <Link href="/shop" onClick={() => cart.setOpen(false)} className="mt-7 border border-[hsl(var(--primary))] px-6 py-3 mono transition-colors hover:bg-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--muted))]" data-testid="link-bag-shop">
              Explore the collection
            </Link>
          </div>
        ) : (
          <>
            <ul className="flex-1 overflow-y-auto px-6 py-4">
              {cart.items.map((item) => (
                <li key={item.variantId} className="flex gap-4 border-b border-[hsl(var(--border))] py-5" data-testid={`row-bag-item-${item.variantId}`}>
                  <div className="relative h-32 w-24 shrink-0 bg-[hsl(var(--muted))]">
                    <LoziaImage src={item.image} alt={item.name} fill sizes="96px" className="object-cover" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex justify-between gap-2">
                      <div>
                        <Link href={`/shop/${item.slug}`} onClick={() => cart.setOpen(false)} className="serif text-lg">{item.name}</Link>
                        <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">{item.colourName} · {item.sizeName}</p>
                      </div>
                      <button onClick={() => cart.remove(item.variantId)} className="flex h-9 w-9 items-center justify-center text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]" aria-label={`Remove ${item.name}`} data-testid={`button-remove-${item.variantId}`}>
                        <X size={16} />
                      </button>
                    </div>
                    <div className="mt-5 flex items-center justify-between">
                      <div className="flex items-center border border-[hsl(var(--border))]">
                        <button onClick={() => cart.update(item.variantId, item.quantity - 1)} className="flex h-11 w-11 items-center justify-center" aria-label={`Decrease quantity of ${item.name}`}><Minus size={14} /></button>
                        <span className="w-8 text-center text-sm" aria-live="polite">{item.quantity}</span>
                        <button onClick={() => cart.update(item.variantId, item.quantity + 1)} disabled={item.quantity >= MAX_LINE_QUANTITY} className="flex h-11 w-11 items-center justify-center disabled:opacity-30" aria-label={`Increase quantity of ${item.name}`}><Plus size={14} /></button>
                      </div>
                      <span className="text-sm">{naira(item.unitPrice * item.quantity)}</span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            <div className="border-t border-[hsl(var(--border))] px-6 py-6">
              <div className="flex justify-between text-sm"><span>Subtotal</span><span>{naira(cart.subtotal)}</span></div>
              <p className="mt-2 text-xs text-[hsl(var(--muted-foreground))]">Delivery is calculated at checkout. Final prices are confirmed when you place your order.</p>
              <Link href="/checkout" onClick={() => { cart.setOpen(false); track({ name: 'checkout_started', props: { items: cart.count } }); }} className="mt-5 flex w-full items-center justify-center bg-[hsl(var(--muted-foreground))] px-6 py-4 mono text-[hsl(var(--primary-foreground))]" data-testid="link-checkout">
                Checkout
              </Link>
            </div>
          </>
        )}
      </aside>
    </>
  );
}

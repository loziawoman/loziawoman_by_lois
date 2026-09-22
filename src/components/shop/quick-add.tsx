'use client';

import { useEffect, useMemo, useState } from 'react';
import { X } from 'lucide-react';
import { useCart } from '@/hooks/use-cart';
import { findVariant, initialSelection, isPurchasable, isSizeAvailable, selectColour } from '@/lib/products/variants';
import { track } from '@/lib/analytics';
import type { Product } from '@/types';

export function QuickAdd({ product, onClose }: { product: Product; onClose: () => void }) {
  const cart = useCart();
  const [selection, setSelection] = useState(() => initialSelection(product.variants, product.colours, product.sizes));
  const variant = useMemo(() => findVariant(product.variants, selection.colourId, selection.sizeId), [product.variants, selection]);
  const colour = product.colours.find((c) => c.id === selection.colourId);
  const size = product.sizes.find((s) => s.id === selection.sizeId);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const add = () => {
    if (!isPurchasable(variant) || !colour || !size) return;
    cart.add({
      variantId: variant.id, productId: product.id, slug: product.slug, name: product.name, colourName: colour.name, sizeName: size.name,
      unitPrice: variant.price, quantity: 1, image: product.images[0]?.src ?? '',
    });
    track({ name: 'add_to_cart', props: { slug: product.slug, quantity: 1 } });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-[hsl(var(--foreground))]/35 p-0 sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-label={`Quick add ${product.name}`}>
      <div className="w-full max-w-[420px] bg-[hsl(var(--card))] p-6">
        <div className="flex items-start justify-between">
          <h2 className="serif text-2xl">{product.name}</h2>
          <button onClick={onClose} aria-label="Close quick add" className="flex h-11 w-11 items-center justify-center"><X size={20} /></button>
        </div>

        <fieldset className="mt-5">
          <legend className="mono">Colour: {colour?.name}</legend>
          <div className="mt-3 flex flex-wrap gap-3">
            {product.colours.map((c) => (
              <button
                key={c.id} type="button" onClick={() => setSelection(selectColour(product.variants, product.sizes, selection, c.id))}
                aria-label={c.name} aria-pressed={c.id === selection.colourId}
                className={`h-11 w-11 rounded-full border-2 ${c.id === selection.colourId ? 'border-[hsl(var(--foreground))]' : 'border-transparent'} p-1`}
              >
                <span className="block h-full w-full rounded-full border border-[hsl(var(--border))]" style={{ background: c.hex }} />
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset className="mt-5">
          <legend className="mono">Size</legend>
          <div className="mt-3 flex flex-wrap gap-2">
            {product.sizes.map((s) => {
              const available = isSizeAvailable(product.variants, selection.colourId, s.id);
              return (
                <button
                  key={s.id} type="button" disabled={!available} aria-pressed={s.id === selection.sizeId}
                  aria-label={available ? s.name : `${s.name}, sold out`}
                  onClick={() => setSelection({ ...selection, sizeId: s.id })}
                  className={`h-11 min-w-11 border px-3 text-sm ${s.id === selection.sizeId ? 'border-[hsl(var(--primary))] bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]' : 'border-[hsl(var(--border))]'} disabled:text-[hsl(var(--muted-foreground))]/50 disabled:line-through`}
                >
                  {s.name}
                </button>
              );
            })}
          </div>
        </fieldset>

        <button onClick={add} disabled={!isPurchasable(variant)} className="mt-7 w-full bg-[hsl(var(--primary))] px-6 py-4 mono text-[hsl(var(--primary-foreground))] disabled:opacity-40" data-testid="button-quick-add-confirm">
          {isPurchasable(variant) ? 'Add to bag' : 'Unavailable'}
        </button>
      </div>
    </div>
  );
}

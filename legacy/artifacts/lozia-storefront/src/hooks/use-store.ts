import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Product } from '@/data/products';

export type BagItem = {
  product: Product;
  productId: string;
  productName: string;
  colour: string;
  size: string;
  selectedColour: string;
  selectedSize: string;
  variantId: string;
  quantity: number;
  unitPrice: number;
  image: string;
};
const KEY = 'lozia-bag';

export function useBag() {
  const [items, setItems] = useState<BagItem[]>(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(KEY) || '[]') as Partial<BagItem>[];
      return stored.map((item) => {
        const product = item.product as Product;
        const colour = item.selectedColour ?? item.colour ?? '';
        const size = item.selectedSize ?? item.size ?? '';
        return {
          ...item,
          product,
          productId: item.productId ?? product.id,
          productName: item.productName ?? product.name,
          colour,
          size,
          selectedColour: colour,
          selectedSize: size,
          variantId: item.variantId ?? `${product.id}:${colour}:${size}`,
          quantity: item.quantity ?? 1,
          unitPrice: item.unitPrice ?? product.price,
          image: item.image ?? product.images[0],
        } as BagItem;
      });
    } catch {
      return [];
    }
  });
  const [open, setOpen] = useState(false);
  useEffect(() => { localStorage.setItem(KEY, JSON.stringify(items)); window.dispatchEvent(new CustomEvent('lozia-bag-change', { detail: items })); }, [items]);
  useEffect(() => {
    const sync = (event: Event) => {
      const detail = (event as CustomEvent<BagItem[]>).detail;
      if (detail) setItems(detail);
    };
    window.addEventListener('lozia-bag-change', sync);
    return () => window.removeEventListener('lozia-bag-change', sync);
  }, []);
  const add = useCallback((product: Product, colour: string, size: string, quantity = 1) => {
    setItems((current) => {
      const variantId = `${product.id}:${colour}:${size}`;
      const index = current.findIndex((i) => i.variantId === variantId);
      if (index < 0) {
        return [...current, {
          product,
          productId: product.id,
          productName: product.name,
          colour,
          size,
          selectedColour: colour,
          selectedSize: size,
          variantId,
          quantity,
          unitPrice: product.price,
          image: product.images[0],
        }];
      }
      return current.map((item, i) => i === index ? { ...item, quantity: item.quantity + quantity } : item);
    });
    setOpen(true);
  }, []);
  const update = useCallback((index: number, quantity: number) => setItems((current) => quantity < 1 ? current.filter((_, i) => i !== index) : current.map((item, i) => i === index ? { ...item, quantity } : item)), []);
  const remove = useCallback((index: number) => setItems((current) => current.filter((_, i) => i !== index)), []);
  const count = useMemo(() => items.reduce((sum, item) => sum + item.quantity, 0), [items]);
  const subtotal = useMemo(() => items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0), [items]);
  return { items, open, setOpen, add, update, remove, count, subtotal };
}
'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { CartItem } from '@/types';
import { addToCart, cartCount, cartSubtotal, parseStoredCart, removeFromCart, setQuantity } from '@/lib/cart/cart';

const KEY = 'lozia-cart-v2';

function useCartState() {
  // Start empty so the server and first client render match; the saved cart is read right after mount.
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      setItems(parseStoredCart(window.localStorage.getItem(KEY)));
    } catch {
      /* storage unavailable: the cart works for this visit only */
    }
    setHydrated(true);
  }, []);

  // Only write back once the saved cart has been read, otherwise the empty starting state would wipe it.
  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(KEY, JSON.stringify(items));
    } catch {
      /* storage full or blocked */
    }
  }, [items, hydrated]);

  const add = useCallback((item: CartItem) => {
    setItems((current) => addToCart(current, item));
    setOpen(true);
  }, []);
  const update = useCallback((variantId: string, quantity: number) => setItems((current) => setQuantity(current, variantId, quantity)), []);
  const remove = useCallback((variantId: string) => setItems((current) => removeFromCart(current, variantId)), []);
  const clear = useCallback(() => setItems([]), []);

  const count = useMemo(() => cartCount(items), [items]);
  const subtotal = useMemo(() => cartSubtotal(items), [items]);
  return { items, hydrated, open, setOpen, add, update, remove, clear, count, subtotal };
}

type CartContextValue = ReturnType<typeof useCartState>;
const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const value = useCartState();
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used inside <CartProvider>');
  return context;
}

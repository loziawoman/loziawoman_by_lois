'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  clearWishlist,
  readWishlist,
  removeFromWishlist,
  toggleWishlist,
  WISHLIST_UPDATED_EVENT,
  type WishlistItem,
} from '@/lib/wishlist/wishlist';

export function useWishlist() {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  const sync = useCallback(() => {
    setItems(readWishlist());
  }, []);

  useEffect(() => {
    sync();
    setHydrated(true);

    window.addEventListener(WISHLIST_UPDATED_EVENT, sync);
    window.addEventListener('storage', sync);

    return () => {
      window.removeEventListener(WISHLIST_UPDATED_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, [sync]);

  const toggle = useCallback(
    (product: Pick<WishlistItem, 'productId' | 'slug'>) => {
      const next = toggleWishlist(product);
      setItems(next);
      return next;
    },
    [],
  );

  const remove = useCallback((productId: string) => {
    const next = removeFromWishlist(productId);
    setItems(next);
    return next;
  }, []);

  const clear = useCallback(() => {
    const next = clearWishlist();
    setItems(next);
    return next;
  }, []);

  const has = useCallback(
    (productId: string) =>
      items.some((item) => item.productId === productId),
    [items],
  );

  return {
    items,
    count: items.length,
    hydrated,
    has,
    toggle,
    remove,
    clear,
  };
}

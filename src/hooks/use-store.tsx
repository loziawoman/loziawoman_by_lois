'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
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

/** Reads and normalises the saved bag. Returns [] on the server or if the data is unreadable. */
function readStoredBag(): BagItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = JSON.parse(window.localStorage.getItem(KEY) || '[]') as Partial<BagItem>[];
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
}

function useBagState() {
  // Start empty so server and first client render match; the saved bag is loaded after mount.
  const [items, setItems] = useState<BagItem[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setItems(readStoredBag());
    setHydrated(true);
  }, []);

  // Only write back once the saved bag has been read, otherwise the empty initial state would wipe it.
  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(KEY, JSON.stringify(items));
    } catch {
      /* storage full or unavailable — the bag still works for this session */
    }
  }, [items, hydrated]);

  const add = useCallback((product: Product, colour: string, size: string, quantity = 1) => {
    setItems((current) => {
      const variantId = `${product.id}:${colour}:${size}`;
      const index = current.findIndex((i) => i.variantId === variantId);
      if (index < 0) {
        return [
          ...current,
          {
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
          },
        ];
      }
      return current.map((item, i) => (i === index ? { ...item, quantity: item.quantity + quantity } : item));
    });
    setOpen(true);
  }, []);

  const update = useCallback(
    (index: number, quantity: number) =>
      setItems((current) =>
        quantity < 1
          ? current.filter((_, i) => i !== index)
          : current.map((item, i) => (i === index ? { ...item, quantity } : item)),
      ),
    [],
  );

  const clear = useCallback(() => setItems([]), []);

  const remove = useCallback((index: number) => setItems((current) => current.filter((_, i) => i !== index)), []);

  const count = useMemo(() => items.reduce((sum, item) => sum + item.quantity, 0), [items]);
  const subtotal = useMemo(() => items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0), [items]);

  return { items, hydrated, open, setOpen, add, update, remove, clear, count, subtotal };
}

type BagContextValue = ReturnType<typeof useBagState>;

const BagContext = createContext<BagContextValue | null>(null);

/** One shared bag for the whole app (header badge, drawer, product pages, checkout). */
export function BagProvider({ children }: { children: ReactNode }) {
  const value = useBagState();
  return <BagContext.Provider value={value}>{children}</BagContext.Provider>;
}

export function useBag(): BagContextValue {
  const context = useContext(BagContext);
  if (!context) throw new Error('useBag must be used inside <BagProvider>');
  return context;
}

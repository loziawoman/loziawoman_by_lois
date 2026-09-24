'use client';

import { Heart } from 'lucide-react';
import { useWishlist } from '@/hooks/use-wishlist';
import { cn } from '@/lib/utils';

type WishlistButtonProps = {
  productId: string;
  slug: string;
  className?: string;
  size?: number;
};

export function WishlistButton({
  productId,
  slug,
  className,
  size = 19,
}: WishlistButtonProps) {
  const { has, toggle, hydrated } = useWishlist();
  const active = hydrated && has(productId);

  return (
    <button
      type="button"
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        toggle({ productId, slug });
      }}
      aria-label={active ? 'Remove from favorites' : 'Add to favorites'}
      aria-pressed={active}
      title={active ? 'Remove from favorites' : 'Add to favorites'}
      className={cn(
        'inline-flex items-center justify-center rounded-full transition-all duration-200',
        'hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--accent))]',
        active
          ? 'text-[hsl(var(--accent))]'
          : 'text-[hsl(var(--foreground))]',
        className,
      )}
      data-testid={`button-wishlist-${productId}`}
    >
      <Heart
        size={size}
        strokeWidth={1.35}
        fill={active ? 'currentColor' : 'none'}
        aria-hidden="true"
      />
      <span className="sr-only">
        {active ? 'Remove from favorites' : 'Add to favorites'}
      </span>
    </button>
  );
}

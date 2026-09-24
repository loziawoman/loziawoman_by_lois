import type { Metadata } from 'next';
import { WishlistContent } from '@/components/wishlist/wishlist-content';
import { listPublishedProducts } from '@/lib/products/queries';
import { displayPrice } from '@/lib/products/variants';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Favorites | LOZIA',
  description: 'Your saved LOZIA pieces.',
  robots: {
    index: false,
    follow: false,
  },
};

export default async function WishlistPage() {
  const products = await listPublishedProducts();

  return (
    <WishlistContent
      products={products.map((product) => {
        const { price } = displayPrice(product.basePrice, product.variants);
        const image = product.images[0];

        return {
          id: product.id,
          slug: product.slug,
          name: product.name,
          price,
          image: image?.src ?? null,
          alt: image?.alt ?? product.name,
        };
      })}
    />
  );
}

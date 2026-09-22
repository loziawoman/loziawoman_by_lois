import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ProductView } from '@/components/product/product-view';
import { ProductCard } from '@/components/shop/product-card';
import { siteUrl } from '@/lib/env';
import { displayPrice, hasStock } from '@/lib/products/variants';
import { getPublishedProduct, listRelatedProducts } from '@/lib/products/queries';

export const dynamic = 'force-dynamic'; // stock must be current

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ colour?: string | string[] }> };

export async function generateMetadata({ params }: Pick<Props, 'params'>): Promise<Metadata> {
  const { slug } = await params;
  const product = await getPublishedProduct(slug);
  if (!product) return { title: 'Piece not found' };
  const description = product.shortDescription || product.description.slice(0, 160);
  const image = product.images[0]?.src;
  const canonical = `/shop/${product.slug}`;
  return {
    title: product.name,
    description,
    alternates: { canonical },
    openGraph: { type: 'website', title: product.name, description, url: canonical, images: image ? [{ url: image, alt: product.images[0]?.alt ?? product.name }] : undefined },
    twitter: { card: 'summary_large_image', title: product.name, description, images: image ? [image] : undefined },
  };
}

export default async function ProductPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { colour } = await searchParams;
  const product = await getPublishedProduct(slug);
  if (!product) notFound();
  const related = await listRelatedProducts(product, 4);

  const { price } = displayPrice(product.basePrice, product.variants);
  const base = siteUrl() ?? '';
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description || product.shortDescription,
    sku: product.variants[0]?.sku,
    image: product.images.map((i) => i.src),
    category: product.category?.name,
    offers: {
      '@type': 'Offer', url: `${base}/shop/${product.slug}`, priceCurrency: 'NGN', price,
      availability: hasStock(product.variants) ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
    },
  };

  return (
    <main className="mx-auto max-w-[1440px] px-5 py-8 md:px-10 md:py-14">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
      <ProductView key={`${product.id}:${Array.isArray(colour) ? colour[0] : colour ?? ''}`} product={product} initialColour={Array.isArray(colour) ? colour[0] : colour} />
      {related.length > 0 && (
        <section className="mt-24" aria-labelledby="related-heading">
          <span className="mono text-[hsl(var(--accent))]">You may also like</span>
          <h2 id="related-heading" className="serif mt-3 text-4xl md:text-5xl">Related pieces</h2>
          <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4 md:gap-6">
            {related.map((p) => <ProductCard key={p.id} product={p} sizes="(min-width: 768px) 25vw, 50vw" />)}
          </div>
        </section>
      )}
    </main>
  );
}

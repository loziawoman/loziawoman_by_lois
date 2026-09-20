import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { readWorkspace } from '@/server/cms-store';
import { ProductPage } from '@/views/storefront-pages';

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ colour?: string | string[] }>;
};

export async function generateMetadata({ params }: Pick<Props, 'params'>): Promise<Metadata> {
  const { slug } = await params;
  const { products } = await readWorkspace();
  const product = products.find((item) => item.slug === slug);
  if (!product) return { title: 'Page not found' };
  return { title: product.name, description: product.description };
}

export default async function Page({ params, searchParams }: Props) {
  const { slug } = await params;
  const { colour } = await searchParams;
  const { products } = await readWorkspace();
  if (!products.some((item) => item.slug === slug)) notFound();

  const initialColour = Array.isArray(colour) ? colour[0] : colour;
  return <ProductPage key={`${slug}:${initialColour ?? ''}`} slug={slug} initialColour={initialColour} />;
}

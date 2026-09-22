import { NextResponse } from 'next/server';
import { fail, handleError } from '@/lib/api/response';
import { getPublishedProduct } from '@/lib/products/queries';

export async function GET(_request: Request, context: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await context.params;
    const product = await getPublishedProduct(slug);
    if (!product) return fail(404, 'not_found', 'That piece could not be found.');
    return NextResponse.json({ ok: true, data: product }, { headers: { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60' } });
  } catch (error) {
    return handleError(error);
  }
}

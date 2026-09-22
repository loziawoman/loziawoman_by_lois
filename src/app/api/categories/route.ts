import { NextResponse } from 'next/server';
import { handleError } from '@/lib/api/response';
import { listCategories } from '@/lib/products/queries';

export async function GET() {
  try {
    return NextResponse.json({ ok: true, data: await listCategories() }, { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' } });
  } catch (error) {
    return handleError(error);
  }
}

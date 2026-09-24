import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createSupabasePublicClient } from '@/lib/supabase/public';
import { getSiteSettings } from '@/lib/settings/queries';

const schema = z.object({
  name: z.string().trim().min(1).max(80),
  email: z.union([z.string().trim().email().max(254), z.literal('')]).optional(),
  rating: z.number().int().min(1).max(5),
  message: z.string().trim().min(1).max(500),
});

export async function GET() {
  try {
    const reviews = await import('@/lib/reviews/queries').then((m) => m.listPublicReviews());
    return NextResponse.json({ ok: true, data: reviews });
  } catch (error) {
    console.error('[reviews] GET failed', error);
    return NextResponse.json({ ok: false, error: { code: 'server_error', message: 'Unable to load reviews.' } }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const settings = await getSiteSettings();
    if (!settings.reviewSubmissionEnabled) {
      return NextResponse.json(
        { ok: false, error: { code: 'reviews_disabled', message: 'Customer reviews are currently closed.' } },
        { status: 403 }
      );
    }

    const body = schema.parse(await request.json());
    const supabase = createSupabasePublicClient();
    const { data, error } = await supabase
      .from('reviews')
      .insert({
        name: body.name.toUpperCase(),
        email: body.email || null,
        rating: body.rating,
        message: body.message,
        status: 'visible',
      })
      .select('id, name, email, rating, message, status, created_at')
      .single();

    if (error) throw error;
    return NextResponse.json({ ok: true, data }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { ok: false, error: { code: 'validation_failed', message: 'Please check your review and try again.' } },
        { status: 422 }
      );
    }
    console.error('[reviews] POST failed', error);
    return NextResponse.json(
      { ok: false, error: { code: 'server_error', message: 'Unable to publish your review.' } },
      { status: 500 }
    );
  }
}

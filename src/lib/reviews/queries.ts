import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Review, ReviewStatus } from '@/types';
import { createSupabasePublicClient } from '@/lib/supabase/public';

type ReviewRow = {
  id: string; name: string; email: string | null; rating: number; message: string;
  status: ReviewStatus; created_at: string;
};

const mapReview = (r: ReviewRow): Review => ({
  id: r.id, name: r.name, email: r.email, rating: r.rating, message: r.message,
  status: r.status, createdAt: r.created_at,
});

export async function listPublicReviews(): Promise<Review[]> {
  const { data, error } = await createSupabasePublicClient()
    .from('reviews')
    .select('id, name, email, rating, message, status, created_at')
    .in('status', ['visible', 'spotlight'])
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) throw error;
  return ((data ?? []) as ReviewRow[]).sort((a, b) => {
    if (a.status === b.status) return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    return a.status === 'spotlight' ? -1 : 1;
  }).map(mapReview);
}

export async function loadReviews(supabase: SupabaseClient): Promise<Review[]> {
  const { data, error } = await supabase.from('reviews')
    .select('id, name, email, rating, message, status, created_at')
    .order('created_at', { ascending: false }).limit(200);
  if (error) throw error;
  return ((data ?? []) as ReviewRow[]).map(mapReview);
}

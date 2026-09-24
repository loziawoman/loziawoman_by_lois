import type { SupabaseClient } from '@supabase/supabase-js';
import { createSupabasePublicClient } from '@/lib/supabase/public';
import type { Review } from '@/types';

function mapReview(row: {
  id: string;
  name: string;
  email: string | null;
  rating: number;
  message: string;
  status: string;
  created_at: string;
}): Review {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    rating: row.rating,
    message: row.message,
    status: row.status as Review['status'],
    createdAt: row.created_at,
  };
}

export async function listPublicReviews(): Promise<Review[]> {
  const { data, error } = await createSupabasePublicClient()
    .from('reviews')
    .select('id, name, email, rating, message, status, created_at')
    .in('status', ['visible', 'spotlight'])
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) throw error;
  return (data ?? []).map(mapReview);
}

export async function loadReviews(supabase: SupabaseClient): Promise<Review[]> {
  const { data, error } = await supabase
    .from('reviews')
    .select('id, name, email, rating, message, status, created_at')
    .order('created_at', { ascending: false })
    .limit(200);

  if (error) throw error;
  return (data ?? []).map(mapReview);
}

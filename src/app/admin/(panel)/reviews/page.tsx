import type { Metadata } from 'next';
import { Empty, PageHeader } from '@/components/admin/ui';
import { ReviewActions } from '@/components/admin/review-actions';
import { loadReviews } from '@/lib/reviews/queries';
import { requirePermission } from '@/lib/auth/session';
import { formatDateTime } from '@/lib/format';

export const metadata: Metadata = { title: 'Reviews' };

export default async function ReviewsPage() {
  const { supabase } = await requirePermission('settings:write');
  const reviews = await loadReviews(supabase);
  return <>
    <PageHeader title="Reviews" description="Manage customer reviews shown on the storefront. New reviews are live by default." />
    {reviews.length === 0 ? <Empty>No reviews yet.</Empty> : <ul className="grid gap-4">
      {reviews.map((review) => <li key={review.id} className="border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm"><strong>{review.name}</strong>{review.email && <> · <a className="underline-link" href={`mailto:${review.email}`}>{review.email}</a></>} · <span className="text-[hsl(var(--muted-foreground))]">{formatDateTime(review.createdAt)}</span></p>
            <p className="mt-2 text-sm">{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)} · <span className="uppercase tracking-[.1em]">{review.status}</span></p>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-7">{review.message}</p>
          </div>
          <ReviewActions id={review.id} status={review.status} />
        </div>
      </li>)}
    </ul>}
  </>;
}

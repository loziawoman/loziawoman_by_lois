import type { Metadata } from 'next';
import { Empty, PageHeader, cellCls, Table } from '@/components/admin/ui';
import { ReviewActions } from '@/components/admin/review-actions';
import { ReviewSettingsGroup } from '@/components/admin/settings-forms';
import { getSiteSettings } from '@/lib/settings/queries';
import { loadReviews } from '@/lib/reviews/queries';
import { requirePermission } from '@/lib/auth/session';
import { formatDateTime } from '@/lib/format';

export const metadata: Metadata = { title: 'Reviews' };

export default async function ReviewsPage() {
  const { supabase } = await requirePermission('settings:write');
  const [reviews, settings] = await Promise.all([loadReviews(supabase), getSiteSettings()]);

  return (
    <>
      <PageHeader title="Reviews" description="Manage customer reviews shown on the storefront." />
      <div className="mb-8 max-w-2xl">
        <ReviewSettingsGroup enabled={settings.reviewSubmissionEnabled} />
      </div>

      {reviews.length === 0 ? (
        <Empty>No customer reviews yet.</Empty>
      ) : (
        <Table head={['Customer', 'Rating', 'Review', 'Status', 'Date', 'Actions']}>
          {reviews.map((review) => (
            <tr key={review.id}>
              <td className={cellCls}>
                <div>{review.name}</div>
                {review.email && <div className="text-xs text-[hsl(var(--muted-foreground))]">{review.email}</div>}
              </td>
              <td className={cellCls}>{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</td>
              <td className={`${cellCls} max-w-[420px] whitespace-normal`}>{review.message}</td>
              <td className={cellCls}>{review.status}</td>
              <td className={cellCls}>{formatDateTime(review.createdAt)}</td>
              <td className={cellCls}><ReviewActions id={review.id} status={review.status} /></td>
            </tr>
          ))}
        </Table>
      )}
    </>
  );
}

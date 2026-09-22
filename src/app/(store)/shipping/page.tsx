import type { Metadata } from 'next';
import { PolicyPage } from '@/components/content/policy-page';
import { getSiteSettings } from '@/lib/settings/queries';

export const metadata: Metadata = { title: 'Shipping', description: 'Delivery areas, times and charges.', alternates: { canonical: '/shipping' } };
export const dynamic = 'force-dynamic';

export default async function Page() {
  const { policies } = await getSiteSettings();
  return <PolicyPage policy={policies.shipping} eyebrow="The practical details" />;
}

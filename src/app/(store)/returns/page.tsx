import type { Metadata } from 'next';
import { PolicyPage } from '@/components/content/policy-page';
import { getSiteSettings } from '@/lib/settings/queries';

export const metadata: Metadata = { title: 'Returns', description: 'Returns, exchanges and refunds.', alternates: { canonical: '/returns' } };
export const dynamic = 'force-dynamic';

export default async function Page() {
  const { policies } = await getSiteSettings();
  return <PolicyPage policy={policies.returns} eyebrow="The considered choice" />;
}

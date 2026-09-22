import type { Metadata } from 'next';
import { PolicyPage } from '@/components/content/policy-page';
import { getSiteSettings } from '@/lib/settings/queries';

export const metadata: Metadata = { title: 'Terms', description: 'Terms for using the website and buying from LOZIA.', alternates: { canonical: '/terms' } };
export const dynamic = 'force-dynamic';

export default async function Page() {
  const { policies } = await getSiteSettings();
  return <PolicyPage policy={policies.terms} eyebrow="The fine print" />;
}

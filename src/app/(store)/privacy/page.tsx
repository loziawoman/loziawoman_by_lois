import type { Metadata } from 'next';
import { PolicyPage } from '@/components/content/policy-page';
import { getSiteSettings } from '@/lib/settings/queries';

export const metadata: Metadata = { title: 'Privacy', description: 'How LOZIA handles your information.', alternates: { canonical: '/privacy' } };
export const dynamic = 'force-dynamic';

export default async function Page() {
  const { policies } = await getSiteSettings();
  return <PolicyPage policy={policies.privacy} eyebrow="A quiet promise" />;
}

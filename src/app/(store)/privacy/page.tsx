import type { Metadata } from 'next';
import { findPolicy } from '@/lib/cms';
import { readWorkspace } from '@/server/cms-store';
import { PolicyPage } from '@/views/info-pages';

export const metadata: Metadata = { title: 'Privacy' };

export default async function Page() {
  const { policies } = await readWorkspace();
  return <PolicyPage policy={findPolicy(policies, 'privacy')} />;
}

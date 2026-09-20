import type { Metadata } from 'next';
import { readWorkspace } from '@/server/cms-store';
import { ContactPage } from '@/views/info-pages';

export const metadata: Metadata = { title: 'Contact' };

export default async function Page() {
  const { settings } = await readWorkspace();
  return <ContactPage settings={settings} />;
}

import { StoreShell } from '@/components/layout/store-shell';
import { getSiteSettings } from '@/lib/settings/queries';

export const dynamic = 'force-dynamic';

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSiteSettings();
  return <StoreShell settings={settings}>{children}</StoreShell>;
}

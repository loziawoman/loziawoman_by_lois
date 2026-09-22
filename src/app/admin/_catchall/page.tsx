import type { Metadata } from 'next';
import { authConfigured, isAdmin } from '@/server/admin-auth';
import { readWorkspace } from '@/server/cms-store';
import { AdminLogin } from '@/views/admin-login';
import AdminPage from '@/views/admin-page';

export const metadata: Metadata = { title: 'Studio admin', robots: { index: false, follow: false } };

export default async function Page() {
  if (!(await isAdmin())) return <AdminLogin configured={authConfigured()} />;
  return <AdminPage initialWorkspace={await readWorkspace()} />;
}

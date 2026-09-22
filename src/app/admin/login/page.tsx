import { isSupabaseConfigured } from '@/lib/env';
import { AdminLoginForm } from '@/components/admin/login-form';

export default async function AdminLoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return <AdminLoginForm configured={isSupabaseConfigured()} forbidden={error === 'forbidden'} />;
}

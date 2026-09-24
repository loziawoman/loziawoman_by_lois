import { AdminNav, type NavItem } from '@/components/admin/admin-nav';
import { can } from '@/lib/auth/permissions';
import { requirePermission } from '@/lib/auth/session';

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  // Every page under /admin needs a signed-in staff member. Individual pages ask for stricter permissions where needed.
  const { user } = await requirePermission('catalog:read');
  const items: NavItem[] = [
    { href: '/admin', label: 'Dashboard' },
    { href: '/admin/orders', label: 'Orders' },
    { href: '/admin/products', label: 'Products' },
    { href: '/admin/inventory', label: 'Inventory' },
    ...(can(user.role, 'catalog:write') ? [{ href: '/admin/attributes', label: 'Colours, sizes & categories' }] : []),
    { href: '/admin/customers', label: 'Customers' },
    { href: '/admin/messages', label: 'Messages' },
    ...(can(user.role, 'settings:write') ? [{ href: '/admin/reviews', label: 'Reviews' }] : []),
    ...(can(user.role, 'settings:write') ? [{ href: '/admin/content', label: 'Content & settings' }] : []),
    ...(can(user.role, 'audit:read') ? [{ href: '/admin/audit', label: 'Audit log' }] : []),
  ];
  return (
    <div className="flex min-h-[100dvh] flex-col md:flex-row">
      <AdminNav items={items} email={user.email} role={user.role} />
      <main id="main" className="min-w-0 flex-1 px-4 py-8 md:ml-60 md:px-10 md:py-12">{children}</main>
    </div>
  );
}

import type { AdminUser, UserRole } from '@/types';

export type Permission =
  | 'catalog:read'
  | 'catalog:write'
  | 'inventory:write'
  | 'orders:read'
  | 'orders:write'
  | 'orders:delete'
  | 'payments:verify'
  | 'customers:read'
  | 'customers:write'
  | 'settings:write'
  | 'audit:read'
  | 'users:manage';

const STAFF: Permission[] = ['catalog:read', 'inventory:write', 'orders:read', 'orders:write', 'customers:read'];
const ADMIN: Permission[] = [...STAFF, 'catalog:write', 'payments:verify', 'settings:write', 'audit:read', 'orders:delete', 'customers:write'];

const GRANTS: Record<UserRole, Permission[]> = {
  customer: [],
  staff: STAFF,
  admin: ADMIN,
  super_admin: [...ADMIN, 'users:manage'],
};

export const isUserRole = (value: unknown): value is UserRole =>
  value === 'customer' || value === 'staff' || value === 'admin' || value === 'super_admin';

export const can = (role: UserRole | null | undefined, permission: Permission): boolean =>
  role ? GRANTS[role].includes(permission) : false;

export const isStaffRole = (role: UserRole | null | undefined): boolean => role === 'staff' || role === 'admin' || role === 'super_admin';

export type AuthDecision =
  | { ok: true; user: AdminUser }
  | { ok: false; status: 401 | 403; code: 'unauthenticated' | 'forbidden' };

/** The single place that turns "who is this?" into "may they do that?". Used by every admin route and page. */
export function authorize(user: AdminUser | null, permission: Permission): AuthDecision {
  if (!user) return { ok: false, status: 401, code: 'unauthenticated' };
  if (!can(user.role, permission)) return { ok: false, status: 403, code: 'forbidden' };
  return { ok: true, user };
}

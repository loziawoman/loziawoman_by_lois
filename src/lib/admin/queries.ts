import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { BankDetails, Customer, Order, SiteSettings } from '@/types';
import { LOW_STOCK_THRESHOLD, availableQuantity } from '@/lib/inventory/stock';
import { listOrders } from '@/lib/orders/admin-queries';
import { buildBankDetails, buildSiteSettings } from '@/lib/settings/definitions';

const count = async (query: PromiseLike<{ count: number | null; error: { message: string } | null }>) => {
  const { count: n, error } = await query;
  if (error) throw error;
  return n ?? 0;
};

export type DashboardData = {
  totalOrders: number; pendingPayments: number; verifiedPayments: number; processing: number; shipped: number; delivered: number;
  totalProducts: number; lowStock: number; outOfStock: number; recent: Order[];
};

export async function loadDashboard(supabase: SupabaseClient): Promise<DashboardData> {
  const head = { count: 'exact' as const, head: true };
  const orders = () => supabase.from('orders').select('id', head);
  const [totalOrders, pendingPayments, verifiedPayments, processing, shipped, delivered, totalProducts, variants, recent] = await Promise.all([
    count(orders()),
    count(orders().in('payment_status', ['PENDING', 'SUBMITTED']).neq('fulfillment_status', 'CANCELLED')),
    count(orders().eq('payment_status', 'VERIFIED')),
    count(orders().eq('fulfillment_status', 'PROCESSING')),
    count(orders().eq('fulfillment_status', 'SHIPPED')),
    count(orders().eq('fulfillment_status', 'DELIVERED')),
    count(supabase.from('products').select('id', head).neq('status', 'archived')),
    supabase.from('product_variants').select('stock_quantity, reserved_quantity, product:products!inner(status)').eq('is_active', true).eq('product.status', 'published'),
    listOrders(supabase, {}, 6),
  ]);
  if (variants.error) throw variants.error;
  const levels = (variants.data ?? []).map((v: { stock_quantity: number; reserved_quantity: number }) => availableQuantity({ stockQuantity: v.stock_quantity, reservedQuantity: v.reserved_quantity }));
  return {
    totalOrders, pendingPayments, verifiedPayments, processing, shipped, delivered, totalProducts,
    lowStock: levels.filter((n: number) => n > 0 && n <= LOW_STOCK_THRESHOLD).length,
    outOfStock: levels.filter((n: number) => n === 0).length,
    recent,
  };
}

export type InventoryRow = {
  id: string; sku: string; isActive: boolean; stock: number; reserved: number; available: number;
  productId: string; productName: string; colour: string; size: string;
};

export async function loadInventory(supabase: SupabaseClient, filter: 'all' | 'low' | 'out'): Promise<InventoryRow[]> {
  const { data, error } = await supabase
    .from('product_variants')
    .select('id, sku, is_active, stock_quantity, reserved_quantity, product:products(id, name), colour:colours(name), size:sizes(name, sort_order)')
    .order('sku').limit(1000);
  if (error) throw error;
  const rows = (data ?? []).map((v: Record<string, unknown>): InventoryRow => {
    const product = v.product as { id: string; name: string } | null;
    const stock = v.stock_quantity as number;
    const reserved = v.reserved_quantity as number;
    return {
      id: v.id as string, sku: v.sku as string, isActive: v.is_active as boolean, stock, reserved, available: availableQuantity({ stockQuantity: stock, reservedQuantity: reserved }),
      productId: product?.id ?? '', productName: product?.name ?? '', colour: (v.colour as { name: string } | null)?.name ?? '', size: (v.size as { name: string } | null)?.name ?? '',
    };
  });
  if (filter === 'out') return rows.filter((r) => r.isActive && r.available === 0);
  if (filter === 'low') return rows.filter((r) => r.isActive && r.available > 0 && r.available <= LOW_STOCK_THRESHOLD);
  return rows;
}

export type CustomerRow = Customer & { orderCount: number };

export async function loadCustomers(supabase: SupabaseClient, q?: string): Promise<CustomerRow[]> {
  let query = supabase.from('customers').select('id, email, full_name, phone, created_at, orders(count)').order('created_at', { ascending: false }).limit(100);
  const term = q?.replace(/[^\p{L}\p{N}\s@.\-_]/gu, '').trim().slice(0, 60);
  if (term) query = query.or(`full_name.ilike.%${term}%,email.ilike.%${term}%,phone.ilike.%${term}%`);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map((c: Record<string, unknown>) => ({
    id: c.id as string, email: c.email as string, fullName: c.full_name as string, phone: c.phone as string, createdAt: c.created_at as string,
    orderCount: ((c.orders as { count: number }[] | null)?.[0]?.count) ?? 0,
  }));
}

export async function loadCustomer(supabase: SupabaseClient, id: string): Promise<Customer | null> {
  const { data, error } = await supabase.from('customers').select('id, email, full_name, phone, created_at').eq('id', id).maybeSingle();
  if (error) throw error;
  return data ? { id: data.id, email: data.email, fullName: data.full_name, phone: data.phone, createdAt: data.created_at } : null;
}

export async function loadMessages(supabase: SupabaseClient) {
  const { data, error } = await supabase.from('contact_messages').select('id, name, email, message, status, created_at').order('created_at', { ascending: false }).limit(100);
  if (error) throw error;
  return (data ?? []) as { id: string; name: string; email: string; message: string; status: string; created_at: string }[];
}

export async function loadAudit(supabase: SupabaseClient) {
  const { data, error } = await supabase.from('audit_logs').select('id, actor_email, action, entity, entity_id, metadata, created_at').order('created_at', { ascending: false }).limit(200);
  if (error) throw error;
  return (data ?? []) as { id: number; actor_email: string | null; action: string; entity: string; entity_id: string | null; metadata: Record<string, unknown>; created_at: string }[];
}

/** All settings as staff see them (including the private bank details). */
export async function loadAdminSettings(supabase: SupabaseClient): Promise<{ settings: SiteSettings; bank: BankDetails; raw: { key: string; value: unknown }[] }> {
  const { data, error } = await supabase.from('site_settings').select('key, value');
  if (error) throw error;
  const raw = data ?? [];
  return { settings: buildSiteSettings(raw), bank: buildBankDetails(raw), raw };
}

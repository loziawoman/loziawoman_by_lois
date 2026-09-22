-- LOZIA storefront schema: catalogue, inventory, orders, manual bank payments, CMS settings, audit log.
-- Run with the Supabase CLI (`supabase db push`) or paste into the SQL editor.
-- Guest checkout writes go through the service-role-only functions below; staff work through their own session and RLS.

-- ---------------------------------------------------------------------------
-- Types
-- ---------------------------------------------------------------------------
create type public.user_role as enum ('customer', 'staff', 'admin', 'super_admin');
create type public.product_status as enum ('draft', 'published', 'archived');
create type public.payment_status as enum ('PENDING', 'SUBMITTED', 'VERIFIED', 'REJECTED', 'REFUNDED');
create type public.fulfillment_status as enum ('PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED');

-- ---------------------------------------------------------------------------
-- Profiles and role helpers
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  full_name text,
  role public.user_role not null default 'customer',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email) values (new.id, new.email) on conflict (id) do nothing;
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.is_staff() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select role in ('staff', 'admin', 'super_admin') from public.profiles where id = auth.uid()), false)
$$;

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select role in ('admin', 'super_admin') from public.profiles where id = auth.uid()), false)
$$;

create or replace function public.is_super_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select role = 'super_admin' from public.profiles where id = auth.uid()), false)
$$;

-- ---------------------------------------------------------------------------
-- Catalogue
-- ---------------------------------------------------------------------------
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  description text not null default '',
  image_url text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table public.colours (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  hex text not null check (hex ~ '^#[0-9a-fA-F]{6}$'),
  sort_order int not null default 0
);

create table public.sizes (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  sort_order int not null default 0
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  description text not null default '',
  short_description text not null default '',
  fabric text not null default '',
  care text not null default '',
  category_id uuid references public.categories (id) on delete set null,
  base_price numeric(12, 2) not null check (base_price >= 0),
  status public.product_status not null default 'draft',
  featured boolean not null default false,
  original_colour_id uuid references public.colours (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index products_status_idx on public.products (status, featured);
create index products_category_idx on public.products (category_id);

create table public.product_colours (
  product_id uuid not null references public.products (id) on delete cascade,
  colour_id uuid not null references public.colours (id) on delete cascade,
  sort_order int not null default 0,
  primary key (product_id, colour_id)
);

create table public.product_sizes (
  product_id uuid not null references public.products (id) on delete cascade,
  size_id uuid not null references public.sizes (id) on delete cascade,
  sort_order int not null default 0,
  primary key (product_id, size_id)
);

create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  storage_path text,
  public_url text,
  alt_text text not null default '',
  sort_order int not null default 0,
  is_primary boolean not null default false,
  mask_storage_path text,
  mask_public_url text,
  created_at timestamptz not null default now(),
  check (storage_path is not null or public_url is not null)
);
create unique index product_images_one_primary on public.product_images (product_id) where is_primary;
create index product_images_product_idx on public.product_images (product_id, sort_order);

create table public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  colour_id uuid not null references public.colours (id) on delete restrict,
  size_id uuid not null references public.sizes (id) on delete restrict,
  sku text not null unique,
  price numeric(12, 2) check (price is null or price >= 0), -- null = use the product's base price
  stock_quantity int not null default 0 check (stock_quantity >= 0),
  reserved_quantity int not null default 0 check (reserved_quantity >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (product_id, colour_id, size_id),
  check (reserved_quantity <= stock_quantity)
);
create index product_variants_product_idx on public.product_variants (product_id);

-- ---------------------------------------------------------------------------
-- Customers, orders, payments
-- ---------------------------------------------------------------------------
create table public.customers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  email text not null unique check (email = lower(email)),
  full_name text not null,
  phone text not null,
  created_at timestamptz not null default now()
);

create table public.addresses (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers (id) on delete cascade,
  full_name text not null,
  phone text not null,
  address_line text not null,
  city text not null,
  state text not null,
  instructions text,
  created_at timestamptz not null default now()
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  customer_id uuid not null references public.customers (id),
  address_id uuid not null references public.addresses (id),
  user_id uuid references auth.users (id) on delete set null,
  access_token_hash text not null,
  payment_status public.payment_status not null default 'PENDING',
  fulfillment_status public.fulfillment_status not null default 'PENDING',
  subtotal numeric(12, 2) not null default 0,
  shipping_fee numeric(12, 2) not null default 0,
  total numeric(12, 2) not null default 0,
  currency text not null default 'NGN',
  stock_committed boolean not null default false,
  admin_notes text not null default '',
  cancelled_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index orders_status_idx on public.orders (payment_status, fulfillment_status, created_at desc);
create index orders_customer_idx on public.orders (customer_id);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  variant_id uuid references public.product_variants (id) on delete set null,
  product_id uuid references public.products (id) on delete set null,
  product_name text not null,
  colour_name text not null,
  size_name text not null,
  sku text not null,
  unit_price numeric(12, 2) not null check (unit_price >= 0),
  quantity int not null check (quantity > 0),
  line_total numeric(12, 2) not null
);
create index order_items_order_idx on public.order_items (order_id);
create index order_items_variant_idx on public.order_items (variant_id);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references public.orders (id) on delete cascade,
  method text not null default 'bank_transfer',
  amount numeric(12, 2) not null,
  status public.payment_status not null default 'PENDING',
  receipt_path text,
  customer_note text,
  submitted_at timestamptz,
  reviewed_by uuid references auth.users (id) on delete set null,
  reviewed_at timestamptz,
  rejection_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.shipments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references public.orders (id) on delete cascade,
  carrier text,
  tracking_number text,
  shipped_at timestamptz,
  delivered_at timestamptz
);

-- ---------------------------------------------------------------------------
-- CMS, contact, audit
-- ---------------------------------------------------------------------------
create table public.site_settings (
  key text primary key,
  value jsonb not null,
  is_public boolean not null default true,
  updated_by uuid references auth.users (id) on delete set null,
  updated_at timestamptz not null default now()
);

create table public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  message text not null,
  status text not null default 'new' check (status in ('new', 'read', 'archived')),
  created_at timestamptz not null default now()
);

create table public.audit_logs (
  id bigint generated always as identity primary key,
  actor_id uuid,
  actor_email text,
  action text not null,
  entity text not null,
  entity_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index audit_logs_created_idx on public.audit_logs (created_at desc);

-- Keep updated_at fresh.
create or replace function public.touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;
create trigger products_touch before update on public.products for each row execute function public.touch_updated_at();
create trigger variants_touch before update on public.product_variants for each row execute function public.touch_updated_at();
create trigger orders_touch before update on public.orders for each row execute function public.touch_updated_at();
create trigger payments_touch before update on public.payments for each row execute function public.touch_updated_at();
create trigger profiles_touch before update on public.profiles for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.colours enable row level security;
alter table public.sizes enable row level security;
alter table public.products enable row level security;
alter table public.product_colours enable row level security;
alter table public.product_sizes enable row level security;
alter table public.product_images enable row level security;
alter table public.product_variants enable row level security;
alter table public.customers enable row level security;
alter table public.addresses enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.payments enable row level security;
alter table public.shipments enable row level security;
alter table public.site_settings enable row level security;
alter table public.contact_messages enable row level security;
alter table public.audit_logs enable row level security;

-- Profiles: read your own; staff read all; only a super admin changes roles.
create policy profiles_self_read on public.profiles for select using (id = auth.uid() or public.is_staff());
create policy profiles_super_admin_update on public.profiles for update using (public.is_super_admin()) with check (public.is_super_admin());

-- Reference data is public to read; only admins write.
create policy categories_read on public.categories for select using (true);
create policy colours_read on public.colours for select using (true);
create policy sizes_read on public.sizes for select using (true);
create policy categories_admin on public.categories for all using (public.is_admin()) with check (public.is_admin());
create policy colours_admin on public.colours for all using (public.is_admin()) with check (public.is_admin());
create policy sizes_admin on public.sizes for all using (public.is_admin()) with check (public.is_admin());

-- Products: the public sees published pieces only; staff see everything; admins write.
create policy products_public_read on public.products for select using (status = 'published' or public.is_staff());
create policy products_admin on public.products for all using (public.is_admin()) with check (public.is_admin());

create policy product_colours_read on public.product_colours for select
  using (public.is_staff() or exists (select 1 from public.products p where p.id = product_id and p.status = 'published'));
create policy product_colours_admin on public.product_colours for all using (public.is_admin()) with check (public.is_admin());

create policy product_sizes_read on public.product_sizes for select
  using (public.is_staff() or exists (select 1 from public.products p where p.id = product_id and p.status = 'published'));
create policy product_sizes_admin on public.product_sizes for all using (public.is_admin()) with check (public.is_admin());

create policy product_images_read on public.product_images for select
  using (public.is_staff() or exists (select 1 from public.products p where p.id = product_id and p.status = 'published'));
create policy product_images_admin on public.product_images for all using (public.is_admin()) with check (public.is_admin());

create policy product_variants_read on public.product_variants for select
  using (public.is_staff() or (is_active and exists (select 1 from public.products p where p.id = product_id and p.status = 'published')));
create policy product_variants_admin on public.product_variants for all using (public.is_admin()) with check (public.is_admin());

-- Orders and customer data: staff read; all writes go through the functions below.
create policy customers_staff_read on public.customers for select using (public.is_staff());
create policy addresses_staff_read on public.addresses for select using (public.is_staff());
create policy orders_staff_read on public.orders for select using (public.is_staff());
create policy orders_owner_read on public.orders for select using (user_id is not null and user_id = auth.uid());
create policy order_items_staff_read on public.order_items for select using (public.is_staff());
create policy order_items_owner_read on public.order_items for select
  using (exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid()));
create policy payments_staff_read on public.payments for select using (public.is_staff());
create policy shipments_staff_read on public.shipments for select using (public.is_staff());

-- Site settings: public keys are readable by everyone; admins write.
create policy site_settings_public_read on public.site_settings for select using (is_public or public.is_staff());
create policy site_settings_admin on public.site_settings for all using (public.is_admin()) with check (public.is_admin());

-- Contact messages are inserted by the server (service role); staff read and triage them.
create policy contact_staff_read on public.contact_messages for select using (public.is_staff());
create policy contact_staff_update on public.contact_messages for update using (public.is_staff()) with check (public.is_staff());

-- Audit log: admins read; staff append entries as themselves.
create policy audit_admin_read on public.audit_logs for select using (public.is_admin());
create policy audit_staff_insert on public.audit_logs for insert with check (public.is_staff() and actor_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Internal audit helper
-- ---------------------------------------------------------------------------
create or replace function public.write_audit(p_action text, p_entity text, p_entity_id text, p_metadata jsonb)
returns void language plpgsql security definer set search_path = public as $$
begin
  insert into public.audit_logs (actor_id, actor_email, action, entity, entity_id, metadata)
  values (auth.uid(), (select email from public.profiles where id = auth.uid()), p_action, p_entity, p_entity_id, coalesce(p_metadata, '{}'::jsonb));
end $$;
revoke all on function public.write_audit(text, text, text, jsonb) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Checkout: create_order (service role only)
-- Locks every variant row, checks and reserves stock, prices from the database, and rolls back on any problem.
-- Error codes raised: EMPTY_ORDER, TOO_MANY_ITEMS, VARIANT_NOT_FOUND:<id>, VARIANT_UNAVAILABLE:<id>,
--                     INSUFFICIENT_STOCK:<id>, PRICE_CHANGED
-- ---------------------------------------------------------------------------
create or replace function public.create_order(
  p_order_number text, p_token_hash text,
  p_email text, p_full_name text, p_phone text,
  p_address text, p_city text, p_state text, p_instructions text,
  p_items jsonb, p_shipping_fee numeric, p_expected_subtotal numeric
) returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_customer uuid; v_address uuid; v_order uuid;
  v_subtotal numeric := 0; v_total numeric;
  r record; v public.product_variants; v_product public.products; v_colour text; v_size text; v_price numeric;
begin
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then raise exception 'EMPTY_ORDER'; end if;
  if jsonb_array_length(p_items) > 20 then raise exception 'TOO_MANY_ITEMS'; end if;
  if p_shipping_fee < 0 then raise exception 'INVALID_SHIPPING_FEE'; end if;

  insert into public.customers (email, full_name, phone) values (lower(p_email), p_full_name, p_phone)
    on conflict (email) do update set full_name = excluded.full_name, phone = excluded.phone
    returning id into v_customer;

  insert into public.addresses (customer_id, full_name, phone, address_line, city, state, instructions)
    values (v_customer, p_full_name, p_phone, p_address, p_city, p_state, nullif(p_instructions, ''))
    returning id into v_address;

  insert into public.orders (order_number, customer_id, address_id, access_token_hash, shipping_fee)
    values (p_order_number, v_customer, v_address, p_token_hash, p_shipping_fee)
    returning id into v_order;

  -- Lock variants in a stable order so two checkouts never deadlock each other.
  for r in
    select (i ->> 'variant_id')::uuid as variant_id, (i ->> 'quantity')::int as quantity
    from jsonb_array_elements(p_items) i order by 1
  loop
    if r.quantity is null or r.quantity < 1 or r.quantity > 20 then raise exception 'EMPTY_ORDER'; end if;

    select * into v from public.product_variants where id = r.variant_id for update;
    if not found then raise exception 'VARIANT_NOT_FOUND:%', r.variant_id; end if;

    select * into v_product from public.products where id = v.product_id;
    if not v.is_active or v_product.status <> 'published' then raise exception 'VARIANT_UNAVAILABLE:%', r.variant_id; end if;
    if v.stock_quantity - v.reserved_quantity < r.quantity then raise exception 'INSUFFICIENT_STOCK:%', r.variant_id; end if;

    update public.product_variants set reserved_quantity = reserved_quantity + r.quantity where id = v.id;

    v_price := coalesce(v.price, v_product.base_price);
    select name into v_colour from public.colours where id = v.colour_id;
    select name into v_size from public.sizes where id = v.size_id;

    insert into public.order_items (order_id, variant_id, product_id, product_name, colour_name, size_name, sku, unit_price, quantity, line_total)
      values (v_order, v.id, v.product_id, v_product.name, v_colour, v_size, v.sku, v_price, r.quantity, v_price * r.quantity);
    v_subtotal := v_subtotal + v_price * r.quantity;
  end loop;

  if p_expected_subtotal is not null and p_expected_subtotal <> v_subtotal then raise exception 'PRICE_CHANGED'; end if;
  v_total := v_subtotal + p_shipping_fee;

  update public.orders set subtotal = v_subtotal, total = v_total where id = v_order;
  insert into public.payments (order_id, amount) values (v_order, v_total);
  insert into public.audit_logs (action, entity, entity_id, metadata)
    values ('order.created', 'order', v_order::text, jsonb_build_object('order_number', p_order_number, 'total', v_total));

  return jsonb_build_object('order_id', v_order, 'order_number', p_order_number, 'subtotal', v_subtotal, 'shipping_fee', p_shipping_fee, 'total', v_total);
end $$;

-- ---------------------------------------------------------------------------
-- Customer payment submission (service role only; the route has already checked the order token)
-- Marks the payment as SUBMITTED. It never marks anything as paid.
-- ---------------------------------------------------------------------------
create or replace function public.submit_payment(p_order_number text, p_token_hash text, p_receipt_path text, p_note text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare o public.orders;
begin
  select * into o from public.orders where order_number = p_order_number and access_token_hash = p_token_hash for update;
  if not found then raise exception 'ORDER_NOT_FOUND'; end if;
  if o.fulfillment_status = 'CANCELLED' then raise exception 'ORDER_CANCELLED'; end if;
  if o.payment_status not in ('PENDING', 'REJECTED', 'SUBMITTED') then raise exception 'PAYMENT_NOT_SUBMITTABLE'; end if;

  update public.payments set status = 'SUBMITTED', receipt_path = coalesce(p_receipt_path, receipt_path),
    customer_note = nullif(p_note, ''), submitted_at = now(), rejection_reason = null where order_id = o.id;
  update public.orders set payment_status = 'SUBMITTED' where id = o.id;
  insert into public.audit_logs (action, entity, entity_id, metadata)
    values ('payment.submitted', 'order', o.id::text, jsonb_build_object('order_number', o.order_number, 'has_receipt', p_receipt_path is not null));
  return jsonb_build_object('order_id', o.id, 'payment_status', 'SUBMITTED');
end $$;

-- ---------------------------------------------------------------------------
-- Staff order actions. Each one checks the caller's role itself, so they are safe to expose to signed-in users.
-- ---------------------------------------------------------------------------
create or replace function public.verify_payment(p_order_id uuid) returns jsonb
language plpgsql security definer set search_path = public as $$
declare o public.orders;
begin
  if not public.is_admin() then raise exception 'FORBIDDEN'; end if;
  select * into o from public.orders where id = p_order_id for update;
  if not found then raise exception 'ORDER_NOT_FOUND'; end if;
  if o.fulfillment_status = 'CANCELLED' then raise exception 'ORDER_CANCELLED'; end if;
  if o.payment_status not in ('PENDING', 'SUBMITTED') then raise exception 'INVALID_TRANSITION'; end if;

  if not o.stock_committed then
    update public.product_variants v
      set stock_quantity = v.stock_quantity - oi.qty, reserved_quantity = v.reserved_quantity - oi.qty
      from (select variant_id, sum(quantity)::int as qty from public.order_items where order_id = o.id and variant_id is not null group by variant_id) oi
      where v.id = oi.variant_id;
  end if;

  update public.orders set payment_status = 'VERIFIED', stock_committed = true,
    fulfillment_status = case when fulfillment_status = 'PENDING' then 'PROCESSING' else fulfillment_status end
    where id = o.id;
  update public.payments set status = 'VERIFIED', reviewed_by = auth.uid(), reviewed_at = now(), rejection_reason = null where order_id = o.id;
  perform public.write_audit('payment.verified', 'order', o.id::text, jsonb_build_object('order_number', o.order_number, 'amount', o.total));
  return jsonb_build_object('order_id', o.id, 'payment_status', 'VERIFIED', 'fulfillment_status', 'PROCESSING');
end $$;

create or replace function public.reject_payment(p_order_id uuid, p_reason text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare o public.orders;
begin
  if not public.is_admin() then raise exception 'FORBIDDEN'; end if;
  if coalesce(trim(p_reason), '') = '' then raise exception 'REASON_REQUIRED'; end if;
  select * into o from public.orders where id = p_order_id for update;
  if not found then raise exception 'ORDER_NOT_FOUND'; end if;
  if o.fulfillment_status = 'CANCELLED' then raise exception 'ORDER_CANCELLED'; end if;
  if o.payment_status not in ('PENDING', 'SUBMITTED') then raise exception 'INVALID_TRANSITION'; end if;

  update public.orders set payment_status = 'REJECTED' where id = o.id;
  update public.payments set status = 'REJECTED', reviewed_by = auth.uid(), reviewed_at = now(), rejection_reason = p_reason where order_id = o.id;
  perform public.write_audit('payment.rejected', 'order', o.id::text, jsonb_build_object('order_number', o.order_number, 'reason', p_reason));
  return jsonb_build_object('order_id', o.id, 'payment_status', 'REJECTED');
end $$;

create or replace function public.set_fulfillment_status(p_order_id uuid, p_status public.fulfillment_status, p_carrier text, p_tracking text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare o public.orders;
begin
  if not public.is_staff() then raise exception 'FORBIDDEN'; end if;
  select * into o from public.orders where id = p_order_id for update;
  if not found then raise exception 'ORDER_NOT_FOUND'; end if;
  if o.payment_status <> 'VERIFIED' then raise exception 'PAYMENT_NOT_VERIFIED'; end if;
  if not ((o.fulfillment_status = 'PROCESSING' and p_status = 'SHIPPED') or (o.fulfillment_status = 'SHIPPED' and p_status = 'DELIVERED')) then
    raise exception 'INVALID_TRANSITION';
  end if;

  update public.orders set fulfillment_status = p_status where id = o.id;
  insert into public.shipments (order_id, carrier, tracking_number, shipped_at, delivered_at)
    values (o.id, nullif(p_carrier, ''), nullif(p_tracking, ''),
            case when p_status = 'SHIPPED' then now() end, case when p_status = 'DELIVERED' then now() end)
    on conflict (order_id) do update set
      carrier = coalesce(nullif(p_carrier, ''), public.shipments.carrier),
      tracking_number = coalesce(nullif(p_tracking, ''), public.shipments.tracking_number),
      shipped_at = coalesce(public.shipments.shipped_at, excluded.shipped_at),
      delivered_at = coalesce(excluded.delivered_at, public.shipments.delivered_at);
  perform public.write_audit('order.' || lower(p_status::text), 'order', o.id::text, jsonb_build_object('order_number', o.order_number));
  return jsonb_build_object('order_id', o.id, 'fulfillment_status', p_status);
end $$;

create or replace function public.cancel_order(p_order_id uuid, p_reason text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare o public.orders;
begin
  if not public.is_admin() then raise exception 'FORBIDDEN'; end if;
  select * into o from public.orders where id = p_order_id for update;
  if not found then raise exception 'ORDER_NOT_FOUND'; end if;
  if o.fulfillment_status not in ('PENDING', 'PROCESSING') then raise exception 'INVALID_TRANSITION'; end if;

  if o.stock_committed then
    update public.product_variants v set stock_quantity = v.stock_quantity + oi.qty
      from (select variant_id, sum(quantity)::int as qty from public.order_items where order_id = o.id and variant_id is not null group by variant_id) oi
      where v.id = oi.variant_id;
  else
    update public.product_variants v set reserved_quantity = greatest(0, v.reserved_quantity - oi.qty)
      from (select variant_id, sum(quantity)::int as qty from public.order_items where order_id = o.id and variant_id is not null group by variant_id) oi
      where v.id = oi.variant_id;
  end if;

  update public.orders set fulfillment_status = 'CANCELLED', cancelled_reason = nullif(p_reason, '') where id = o.id;
  perform public.write_audit('order.cancelled', 'order', o.id::text, jsonb_build_object('order_number', o.order_number, 'reason', p_reason, 'restocked', o.stock_committed));
  return jsonb_build_object('order_id', o.id, 'fulfillment_status', 'CANCELLED');
end $$;

create or replace function public.mark_refunded(p_order_id uuid) returns jsonb
language plpgsql security definer set search_path = public as $$
declare o public.orders;
begin
  if not public.is_admin() then raise exception 'FORBIDDEN'; end if;
  select * into o from public.orders where id = p_order_id for update;
  if not found then raise exception 'ORDER_NOT_FOUND'; end if;
  if o.fulfillment_status <> 'CANCELLED' or o.payment_status <> 'VERIFIED' then raise exception 'INVALID_TRANSITION'; end if;
  update public.orders set payment_status = 'REFUNDED' where id = o.id;
  update public.payments set status = 'REFUNDED' where order_id = o.id;
  perform public.write_audit('payment.refunded', 'order', o.id::text, jsonb_build_object('order_number', o.order_number));
  return jsonb_build_object('order_id', o.id, 'payment_status', 'REFUNDED');
end $$;

create or replace function public.add_order_note(p_order_id uuid, p_note text) returns void
language plpgsql security definer set search_path = public as $$
declare v_email text;
begin
  if not public.is_staff() then raise exception 'FORBIDDEN'; end if;
  if coalesce(trim(p_note), '') = '' then raise exception 'NOTE_REQUIRED'; end if;
  select email into v_email from public.profiles where id = auth.uid();
  update public.orders set admin_notes = admin_notes || case when admin_notes = '' then '' else E'\n' end
    || to_char(now() at time zone 'utc', 'YYYY-MM-DD HH24:MI') || ' UTC · ' || coalesce(v_email, 'staff') || ': ' || p_note
    where id = p_order_id;
  if not found then raise exception 'ORDER_NOT_FOUND'; end if;
  perform public.write_audit('order.note_added', 'order', p_order_id::text, '{}'::jsonb);
end $$;

-- Stock changes: never below zero and never below what customers have already reserved.
create or replace function public.adjust_stock(p_variant_id uuid, p_delta int, p_reason text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare v public.product_variants; v_new int;
begin
  if not public.is_staff() then raise exception 'FORBIDDEN'; end if;
  if p_delta = 0 then raise exception 'NO_CHANGE'; end if;
  select * into v from public.product_variants where id = p_variant_id for update;
  if not found then raise exception 'VARIANT_NOT_FOUND'; end if;
  v_new := v.stock_quantity + p_delta;
  if v_new < 0 then raise exception 'NEGATIVE_STOCK'; end if;
  if v_new < v.reserved_quantity then raise exception 'BELOW_RESERVED'; end if;
  update public.product_variants set stock_quantity = v_new where id = v.id;
  perform public.write_audit('stock.changed', 'variant', v.id::text,
    jsonb_build_object('sku', v.sku, 'from', v.stock_quantity, 'to', v_new, 'delta', p_delta, 'reason', p_reason));
  return jsonb_build_object('variant_id', v.id, 'stock_quantity', v_new);
end $$;

create or replace function public.set_primary_image(p_product_id uuid, p_image_id uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'FORBIDDEN'; end if;
  if not exists (select 1 from public.product_images where id = p_image_id and product_id = p_product_id) then raise exception 'IMAGE_NOT_FOUND'; end if;
  update public.product_images set is_primary = false where product_id = p_product_id and is_primary;
  update public.product_images set is_primary = true where id = p_image_id;
end $$;

-- Releases stock held by orders that never got paid (service role only; call it from a scheduled job).
create or replace function public.release_expired_reservations(p_hours int) returns int
language plpgsql security definer set search_path = public as $$
declare o record; n int := 0;
begin
  for o in
    select id, order_number from public.orders
    where payment_status in ('PENDING', 'REJECTED') and fulfillment_status = 'PENDING' and not stock_committed
      and created_at < now() - make_interval(hours => p_hours)
    for update
  loop
    update public.product_variants v set reserved_quantity = greatest(0, v.reserved_quantity - oi.qty)
      from (select variant_id, sum(quantity)::int as qty from public.order_items where order_id = o.id and variant_id is not null group by variant_id) oi
      where v.id = oi.variant_id;
    update public.orders set fulfillment_status = 'CANCELLED', cancelled_reason = 'Reservation expired: payment was not received in time' where id = o.id;
    insert into public.audit_logs (action, entity, entity_id, metadata)
      values ('order.reservation_expired', 'order', o.id::text, jsonb_build_object('order_number', o.order_number));
    n := n + 1;
  end loop;
  return n;
end $$;

-- Function privileges: nothing is callable by default.
revoke all on function public.create_order(text, text, text, text, text, text, text, text, text, jsonb, numeric, numeric) from public, anon, authenticated;
revoke all on function public.submit_payment(text, text, text, text) from public, anon, authenticated;
revoke all on function public.release_expired_reservations(int) from public, anon, authenticated;
grant execute on function public.create_order(text, text, text, text, text, text, text, text, text, jsonb, numeric, numeric) to service_role;
grant execute on function public.submit_payment(text, text, text, text) to service_role;
grant execute on function public.release_expired_reservations(int) to service_role;

revoke all on function public.verify_payment(uuid) from public, anon;
revoke all on function public.reject_payment(uuid, text) from public, anon;
revoke all on function public.set_fulfillment_status(uuid, public.fulfillment_status, text, text) from public, anon;
revoke all on function public.cancel_order(uuid, text) from public, anon;
revoke all on function public.mark_refunded(uuid) from public, anon;
revoke all on function public.add_order_note(uuid, text) from public, anon;
revoke all on function public.adjust_stock(uuid, int, text) from public, anon;
revoke all on function public.set_primary_image(uuid, uuid) from public, anon;
grant execute on function public.verify_payment(uuid) to authenticated;
grant execute on function public.reject_payment(uuid, text) to authenticated;
grant execute on function public.set_fulfillment_status(uuid, public.fulfillment_status, text, text) to authenticated;
grant execute on function public.cancel_order(uuid, text) to authenticated;
grant execute on function public.mark_refunded(uuid) to authenticated;
grant execute on function public.add_order_note(uuid, text) to authenticated;
grant execute on function public.adjust_stock(uuid, int, text) to authenticated;
grant execute on function public.set_primary_image(uuid, uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Storage
-- product-images: public read, admin write. payment-receipts: private; the server uploads, staff read via signed URLs.
-- Product images live under products/{productId}/images/ and masks under products/{productId}/masks/.
-- Receipts live under orders/{orderId}/receipts/.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('product-images', 'product-images', true, 4194304, array['image/jpeg', 'image/png', 'image/webp', 'image/avif']),
  ('payment-receipts', 'payment-receipts', false, 4194304, array['image/jpeg', 'image/png', 'image/webp', 'application/pdf'])
on conflict (id) do nothing;

create policy product_images_public_read on storage.objects for select using (bucket_id = 'product-images');
create policy product_images_admin_insert on storage.objects for insert with check (bucket_id = 'product-images' and public.is_admin());
create policy product_images_admin_update on storage.objects for update using (bucket_id = 'product-images' and public.is_admin());
create policy product_images_admin_delete on storage.objects for delete using (bucket_id = 'product-images' and public.is_admin());
create policy receipts_staff_read on storage.objects for select using (bucket_id = 'payment-receipts' and public.is_staff());

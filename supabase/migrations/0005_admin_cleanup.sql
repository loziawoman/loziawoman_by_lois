-- LOZIA admin cleanup
-- Customer deletion is deliberately done inside one SECURITY DEFINER
-- PostgreSQL function so FK cleanup and order cleanup happen atomically.

create or replace function public.delete_order_for_admin(p_order_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  o public.orders;
  paths text[];
begin
  if not public.is_admin() then
    raise exception 'FORBIDDEN';
  end if;

  select * into o
  from public.orders
  where id = p_order_id
  for update;

  if not found then
    raise exception 'ORDER_NOT_FOUND';
  end if;

  if not o.stock_committed then
    update public.product_variants v
    set reserved_quantity = greatest(0, v.reserved_quantity - oi.qty)
    from (
      select variant_id, sum(quantity)::int as qty
      from public.order_items
      where order_id = o.id
        and variant_id is not null
      group by variant_id
    ) oi
    where v.id = oi.variant_id;
  end if;

  select coalesce(
    array_agg(p.receipt_path) filter (where p.receipt_path is not null),
    '{}'
  )
  into paths
  from public.payments p
  where p.order_id = o.id;

  delete from public.orders where id = o.id;

  return jsonb_build_object(
    'order_number', o.order_number,
    'receipt_paths', to_jsonb(paths)
  );
end
$$;

revoke all on function public.delete_order_for_admin(uuid) from public, anon, authenticated;
grant execute on function public.delete_order_for_admin(uuid) to authenticated;


create or replace function public.delete_customer_for_admin(p_customer_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  c public.customers;
  order_id uuid;
  all_receipt_paths text[] := '{}';
  one_result jsonb;
  one_paths text[];
  deleted_orders integer := 0;
begin
  if not public.is_admin() then
    raise exception 'FORBIDDEN';
  end if;

  select * into c
  from public.customers
  where id = p_customer_id
  for update;

  if not found then
    raise exception 'CUSTOMER_NOT_FOUND';
  end if;

  -- Delete every order belonging to this customer through the same safe
  -- order-cleanup logic, so reserved stock is released when necessary.
  for order_id in
    select id from public.orders where customer_id = p_customer_id
  loop
    one_result := public.delete_order_for_admin(order_id);
    one_paths := coalesce(
      array(
        select jsonb_array_elements_text(one_result -> 'receipt_paths')
      ),
      '{}'
    );
    all_receipt_paths := all_receipt_paths || one_paths;
    deleted_orders := deleted_orders + 1;
  end loop;

  -- addresses.customer_id is expected to cascade from the existing schema.
  delete from public.customers where id = p_customer_id;

  return jsonb_build_object(
    'customer_id', p_customer_id,
    'customer_name', c.full_name,
    'deleted_orders', deleted_orders,
    'receipt_paths', to_jsonb(all_receipt_paths)
  );
end
$$;

revoke all on function public.delete_customer_for_admin(uuid) from public, anon, authenticated;
grant execute on function public.delete_customer_for_admin(uuid) to authenticated;

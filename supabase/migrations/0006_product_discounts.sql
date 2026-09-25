-- LOZIA product flash-sale / discount pricing.
-- discount_value means FINAL sale price for "fixed", and percentage off for "percentage".
alter table public.products
  add column discount_enabled boolean not null default false,
  add column discount_type text not null default 'percentage' check (discount_type in ('fixed', 'percentage')),
  add column discount_value numeric(12, 2) not null default 0 check (discount_value >= 0);

alter table public.products
  add constraint products_discount_percentage_check
  check (discount_type <> 'percentage' or discount_value <= 100);

-- Rebuild checkout pricing so the database independently applies the active product sale.
create or replace function public.create_order(
  p_order_number text, p_token_hash text,
  p_email text, p_full_name text, p_phone text,
  p_address text, p_city text, p_state text, p_instructions text,
  p_items jsonb, p_shipping_fee numeric, p_expected_subtotal numeric
) returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_customer uuid; v_address uuid; v_order uuid;
  v_subtotal numeric := 0; v_total numeric;
  r record; v public.product_variants; v_product public.products; v_colour text; v_size text;
  v_normal_price numeric; v_price numeric;
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

    v_normal_price := coalesce(v.price, v_product.base_price);
    if v_product.discount_enabled and v_product.discount_value > 0 then
      if v_product.discount_type = 'fixed' then
        v_price := least(v_normal_price, round(v_product.discount_value / 1000) * 1000);
      else
        v_price := round((v_normal_price * (1 - least(100, greatest(0, v_product.discount_value)) / 100)) / 1000) * 1000;
      end if;
    else
      v_price := v_normal_price;
    end if;
    v_price := greatest(0, v_price);

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

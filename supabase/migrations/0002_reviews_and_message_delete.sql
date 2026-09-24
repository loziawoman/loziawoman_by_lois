create type public.review_status as enum ('visible', 'hidden', 'spotlight');

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 2 and 80),
  email text,
  rating int not null check (rating between 1 and 5),
  message text not null check (char_length(trim(message)) between 5 and 1000),
  status public.review_status not null default 'visible',
  created_at timestamptz not null default now()
);
create index reviews_public_idx on public.reviews (status, created_at desc);

alter table public.reviews enable row level security;

create policy reviews_public_read on public.reviews for select using (status in ('visible', 'spotlight'));
create policy reviews_staff_read on public.reviews for select using (public.is_staff());
create policy reviews_admin_write on public.reviews for all using (public.is_admin()) with check (public.is_admin());

create policy contact_admin_delete on public.contact_messages for delete using (public.is_admin());

insert into public.site_settings (key, value, is_public)
values ('review_submission_enabled', 'true'::jsonb, true)
on conflict (key) do nothing;

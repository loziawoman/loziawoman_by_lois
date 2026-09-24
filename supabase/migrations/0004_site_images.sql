-- Website content images. Public storefront read; admins can upload, replace and delete.
-- Image metadata is stored in public.site_settings under the `site_images` key.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('site-images', 'site-images', true, 4194304, array['image/jpeg', 'image/png', 'image/webp', 'image/avif'])
on conflict (id) do nothing;

create policy site_images_public_read on storage.objects
  for select using (bucket_id = 'site-images');

create policy site_images_admin_insert on storage.objects
  for insert with check (bucket_id = 'site-images' and public.is_admin());

create policy site_images_admin_update on storage.objects
  for update using (bucket_id = 'site-images' and public.is_admin());

create policy site_images_admin_delete on storage.objects
  for delete using (bucket_id = 'site-images' and public.is_admin());

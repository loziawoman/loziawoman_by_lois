-- Run once in the Supabase SQL editor AFTER creating your admin user in Authentication > Users.
-- Replace the email, then run. Roles: customer, staff, admin, super_admin.
update public.profiles set role = 'super_admin' where email = 'YOUR-ADMIN-EMAIL@example.com';

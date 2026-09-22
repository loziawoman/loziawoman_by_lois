-- DEMO CATALOGUE for local development and first-run previews.
-- Names, descriptions, prices and stock below are illustrative placeholders carried over from the original design demo.
-- Replace or delete them in /admin before launch. Safe to re-run: existing rows are left alone.

insert into public.categories (name, slug, sort_order) values
  ('Dresses', 'dresses', 1), ('Sets', 'sets', 2), ('Tailoring', 'tailoring', 3), ('Tops', 'tops', 4), ('Bottoms', 'bottoms', 5)
on conflict (slug) do nothing;

insert into public.sizes (name, sort_order) values ('XS', 1), ('S', 2), ('M', 3), ('L', 4), ('XL', 5)
on conflict (name) do nothing;

insert into public.colours (name, slug, hex, sort_order) values
  ('Terracotta', 'terracotta', '#a95949', 1), ('Ochre', 'ochre', '#b7894d', 2), ('Ink', 'ink', '#25211d', 3),
  ('Espresso', 'espresso', '#3a2820', 4), ('Bone', 'bone', '#d4c4aa', 5), ('Sage', 'sage', '#8b9580', 6),
  ('Parchment', 'parchment', '#cbbda5', 7), ('Black', 'black', '#211e1c', 8), ('Burgundy', 'burgundy', '#6f2637', 9),
  ('Chocolate', 'chocolate', '#65402d', 10), ('Emerald', 'emerald', '#23604f', 11), ('Cream', 'cream', '#e7dccc', 12),
  ('Burnt Rose', 'burnt-rose', '#a86a63', 13), ('Milk', 'milk', '#e7dccc', 14), ('Dusty Rose', 'dusty-rose', '#b7827d', 15),
  ('Olive', 'olive', '#70745b', 16)
on conflict (slug) do nothing;

-- Products (published so the storefront has something to show).
insert into public.products (name, slug, description, short_description, fabric, care, base_price, status, featured, category_id, original_colour_id)
select v.name, v.slug, v.description, v.short_description, v.fabric, v.care, v.price, 'published', v.featured,
       (select id from public.categories where slug = v.category), (select id from public.colours where slug = v.original)
from (values
  ('The Amara Dress', 'the-amara-dress', 'A considered silhouette with an asymmetric neckline and a soft, sculpted waist. Designed for entrances and the quiet moments after.', 'Asymmetric neckline, sculpted waist.', 'Fluid crepe', 'Dry clean only', 85000, true, 'dresses', 'terracotta'),
  ('The LOZIA Blazer', 'the-lozia-blazer', 'A precise, softly-structured blazer cut to lend its wearer a little more composure. Finished with a warm satin lining.', 'Softly structured, satin lined.', 'Wool blend', 'Dry clean only', 120000, true, 'tailoring', 'espresso'),
  ('The Atelier Set', 'the-atelier-set', 'A long, lean two-piece for days that begin at the studio and end somewhere worth remembering.', 'A long, lean two-piece.', 'Washed linen', 'Gentle machine wash', 95000, true, 'sets', 'sage'),
  ('The Noir Skirt', 'the-noir-skirt', 'A high-waisted column in liquid satin, with an architectural fold that catches the light as you move.', 'High-waisted satin column.', 'Satin-backed crepe', 'Dry clean only', 72000, true, 'bottoms', 'black'),
  ('The Solene Top', 'the-solene-top', 'Sculpted sleeves and a curved neckline make this silk top the punctuation mark of an otherwise simple look.', 'Sculpted sleeves, curved neckline.', 'Silk twill', 'Dry clean only', 58000, false, 'tops', 'burnt-rose'),
  ('The Muse Dress', 'the-muse-dress', 'A column of fluid jersey, falling from one draped shoulder. Uncomplicated, but never unobserved.', 'Fluid jersey, one draped shoulder.', 'Silk jersey', 'Hand wash cold', 78000, false, 'dresses', 'dusty-rose')
) as v(name, slug, description, short_description, fabric, care, price, featured, category, original)
on conflict (slug) do nothing;

-- Which colours and sizes each piece is offered in.
insert into public.product_colours (product_id, colour_id, sort_order)
select p.id, c.id, row_number() over (partition by p.id order by o.ord)
from (values
  ('the-amara-dress', 'terracotta', 1), ('the-amara-dress', 'ochre', 2), ('the-amara-dress', 'ink', 3),
  ('the-lozia-blazer', 'espresso', 1), ('the-lozia-blazer', 'bone', 2), ('the-lozia-blazer', 'ink', 3),
  ('the-atelier-set', 'sage', 1), ('the-atelier-set', 'parchment', 2),
  ('the-noir-skirt', 'black', 1), ('the-noir-skirt', 'burgundy', 2), ('the-noir-skirt', 'chocolate', 3), ('the-noir-skirt', 'emerald', 4), ('the-noir-skirt', 'cream', 5),
  ('the-solene-top', 'burnt-rose', 1), ('the-solene-top', 'milk', 2), ('the-solene-top', 'ink', 3),
  ('the-muse-dress', 'dusty-rose', 1), ('the-muse-dress', 'olive', 2)
) as o(pslug, cslug, ord)
join public.products p on p.slug = o.pslug join public.colours c on c.slug = o.cslug
on conflict do nothing;

insert into public.product_sizes (product_id, size_id, sort_order)
select p.id, s.id, s.sort_order
from public.products p
join public.sizes s on (
  (p.slug in ('the-amara-dress', 'the-lozia-blazer', 'the-solene-top') and s.name in ('XS', 'S', 'M', 'L', 'XL')) or
  (p.slug = 'the-atelier-set' and s.name in ('S', 'M', 'L', 'XL')) or
  (p.slug in ('the-noir-skirt', 'the-muse-dress') and s.name in ('XS', 'S', 'M', 'L'))
)
on conflict do nothing;

-- One variant per colour x size. DEMO stock only: every variant starts at 4, and the last size of each colour is sold out.
insert into public.product_variants (product_id, colour_id, size_id, sku, stock_quantity, is_active)
select pc.product_id, pc.colour_id, ps.size_id,
       'DEMO-' || upper(left(p.slug, 12)) || '-' || upper(left(c.slug, 4)) || '-' || s.name,
       case when ps.sort_order = (select max(sort_order) from public.product_sizes where product_id = pc.product_id) then 0 else 4 end,
       true
from public.product_colours pc
join public.product_sizes ps on ps.product_id = pc.product_id
join public.products p on p.id = pc.product_id
join public.colours c on c.id = pc.colour_id
join public.sizes s on s.id = ps.size_id
on conflict do nothing;

-- Images point at files in /public/images for the demo. Uploads made in /admin use Supabase Storage instead.
insert into public.product_images (product_id, public_url, alt_text, sort_order, is_primary, mask_public_url)
select p.id, i.url, p.name, 0, true, i.mask
from (values
  ('the-amara-dress', '/images/amara-dress.jpg', null),
  ('the-lozia-blazer', '/images/lozia-blazer.jpg', null),
  ('the-atelier-set', '/images/atelier-set.jpg', null),
  ('the-noir-skirt', '/images/noir-skirt.jpg', '/images/noir-skirt-mask.svg'),
  ('the-solene-top', '/images/solene-top.jpg', null),
  ('the-muse-dress', '/images/muse-dress.jpg', null)
) as i(slug, url, mask)
join public.products p on p.slug = i.slug
where not exists (select 1 from public.product_images pi where pi.product_id = p.id);

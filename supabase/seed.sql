-- =====================================================================
-- OPTIONAL development seed data.
--
-- Creates the three launch categories and a handful of clearly marked
-- DEMO products so the showroom can be previewed before real products
-- are added. Demo products are NOT real store products.
--
-- Remove them before launch with supabase/remove-demo-data.sql
-- (every demo product slug starts with "demo-").
-- =====================================================================

insert into public.categories (name, slug, description, sort_order, is_active) values
  ('Trolley Bags', 'trolley-bags',
   'Hard-shell and soft-sided trolley luggage for every kind of journey.', 1, true),
  ('School Bags', 'school-bags',
   'Durable, comfortable school bags and backpacks for everyday use.', 2, true),
  ('Ladies Purses', 'ladies-purses',
   'Handbags, slings and purses for work, travel and occasions.', 3, true)
on conflict (slug) do nothing;

insert into public.products (
  name, slug, category_id, short_description, description,
  features, specifications, available_colors,
  is_featured, is_new_arrival, is_active, sort_order
)
select
  v.name, v.slug, c.id, v.short_description, v.description,
  v.features::jsonb, v.specifications::jsonb, v.available_colors::jsonb,
  v.is_featured, v.is_new_arrival, true, v.sort_order
from (values
  ('DEMO – Hard-shell Trolley 24"', 'demo-hard-shell-trolley-24', 'trolley-bags',
   'Demo product. Replace with a real trolley bag before launch.',
   'This is placeholder content used to preview the product page layout. It does not describe a real product in the store.',
   '[{"label":"Material","value":"ABS"},{"label":"Size","value":"24 inch"},{"label":"Wheels","value":"4 wheel spinner"},{"label":"Lock","value":"Number lock"}]',
   '{"material":"ABS","size":"24 inch","wheels":"4 wheel","lock":"Number lock"}',
   '[{"name":"Black","hex":"#111111"},{"name":"Navy","hex":"#1F2A44"}]',
   true, true, 1),
  ('DEMO – Cabin Trolley 20"', 'demo-cabin-trolley-20', 'trolley-bags',
   'Demo product. Replace with a real cabin trolley before launch.',
   'Placeholder content for layout preview only.',
   '[{"label":"Size","value":"20 inch"},{"label":"Wheels","value":"4 wheel"}]',
   '{"size":"20 inch","wheels":"4 wheel"}',
   '[{"name":"Grey","hex":"#8A8A8A"}]',
   true, false, 2),
  ('DEMO – Everyday School Backpack', 'demo-everyday-school-backpack', 'school-bags',
   'Demo product. Replace with a real school bag before launch.',
   'Placeholder content for layout preview only.',
   '[{"label":"Compartments","value":"3"},{"label":"Padded straps","value":"Yes"}]',
   '{"compartments":"3","laptop_sleeve":"No"}',
   '[{"name":"Blue","hex":"#2B4C7E"},{"name":"Red","hex":"#9E2B25"}]',
   true, true, 3),
  ('DEMO – Structured Handbag', 'demo-structured-handbag', 'ladies-purses',
   'Demo product. Replace with a real purse before launch.',
   'Placeholder content for layout preview only.',
   '[{"label":"Closure","value":"Zip"},{"label":"Strap","value":"Detachable"}]',
   '{"closure":"Zip","strap":"Detachable"}',
   '[{"name":"Blush Pink","hex":"#D8A7A0"},{"name":"Black","hex":"#111111"}]',
   true, true, 4)
) as v(name, slug, category_slug, short_description, description,
       features, specifications, available_colors,
       is_featured, is_new_arrival, sort_order)
join public.categories c on c.slug = v.category_slug
on conflict (slug) do nothing;

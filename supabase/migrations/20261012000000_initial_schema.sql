-- =====================================================================
-- Sachdeva Carry Hub — initial schema
--
-- Digital showroom only: categories, products, product images and
-- store settings. No carts, orders, customers or inventory.
--
-- Safe to run once on a fresh Supabase project (SQL editor or
-- `supabase db push`). Re-running is guarded where practical.
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------
-- Admin authorization
--
-- Being signed in is NOT enough to be an admin. A user is an admin only
-- if their auth user id is listed in public.admin_users. Rows can only be
-- added with the service role (SQL editor / scripts/create-admin.mjs);
-- there is no policy that allows writing this table through the API.
-- ---------------------------------------------------------------------

create table if not exists public.admin_users (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.admin_users enable row level security;

drop policy if exists "Admins can read their own admin row" on public.admin_users;
create policy "Admins can read their own admin row"
  on public.admin_users for select
  to authenticated
  using (user_id = (select auth.uid()));

-- SECURITY DEFINER so policies can check membership without granting
-- read access to the whole admin table.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.admin_users a where a.user_id = (select auth.uid())
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

-- ---------------------------------------------------------------------
-- categories
-- ---------------------------------------------------------------------

create table if not exists public.categories (
  id              uuid primary key default gen_random_uuid(),
  name            varchar(120) not null check (char_length(btrim(name)) > 0),
  slug            varchar(140) not null unique
                    check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  description     text,
  image_url       text,
  image_public_id text,
  is_active       boolean not null default true,
  sort_order      integer not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

drop trigger if exists categories_set_updated_at on public.categories;
create trigger categories_set_updated_at
  before update on public.categories
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- products
-- ---------------------------------------------------------------------

create table if not exists public.products (
  id                uuid primary key default gen_random_uuid(),
  name              varchar(160) not null check (char_length(btrim(name)) > 0),
  slug              varchar(180) not null unique
                      check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  -- RESTRICT: a category that still has products cannot be deleted.
  category_id       uuid references public.categories (id) on delete restrict,
  short_description text,
  description       text,
  -- [{ "label": "Material", "value": "ABS" }, ...]
  features          jsonb not null default '[]'::jsonb
                      check (jsonb_typeof(features) = 'array'),
  -- { "material": "ABS", "size": "24 inch" }
  specifications    jsonb not null default '{}'::jsonb
                      check (jsonb_typeof(specifications) = 'object'),
  -- [{ "name": "Black", "hex": "#111111" }, ...]
  available_colors  jsonb not null default '[]'::jsonb
                      check (jsonb_typeof(available_colors) = 'array'),
  is_featured       boolean not null default false,
  is_new_arrival    boolean not null default false,
  is_active         boolean not null default true,
  sort_order        integer not null default 0,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

drop trigger if exists products_set_updated_at on public.products;
create trigger products_set_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- product_images
-- ---------------------------------------------------------------------

create table if not exists public.product_images (
  id                   uuid primary key default gen_random_uuid(),
  product_id           uuid not null references public.products (id) on delete cascade,
  cloudinary_public_id text not null,
  image_url            text not null,
  alt_text             text,
  width                integer check (width is null or width > 0),
  height               integer check (height is null or height > 0),
  format               text,
  sort_order           integer not null default 0,
  is_primary           boolean not null default false,
  created_at           timestamptz not null default now()
);

-- The same Cloudinary asset cannot be attached to a product twice.
create unique index if not exists product_images_unique_asset_per_product
  on public.product_images (product_id, cloudinary_public_id);

-- Only ONE primary image per product, enforced by the database.
create unique index if not exists product_images_one_primary_per_product
  on public.product_images (product_id)
  where is_primary;

-- ---------------------------------------------------------------------
-- store_settings (single row)
-- ---------------------------------------------------------------------

create table if not exists public.store_settings (
  id              uuid primary key default gen_random_uuid(),
  -- guarantees there is never more than one settings row
  singleton       boolean not null default true unique check (singleton),
  store_name      text,
  owner_name      text,
  phone_primary   text,
  phone_secondary text,
  whatsapp_number text,
  address         text,
  city            text,
  state           text,
  pincode         text,
  instagram_url   text,
  google_maps_url text,
  logo_url        text,
  favicon_url     text,
  established_on  date,
  updated_at      timestamptz not null default now()
);

drop trigger if exists store_settings_set_updated_at on public.store_settings;
create trigger store_settings_set_updated_at
  before update on public.store_settings
  for each row execute function public.set_updated_at();

insert into public.store_settings (
  store_name, owner_name, phone_primary, phone_secondary, whatsapp_number,
  address, city, state, pincode, instagram_url, google_maps_url, established_on
) values (
  'Sachdeva Carry Hub',
  'Dhruv Sachdeva',
  '7248543292',
  '9045626771',
  '9411276440',
  'Moh. Pahari Darwaza, Near Sundar Lal Hospital',
  'Nagina, Bijnor',
  'Uttar Pradesh',
  null,
  'https://www.instagram.com/sachdevacarryhub/',
  'https://www.google.com/maps/search/?api=1&query=Pahari+Darwaza+Near+Sundar+Lal+Hospital+Nagina+Bijnor',
  '2026-09-26'
)
on conflict (singleton) do nothing;

-- ---------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------

-- products.slug and categories.slug are indexed by their UNIQUE constraints.
create index if not exists products_category_id_idx    on public.products (category_id);
create index if not exists products_is_active_idx      on public.products (is_active);
create index if not exists products_is_featured_idx    on public.products (is_featured) where is_featured;
create index if not exists products_is_new_arrival_idx on public.products (is_new_arrival) where is_new_arrival;
create index if not exists products_listing_idx        on public.products (is_active, sort_order, created_at desc);
create index if not exists categories_is_active_idx    on public.categories (is_active, sort_order);
create index if not exists product_images_product_id_idx
  on public.product_images (product_id, sort_order);

-- ---------------------------------------------------------------------
-- Row Level Security
--
-- Public (anon) visitors can only READ:
--   * active categories
--   * active products that belong to an active category
--   * images of those products
--   * store settings
-- All writes require public.is_admin().
-- ---------------------------------------------------------------------

alter table public.categories     enable row level security;
alter table public.products       enable row level security;
alter table public.product_images enable row level security;
alter table public.store_settings enable row level security;

-- categories
drop policy if exists "Public can read active categories" on public.categories;
create policy "Public can read active categories"
  on public.categories for select
  to anon, authenticated
  using (is_active or (select public.is_admin()));

drop policy if exists "Admins can insert categories" on public.categories;
create policy "Admins can insert categories"
  on public.categories for insert
  to authenticated
  with check ((select public.is_admin()));

drop policy if exists "Admins can update categories" on public.categories;
create policy "Admins can update categories"
  on public.categories for update
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

drop policy if exists "Admins can delete categories" on public.categories;
create policy "Admins can delete categories"
  on public.categories for delete
  to authenticated
  using ((select public.is_admin()));

-- products
drop policy if exists "Public can read active products" on public.products;
create policy "Public can read active products"
  on public.products for select
  to anon, authenticated
  using (
    (select public.is_admin())
    or (
      is_active
      and exists (
        select 1 from public.categories c
        where c.id = products.category_id and c.is_active
      )
    )
  );

drop policy if exists "Admins can insert products" on public.products;
create policy "Admins can insert products"
  on public.products for insert
  to authenticated
  with check ((select public.is_admin()));

drop policy if exists "Admins can update products" on public.products;
create policy "Admins can update products"
  on public.products for update
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

drop policy if exists "Admins can delete products" on public.products;
create policy "Admins can delete products"
  on public.products for delete
  to authenticated
  using ((select public.is_admin()));

-- product_images (visibility follows the parent product's policy)
drop policy if exists "Public can read images of visible products" on public.product_images;
create policy "Public can read images of visible products"
  on public.product_images for select
  to anon, authenticated
  using (
    exists (select 1 from public.products p where p.id = product_images.product_id)
  );

drop policy if exists "Admins can insert product images" on public.product_images;
create policy "Admins can insert product images"
  on public.product_images for insert
  to authenticated
  with check ((select public.is_admin()));

drop policy if exists "Admins can update product images" on public.product_images;
create policy "Admins can update product images"
  on public.product_images for update
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

drop policy if exists "Admins can delete product images" on public.product_images;
create policy "Admins can delete product images"
  on public.product_images for delete
  to authenticated
  using ((select public.is_admin()));

-- store_settings
drop policy if exists "Public can read store settings" on public.store_settings;
create policy "Public can read store settings"
  on public.store_settings for select
  to anon, authenticated
  using (true);

drop policy if exists "Admins can insert store settings" on public.store_settings;
create policy "Admins can insert store settings"
  on public.store_settings for insert
  to authenticated
  with check ((select public.is_admin()));

drop policy if exists "Admins can update store settings" on public.store_settings;
create policy "Admins can update store settings"
  on public.store_settings for update
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- Table privileges (RLS above still decides which rows are reachable).
grant usage on schema public to anon, authenticated;
grant select on public.categories, public.products, public.product_images, public.store_settings
  to anon, authenticated;
grant insert, update, delete on public.categories, public.products, public.product_images
  to authenticated;
grant insert, update on public.store_settings to authenticated;
grant select on public.admin_users to authenticated;
revoke insert, update, delete on public.admin_users from anon, authenticated;

-- ---------------------------------------------------------------------
-- save_product: create or update a product AND its gallery atomically.
--
-- SECURITY INVOKER: runs with the caller's privileges, so RLS applies,
-- and it additionally refuses non-admins explicitly.
--
-- p_images: ordered array. Existing images carry "id"; new uploads carry
-- the Cloudinary metadata. Images of this product that are missing from
-- the array are deleted; their Cloudinary public ids are returned so the
-- server can remove the assets after the transaction commits.
-- ---------------------------------------------------------------------

create or replace function public.save_product(
  p_id      uuid,
  p_product jsonb,
  p_images  jsonb
)
returns table (saved_id uuid, saved_slug text, removed_public_ids text[])
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_id          uuid;
  v_slug        text;
  v_removed     text[];
  v_keep_ids    uuid[];
  v_has_primary boolean;
  v_img         jsonb;
  v_pos         integer;
begin
  if not public.is_admin() then
    raise exception 'Not authorized' using errcode = '42501';
  end if;

  if jsonb_typeof(coalesce(p_images, '[]'::jsonb)) <> 'array' then
    raise exception 'p_images must be an array' using errcode = '22023';
  end if;

  if p_id is null then
    insert into public.products (
      name, slug, category_id, short_description, description, features,
      specifications, available_colors, is_featured, is_new_arrival, is_active, sort_order
    ) values (
      p_product->>'name',
      p_product->>'slug',
      (p_product->>'category_id')::uuid,
      nullif(p_product->>'short_description', ''),
      nullif(p_product->>'description', ''),
      coalesce(p_product->'features', '[]'::jsonb),
      coalesce(p_product->'specifications', '{}'::jsonb),
      coalesce(p_product->'available_colors', '[]'::jsonb),
      coalesce((p_product->>'is_featured')::boolean, false),
      coalesce((p_product->>'is_new_arrival')::boolean, false),
      coalesce((p_product->>'is_active')::boolean, true),
      coalesce((p_product->>'sort_order')::integer, 0)
    )
    returning id, slug into v_id, v_slug;
  else
    update public.products set
      name              = p_product->>'name',
      slug              = p_product->>'slug',
      category_id       = (p_product->>'category_id')::uuid,
      short_description = nullif(p_product->>'short_description', ''),
      description       = nullif(p_product->>'description', ''),
      features          = coalesce(p_product->'features', '[]'::jsonb),
      specifications    = coalesce(p_product->'specifications', '{}'::jsonb),
      available_colors  = coalesce(p_product->'available_colors', '[]'::jsonb),
      is_featured       = coalesce((p_product->>'is_featured')::boolean, false),
      is_new_arrival    = coalesce((p_product->>'is_new_arrival')::boolean, false),
      is_active         = coalesce((p_product->>'is_active')::boolean, true),
      sort_order        = coalesce((p_product->>'sort_order')::integer, 0)
    where id = p_id
    returning id, slug into v_id, v_slug;

    if v_id is null then
      raise exception 'Product not found' using errcode = 'P0002';
    end if;
  end if;

  -- Existing images that the admin kept.
  select coalesce(array_agg((e->>'id')::uuid), '{}')
    into v_keep_ids
    from jsonb_array_elements(coalesce(p_images, '[]'::jsonb)) e
   where nullif(e->>'id', '') is not null;

  -- Images removed in this save.
  with removed as (
    delete from public.product_images pi
     where pi.product_id = v_id
       and not (pi.id = any (v_keep_ids))
    returning pi.cloudinary_public_id
  )
  select coalesce(array_agg(cloudinary_public_id), '{}') into v_removed from removed;

  -- Reset primary flag first so the unique index is never violated.
  update public.product_images set is_primary = false
   where product_id = v_id and is_primary;

  select exists (
    select 1 from jsonb_array_elements(coalesce(p_images, '[]'::jsonb)) e
     where coalesce((e->>'is_primary')::boolean, false)
  ) into v_has_primary;

  for v_img, v_pos in
    select e, (o - 1)::integer
      from jsonb_array_elements(coalesce(p_images, '[]'::jsonb)) with ordinality as t(e, o)
  loop
    if nullif(v_img->>'id', '') is not null then
      update public.product_images set
        sort_order = v_pos,
        alt_text   = nullif(v_img->>'alt_text', ''),
        -- the first image becomes primary when none was chosen
        is_primary = case
                       when v_has_primary then coalesce((v_img->>'is_primary')::boolean, false)
                       else v_pos = 0
                     end
      where id = (v_img->>'id')::uuid
        and product_id = v_id;
    else
      insert into public.product_images (
        product_id, cloudinary_public_id, image_url, alt_text,
        width, height, format, sort_order, is_primary
      ) values (
        v_id,
        v_img->>'cloudinary_public_id',
        v_img->>'image_url',
        nullif(v_img->>'alt_text', ''),
        (v_img->>'width')::integer,
        (v_img->>'height')::integer,
        nullif(v_img->>'format', ''),
        v_pos,
        case
          when v_has_primary then coalesce((v_img->>'is_primary')::boolean, false)
          else v_pos = 0
        end
      );
    end if;
  end loop;

  return query select v_id, v_slug, v_removed;
end;
$$;

revoke all on function public.save_product(uuid, jsonb, jsonb) from public, anon;
grant execute on function public.save_product(uuid, jsonb, jsonb) to authenticated;

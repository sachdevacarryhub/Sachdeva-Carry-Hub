# Sachdeva Carry Hub — Digital Showroom

A premium digital showroom for **Sachdeva Carry Hub**, a physical bag store in Nagina, Bijnor
(trolley bags, school bags, ladies purses). Customers discover products online or by scanning a
product QR sticker in the store, then **WhatsApp, call, or visit the store**.

> This is **not** an e-commerce site. There is no cart, checkout, payment, orders, customer
> accounts, inventory, wishlist or reviews.

---

📚 **More documentation** in [`docs/`](docs/README.md): [Architecture](docs/ARCHITECTURE.md) ·
[Database](docs/DATABASE.md) · [API](docs/API.md) · [Security](docs/SECURITY.md) ·
[Images & QR](docs/MEDIA.md) · [Deployment](docs/DEPLOYMENT.md) ·
[Development](docs/DEVELOPMENT.md) · [Troubleshooting](docs/TROUBLESHOOTING.md) ·
[Admin guide (store owner)](docs/ADMIN_GUIDE.md)

## Features

**Public website**

- Home: hero, category showcase, featured collection, new arrivals, store intro, visit CTA, map
- `/products`: server-side search plus category, featured and new-arrival filters (shareable URLs)
- `/category/[slug]`: category header and instant in-browser search and filters
- `/product/[slug]`: gallery (thumbnails, swipe, keyboard, desktop hover-zoom), features,
  specifications, colours, **WhatsApp enquiry** (pre-filled with product name and URL), **Call
  Now**, related products, and a sticky mobile CTA bar
- `/about`, `/contact` (Google Maps embed and directions), `/robots.txt`, `/sitemap.xml`
- Dynamic SEO metadata, canonical URLs, Open Graph, Twitter cards, and JSON-LD (Store and
  BreadcrumbList)
- Real HTTP 404 for unknown, inactive, or hidden products and categories
- Graceful image fallbacks (line-art placeholders) for missing or broken images

**Admin panel (`/admin`)**

- Supabase Auth login, protected by an explicit `admin_users` allow-list (not just "logged in")
- Dashboard: total products, categories, featured, new arrivals, and recently added
- Products: create, edit, delete; quick toggles for featured, new arrival and active; search and
  filter
- Images: multi-upload, client-side resize and WebP compression, upload progress, drag or arrow
  reorder, set primary, delete, alt text
- Categories: create, edit, delete (blocked while products exist), activate or deactivate, image
- QR codes: website QR and per-product QR with preview, PNG/SVG download and print
- Store Information: every phone, WhatsApp, address, Instagram, Maps and logo shown on the site
- Settings: configuration status, change password, sign out

## Tech stack

Next.js 16 (App Router, Cache Components, TypeScript strict) · Tailwind CSS v4 · Framer Motion ·
Supabase (Postgres, Auth, RLS) · Cloudinary · Zod · `qrcode` · Vercel

## Folder structure

```
src/
  app/
    (site)/              public pages (shared navbar/footer layout)
      page.tsx           home
      products/  category/[slug]/  product/[slug]/  about/  contact/
    admin/
      login/             admin sign-in (public)
      (panel)/           protected admin pages: dashboard, products, categories, qr, settings, account
    api/                 route handlers: products, categories, upload, qr, settings
    robots.ts  sitemap.ts  layout.tsx  not-found.tsx  globals.css
  components/            ui, navbar, footer, home, products, categories, admin, forms, qr, shared, layout
  lib/
    supabase/            public (cached), server (cookie session), browser, proxy clients
    auth/                admin authorization (server-side)
    data/                public cached queries, admin queries, revalidation, slugs
    cloudinary/          signed upload/destroy (server-only), image loader
    images/              client-side optimisation (resize, WebP)
    qr/                  QR generation
    validations/         Zod schemas
    utils/               slug, contact links, formatting
  proxy.ts               session refresh and optimistic admin redirects
  types/
supabase/
  migrations/20261012000000_initial_schema.sql   tables, indexes, RLS, functions
  seed.sql                                       optional categories and DEMO products
  remove-demo-data.sql                           removes DEMO products
scripts/create-admin.mjs                         creates or promotes an admin user
```

## Local setup

Requires Node.js 20+.

```bash
npm install
cp .env.local.example .env.local   # then fill in the values (see below)
npm run dev                         # http://localhost:3000
```

### Environment variables

| Variable                        | Where used                    | Notes                                                                 |
| ------------------------------- | ----------------------------- | --------------------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | browser + server              | Supabase → Project Settings → API                                     |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | browser + server              | anon key, or the new publishable key (`sb_publishable_…`)             |
| `SUPABASE_SERVICE_ROLE_KEY`     | `npm run admin:create` only   | **Secret.** Not used by the running website, never sent to the browser |
| `CLOUDINARY_CLOUD_NAME`         | server only                   | Cloudinary dashboard                                                  |
| `CLOUDINARY_API_KEY`            | server only                   |                                                                       |
| `CLOUDINARY_API_SECRET`         | server only                   | **Secret.** Uploads are signed on the server                          |
| `NEXT_PUBLIC_SITE_URL`          | canonical URLs, sitemap, QR   | e.g. `https://sachdevacarryhub.in` (no trailing slash). Locally `http://localhost:3000` |

`.env`, `.env.local` and `.env.*.local` are git-ignored. If a variable is missing, the site shows
graceful empty states, the admin login explains what is missing, and the QR page refuses to
generate codes rather than printing broken ones.

> `NEXT_PUBLIC_*` values are embedded at build time: rebuild or redeploy after changing them.

## Supabase setup

1. Create a project at [supabase.com](https://supabase.com).
2. Open **SQL Editor**, paste the contents of
   `supabase/migrations/20261012000000_initial_schema.sql`, and run it. This creates the tables,
   indexes, RLS policies, the `is_admin()` and `save_product()` functions, and the store settings
   row with the business details.
   - Alternatively, with the Supabase CLI: `supabase link --project-ref <ref>` then `supabase db push`.
3. *(Optional)* Run `supabase/seed.sql` to add the three categories and four **DEMO** products.
   Remove the demo products before launch with `supabase/remove-demo-data.sql` (categories are kept).
4. Copy the URL and anon (publishable) key into `.env.local`.

### Admin setup

Admins are users listed in `public.admin_users`. Logging in alone does **not** grant access.

```bash
# needs NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in .env.local
npm run admin:create -- owner@example.com 'a-strong-password'
```

This creates the user (email pre-confirmed) and grants admin access. Running it for an existing
user only grants access. Then sign in at `/admin/login`.

Manual alternative: create the user in **Authentication → Users**, then in the SQL editor run
`insert into public.admin_users (user_id) select id from auth.users where email = 'owner@example.com';`

You can also turn off public sign-ups (**Authentication → Providers → Email → Allow new users to
sign up**). Admin access is safe either way, because only `admin_users` members can write.

## Cloudinary setup

1. Create a free account at [cloudinary.com](https://cloudinary.com).
2. Copy **Cloud name**, **API key** and **API secret** into `.env.local`.
3. Nothing else is required. Uploads are signed server-side and stored as WebP under:

```
sachdeva-carry-hub/
  products/<category-slug>/   e.g. products/trolley-bags/
  categories/
  branding/                   logo and favicon uploads
```

Images are delivered through Cloudinary's CDN with automatic format, quality and width (see
`src/lib/cloudinary/loader.ts`).

**Image pipeline:** select → validate type and size → resize (max 1800px wide) → compress →
WebP (~80–85%, target ≤ 300 KB) → signed upload → metadata saved in Supabase. Original
uncompressed files are never uploaded. When an image or product is deleted, its Cloudinary asset
is removed after the database change commits; failures are logged server-side.

## Security model

- **RLS** on every table. Anonymous visitors can only `SELECT` active categories, active products
  in active categories, their images, and store settings.
- All writes require `public.is_admin()` (membership in `admin_users`) at the database level.
- Every admin page and mutation API re-checks admin status server-side. The API also rejects
  cross-origin mutation requests and validates all input with Zod. The proxy redirect is only a
  UX convenience.
- `SUPABASE_SERVICE_ROLE_KEY` and `CLOUDINARY_API_SECRET` are only read in server-only modules
  (`server-only` import guard).

## Caching and revalidation

Public data uses `"use cache"` with cache tags (`products`, `categories`, `store-settings`). Admin
mutations call `revalidateTag(tag, { expire: 0 })`, so the public site reflects changes on the
next request without a redeploy. Product and category pages are fully static
(`ensureStatic = "navigation"`). New slugs are rendered on first visit, then cached.

## QR codes

Product QR codes encode `NEXT_PUBLIC_SITE_URL/product/<slug>` and are generated on demand (never
stored). Changing a product's slug changes its URL, so the admin form warns that printed stickers
must be reprinted. Deactivating a product makes its QR show the "not found" page until it is
reactivated.

## Commands

```bash
npm run dev          # development server
npm run build        # production build
npm run start        # serve the production build
npm run lint         # ESLint
npm run typecheck    # TypeScript (tsc --noEmit)
npm run format       # Prettier
npm run admin:create -- <email> <password>
```

## Deploying to Vercel

1. Push the repository to GitHub.
2. In Vercel: **Add New → Project**, then import the repository (framework is detected as Next.js).
3. Add all environment variables from the table above. Set `NEXT_PUBLIC_SITE_URL` to the final
   domain, e.g. `https://sachdevacarryhub.in`.
4. Deploy, then add your custom domain under **Settings → Domains**.
5. Generate and print QR codes **after** the final domain is set (QR codes embed the site URL).

## Before launch checklist

- [ ] Run `supabase/remove-demo-data.sql` and add real products with real photos
- [ ] Confirm the store details in **Admin → Store Information** (pincode, Google Maps link)
- [ ] Set `NEXT_PUBLIC_SITE_URL` to the production domain, redeploy, then print QR codes

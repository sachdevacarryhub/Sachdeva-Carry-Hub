# Deployment

Target: **Vercel** (Next.js 16) + **Supabase** + **Cloudinary**.

## 1. Supabase (production project)

1. Create the project (region close to India, e.g. Mumbai `ap-south-1`).
2. SQL Editor → run `supabase/migrations/20261012000000_initial_schema.sql`.
   (CLI alternative: `supabase link --project-ref <ref>` then `supabase db push`.)
3. Do **not** run `seed.sql` in production unless you want DEMO products; if you did, run
   `supabase/remove-demo-data.sql`.
4. Authentication → Providers → Email: optionally turn off "Allow new users to sign up".
5. Authentication → URL Configuration: set **Site URL** to the production domain.
6. Create the admin from your machine (needs the service role key in `.env.local`):
   `npm run admin:create -- owner@example.com 'strong-password'`.

## 2. Cloudinary

Copy Cloud name / API key / API secret. No upload presets or folders need to be created.

## 3. Vercel

1. Push to GitHub → Vercel **Add New → Project** → import (framework auto-detected).
2. Environment variables (Production, and Preview if used):

   | Variable                        | Value                                   |
   | ------------------------------- | --------------------------------------- |
   | `NEXT_PUBLIC_SUPABASE_URL`      | `https://<ref>.supabase.co`             |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon / publishable key                  |
   | `CLOUDINARY_CLOUD_NAME`         |                                         |
   | `CLOUDINARY_API_KEY`            |                                         |
   | `CLOUDINARY_API_SECRET`         |                                         |
   | `NEXT_PUBLIC_SITE_URL`          | `https://sachdevacarryhub.in` (no trailing slash) |

   `SUPABASE_SERVICE_ROLE_KEY` is **not needed** on Vercel (only the local admin script uses it).
   Leave it out to keep the blast radius small.
3. Deploy. Build command `npm run build`, output default.
4. Settings → Domains → add the domain and follow the DNS instructions.

> `NEXT_PUBLIC_*` variables are baked in at **build** time. After changing one (e.g. the domain),
> **redeploy**.

### Preview deployments

Preview URLs differ from `NEXT_PUBLIC_SITE_URL`, so canonical links/QR codes point at production.
That's intended. If previews should use a separate database, give the Preview environment its own
Supabase variables.

## 4. Go-live checklist

- [ ] Migration applied; `store_settings` row shows the right details (Admin → Store Information):
      phones, WhatsApp, address, pincode, Google Maps link, Instagram
- [ ] Demo products removed; real products with photos added
- [ ] Admin login works on the production domain; a non-admin account is refused
- [ ] `NEXT_PUBLIC_SITE_URL` = final domain, redeployed
- [ ] `https://<domain>/robots.txt` and `/sitemap.xml` show the production domain
- [ ] Scan a test product QR with a phone → opens the product → WhatsApp/Call work
- [ ] Print QR stickers
- [ ] Submit the sitemap in Google Search Console; create/claim the Google Business Profile and
      put its link in Google Maps URL

## 5. Operations

- **Content updates** appear immediately (cache tags expire on every admin save). No redeploy.
- **Code updates**: push to the main branch → Vercel builds and deploys. A new deploy starts with
  an empty data cache; first visits repopulate it.
- **Backups**: Supabase dashboard → Database → Backups (daily on paid plans). Product images live
  in Cloudinary.
- **Logs**: Vercel → Project → Logs. Look for `[data:…]`, `[db:…]`, `[cloudinary:…]`, `[upload]`
  prefixes.

## Local production check

```bash
npm run build && npm run start   # http://localhost:3000
```

# Troubleshooting

| Symptom | Cause | Fix |
| ------- | ----- | --- |
| Terminal: `[data] Supabase tables are missing…` / `PGRST205 Could not find the table` | Migration not applied to this Supabase project | Run `supabase/migrations/20261012000000_initial_schema.sql` in the SQL editor, then restart `npm run dev` |
| Site shows "Coming soon" / "temporarily unavailable" everywhere | Supabase env vars missing or DB unreachable | Check `NEXT_PUBLIC_SUPABASE_URL` / `_ANON_KEY`; failures are cached only a few minutes |
| A change made directly in the Supabase dashboard doesn't appear | Public data is cached (up to 1 h) and only admin-panel saves expire the cache | Edit through the admin panel, or restart/redeploy |
| Login: "This account does not have admin access" | User exists but isn't in `admin_users` | `npm run admin:create -- <email>` (no password needed for existing users) |
| Login: "Supabase is not configured" | Env vars missing at build/start | Fill `.env.local`, restart (rebuild for production) |
| `npm run admin:create`: "Did you run the migration?" | `admin_users` table missing | Apply the migration first |
| Upload: "Cloudinary is not configured" (503) | Cloudinary env vars missing | Set the three `CLOUDINARY_*` vars, restart |
| Upload: 415 "does not look like a valid image" | File isn't really JPEG/PNG/WebP (e.g. HEIC renamed) | Export as JPEG from the phone/photo app |
| Upload: 413 | File > 4 MB after compression (very unusual) | Use a smaller photo |
| QR page: "Website URL is not configured" | `NEXT_PUBLIC_SITE_URL` missing/invalid | Set it (e.g. `https://sachdevacarryhub.in`), rebuild/redeploy |
| Scanned QR shows "not found" | Product inactive, its category inactive, deleted, or slug changed | Reactivate, or reprint the sticker for the new slug |
| Dev overlay: "Next.js encountered uncached data during prerendering…" on an admin route | New admin page missing the opt-out | Add `export const instant = false` (see DEVELOPMENT.md) |
| Build: "Route … used `searchParams`/`cookies()` … ensureStatic" | Request-time API used in `/product/[slug]` or `/category/[slug]` | Keep those pages cached-data only; move interactivity to client components |
| Build: `generateStaticParams` returned empty | Cache Components requires ≥ 1 | Return `[{ slug: PLACEHOLDER_SLUG }]` when empty |
| Category can't be deleted (409) | It still has products (FK `RESTRICT`) | Move/delete products, or just deactivate the category |
| "That URL slug is already in use" | Manually typed a slug owned by another item | Choose another; auto-generated slugs get `-2` automatically |
| WhatsApp button missing | No valid WhatsApp number or primary phone in settings | Admin → Store Information |
| Map not showing on Contact | Address empty | Fill address/city in Store Information |
| Old WhatsApp number still showing after editing in Supabase directly | Settings cache | Save once from Admin → Store Information, or restart |

## Where to look

- **Local**: the `npm run dev` terminal (server logs) and the browser console.
- **Production**: Vercel → Logs. Prefixes: `[data:*]` public reads, `[admin-data:*]` admin reads,
  `[db:*]` mutation errors, `[cloudinary:*]` / `[upload]` image issues, `[qr:*]`.
- **Database**: Supabase → Logs → Postgres / API.

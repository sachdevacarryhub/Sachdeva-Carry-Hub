# Security

## Threat model (short)

The only private capability is **editing the catalogue and store details**. Public data is
meant to be public. So the goals are: only approved admins can write; visitors can never see
inactive content; secrets never reach the browser; uploads can't be abused.

## Layers of defence

| Layer                   | Where                                   | What it does                                                    |
| ----------------------- | --------------------------------------- | --------------------------------------------------------------- |
| Database (authoritative)| RLS + `is_admin()` + `save_product`     | All writes require membership in `admin_users`; reads filtered by `is_active` |
| Server pages            | `requireAdmin()` in `(panel)/layout.tsx` and every admin page | Redirects non-admins to login before any data loads |
| API                     | `guardAdmin()` in every mutating handler | Same-origin check, then admin check; Zod validation             |
| Proxy (UX only)         | `src/proxy.ts`                          | Refreshes the session; clean 307 redirects for non-admins        |

The proxy is **not** a security boundary. Removing it must not expose anything — the layers
below re-check.

## Authentication & authorisation

- Supabase Auth email + password. Sessions are cookies managed by `@supabase/ssr`.
- `getAdminStatus()` (`src/lib/auth/admin.ts`) verifies the JWT with `auth.getClaims()` (signature
  checked — not the unverified `getSession()`), then looks the user up in `admin_users`.
- **Signed in ≠ admin.** A valid account not in `admin_users` gets `403` from the API, is redirected
  from admin pages, and is signed out by the login form.
- Login redirects (`?next=`) are restricted to `/admin…` paths by `safeAdminRedirect()` (no open
  redirect).
- Recommended: disable public sign-ups in Supabase (Authentication → Providers → Email). Not
  required for safety, but reduces noise.

## CSRF

Admin APIs use cookie auth, so mutations additionally require an `Origin` header whose host
matches the request host (`isSameOrigin` in `src/lib/api/http.ts`). Supabase cookies are also
`SameSite=Lax`.

## Secrets

| Secret                        | Read in                         | Exposure                                  |
| ----------------------------- | ------------------------------- | ----------------------------------------- |
| `SUPABASE_SERVICE_ROLE_KEY`   | `scripts/create-admin.mjs` only | Never imported by the app                 |
| `CLOUDINARY_API_SECRET`       | `src/lib/env.server.ts`         | `server-only` guard → build fails if imported client-side |

`.env`, `.env.local`, `.env.*.local` are git-ignored. Only `NEXT_PUBLIC_*` values reach the
browser (Supabase URL + anon/publishable key — safe because of RLS).

## Uploads

- Browser compresses first; server accepts ≤ 4 MB, `image/jpeg|png|webp` only, and checks file
  **magic bytes** (a renamed text file is rejected with `415`).
- Uploads are **signed server-side** (SHA-1 signature with the API secret) — the browser never
  talks to Cloudinary with credentials.
- Destination folder is chosen from an allow-list (`products|categories|branding`) plus a
  sanitised subfolder.
- Saved product/category images must carry a public id under `sachdeva-carry-hub/` and a
  `https://res.cloudinary.com/` URL (Zod), so an admin form can't point at arbitrary hosts.
- `DELETE /api/upload` refuses assets that are referenced anywhere (products, categories,
  logo/favicon).

## Input & output handling

- Every body/query is validated with Zod; ids with a UUID check; slugs with
  `^[a-z0-9]+(-[a-z0-9]+)*$`.
- Public search text is reduced to letters/numbers/spaces/hyphens before it's put into a
  PostgREST filter (`sanitizeSearch` in `src/lib/data/public.ts`).
- Database error messages are logged server-side and replaced with safe messages.
- JSON-LD is serialised with `<` escaped to prevent `</script>` injection.
- External links use `rel="noopener noreferrer"`.

## HTTP headers

Set in `next.config.ts` for all routes: `X-Content-Type-Options: nosniff`,
`Referrer-Policy: strict-origin-when-cross-origin`, `X-Frame-Options: SAMEORIGIN`,
`Permissions-Policy` (camera/mic/geolocation off). `/admin/*` also sends
`X-Robots-Tag: noindex, nofollow`; `robots.txt` disallows `/admin` and `/api/`.
`poweredByHeader` is disabled.

## Verifying RLS

Run these in the Supabase SQL editor, or with the anon key from a script:

```sql
-- As anon (SQL editor: set role anon;)
set role anon;
insert into public.categories (name, slug) values ('x', 'x');      -- must fail
select count(*) from public.products where not is_active;           -- must be 0
select * from public.admin_users;                                   -- must be empty
reset role;
```

Checks that were run against a local Supabase stack during development (all passed): anon
insert/update blocked; non-admin updates affect 0 rows; non-admin `save_product` → `42501`;
inactive product and its images hidden; inactive category hides its products; category with
products can't be deleted; two primary images rejected; product delete cascades images; API
returns 401/403 for anon/non-admin, 403 for cross-origin, 415 for fake images.

## Reporting / rotating

If a secret leaks: rotate it in the Supabase/Cloudinary dashboard, update Vercel env vars,
redeploy. To remove an admin, delete their `admin_users` row (see [DATABASE.md](DATABASE.md#useful-sql)).

# Development guide

## Commands

```bash
npm run dev          # dev server (Turbopack)
npm run typecheck    # tsc --noEmit
npm run lint         # ESLint (next/core-web-vitals + TypeScript)
npm run format       # Prettier (+ Tailwind class sorting)
npm run build        # production build — run before pushing
```

Before a PR: `npm run typecheck && npm run lint && npm run build` must all pass.

## Next.js 16 / Cache Components rules

This project runs **Next.js 16.4 with `cacheComponents` and `partialPrefetching`**. Many older
patterns no longer apply. Bundled docs: `node_modules/next/dist/docs/`.

1. **`middleware.ts` is now `proxy.ts`** (`src/proxy.ts`, export `proxy`).
2. **`params` and `searchParams` are Promises.** Use the global helper types
   `PageProps<"/route">`, `LayoutProps<"/route">`, `RouteContext<"/api/route">`.
3. **No `export const dynamic/revalidate`.** Cache data with `"use cache"` + `cacheLife(...)` +
   `cacheTag(...)`; anything uncached or request-dependent must be inside `<Suspense>` or the
   route opts out.
4. **`"use cache"` functions can't read cookies/headers.** Public reads use the cookie-less anon
   client (`createPublicClient`). Never call `createServerSupabase()` inside a cached function.
5. **Admin pages** call `getAdminStatus()` → `connection()` and export `instant = false`
   (they block per request by design). New admin pages must also export `instant = false` and
   call `requireAdmin()`.
6. **`revalidateTag(tag, { expire: 0 })`** in route handlers (immediate). `updateTag` only works in
   Server Actions.
7. **`generateStaticParams` must return ≥ 1 item** — use `PLACEHOLDER_SLUG` when empty.
8. **`ensureStatic = "navigation"`** on `/product/[slug]` and `/category/[slug]` keeps them fully
   static so `notFound()` returns HTTP 404. Don't read `searchParams`, cookies or uncached data
   there, or the build fails.
9. **`usePathname()` can suspend** on routes with not-yet-generated params; components using it
   in shared layouts are wrapped in `<Suspense>` with a static fallback
   (`desktop-nav.tsx`, `admin-nav.tsx`).
10. `Date.now()`/`new Date()` during render needs `"use cache"` or `connection()` — see
    `CopyrightYear`.

## Conventions

- **Server first.** Pages/layouts are Server Components; add `"use client"` only for interaction.
- **Business data comes from `getStoreSettings()`.** Never hard-code phones, address, Instagram,
  etc. in components.
- **Data access** only through `src/lib/data/*`. Map rows with `mappers.ts`; components receive
  domain types from `src/types`.
- **Every mutation**: `guardAdmin` → Zod → RLS-scoped client → `databaseError` mapping →
  `revalidate*()`. See [API.md](API.md#adding-an-endpoint).
- **Validation** lives in `src/lib/validations/` and is shared by API (server) and form error
  display (client receives `fieldErrors`).
- **Styling**: Tailwind v4 tokens from `globals.css` (`bg-ink`, `text-gold-deep`, `bg-cream`,
  `border-line`, `rounded-(--radius-card)`, `shadow-(--shadow-card)`). Gold = accent only; use
  `gold-deep` for text on light backgrounds (contrast). Buttons via `buttonClasses()`.
- Don't put `hidden` and a display utility (`inline-flex`, `flex`) in the **same** class list —
  Tailwind's order decides and `hidden` loses. Wrap in a `hidden lg:block` element instead.
- **Accessibility**: labels for every control (`Field` component), `aria-pressed` on toggle
  chips, `role="switch"` on switches, visible focus (gold outline), images need meaningful `alt`
  (decorative ones `alt=""`), honour `prefers-reduced-motion`.
- **Logging**: `console.error` with a `[scope]` prefix for server failures only; no stray
  `console.log`.

## Adding things

**A product field**: migration column → `types/index.ts` → `mappers.ts` (`toProduct`) →
`validations/product.ts` → `save_product` SQL (insert + update) → `ProductForm` → public UI.

**A public page**: `src/app/(site)/<name>/page.tsx`, export `metadata`/`generateMetadata` with
`alternates.canonical`, read data via cached functions, add to `sitemap.ts` and (if needed)
`NAV_LINKS`.

**An admin page**: `src/app/admin/(panel)/<name>/page.tsx` with `export const instant = false`,
`await requireAdmin("/admin/<name>")`, and a sidebar entry in `components/admin/admin-nav.tsx`.

## Local Supabase (optional)

With Docker running you can test against a throwaway local stack instead of the cloud project:

```bash
mkdir /tmp/sch-supa && cd /tmp/sch-supa && supabase init
cp <repo>/supabase/migrations/*.sql supabase/migrations/ && cp <repo>/supabase/seed.sql supabase/
supabase start -x studio,imgproxy,logflare,vector,edge-runtime,realtime,storage-api,mailpit
# then run the app with the printed API URL and publishable key:
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321 NEXT_PUBLIC_SUPABASE_ANON_KEY=<key> npm run dev
supabase stop   # when done
```

Process env vars override `.env.local`, so your real credentials stay untouched.

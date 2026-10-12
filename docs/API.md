# API reference

Route handlers live in `src/app/api/`. All responses are JSON unless noted.

## Conventions

- **Admin endpoints** run `guardAdmin()` (`src/lib/api/http.ts`):
  - mutations (`POST`/`PATCH`/`DELETE`) must be **same-origin** (`Origin` header host = request
    host) → otherwise `403`;
  - then the session must belong to a user in `admin_users`.
- Bodies are validated with Zod (`src/lib/validations/`). Unknown keys are rejected (`.strict()`).
- Admin responses send `Cache-Control: no-store`.
- Raw database errors are never returned; they are logged server-side and mapped:

| Status | Body `error` (example)                                    | Cause                                  |
| ------ | --------------------------------------------------------- | -------------------------------------- |
| 400    | `Invalid product id.` / `Request body must be valid JSON.` | malformed input                        |
| 401    | `Please sign in to continue.`                             | no/expired session                     |
| 403    | `This account is not an administrator.` / `Cross-origin request rejected.` | not admin / CSRF guard |
| 404    | `Product not found.`                                      | unknown id                             |
| 409    | slug in use, category still has products, image in use    | conflict                               |
| 413/415| image too large / unsupported type                        | upload checks                          |
| 422    | `Please fix the highlighted fields.` + `fieldErrors`      | Zod validation                         |
| 503    | Supabase / Cloudinary / site URL not configured           | missing env                            |

Validation error shape:

```json
{ "error": "Please fix the highlighted fields.",
  "fieldErrors": { "name": ["Product name is required."], "features.0.value": ["Feature value is required."] } }
```

The browser helper `apiRequest()` (`src/lib/api/client.ts`) wraps these into
`{ ok: true, data } | { ok: false, status, error, fieldErrors }`.

---

## Products

### `GET /api/products` — public

Active products only. Query: `q` (≤ 80 chars), `category` (slug), `featured=1`, `new=1`.
Response: `{ "products": ProductCardData[] }`. CDN cache: `s-maxage=60, stale-while-revalidate=300`.

### `POST /api/products` — admin

Creates a product and its gallery.

```jsonc
{
  "name": "Premium Black Trolley Bag",        // required, 2–160
  "slug": "",                                  // optional; "" = generate from name
  "category_id": "uuid",                       // required
  "short_description": "…",                    // ≤ 300
  "description": "…",                          // ≤ 5000
  "features": [{ "label": "Material", "value": "ABS" }],          // ≤ 30
  "specifications": [{ "key": "Lock Type", "value": "TSA Lock" }], // ≤ 40, stored as {"lock_type": …}
  "available_colors": [{ "name": "Black", "hex": "#111111" }],     // ≤ 20, hex optional
  "is_featured": false, "is_new_arrival": false, "is_active": true,
  "sort_order": 0,
  "images": [                                  // ≤ 12, ordered; ≤ 1 primary
    { "cloudinary_public_id": "sachdeva-carry-hub/products/trolley-bags/abc",
      "image_url": "https://res.cloudinary.com/…/abc.webp",
      "width": 1600, "height": 2000, "format": "webp",
      "alt_text": "", "is_primary": true }
  ]
}
```

Response `201 { "id": "uuid", "slug": "premium-black-trolley-bag" }`. Duplicate slugs get
`-2`, `-3`, … appended. Image ids must be in the `sachdeva-carry-hub/` folder and URLs on
`res.cloudinary.com`.

### `GET /api/products/:id`

Admins get any product; everyone else only active, public products (RLS on the caller's session).
`{ "product": Product }`.

### `PATCH /api/products/:id` — admin

Two modes, chosen by the body:

- **Full save** (body contains `images`): same schema as `POST`. Images with `id` are kept and
  re-ordered; missing ones are deleted (and removed from Cloudinary after commit).
- **Quick toggle**: `{ "is_featured"?: bool, "is_new_arrival"?: bool, "is_active"?: bool }`.

Response `{ "id", "slug" }` (full save) or `{ "id" }`.

### `DELETE /api/products/:id` — admin

Deletes the product (images cascade), then its Cloudinary assets. `{ "id" }`.

## Categories

| Method & path                 | Auth   | Body / notes                                                                 |
| ----------------------------- | ------ | ---------------------------------------------------------------------------- |
| `GET /api/categories`         | public | `{ categories: Category[] }` — active only                                   |
| `POST /api/categories`        | admin  | `{ name, slug?, description?, image_url?, image_public_id?, is_active?, sort_order? }` → `201 { id, slug }` |
| `GET /api/categories/:id`     | public / admin | inactive visible to admins only                                    |
| `PATCH /api/categories/:id`   | admin  | full (body has `name`) or toggle `{ is_active?, sort_order? }`. Replacing/removing the image deletes the old asset. |
| `DELETE /api/categories/:id`  | admin  | `409` if the category has products (“Move or delete them first, or deactivate the category instead.”) |

`image_url` and `image_public_id` must be provided together.

## Uploads

### `POST /api/upload` — admin, `multipart/form-data`

| Field       | Value                                              |
| ----------- | -------------------------------------------------- |
| `file`      | JPEG, PNG or WebP, ≤ 4 MB (already optimised by the browser) |
| `folder`    | `products` \| `categories` \| `branding`           |
| `subfolder` | optional, `[a-z0-9-]` — category slug for products |

Checks MIME type **and** file signature (magic bytes). Stored as WebP at
`sachdeva-carry-hub/<folder>[/<subfolder>]/…`.
Response `201 { cloudinary_public_id, image_url, width, height, format }`.

### `DELETE /api/upload` — admin

`{ "public_id": "sachdeva-carry-hub/…" }`. Only for uploads **not yet saved**: returns `409` if
the asset is referenced by a product image, category or the logo/favicon setting. Saved images
are removed through the product/category endpoints instead.

## QR codes — admin

| Endpoint                      | Encodes                                     |
| ----------------------------- | ------------------------------------------- |
| `GET /api/qr/product/:id`     | `NEXT_PUBLIC_SITE_URL/product/<slug>`       |
| `GET /api/qr/site`            | `NEXT_PUBLIC_SITE_URL/`                     |

Query: `format=png|svg` (default png), `download=1` for `Content-Disposition: attachment`.
PNG is 1024 px; error correction level **Q**. Returns `503` when `NEXT_PUBLIC_SITE_URL` is
missing or invalid (no malformed codes). Never cached or stored.

## Store settings

| Method                | Auth   | Notes                                                           |
| --------------------- | ------ | --------------------------------------------------------------- |
| `GET /api/settings`   | public | `{ settings: StoreSettings }`                                   |
| `PATCH /api/settings` | admin  | full settings object (see `src/lib/validations/settings.ts`); phones need 10–15 digits, pincode 6 digits, URLs must be http(s) |

## Adding an endpoint

1. Create `src/app/api/<name>/route.ts`.
2. Start mutations with `const guard = await guardAdmin(request); if (!guard.ok) return guard.response;`.
3. Validate with `parseJsonBody(request, schema)`; validate ids with `isUuid()`.
4. Use `guard.admin.supabase` (RLS-scoped) — never a service-role client.
5. Map errors with `databaseError(error, "<context>")`.
6. Expire the right cache tags via `src/lib/data/revalidate.ts`.

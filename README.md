# LOZIA — Next.js + Supabase storefront

Production e-commerce rebuild of the LOZIA storefront: Next.js 16 (App Router), TypeScript, Tailwind CSS v4,
Supabase (Postgres, Auth, Storage, Row Level Security). Manual bank-transfer payments only — no Paystack or
Flutterwave integration yet.

## 1. Set up Supabase

1. Create a project at supabase.com.
2. SQL editor → run `supabase/migrations/0001_init.sql` (schema, RLS policies, order/payment/stock functions, storage buckets).
3. Optional demo catalogue: run `supabase/seed/seed.sql`.
4. Authentication → Users → create your admin user (email + password).
5. SQL editor → edit and run `supabase/seed/make-admin.sql` with that email, to grant `super_admin`.
6. Project Settings → API: copy the Project URL, anon key and service_role key.

## 2. Configure the app

```bash
cp .env.example .env.local
```

Fill in `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.
`.env.example` documents every variable, including the optional ones (site URL, cron secret, analytics).
**Never commit `.env.local`.**

## 3. Run

```bash
pnpm install
pnpm dev            # http://localhost:3000
pnpm build && pnpm start
pnpm typecheck
pnpm lint
pnpm test           # business-logic unit tests (node:test), no network needed
```

Requires Node 20.9+.

## 4. Add your catalogue

Sign in at `/admin` and go to **Colours, sizes & categories** first, then **Products** to add pieces, images and
variants (colour × size, each with its own SKU, price override and stock). Then **Content & settings** for brand
details, WhatsApp number, bank transfer details, delivery fees, and the shipping/returns/privacy/terms/size-guide
pages — all of it starts as clearly marked placeholder text (see §11 below).

## Architecture

```
supabase/
  migrations/0001_init.sql   schema, RLS, order/payment/stock functions (SECURITY DEFINER), storage buckets
  seed/                      demo catalogue + make-admin script (optional)
src/
  types/                     shared domain types (Product, Order, CartItem, SiteSettings, ...)
  lib/
    auth/          permissions (role → allowed actions), session (getCurrentUser, requirePermission, authorizeRequest)
    products/      mappers (DB row → Product), queries (public + admin), variants (selection/availability logic), admin (colour/size sync, file cleanup)
    orders/        lines (pricing from DB records, never the client), prepare (order number + token + totals),
                   service (createOrder, submitPayment, guest lookups), admin-queries, status (payment/fulfilment state machine), number, token
    inventory/     stock math (available, reserve/adjust checks, low-stock)
    cart/          client-side cart math (localStorage-backed, never trusted for price)
    shipping/      Nigerian states list, delivery-fee calculation
    settings/      typed setting definitions + validation + defaults, server queries
    storage/       upload validation (content-sniffed, not just declared MIME type)
    validation/    Zod schemas (checkout, contact, admin forms) — every admin/checkout route parses through these
    api/           response helpers, admin-route wrapper (auth + error handling in one place), attribute CRUD factory
    supabase/      server client (RLS-scoped, cookie-based), admin client (service role, guest-checkout only), proxy
    audit/         audit-log writer
    notifications/ event boundary (currently logs only — see §34 below)
    analytics/     privacy-conscious event tracking boundary (no PII)
    colorizer/     pure colour math (luminance-based recolouring) used by the garment colourizer
  components/
    layout/        header, cart drawer, footer, WhatsApp button, store shell
    shop/, product/, checkout/, forms/   storefront UI
    admin/         studio-desk UI (product form, image/variant managers, order actions, settings editors)
    ui/            shadcn/ui primitives (unchanged from the original design)
  app/
    (store)/       every public page (home, shop, product, about, contact, checkout, order-confirmed, policies, size-guide, track-order)
    admin/         /admin/login (public) and /admin/(panel)/* (every page requires a signed-in staff account)
    api/           route handlers — see table below
  tests/           business-logic unit tests (auth, stock, cart, variants, checkout pricing, payment state machine, uploads, mappers)
```

## API routes

| Route | Auth | Purpose |
|---|---|---|
| `GET /api/products`, `/api/products/[slug]`, `/api/categories` | public | catalogue reads |
| `POST /api/orders` | public, rate-limited | guest checkout — prices, stock and shipping computed server-side |
| `POST /api/orders/lookup` | public, rate-limited | order status by number + email |
| `POST /api/orders/[orderNumber]/payment` | public (order token), rate-limited | "I have paid" + optional receipt upload |
| `POST /api/contact` | public, rate-limited, honeypot | contact form |
| `GET /api/cron/release-reservations` | `Authorization: Bearer $CRON_SECRET` | releases stock held by unpaid orders |
| `POST /api/auth/login`, `/api/auth/logout` | — | staff sign-in/out (Supabase Auth) |
| `POST/PATCH/DELETE /api/admin/products*`, `/images*`, `/variants*`, `/colours*`, `/sizes*`, `/categories*` | staff (`catalog:write`) | catalogue management |
| `POST /api/admin/stock` | staff (`inventory:write`) | stock adjustment, audited, cannot go negative or below reserved |
| `POST /api/admin/orders/[id]` | staff (`orders:write`; verify/reject/cancel/refund need `payments:verify`) | order actions, each backed by a SQL function that re-checks role and state |
| `GET /api/admin/orders/[id]/receipt` | staff (`orders:read`) | 5-minute signed URL to a private receipt |
| `PUT /api/admin/settings` | staff (`settings:write`) | site content and settings |

Every admin route runs through `adminRoute()`, which checks same-origin, authentication, and the specific
permission before the handler runs — a route can't accidentally skip authorization.

## Roles

`customer` (default, no elevated access) · `staff` (orders, stock, customers) · `admin` (+ catalogue, payment
verification, settings) · `super_admin` (+ managing other users' roles). Enforced in Postgres via Row Level
Security and `SECURITY DEFINER` functions — not just hidden in the UI. Guest checkout needs no account.

## Payments: manual bank transfer only

`PENDING → SUBMITTED (customer says "I paid") → VERIFIED (admin confirms) / REJECTED`, separately from
`fulfillment: PENDING → PROCESSING → SHIPPED → DELIVERED` (or `CANCELLED`). Nothing on the customer side can set
`VERIFIED` — only `POST /api/admin/orders/[id]` with `payments:verify`, which calls the `verify_payment` SQL
function. That function also commits stock (converts the checkout-time reservation into a real deduction) and
records an audit entry. Receipts are stored in a private bucket; only staff get signed URLs.

## Inventory safety

Checkout calls the `create_order` Postgres function, which locks every variant row (`FOR UPDATE`), re-checks
price, active status and available stock, and inserts the order atomically — two simultaneous checkouts for the
last unit cannot both succeed. Stock is *reserved* at checkout and only actually decremented when payment is
verified; if an order is cancelled first, the reservation is released instead. `adjust_stock` (manual admin
changes) refuses to go negative or below what's reserved.

## Price tampering

The checkout API's Zod schema (`checkoutSchema`, `.strict()`) accepts only customer details, delivery details,
and `{ variantId, quantity }` pairs — no price, total, or status field exists to send. `lib/orders/lines.ts` prices
every line from the database record, never from the request. The Postgres function re-checks the computed
subtotal against what the server itself just calculated (`PRICE_CHANGED` if they disagree) as a second line of
defense inside the same transaction.

## Garment colourization

`lib/colorizer/math.ts` — pure, unit-tested colour math. Recolouring rebuilds each garment pixel from the
target colour's hue/saturation and the pixel's own luminance (so black *can* become burgundy: a hue rotation
cannot do that, since black has no hue). Highlights, shadows and fabric folds are preserved because they come
from the source luminance, not overwritten. Skin tones are detected and left alone in automatic mode.
`components/garment-colorizer.tsx` runs this on a canvas at render time; it accepts an optional PNG/WebP mask
(uploaded per image in the admin) for pixel-precise results on difficult photos, and falls back to the plain
photo if processing fails for any reason.

## What's a placeholder vs. real

Nothing about LOZIA's real phone number, bank account, shipping prices/times, return window or physical address
was invented. Everywhere one of these would go, the app either:
- shows nothing until you fill it in (WhatsApp button links to WhatsApp's chooser with no number set; the "studio
  location" line disappears if empty), or
- shows clearly bracketed placeholder text (shipping/returns/privacy/terms sections, size chart) with a
  `[stated]`-style `[To be confirmed by LOZIA]` marker and an on-page draft notice, or
- is left as an easily-found placeholder value you're expected to replace (the size-guide demo measurements, the
  demo product catalogue in `supabase/seed/seed.sql`).

`/admin → Content & settings` lists what's still missing before launch (contact email, WhatsApp number, bank
details, delivery prices, returns policy) as an on-page checklist.

## Testing

`pnpm test` runs `src/tests/*.test.ts` with `node:test` (no build step, no network, no Supabase needed). Covers:
variant selection & unavailable-variant blocking, stock math, cart math, checkout pricing & totals, the
price-tampering schema rejection, the payment/fulfilment state machine (including "claiming payment never marks
an order paid"), role authorization, content-based upload validation, the rate limiter, colour-recolouring math,
and the database-row → Product mapper + shop filters.

## Deployment (Vercel)

`pnpm build` and `pnpm typecheck` both need to pass with only the env vars in `.env.example` set — no
localhost URLs, no hardcoded credentials. Add the cron job from `vercel.json` (or trigger
`/api/cron/release-reservations` some other way) so stock reserved by abandoned checkouts is released
automatically; the window is set in **Content & settings → Delivery fees and stock holds**.

## Known limitations

- Automated email notifications use Resend through the `NotificationProvider` boundary. SMS and WhatsApp are not implemented yet. Set `RESEND_API_KEY` and `RESEND_FROM_EMAIL` to enable email delivery; the server log remains a fallback when Resend is unavailable.
- No customer accounts/order history beyond the guest order-link + "track an order" lookup (by design, per the
  brief: guest checkout, no forced signup).
- `next/image` is configured for files in `/public` and this project's own Supabase Storage bucket; a hosted
  image URL typed into an image field is shown unoptimized rather than failing.
- The in-memory rate limiter is per server instance — fine for a single Vercel deployment, but add a shared
  limiter (e.g. Upstash Redis) if you scale to multiple regions/instances.

### Website content images

Storefront content images can be replaced from **Admin → Content & settings → Website images**. This includes the brand logo, homepage hero/editorial/category imagery, About imagery, and Contact imagery. Uploaded files are validated and stored in the Supabase `site-images` bucket; each slot keeps an editable alt text and can be reset to its built-in fallback image. Product imagery remains managed separately from each product's image manager.

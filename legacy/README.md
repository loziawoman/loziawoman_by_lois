# LOZIA Fashion Storefront

A responsive editorial e-commerce storefront for LOZIA, a Nigerian women's fashion label.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/lozia-storefront/src/data/products.ts` — typed demo catalogue and replaceable product data boundary.
- `artifacts/lozia-storefront/src/pages/storefront-pages.tsx` — route-level storefront pages and shopping interactions.
- `artifacts/lozia-storefront/src/components/garment-colorizer.tsx` — client-side canvas recolouring with luminance preservation and fallback.
- `artifacts/lozia-storefront/src/components/lozia-shell.tsx` — navigation, persistent shopping bag drawer, and footer.
- `artifacts/lozia-storefront/public/images/` — supplied LOZIA logo and local editorial product imagery.

## Architecture decisions

- The storefront uses a local typed product source and localStorage-backed bag so the UI can later swap to API data without coupling the experience to a database.
- Product colour changes use one base image and preserve luminance through a canvas pipeline; optional masks are supported for future precise garment selections.
- Manual transfer checkout intentionally ends in pending verification; payment is never treated as successful from the client alone.

## Product

The site includes editorial home discovery, catalogue filters and search, product pages with stock-aware variants and live colour visualization, a persistent bag drawer, manual bank-transfer checkout, order-pending confirmation, brand/about/contact content, sizing, shipping, returns, and privacy information.

## User preferences

- Keep the LOZIA experience editorial, restrained, warm, and quietly luxurious rather than template-like.

## Gotchas

- The frontend workflow supplies `PORT` and `BASE_PATH`; use the managed workflow for preview rather than starting the app from the workspace root.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details

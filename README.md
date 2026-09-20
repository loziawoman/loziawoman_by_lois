# LOZIA Fashion Storefront (Next.js)

A responsive editorial e-commerce storefront for LOZIA, a Nigerian women's fashion label.
Converted from a Vite + React + wouter app to Next.js (App Router).

## Run

```bash
pnpm install        # or npm install / yarn
pnpm dev            # http://localhost:3000
pnpm build && pnpm start
pnpm typecheck
```

Requires Node 20.9 or newer.

## Studio admin

`/admin` is protected by a password. Copy `.env.example` to `.env.local` and set:

```bash
ADMIN_PASSWORD=your-password
ADMIN_SESSION_SECRET=$(openssl rand -base64 48)   # 32+ characters
```

Without both values `/admin` stays locked. Sessions last 7 days and are stored in an HttpOnly cookie.

Shop content (products, homepage, policies, studio settings) is saved on the server in `.data/cms.json`
(override with `CMS_DATA_FILE`). This needs a filesystem that persists between restarts, such as a VPS or Docker
volume. On serverless hosts (e.g. Vercel) swap `src/server/cms-store.ts` for a database or KV store; it is the only
file that touches storage.

## Structure

```
src/
  app/
    layout.tsx            fonts (next/font), metadata, providers
    globals.css           Tailwind v4 theme tokens + LOZIA utility classes
    (store)/              every public page, wrapped in the header/footer/bag shell
      page.tsx            /
      shop/               /shop and /shop/[slug]
      about/ checkout/ contact/ order-confirmed/ size-guide/ shipping/ returns/ privacy/
      [...slug]/          unmatched URLs -> 404 page inside the shell
    admin/                /admin (sign-in, then the studio desk; no shell, noindex)
    api/healthz/          GET /api/healthz -> { status: "ok" }
    api/admin/            POST/DELETE session (sign in / out), PUT workspace (save content)
  views/                  page-level components (was src/pages in the Vite app)
  components/             shell, providers, garment colorizer, shadcn/ui
  server/                 file storage + admin auth (server-only)
  lib/cms.ts              content types, defaults and validation shared by server and client
  hooks/                  bag (context), CMS context, toast, mobile
  data/products.ts        typed demo catalogue
public/                   images, favicon, robots.txt
```

## Architecture notes

- The bag lives in one React context (`BagProvider`), persisted to `localStorage` under `lozia-bag`.
- The root layout reads the saved content on every request and hands it to the client through `CmsProvider`,
  so admin saves (followed by `router.refresh()`) show up for every visitor and pages are rendered with the real content.
- Policy pages, the contact page, the footer and the WhatsApp button all read from the same content.
- Images go through `next/image` via `LoziaImage`. Files in `public/` are optimised; hosted URLs typed into the admin are shown as-is.
- `/shop?category=…` and `/shop/[slug]?colour=…` are read on the server and passed to the page components as props.
- Product colour changes still run client-side on a canvas (`garment-colorizer.tsx`).
- Manual transfer checkout ends in "pending verification"; payment is never treated as successful from the client alone.

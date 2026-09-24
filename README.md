# LOZIA — Client & Developer Guide

LOZIA is a contemporary women's fashion e-commerce website built for a fashion brand operating from Abuja, Nigeria.

This README is intentionally written for two audiences:

- **Client / brand team:** what the website does, how customers use it, and what the LOZIA team can manage.
- **Developers / technical collaborators:** how the application is structured, where the important logic lives, how data moves through the system, and how to run and deploy it safely.

---

# Part I — Client / Brand Guide

## 1. What the website is

LOZIA is the brand's online storefront and order-management platform.

Customers can:

- discover the LOZIA collection;
- browse products by category;
- open individual product pages;
- select available colours and sizes;
- add products to their bag;
- complete checkout without creating an account;
- choose delivery information for Nigerian orders;
- pay by manual bank transfer;
- submit payment information and an optional receipt;
- track an order using the order lookup flow;
- contact LOZIA through the contact form;
- reach LOZIA through WhatsApp when a number has been configured;
- read the brand story, shipping information, returns policy, privacy policy, terms and size guide;
- leave a product-independent customer review when review submissions are enabled.

The website also has a private **Studio / Admin** area for the LOZIA team.

---

## 2. The customer journey

### Home

The homepage introduces the LOZIA brand and highlights:

- the announcement bar;
- the main brand message;
- the current collection;
- product categories;
- editorial / brand imagery;
- customer reviews.

Homepage content and imagery can be managed from the admin area.

### Shop

Customers can browse published products and filter the collection.

A product can contain:

- name;
- description;
- category;
- price;
- product imagery;
- colours;
- sizes;
- variants;
- SKU;
- stock availability;
- featured/new-arrival information.

### Product page

Customers choose the available variant before adding an item to their bag.

The website uses the product and variant information stored in the database rather than trusting prices or stock values supplied by the browser.

### Bag and checkout

The bag stores the customer's selected items on the device.

At checkout, the server recalculates:

- product prices;
- quantities;
- subtotal;
- delivery fee;
- total.

This means the browser is not the authority for what an order costs.

Customers do not need to create an account to place an order.

### Payment

The current website supports **manual bank transfer only**.

There is no Paystack or Flutterwave integration in the current implementation.

The customer receives the configured LOZIA bank-transfer instructions, makes the transfer externally, and then uses the order payment flow to say that payment has been made and optionally upload a receipt.

An admin must verify the payment before the order is treated as paid.

### Order tracking

Customers can use the order-tracking flow to retrieve order information using the details requested by the website.

Customers do not have a traditional account dashboard or permanent order-history area.

This is intentional: the current model is guest checkout.

---

## 3. Delivery

Delivery fees are configurable from the admin area.

The settings support:

- a default delivery fee;
- state-specific Nigerian delivery fees;
- free delivery above a configured order amount;
- a configurable reservation window for unpaid orders.

The actual values shown to customers should be configured by the LOZIA team before launch.

---

## 4. Customer reviews

The website has a customer review system.

Customers can submit:

- name;
- optional email;
- rating from 1–5;
- review message.

The LOZIA team can manage submitted reviews from:

**Admin → Reviews**

Reviews can be:

- shown;
- hidden;
- marked as spotlighted;
- deleted.

The team can also enable or disable new review submissions.

---

## 5. Contact and social links

The contact area can display configured brand information such as:

- contact email;
- WhatsApp;
- studio location;
- studio hours;
- Instagram;
- TikTok.

These values are managed from the admin settings.

The contact form sends the submitted message into the site's admin message area.

If Resend is configured, the system can also send an email notification.

---

## 6. Website content the LOZIA team can manage

The admin content/settings area supports editable brand information including:

- brand name;
- tagline;
- contact email;
- WhatsApp number and default message;
- Instagram URL;
- TikTok URL;
- studio location;
- studio hours;
- delivery fees;
- homepage text;
- shipping policy;
- returns policy;
- privacy policy;
- terms;
- size guide;
- About story;
- website images;
- review-submission setting;
- bank-transfer details.

Website images include the brand logo and the main editorial/content image slots used around the storefront.

Product images are managed separately from the website-content image settings.

---

## 7. Studio / Admin area

The private admin area contains:

### Dashboard
A summary view for the store's operational data.

### Orders
The team can review orders and move them through the order/payment workflow.

Supported payment states include:

`PENDING → SUBMITTED → VERIFIED / REJECTED`

Fulfilment states include:

`PENDING → PROCESSING → SHIPPED → DELIVERED`

Orders can also be cancelled or refunded where the application's state rules allow it.

### Products
The team can create and manage catalogue products.

### Inventory
The team can adjust stock while the system protects reserved inventory.

### Colours, sizes & categories
Catalogue attributes can be managed here.

### Customers
The team can review customers associated with orders and perform supported customer-management actions.

### Messages
Customer contact-form messages can be reviewed and managed.

### Reviews
Customer reviews can be moderated and review submissions can be enabled/disabled.

### Content & settings
Brand content, policies, delivery configuration, contact information, bank-transfer details and website images can be managed here.

### Audit log
Administrative actions are recorded so operational changes can be traced.

---

## 8. Email notifications

The application has a notification layer with Resend support.

When configured, email notifications can cover events such as:

- order received;
- payment submitted;
- payment verified;
- payment rejected;
- order processing;
- order shipped;
- order delivered;
- new contact message.

Required server variables:

```env
RESEND_API_KEY=
RESEND_FROM_EMAIL=LOZIA <hello@your-verified-domain.com>
```

The sender domain/address must be verified with Resend.

If Resend is not configured, the application keeps its server-side notification logging behaviour rather than exposing an email configuration error to customers.

---

## 9. What the client should configure before launch

Before production launch, the LOZIA team should confirm:

- production domain;
- contact email;
- WhatsApp number;
- social-media URLs;
- studio location/hours if they should be public;
- bank name;
- bank account name;
- bank account number;
- delivery fees by state;
- free-delivery threshold, if applicable;
- reservation window;
- shipping policy;
- returns policy;
- privacy policy;
- terms;
- size guide;
- final homepage copy;
- final website imagery;
- product catalogue;
- product variants and SKUs;
- stock quantities;
- Resend sender/domain;
- `NEXT_PUBLIC_SITE_URL`.

The website contains fallbacks/placeholders for information that should not be invented by developers.

---

# Part II — Developer Guide

## 10. Technology stack

### Application

- Next.js 16
- React 19
- TypeScript
- App Router
- Tailwind CSS v4
- Lucide React

### Backend / data

- Supabase Postgres
- Supabase Auth
- Supabase Storage
- Row Level Security (RLS)
- PostgreSQL `SECURITY DEFINER` functions for sensitive transactional operations

### Validation

- Zod

### Notifications

- Resend via the Resend HTTP API

### Hosting

- Designed for Vercel deployment
- Supabase provides the database, authentication and storage layer

---

## 11. High-level architecture

```text
Browser
  │
  ▼
Next.js App Router
  │
  ├── Storefront pages
  │     ├── Home
  │     ├── Shop
  │     ├── Product
  │     ├── Checkout
  │     ├── About
  │     ├── Contact
  │     ├── Policies
  │     ├── Size guide
  │     └── Order tracking
  │
  ├── Admin pages
  │     ├── Dashboard
  │     ├── Orders
  │     ├── Products
  │     ├── Inventory
  │     ├── Attributes
  │     ├── Customers
  │     ├── Messages
  │     ├── Reviews
  │     ├── Content & settings
  │     └── Audit log
  │
  └── API route handlers
        │
        ▼
      Supabase
        ├── Postgres
        ├── Auth
        └── Storage

Optional:
  Next.js server → Resend → customer/admin email
```

The current application is Supabase-backed. The old file-backed CMS implementation has been removed from the project.

---

## 12. Important source directories

```text
src/
  app/
    (store)/        Public storefront routes
    admin/          Admin interface
    api/            API route handlers
    layout.tsx      Root metadata, fonts and application shell
    globals.css     Global styles
    robots.ts       Robots metadata
    sitemap.ts      Sitemap generation

  components/
    admin/          Admin UI and admin actions
    checkout/       Checkout and payment UI
    content/        Policy/not-found content components
    forms/          Contact and tracking forms
    home/           Homepage sections
    layout/         Header, footer, cart drawer, WhatsApp button
    product/        Product-detail UI
    shop/           Shop/product-card UI
    ui/             Only the currently used toast/tooltip primitives

  hooks/
    use-cart.tsx    Client-side shopping cart

  lib/
    admin/          Admin data helpers
    analytics/      Privacy-conscious event tracking
    api/            API response/auth helpers
    audit/          Audit logging
    auth/           Permissions and session handling
    cart/           Pure cart calculations
    colorizer/      Garment colourization math
    content/        Default site content and site-image helpers
    inventory/      Stock calculations
    notifications/  Notification provider boundary + Resend
    orders/         Order creation, pricing and state logic
    products/       Product queries, mapping and variant logic
    reviews/        Review queries
    settings/       Typed site settings
    shipping/       Nigerian states and delivery-fee logic
    storage/        Upload/content validation
    supabase/       Supabase clients
    validation/     Zod validation schemas

  server/
    admin-auth.ts   Server-side admin authentication helpers

  tests/
    Business-logic tests

  types/
    Shared domain types
```

---

## 13. Database structure

The main database entities include:

- `profiles`
- `products`
- `categories`
- `colours`
- `sizes`
- `product_variants`
- `product_images`
- `product_colours`
- `product_sizes`
- `customers`
- `addresses`
- `orders`
- `order_items`
- `payments`
- `shipments`
- `contact_messages`
- `site_settings`
- `reviews`
- `audit_logs`

The database migrations live in:

```text
supabase/migrations/
```

Seed/admin helper SQL lives in:

```text
supabase/seed/
```

---

## 14. Supabase migrations

The migrations currently included are:

```text
0001_init.sql
0002_reviews_and_message_delete.sql
0004_site_images.sql
0005_admin_cleanup.sql
```

`0001_init.sql` contains the core catalogue, inventory, customer, order, payment, authentication, RLS, storage and transactional database functions.

`0002_reviews_and_message_delete.sql` adds reviews and admin deletion support for contact messages.

`0004_site_images.sql` adds editable public website images.

`0005_admin_cleanup.sql` provides the admin-only order/customer deletion functions used by the current DELETE API routes.

If a migration has already been applied to a production database, do not edit an older migration in place. Add a new migration for subsequent changes.

---

## 15. Product and variant model

A product is not the same thing as a sellable variant.

A product can have combinations such as:

```text
Product: Example Dress

Colour: Black
Size: S → SKU A
Size: M → SKU B
Size: L → SKU C

Colour: Burgundy
Size: S → SKU D
Size: M → SKU E
Size: L → SKU F
```

Inventory belongs to the variant.

This allows:

- colour-specific stock;
- size-specific stock;
- SKU-level inventory;
- optional variant-level price overrides.

---

## 16. Checkout security

The browser is never trusted for price or stock.

The checkout request contains customer/order information and variant IDs + quantities.

The server:

1. validates the request with Zod;
2. reads product/variant data from Supabase;
3. calculates prices from database records;
4. calculates delivery;
5. creates the order through the database transaction;
6. reserves stock;
7. returns the resulting order information.

The database function locks relevant variant rows before checking availability. This prevents two simultaneous checkouts from successfully taking the same final unit.

---

## 17. Inventory lifecycle

Stock has two important quantities:

```text
stock_quantity
reserved_quantity
```

At checkout, inventory can be reserved.

When payment is verified, the reservation is converted into a committed stock deduction.

When an unpaid reservation expires or an order is cancelled, the reservation is released.

Admin stock adjustments are prevented from reducing stock below the quantity already reserved.

A scheduled job calls:

```text
/api/cron/release-reservations
```

using the configured `CRON_SECRET`.

---

## 18. Payment state machine

Payment is deliberately separate from fulfilment.

Payment:

```text
PENDING
   ↓
SUBMITTED
   ├── VERIFIED
   └── REJECTED
```

Refunding is represented separately where permitted.

Only authorised staff/admin users can verify or reject payment.

The customer cannot mark an order as verified through the public API.

---

## 19. Fulfilment state machine

```text
PENDING
   ↓
PROCESSING
   ↓
SHIPPED
   ↓
DELIVERED
```

Cancellation is handled separately.

The server validates allowed state transitions rather than relying only on UI controls.

---

## 20. Authentication and roles

The application supports:

```text
customer
staff
admin
super_admin
```

Permissions are defined in:

```text
src/lib/auth/permissions.ts
```

Authentication/session logic is in:

```text
src/lib/auth/session.ts
src/server/admin-auth.ts
```

Sensitive permissions are enforced server-side and in Postgres. Hiding an admin button is not considered sufficient security.

---

## 21. API structure

Public routes include:

```text
GET  /api/products
GET  /api/products/[slug]
GET  /api/categories

POST /api/orders
POST /api/orders/lookup
POST /api/orders/[orderNumber]/payment

POST /api/contact
POST /api/reviews

GET  /api/cron/release-reservations
GET  /api/healthz
```

Admin routes cover:

```text
/products
/products/[id]
/products/[id]/images
/products/[id]/variants
/variants
/variants/generate
/colours
/sizes
/categories
/stock
/orders/[id]
/orders/[id]/receipt
/customers/[id]
/messages/[id]
/reviews/[id]
/settings
/site-images
```

Authentication and permission checks are centralised through the admin-route helper where appropriate.

---

## 22. Storage

Supabase Storage currently contains separate concerns for:

### Product images

Bucket:

```text
product-images
```

Product imagery is public to the storefront.

### Payment receipts

Bucket:

```text
payment-receipts
```

Payment receipts are private.

Authorised staff receive short-lived signed URLs when viewing receipts.

### Website images

Bucket:

```text
site-images
```

Website content images are public because they are displayed on the storefront.

---

## 23. Website images

Editable site-image metadata is handled by:

```text
src/lib/content/site-images.ts
src/app/api/admin/site-images/
src/components/admin/site-image-manager.tsx
```

The settings system stores:

- image source;
- alt text;
- optional Supabase Storage path.

The storefront has built-in fallback images so a missing uploaded image does not automatically break the page.

---

## 24. Notifications

Notification events are defined in:

```text
src/lib/notifications/index.ts
```

The notification boundary currently contains:

- a server-log provider;
- a Resend provider.

This means future notification channels can be added without rewriting the order system.

---

## 25. Analytics

The analytics boundary is:

```text
src/lib/analytics/index.ts
```

The default provider is:

```env
NEXT_PUBLIC_ANALYTICS_PROVIDER=none
```

Supported configuration also includes:

```text
console
plausible
```

Tracked events include storefront actions such as:

- product viewed;
- colour selected;
- size selected;
- add to cart;
- checkout started;
- order created.

The analytics layer is designed not to send customer PII as event payloads.

---

## 26. Garment colourization

The colourization system lives in:

```text
src/lib/colorizer/math.ts
src/components/garment-colorizer.tsx
```

The math is separated from the UI and is testable independently.

The implementation uses image luminance to preserve garment highlights and shadows while changing colour.

A mask can be supplied for more precise image processing.

If colour processing fails, the normal source image can be used instead.

---

## 27. Validation

Validation is handled with Zod.

Important schemas are located in:

```text
src/lib/validation/
```

Admin and checkout requests should continue to be validated at the API boundary.

When adding a new API endpoint:

1. define the input schema;
2. parse the request;
3. perform authentication/permission checks;
4. perform the server-side operation;
5. return the standard API response shape.

Do not trust client-provided prices, totals, roles, payment states or inventory.

---

## 28. Local development

Requirements:

- Node.js 20.9+
- pnpm
- Supabase project

Install:

```bash
pnpm install
```

Create environment variables:

```bash
cp .env.example .env.local
```

Run:

```bash
pnpm dev
```

The local site runs at:

```text
http://localhost:3000
```

---

## 29. Environment variables

The expected variables are documented in:

```text
.env.example
```

Core variables:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_SITE_URL=
```

Scheduled job:

```env
CRON_SECRET=
```

Analytics:

```env
NEXT_PUBLIC_ANALYTICS_PROVIDER=none
NEXT_PUBLIC_PLAUSIBLE_DOMAIN=
```

Email:

```env
RESEND_API_KEY=
RESEND_FROM_EMAIL=
```

Never expose:

```text
SUPABASE_SERVICE_ROLE_KEY
RESEND_API_KEY
CRON_SECRET
```

to the browser.

Do not prefix server-only secrets with `NEXT_PUBLIC_`.

---

## 30. Development commands

```bash
pnpm dev
pnpm build
pnpm start
pnpm typecheck
pnpm lint
pnpm test
```

Before a production deployment, at minimum run:

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

---

## 31. Tests

Tests live in:

```text
src/tests/
```

The test suite uses Node's test runner through `tsx`.

It covers business logic such as:

- product/variant selection;
- inventory calculations;
- cart calculations;
- checkout pricing;
- price-tampering rejection;
- payment/fulfilment transitions;
- permissions;
- upload validation;
- rate limiting;
- colourization math;
- database-row-to-product mapping.

Run:

```bash
pnpm test
```

---

## 32. Deployment

The intended production deployment is Vercel + Supabase.

Typical deployment flow:

```text
Git push
   ↓
Vercel build
   ↓
Next.js production application
   ↓
Supabase database/auth/storage
```

Set all required environment variables in Vercel.

The production site URL should be configured as:

```env
NEXT_PUBLIC_SITE_URL=https://loziawoman.com
```

If the production domain changes, update this value accordingly.

The reservation-release endpoint should also be scheduled through Vercel Cron or another trusted scheduler.

---

## 33. Important collaboration rules

When extending the project:

### For client/content changes
Prefer the admin Content & settings interface rather than hardcoding copy into components.

### For catalogue changes
Use the Products, Attributes and Inventory admin areas rather than changing seeded product data for normal production edits.

### For database changes
Create a new Supabase migration.

Do not silently modify an already-applied production migration.

### For security-sensitive changes
Review:

- API authentication;
- permission checks;
- RLS;
- `SECURITY DEFINER` functions;
- server-side validation;
- storage policies.

### For customer-facing copy
Keep the copy editable where the current CMS/settings model already supports it.

### For images
Use the existing site-image/product-image systems rather than adding duplicate hardcoded assets.

### For payments
Do not introduce a new payment status transition only in the UI. Payment state must remain enforced by the server/database.

---

## 34. Current product decisions / limitations

The current implementation intentionally does not include:

- Paystack;
- Flutterwave;
- automated card payments;
- customer account dashboards;
- customer login for normal shopping;
- customer order history;
- SMS notifications;
- WhatsApp API notifications.

WhatsApp is currently a customer-facing contact link, not an automated messaging provider.

The order model is intentionally guest-first.

---

## 35. Cleanup performed in this version

The repository previously contained two generations of the application.

The older implementation included:

- a file-backed CMS;
- an older storefront implementation;
- an older store shell;
- duplicate bag/CMS providers;
- an unused `/admin/_catchall` path;
- unused view components;
- a large unused set of shadcn/Radix UI primitives;
- unused dependencies retained from the earlier implementation;
- an old workspace API.

The current application is the Supabase-backed Next.js storefront/admin implementation.

Those confirmed unused legacy pieces have been removed so future developers have one application architecture to work with.

The cleanup also:

- removes stale receipt-bucket references and uses the configured `payment-receipts` bucket;
- fixes the customer-delete audit import;
- adds the admin-delete migration required by the existing order/customer DELETE routes;
- keeps only the currently used toast and tooltip UI primitives;
- removes dependencies that are no longer referenced by the remaining source tree.

---

## 36. Repository structure after cleanup

The important project structure is now:

```text
.
├── .env.example
├── .gitignore
├── .npmrc
├── README.md
├── eslint.config.mjs
├── next.config.ts
├── package.json
├── pnpm-lock.yaml
├── postcss.config.mjs
├── tsconfig.json
├── public/
├── src/
│   ├── app/
│   ├── components/
│   ├── hooks/
│   ├── lib/
│   ├── server/
│   ├── tests/
│   └── types/
└── supabase/
    ├── migrations/
    └── seed/
```

There is no longer a second legacy storefront implementation inside the repository.

---

## 37. Working principle for future developers

Before adding code, first check whether the existing system already has a place for the feature.

Prefer:

```text
existing setting → existing component → existing API → existing Supabase model
```

over creating a second parallel implementation.

The goal is for LOZIA to remain understandable to both the brand team and the developers maintaining it.

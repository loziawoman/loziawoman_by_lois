import { z } from 'zod';
import { products as defaultProducts, type Product } from '@/data/products';

// Shared by the server (storage, validation) and the browser (types, defaults). Keep it free of server-only imports.

export type CmsHomepage = {
  eyebrow: string;
  headline: string;
  italicHeadline: string;
  description: string;
  ctaLabel: string;
  announcement: string;
};

export type CmsPolicySection = { title: string; body: string };
export type CmsPolicy = {
  id: 'shipping' | 'returns' | 'privacy';
  name: string;
  intro: string;
  sections: CmsPolicySection[];
};

export type CmsSettings = {
  email: string;
  whatsappDisplay: string;
  whatsappUrl: string;
  city: string;
  hours: string;
  instagram: string;
  footerLine: string;
};

export type SavedChange = { id: string; label: string; savedAt: string };

/** What the public storefront needs. */
export type CmsWorkspace = {
  products: Product[];
  homepage: CmsHomepage;
  policies: CmsPolicy[];
  settings: CmsSettings;
};

/** What is stored on the server: the public content plus the admin's recent change log. */
export type StoredWorkspace = CmsWorkspace & { changes: SavedChange[] };

export const defaultHomepage: CmsHomepage = {
  eyebrow: 'LOZIA / Collection 01',
  headline: 'Defined by',
  italicHeadline: 'elegance.',
  description: 'Contemporary pieces for the woman who knows that presence does not need to be loud.',
  ctaLabel: 'Shop the collection',
  announcement: '',
};

export const defaultPolicies: CmsPolicy[] = [
  {
    id: 'shipping',
    name: 'Shipping',
    intro:
      'Every LOZIA order is wrapped at the Lagos studio and sent with care. We will share delivery updates as soon as your order is on its way.',
    sections: [
      {
        title: 'Delivery windows',
        body:
          'Lagos deliveries usually arrive within 2–5 working days. Deliveries to other Nigerian cities usually take 3–7 working days. International orders generally arrive within 5–10 working days, depending on destination and customs.',
      },
      {
        title: 'Fees and tracking',
        body:
          'Delivery fees are calculated at checkout based on your destination. Once your parcel leaves the studio, our team will send the available tracking or courier details to the email or phone number on the order.',
      },
      {
        title: 'A small studio note',
        body:
          'Orders are checked and packed by hand. If your delivery address changes, message the studio as quickly as possible on WhatsApp before the parcel has been dispatched.',
      },
    ],
  },
  {
    id: 'returns',
    name: 'Returns',
    intro: 'If a piece is not quite right, contact the studio within 7 days of delivery. We will help you work through the next step.',
    sections: [
      {
        title: 'Eligibility',
        body:
          'Items must be unworn, unwashed, undamaged and returned with their original tags and packaging. Please check your order as soon as it arrives and keep the piece protected while a return is arranged.',
      },
      {
        title: 'How to start',
        body:
          'Send your order number, the piece you would like to return and a short reason to hello@lozia.studio or WhatsApp. We will confirm the return address and the available resolution before you send anything back.',
      },
      {
        title: 'Exceptions',
        body:
          'For hygiene and production reasons, altered, personalised, worn, washed or final-sale pieces cannot be returned. Return delivery is the customer’s responsibility unless the item arrived damaged or incorrect.',
      },
    ],
  },
  {
    id: 'privacy',
    name: 'Privacy',
    intro:
      'Your details stay between you and LOZIA. We only use the information needed to fulfil your order, answer your questions and keep the studio running.',
    sections: [
      {
        title: 'What we collect',
        body:
          'When you place an order or contact us, we may receive your name, delivery details, email address, phone number and the information needed to help with your request.',
      },
      {
        title: 'How we use it',
        body:
          'We use these details to confirm orders, arrange delivery, respond to messages, handle returns and improve the shopping experience. We do not sell your personal information.',
      },
      {
        title: 'Your choices',
        body:
          'You can ask what personal information we hold, request a correction or ask us to stop using it where there is no legal or fulfilment reason to keep it. Write to hello@lozia.studio and we will help.',
      },
    ],
  },
];

export const defaultSettings: CmsSettings = {
  email: 'hello@lozia.studio',
  whatsappDisplay: '+234 000 000 0000',
  whatsappUrl: 'https://wa.me/2340000000000?text=Hello%20LOZIA%20studio%2C%20I%27d%20like%20to%20ask%20about%20a%20piece.',
  city: 'Lagos, Nigeria',
  hours: 'Mon–Fri, 10:00–17:00',
  instagram: '@lozia.studio',
  footerLine: '© 2025 LOZIA Studio · Lagos, Nigeria',
};


export const makeDefaultWorkspace = (): StoredWorkspace => ({
  products: defaultProducts.map((product) => ({
    ...product,
    images: [...product.images],
    colours: product.colours.map((colour) => ({ ...colour })),
    sizes: [...product.sizes],
    variants: product.variants.map((variant) => ({ ...variant })),
  })),
  homepage: { ...defaultHomepage },
  policies: defaultPolicies.map((policy) => ({
    ...policy,
    sections: policy.sections.map((section) => ({ ...section })),
  })),
  settings: { ...defaultSettings },
  changes: [],
});

export const publicWorkspace = ({ changes: _changes, ...workspace }: StoredWorkspace): CmsWorkspace => workspace;

export const findPolicy = (policies: CmsPolicy[], id: CmsPolicy['id']): CmsPolicy =>
  policies.find((policy) => policy.id === id) ?? defaultPolicies.find((policy) => policy.id === id)!;

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

const text = (max: number) => z.string().max(max);
const isLocalPath = (value: string) => value.startsWith('/') && !value.startsWith('//');
const isImageSource = (value: string) => isLocalPath(value) || /^https?:\/\//i.test(value);

const productSchema = z.object({
  id: z.string().min(1).max(120),
  slug: z.string().min(1).max(120).regex(/^[a-z0-9-]+$/, 'Product slugs can only use lowercase letters, numbers and hyphens.'),
  name: text(160),
  description: text(2000),
  price: z.number().finite().min(0).max(1_000_000_000),
  category: text(80),
  images: z.array(z.string().max(2048).refine(isImageSource, 'Image URLs must start with "/" or "http(s)://".')).max(10),
  colours: z.array(z.object({ name: text(60), hex: z.string().regex(/^#[0-9a-fA-F]{6}$/) })).max(30),
  sizes: z.array(text(20)).max(30),
  variants: z
    .array(z.object({ colour: text(60), size: text(20), stock: z.number().int().min(0).max(100_000) }))
    .max(1000),
  fabric: text(200),
  care: text(200),
  featured: z.boolean().optional(),
  newArrival: z.boolean().optional(),
  originalColor: text(60),
  colourMask: z.string().max(2048).refine(isImageSource).optional(),
});

const homepageSchema = z.object({
  eyebrow: text(120),
  headline: text(120),
  italicHeadline: text(120),
  description: text(600),
  ctaLabel: text(60),
  announcement: text(240),
});

const policySchema = z.object({
  id: z.enum(['shipping', 'returns', 'privacy']),
  name: text(60),
  intro: text(1200),
  sections: z.array(z.object({ title: text(120), body: text(4000) })).max(12),
});

const settingsSchema = z.object({
  email: text(160),
  whatsappDisplay: text(60),
  whatsappUrl: z.string().max(1000).regex(/^https?:\/\//i, 'The WhatsApp link must start with http:// or https://.'),
  city: text(120),
  hours: text(120),
  instagram: text(80),
  footerLine: text(240),
});

const changeSchema = z.object({ id: text(60), label: text(240), savedAt: text(60) });

const productsSchema = z.array(productSchema).max(500);
const policiesSchema = z.array(policySchema).max(10);
const changesSchema = z.array(changeSchema).max(50);

const workspaceSchema = z.object({
  products: productsSchema,
  homepage: homepageSchema,
  policies: policiesSchema,
  settings: settingsSchema,
  changes: changesSchema,
});

/** Strict check for anything an admin sends. */
export function parseWorkspaceInput(
  raw: unknown,
): { ok: true; data: StoredWorkspace } | { ok: false; error: string } {
  const result = workspaceSchema.safeParse(raw);
  if (!result.success) {
    const issue = result.error.issues[0];
    const where = issue?.path.length ? ` (${issue.path.join(' › ')})` : '';
    return { ok: false, error: `${issue?.message ?? 'The content is not valid.'}${where}` };
  }

  const products = result.data.products;
  if (new Set(products.map((product) => product.slug)).size !== products.length) {
    return { ok: false, error: 'Two pieces share the same slug. Give each piece its own slug.' };
  }
  if (new Set(products.map((product) => product.id)).size !== products.length) {
    return { ok: false, error: 'Two pieces share the same id.' };
  }
  return { ok: true, data: result.data };
}

/** Lenient read of stored data: keeps every section that is still valid and falls back to defaults for the rest. */
export function normaliseWorkspace(raw: unknown): StoredWorkspace {
  const fallback = makeDefaultWorkspace();
  if (!raw || typeof raw !== 'object') return fallback;
  const saved = raw as Record<string, unknown>;

  const products = productsSchema.safeParse(saved.products);
  const homepage = homepageSchema.partial().safeParse(saved.homepage);
  const policies = policiesSchema.safeParse(saved.policies);
  const settings = settingsSchema.partial().safeParse(saved.settings);
  const changes = changesSchema.safeParse(saved.changes);

  return {
    products: products.success ? products.data : fallback.products,
    homepage: { ...fallback.homepage, ...(homepage.success ? homepage.data : {}) },
    policies: policies.success ? policies.data : fallback.policies,
    settings: { ...fallback.settings, ...(settings.success ? settings.data : {}) },
    changes: changes.success ? changes.data : [],
  };
}

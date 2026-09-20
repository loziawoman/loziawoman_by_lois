import { useEffect, useState } from 'react';
import type { Product } from '@/data/products';
import { products as defaultProducts } from '@/data/products';

export const CMS_STORAGE_KEY = 'lozia-admin-workspace-v1';
export const CMS_CHANGE_EVENT = 'lozia-cms-change';

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

export type CmsWorkspace = {
  products: Product[];
  homepage: CmsHomepage;
  policies: CmsPolicy[];
  settings: CmsSettings;
};

const defaultHomepage: CmsHomepage = {
  eyebrow: 'LOZIA / Collection 01',
  headline: 'Defined by',
  italicHeadline: 'elegance.',
  description: 'Contemporary pieces for the woman who knows that presence does not need to be loud.',
  ctaLabel: 'Shop the collection',
  announcement: '',
};

const defaultPolicies: CmsPolicy[] = [
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

const defaultSettings: CmsSettings = {
  email: 'hello@lozia.studio',
  whatsappDisplay: '+234 000 000 0000',
  whatsappUrl: 'https://wa.me/2340000000000?text=Hello%20LOZIA%20studio%2C%20I%27d%20like%20to%20ask%20about%20a%20piece.',
  city: 'Lagos, Nigeria',
  hours: 'Mon–Fri, 10:00–17:00',
  instagram: '@lozia.studio',
  footerLine: '© 2025 LOZIA Studio · Lagos, Nigeria',
};

const cloneWorkspace = (): CmsWorkspace => ({
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
});

const isProduct = (value: unknown): value is Product =>
  Boolean(value && typeof value === 'object' && 'id' in value && 'slug' in value && 'name' in value);

export function readCmsWorkspace(): CmsWorkspace {
  const fallback = cloneWorkspace();
  if (typeof window === 'undefined') return fallback;

  try {
    const saved = JSON.parse(window.localStorage.getItem(CMS_STORAGE_KEY) || 'null') as Partial<CmsWorkspace> | null;
    if (!saved) return fallback;
    return {
      products: Array.isArray(saved.products) ? saved.products.filter(isProduct) : fallback.products,
      homepage: { ...fallback.homepage, ...(saved.homepage ?? {}) },
      policies: Array.isArray(saved.policies) ? saved.policies : fallback.policies,
      settings: { ...fallback.settings, ...(saved.settings ?? {}) },
    };
  } catch {
    return fallback;
  }
}

export function useCmsWorkspace() {
  const [workspace, setWorkspace] = useState<CmsWorkspace>(() => readCmsWorkspace());

  useEffect(() => {
    const refresh = () => setWorkspace(readCmsWorkspace());
    window.addEventListener(CMS_CHANGE_EVENT, refresh);
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener(CMS_CHANGE_EVENT, refresh);
      window.removeEventListener('storage', refresh);
    };
  }, []);

  return workspace;
}

export function getCmsPolicy(workspace: CmsWorkspace, kind: CmsPolicy['id']) {
  return workspace.policies.find((policy) => policy.id === kind) ?? cloneWorkspace().policies.find((policy) => policy.id === kind)!;
}
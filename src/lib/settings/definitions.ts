import { z } from 'zod';
import type { BankDetails, SiteSettings } from '@/types';
import { defaultSiteImages } from '@/lib/content/site-images';
import {
  defaultAboutStory, defaultHomepage, defaultPrivacyPolicy, defaultReturnsPolicy, defaultShippingPolicy,
  defaultShippingRates, defaultSizeGuide, defaultTermsPolicy,
} from '@/lib/content/defaults';

const text = (max: number) => z.string().trim().max(max);

const policySchema = z.object({
  title: text(120),
  intro: text(1500),
  isPlaceholder: z.boolean(),
  sections: z.array(z.object({ title: text(160), body: text(6000) })).max(20),
});

export const shippingRatesSchema = z.object({
  defaultFee: z.number().finite().min(0).max(1_000_000),
  byState: z.record(z.string(), z.number().finite().min(0).max(1_000_000)),
  freeAbove: z.number().finite().min(0).nullable(),
  placeholder: z.boolean(),
});

const siteImageSchema = z.object({ src: text(1000), alt: text(300), storagePath: z.union([z.string().trim().max(500), z.null()]) });
const siteImagesSchema = z.object({
  logo: siteImageSchema, home_hero: siteImageSchema, home_tailoring: siteImageSchema, home_everyday: siteImageSchema,
  home_evening: siteImageSchema, home_editorial: siteImageSchema, about_hero: siteImageSchema, about_editorial: siteImageSchema, contact_hero: siteImageSchema,
});

const homepageSchema = z.object({
  announcement: text(240), eyebrow: text(120), headline: text(120), italicHeadline: text(120), description: text(600), ctaLabel: text(60),
});

const sizeGuideSchema = z.object({
  intro: text(1000),
  howToMeasure: z.array(text(300)).max(12),
  isPlaceholder: z.boolean(),
  rows: z.array(z.object({ size: text(10), bust: text(30), waist: text(30), hip: text(30), uk: text(10) })).max(20),
});

const url = z.union([z.literal(''), z.string().trim().max(500).regex(/^https:\/\//i, 'Use a full https:// link.')]);

/** Every editable setting: how it is validated, whether the public can read it, and its fallback. Bank details are never public. */
export const SETTING_DEFINITIONS = {
  brand_name: { schema: text(80).min(1), isPublic: true, fallback: 'LOZIA' },
  tagline: { schema: text(160), isPublic: true, fallback: 'A distinctive expression of self.' },
  contact_email: { schema: z.union([z.literal(''), z.string().trim().email().max(254)]), isPublic: true, fallback: '' },
  whatsapp_number: { schema: z.string().trim().regex(/^(\d{8,15})?$/, 'Digits only, with country code and no + sign, e.g. 2348012345678.'), isPublic: true, fallback: '' },
  whatsapp_message: { schema: text(300), isPublic: true, fallback: "Hello LOZIA, I'd like to make an enquiry about your collection." },
  instagram_url: { schema: url, isPublic: true, fallback: '' },
  tiktok_url: { schema: url, isPublic: true, fallback: '' },
  studio_location: { schema: text(200), isPublic: true, fallback: '' },
  studio_hours: { schema: text(200), isPublic: true, fallback: '' },
  reservation_hours: { schema: z.number().int().min(1).max(720), isPublic: true, fallback: 48 },
  shipping_rates: { schema: shippingRatesSchema, isPublic: true, fallback: defaultShippingRates },
  homepage: { schema: homepageSchema, isPublic: true, fallback: defaultHomepage },
  policy_shipping: { schema: policySchema, isPublic: true, fallback: defaultShippingPolicy },
  policy_returns: { schema: policySchema, isPublic: true, fallback: defaultReturnsPolicy },
  policy_privacy: { schema: policySchema, isPublic: true, fallback: defaultPrivacyPolicy },
  policy_terms: { schema: policySchema, isPublic: true, fallback: defaultTermsPolicy },
  size_guide: { schema: sizeGuideSchema, isPublic: true, fallback: defaultSizeGuide },
  about_story: { schema: text(3000), isPublic: true, fallback: defaultAboutStory },
  review_submission_enabled: { schema: z.boolean(), isPublic: true, fallback: true },
  site_images: { schema: siteImagesSchema, isPublic: true, fallback: defaultSiteImages() },
  bank_name: { schema: text(120), isPublic: false, fallback: '' },
  bank_account_name: { schema: text(120), isPublic: false, fallback: '' },
  bank_account_number: { schema: z.string().trim().regex(/^[0-9 -]{0,30}$/, 'Digits only.'), isPublic: false, fallback: '' },
} as const;

export type SettingKey = keyof typeof SETTING_DEFINITIONS;
export const isSettingKey = (key: string): key is SettingKey => key in SETTING_DEFINITIONS;
export const PUBLIC_SETTING_KEYS = (Object.keys(SETTING_DEFINITIONS) as SettingKey[]).filter((k) => SETTING_DEFINITIONS[k].isPublic);
export const PRIVATE_SETTING_KEYS = (Object.keys(SETTING_DEFINITIONS) as SettingKey[]).filter((k) => !SETTING_DEFINITIONS[k].isPublic);

type Row = { key: string; value: unknown };

/** Reads one stored value, falling back to the default when it is missing or no longer valid. */
function read<K extends SettingKey>(rows: Row[], key: K): z.infer<(typeof SETTING_DEFINITIONS)[K]['schema']> {
  const def = SETTING_DEFINITIONS[key];
  const row = rows.find((r) => r.key === key);
  if (!row) return def.fallback as never;
  const parsed = def.schema.safeParse(row.value);
  return (parsed.success ? parsed.data : def.fallback) as never;
}

export function buildSiteSettings(rows: Row[]): SiteSettings {
  return {
    brandName: read(rows, 'brand_name'),
    tagline: read(rows, 'tagline'),
    contactEmail: read(rows, 'contact_email'),
    whatsappNumber: read(rows, 'whatsapp_number'),
    whatsappMessage: read(rows, 'whatsapp_message'),
    instagramUrl: read(rows, 'instagram_url'),
    tiktokUrl: read(rows, 'tiktok_url'),
    studioLocation: read(rows, 'studio_location'),
    studioHours: read(rows, 'studio_hours'),
    reservationHours: read(rows, 'reservation_hours'),
    shippingRates: read(rows, 'shipping_rates'),
    homepage: read(rows, 'homepage'),
    policies: {
      shipping: read(rows, 'policy_shipping'),
      returns: read(rows, 'policy_returns'),
      privacy: read(rows, 'policy_privacy'),
      terms: read(rows, 'policy_terms'),
    },
    sizeGuide: read(rows, 'size_guide'),
    aboutStory: read(rows, 'about_story'),
    reviewSubmissionEnabled: read(rows, 'review_submission_enabled'),
    siteImages: read(rows, 'site_images'),
  };
}

export function buildBankDetails(rows: Row[]): BankDetails {
  const bankName = read(rows, 'bank_name');
  const accountName = read(rows, 'bank_account_name');
  const accountNumber = read(rows, 'bank_account_number');
  return { bankName, accountName, accountNumber, configured: Boolean(bankName && accountName && accountNumber) };
}

/** wa.me link. With no number configured it opens WhatsApp's chooser rather than pointing at a made-up number. */
export function whatsappHref(number: string, message: string): string {
  const text = encodeURIComponent(message);
  return number ? `https://wa.me/${number}?text=${text}` : `https://wa.me/?text=${text}`;
}

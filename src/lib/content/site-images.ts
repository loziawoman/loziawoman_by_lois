import type { SiteImage, SiteImageKey, SiteImages } from '@/types';

export const SITE_IMAGE_KEYS: SiteImageKey[] = [
  'logo',
  'home_hero',
  'home_tailoring',
  'home_everyday',
  'home_evening',
  'home_editorial',
  'about_hero',
  'about_editorial',
  'contact_hero',
];

export const SITE_IMAGE_META: Record<SiteImageKey, { label: string; description: string; fallback: string; alt: string }> = {
  logo: { label: 'Brand logo', description: 'Used in the storefront header and footer.', fallback: '/images/logo-nav.jpeg', alt: 'LOZIA logo' },
  home_hero: { label: 'Homepage hero', description: 'Large image in the homepage hero.', fallback: '/images/lozia-logo.jpeg', alt: 'LOZIA editorial hero' },
  home_tailoring: { label: 'Homepage — Tailoring tile', description: 'Image behind the Tailoring category tile.', fallback: '/images/lozia-blazer.jpg', alt: 'LOZIA tailoring' },
  home_everyday: { label: 'Homepage — Everyday tile', description: 'Image behind the Everyday / Sets category tile.', fallback: '/images/atelier-set.jpg', alt: 'LOZIA everyday collection' },
  home_evening: { label: 'Homepage — Evening tile', description: 'Image behind the Evening / Dresses category tile.', fallback: '/images/muse-dress.jpg', alt: 'LOZIA evening collection' },
  home_editorial: { label: 'Homepage — LOZIA woman editorial', description: 'Editorial image beside the LOZIA woman statement.', fallback: '/images/atelier-set.jpg', alt: 'The LOZIA woman' },
  about_hero: { label: 'About — hero image', description: 'Large portrait on the About page.', fallback: '/images/lozia-about-hero.png', alt: 'LOZIA woman in a dark tailored suit' },
  about_editorial: { label: 'About — editorial image', description: 'Editorial image beside the About story.', fallback: '/images/muse-dress.jpg', alt: 'LOZIA editorial' },
  contact_hero: { label: 'Contact — hero image', description: 'Large image on the Contact page.', fallback: '/images/lozia-blazer.jpg', alt: 'LOZIA studio tailoring' },
};

export const defaultSiteImages = (): SiteImages => Object.fromEntries(
  SITE_IMAGE_KEYS.map((key) => [key, { src: SITE_IMAGE_META[key].fallback, alt: SITE_IMAGE_META[key].alt, storagePath: null }]),
) as SiteImages;

export const getSiteImage = (images: SiteImages, key: SiteImageKey): SiteImage => images[key] ?? defaultSiteImages()[key];

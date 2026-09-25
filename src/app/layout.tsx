import type { Metadata, Viewport } from 'next';
import { GoogleAnalytics } from '@next/third-parties/google';
import { DM_Mono, DM_Sans, Playfair_Display } from 'next/font/google';
import { Providers } from '@/components/providers';
import './globals.css';

const dmSans = DM_Sans({ subsets: ['latin'], weight: ['400', '500', '600'], variable: '--font-dm-sans', display: 'swap' });
const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['500', '600'],
  style: ['normal', 'italic'],
  variable: '--font-playfair',
  display: 'swap',
});
const dmMono = DM_Mono({ subsets: ['latin'], weight: ['400', '500'], variable: '--font-dm-mono', display: 'swap' });

const description =
  "LOZIA is an Abuja-born women's fashion label creating contemporary pieces for the woman who knows that presence does not need to be loud.";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, '') ?? (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : 'http://localhost:3000');
const metadataBase = new URL(siteUrl);
const ogImageUrl = `${siteUrl}/images/og-image.png`;

export const metadata: Metadata = {
  metadataBase,
  title: {
    default: 'LOZIA | Contemporary Women’s Fashion',
    template: '%s | LOZIA',
  },
  description,
  applicationName: 'LOZIA',
  generator: 'Next.js',
  keywords: [
    'LOZIA',
    'LOZIA fashion',
    'women’s fashion',
    'womens fashion',
    'contemporary fashion',
    'Abuja fashion',
    'Nigerian fashion',
    'Nigerian womenswear',
    'women clothing Nigeria',
    'LOZIA woman',
  ],
  authors: [{ name: 'LOZIA' }],
  creator: 'LOZIA',
  publisher: 'LOZIA',
  category: 'fashion',
  alternates: {
    canonical: '/',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  manifest: '/site.webmanifest',
  openGraph: {
    type: 'website',
    locale: 'en_NG',
    url: siteUrl,
    siteName: 'LOZIA',
    title: 'LOZIA | Contemporary Women’s Fashion',
    description,
    images: [
      {
        url: ogImageUrl,
        width: 1200,
        height: 630,
        alt: 'LOZIA contemporary women’s fashion',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LOZIA | Contemporary Women’s Fashion',
    description,
    images: [ogImageUrl],
  },
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: '#ffffff',
  colorScheme: 'light',
};

// Shop content is read from the server on every request, so no page may be prerendered at build time.
export const dynamic = 'force-dynamic';

export default async function RootLayout({ children }: { children: React.ReactNode }) {

  return (
    <html lang="en" className={`${dmSans.variable} ${playfair.variable} ${dmMono.variable}`}>
      <body>
        <Providers>{children}</Providers>
      </body>
      <GoogleAnalytics gaId="G-JMBWW5YKLH" />
    </html>
  );
}

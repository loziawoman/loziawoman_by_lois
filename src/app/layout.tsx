import type { Metadata } from 'next';
import { connection } from 'next/server';
import { DM_Mono, DM_Sans, Playfair_Display } from 'next/font/google';
import { Providers } from '@/components/providers';
import { publicWorkspace } from '@/lib/cms';
import { readWorkspace } from '@/server/cms-store';
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
  "LOZIA is an Abuja-born women's fashion label. Contemporary pieces for the woman who knows that presence does not need to be loud.";

export const metadata: Metadata = {
  title: { default: 'LOZIA Fashion Storefront', template: '%s | LOZIA' },
  description,
  robots: { index: true, follow: true },
  icons: { icon: '/favicon.ico' },
  openGraph: { type: 'website', title: 'LOZIA Fashion Storefront', description },
  twitter: { card: 'summary_large_image', title: 'LOZIA Fashion Storefront', description },
};

// Shop content is read from the server on every request, so no page may be prerendered at build time.
export const dynamic = 'force-dynamic';

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  await connection();
  // Every page gets a fresh copy of the content so admin edits show up straight away.
  const workspace = publicWorkspace(await readWorkspace());

  return (
    <html lang="en" className={`${dmSans.variable} ${playfair.variable} ${dmMono.variable}`}>
      <body>
        <Providers workspace={workspace}>{children}</Providers>
      </body>
    </html>
  );
}

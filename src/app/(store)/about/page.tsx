import type { Metadata } from 'next';
import { AboutPage, ContactSection } from '@/views/storefront-pages';

export const metadata: Metadata = { title: 'About' };

export default function Page() {
  return (
    <>
      <AboutPage />
      <ContactSection />
    </>
  );
}

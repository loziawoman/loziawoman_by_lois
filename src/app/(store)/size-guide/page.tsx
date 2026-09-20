import type { Metadata } from 'next';
import { SizeGuidePage } from '@/views/storefront-pages';

export const metadata: Metadata = { title: 'Size guide' };

export default function Page() {
  return <SizeGuidePage />;
}

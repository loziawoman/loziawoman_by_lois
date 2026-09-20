import type { Metadata } from 'next';
import { CheckoutPage } from '@/views/storefront-pages';

export const metadata: Metadata = { title: 'Checkout' };

export default function Page() {
  return <CheckoutPage />;
}

import { notFound } from 'next/navigation';

// Any URL that no other route matches lands here so the 404 page still gets the storefront header and footer.
export default function UnmatchedPage() {
  notFound();
}

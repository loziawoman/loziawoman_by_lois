import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export default function NotFound() {
  return (
    <main className="mx-auto max-w-[900px] px-5 py-20 md:px-10 md:py-32">
      <span className="mono text-[hsl(var(--accent))]">Error 404</span>
      <h1 className="serif mt-5 text-6xl md:text-8xl">Page not found.</h1>
      <p className="mt-7 max-w-[600px] text-lg leading-8 text-[hsl(var(--muted-foreground))]">
        This page may have moved on, but there is more to discover.
      </p>
      <Link
        href="/shop"
        className="mt-9 inline-flex items-center gap-3 border-b border-current pb-2 mono"
        data-testid="link-not-found-shop"
      >
        Back to the collection <ArrowRight size={14} />
      </Link>
    </main>
  );
}

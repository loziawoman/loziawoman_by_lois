import type { Metadata } from 'next';

export const metadata: Metadata = { title: { default: 'Studio desk', template: '%s | Studio desk' }, robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

export default function AdminRoot({ children }: { children: React.ReactNode }) {
  return <div className="min-h-[100dvh] bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">{children}</div>;
}

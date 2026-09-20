import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Order confirmed' };

export default function Page() {
  return (
    <main className="mx-auto max-w-[900px] px-5 py-20 md:px-10 md:py-32">
      <span className="mono text-[hsl(var(--accent))]">LOZIA information</span>
      <h1 className="serif mt-5 text-6xl md:text-8xl">Order confirmed.</h1>
      <p className="mt-7 max-w-[600px] text-lg leading-8 text-[hsl(var(--muted-foreground))]">
        Your order is in our hands. We are verifying your transfer now and will write to you with the next step.
      </p>
    </main>
  );
}

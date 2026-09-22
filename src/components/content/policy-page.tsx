import type { PolicyContent } from '@/types';

export function PlaceholderNotice({ what }: { what: string }) {
  return (
    <p role="note" className="mt-8 border border-[hsl(var(--accent))] bg-[hsl(var(--accent))]/10 px-4 py-3 text-xs leading-6" data-testid="notice-placeholder">
      <strong className="mono">Draft:</strong> {what} is placeholder text and has not been finalised by the business. Items in [square brackets] still need real information.
    </p>
  );
}

export function PolicyPage({ policy, eyebrow }: { policy: PolicyContent; eyebrow: string }) {
  return (
    <main className="mx-auto max-w-[1000px] px-5 py-20 md:px-10 md:py-32">
      <span className="mono text-[hsl(var(--accent))]">{eyebrow}</span>
      <h1 className="serif mt-5 text-6xl md:text-8xl">{policy.title}.</h1>
      <p className="mt-6 max-w-[620px] text-lg leading-8 text-[hsl(var(--muted-foreground))]">{policy.intro}</p>
      {policy.isPlaceholder && <PlaceholderNotice what={`The ${policy.title.toLowerCase()} information`} />}
      <div className="mt-14 grid gap-10 border-t border-[hsl(var(--border))] pt-10 md:grid-cols-2">
        {policy.sections.map((section, index) => (
          <section key={`${index}-${section.title}`}>
            <span className="mono text-[hsl(var(--accent))]">{String(index + 1).padStart(2, '0')}</span>
            <h2 className="serif mt-3 text-3xl">{section.title}</h2>
            <p className="mt-3 whitespace-pre-line text-sm leading-7 text-[hsl(var(--muted-foreground))]">{section.body}</p>
          </section>
        ))}
      </div>
    </main>
  );
}

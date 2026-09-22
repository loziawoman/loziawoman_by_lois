export default function Loading() {
  return (
    <div className="mx-auto max-w-[1440px] px-5 py-20 md:px-10" role="status" aria-label="Loading">
      <div className="h-4 w-24 animate-pulse bg-[hsl(var(--muted))]" />
      <div className="mt-6 h-16 w-2/3 animate-pulse bg-[hsl(var(--muted))]" />
      <div className="mt-12 grid grid-cols-2 gap-6 md:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => <div key={i} className="aspect-[4/5] animate-pulse bg-[hsl(var(--muted))]" />)}
      </div>
    </div>
  );
}

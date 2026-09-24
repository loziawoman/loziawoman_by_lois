'use client';

import { FormEvent, useEffect, useState } from 'react';
import { MessageCircle, Star, X } from 'lucide-react';
import type { Review } from '@/types';

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, index) => (
        <Star key={index} size={19} strokeWidth={1.5}
          fill={index < rating ? 'currentColor' : 'none'}
          className={index < rating ? 'text-[#a77d46]' : 'text-[hsl(var(--foreground))]/65'}
          aria-hidden="true" />
      ))}
    </div>
  );
}

export function ReviewsSection({ reviewSubmissionEnabled }: { reviewSubmissionEnabled: boolean }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [name, setName] = useState('');
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/reviews', { cache: 'no-store' })
      .then((r) => r.json())
      .then((payload) => {
        if (!cancelled && payload?.ok && Array.isArray(payload.data)) setReviews(payload.data);
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const cleanName = name.trim();
    const cleanText = text.trim();
    if (!cleanName || !cleanText) return;

    const response = await fetch('/api/reviews', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: cleanName, rating, message: cleanText }),
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok || !payload?.ok) {
      window.alert(payload?.error?.message ?? 'Unable to publish your review.');
      return;
    }

    const row = payload.data;
    const created: Review = {
      id: row.id,
      name: row.name,
      email: row.email ?? null,
      rating: row.rating,
      message: row.message,
      status: row.status,
      createdAt: row.created_at,
    };
    setReviews((current) => [created, ...current]);
    setName('');
    setText('');
    setRating(5);
    setOpen(false);
  };

  return (
    <>
      <section id="reviews" className="scroll-mt-[90px] relative overflow-hidden bg-[hsl(var(--background))]" aria-labelledby="reviews-heading">
        <div className="pointer-events-none absolute -bottom-48 -left-24 h-[520px] w-[520px] rounded-full border-2 border-[hsl(var(--accent))]/20" />
        <div className="mx-auto max-w-[1440px] px-5 py-20 md:px-10 md:py-28">
          <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between md:gap-12">
            <div>
              <span className="mono text-[hsl(var(--accent))]">From the women who wear LOZIA</span>
              <h2 id="reviews-heading" className="serif mt-4 text-6xl leading-[.95] tracking-[-.035em] md:text-7xl lg:text-8xl">Reviews</h2>
              <p className="mt-5 max-w-[520px] text-base leading-7 text-[hsl(var(--muted-foreground))]">
                Real experiences. Beautiful stories. From our amazing customers.
              </p>
              <div className="mt-5 h-px w-32 bg-[hsl(var(--accent))]" />
            </div>

            {reviewSubmissionEnabled && (
              <button type="button" onClick={() => setOpen(true)}
                className="review-bubble group relative inline-flex w-fit shrink-0 items-center gap-4 self-start px-8 py-5 text-left text-base transition-transform duration-300 hover:-translate-y-1 md:mt-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-full border border-current/80">
                  <MessageCircle size={19} strokeWidth={1.5} />
                </span>
                <span>Leave a review</span>
                <span className="review-bubble-tail" aria-hidden="true" />
                <span className="review-bubble-spark review-bubble-spark-one" aria-hidden="true" />
                <span className="review-bubble-spark review-bubble-spark-two" aria-hidden="true" />
              </button>
            )}
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {loading ? (
              <div className="text-sm text-[hsl(var(--muted-foreground))]">Loading reviews…</div>
            ) : reviews.length === 0 ? (
              <div className="text-sm text-[hsl(var(--muted-foreground))]">No customer reviews yet.</div>
            ) : reviews.slice(0, 6).map((review) => (
              <article key={review.id}
                className="review-card flex min-h-[285px] flex-col border border-[hsl(var(--border))] bg-[hsl(var(--card))]/70 p-7 shadow-[0_12px_40px_rgba(48,34,26,0.035)] transition-transform duration-300 hover:-translate-y-1 md:p-9">
                <Stars rating={review.rating} />
                <blockquote className="serif mt-8 max-w-[480px] text-[1.45rem] leading-[1.28] tracking-[-.015em] md:text-[1.55rem]">
                  “{review.message}”
                </blockquote>
                <div className="mt-auto flex items-center gap-4 pt-10">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[hsl(var(--muted))] serif text-lg text-[hsl(var(--accent))]">
                    {review.name.charAt(0)}
                  </div>
                  <div>
                    <p className="mono text-[hsl(var(--foreground))]">{review.name}</p>
                    <p className="mt-1 text-xs tracking-[.16em] text-[hsl(var(--muted-foreground))]">CUSTOMER</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {reviewSubmissionEnabled && open && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-[hsl(var(--primary))]/45 p-5 backdrop-blur-sm"
          role="dialog" aria-modal="true" aria-labelledby="review-dialog-title">
          <div className="w-full max-w-[560px] border border-[hsl(var(--border))] bg-[hsl(var(--background))] p-6 shadow-2xl md:p-9">
            <div className="flex items-start justify-between gap-6">
              <div>
                <span className="mono text-[hsl(var(--accent))]">Your experience</span>
                <h3 id="review-dialog-title" className="serif mt-2 text-4xl">Leave a review.</h3>
              </div>
              <button type="button" onClick={() => setOpen(false)}
                className="flex h-10 w-10 items-center justify-center border border-[hsl(var(--border))]" aria-label="Close review form">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={submit} className="mt-8 space-y-6">
              <label className="block">
                <span className="mono">Your name</span>
                <input value={name} onChange={(e) => setName(e.target.value)} required maxLength={80}
                  className="mt-2 h-12 w-full border border-[hsl(var(--border))] bg-transparent px-4 outline-none focus:border-[hsl(var(--accent))]"
                  placeholder="Your name" />
              </label>

              <fieldset>
                <legend className="mono">Your rating</legend>
                <div className="mt-3 flex gap-2">
                  {Array.from({ length: 5 }).map((_, index) => {
                    const value = index + 1;
                    return (
                      <button key={value} type="button" onClick={() => setRating(value)}
                        className="rounded-sm p-1 text-[#a77d46]" aria-label={`${value} star${value > 1 ? 's' : ''}`} aria-pressed={rating === value}>
                        <Star size={24} fill={value <= rating ? 'currentColor' : 'none'} strokeWidth={1.5} />
                      </button>
                    );
                  })}
                </div>
              </fieldset>

              <label className="block">
                <span className="mono">Your review</span>
                <textarea value={text} onChange={(e) => setText(e.target.value)} required maxLength={500} rows={5}
                  className="mt-2 w-full resize-none border border-[hsl(var(--border))] bg-transparent p-4 outline-none focus:border-[hsl(var(--accent))]"
                  placeholder="Tell us about your LOZIA experience..." />
              </label>

              <button type="submit"
                className="inline-flex min-h-12 w-full items-center justify-center bg-[hsl(var(--primary))] px-6 py-4 mono text-[hsl(var(--primary-foreground))] hover:opacity-90">
                Publish review
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

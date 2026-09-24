'use client';

import { FormEvent, useEffect, useState } from 'react';
import { MessageCircle, Star, X } from 'lucide-react';

type Review = {
  id: string;
  name: string;
  rating: number;
  text: string;
};

const DEFAULT_REVIEWS: Review[] = [
  // { id: 'nexa-queens', name: 'NEXA QUEENS', rating: 5, text: 'Lozia woman actually delivered, nothing to say much' },
  // { id: 'cos-wife', name: "THE COS'S WIFE", rating: 5, text: 'This is a very reliable source' },
  // { id: 'nex', name: 'NEX', rating: 4, text: 'Your dev delivered and killed' },
];

const STORAGE_KEY = 'lozia-customer-reviews';

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, index) => (
        <Star
          key={index}
          size={19}
          strokeWidth={1.5}
          fill={index < rating ? 'currentColor' : 'none'}
          className={index < rating ? 'text-[#a77d46]' : 'text-[hsl(var(--foreground))]/65'}
          aria-hidden="true"
        />
      ))}
    </div>
  );
}

export function ReviewsSection() {
  const [reviews, setReviews] = useState<Review[]>(DEFAULT_REVIEWS);
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [name, setName] = useState('');
  const [text, setText] = useState('');

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as Review[];
        if (Array.isArray(parsed)) setReviews([...parsed, ...DEFAULT_REVIEWS]);
      }
    } catch {
      // Keep the default reviews if local storage is unavailable or malformed.
    }
  }, []);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const cleanName = name.trim();
    const cleanText = text.trim();
    if (!cleanName || !cleanText) return;

    const review: Review = {
      id: `${Date.now()}`,
      name: cleanName.toUpperCase(),
      rating,
      text: cleanText,
    };

    const next = [review, ...reviews.filter((item) => !DEFAULT_REVIEWS.some((defaultReview) => defaultReview.id === item.id))];
    setReviews(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // The review is still shown for the current session if storage is unavailable.
    }
    setName('');
    setText('');
    setRating(5);
    setOpen(false);
  };

  return (
    <>
      <section className="relative overflow-hidden bg-[hsl(var(--background))]" aria-labelledby="reviews-heading">
        <div className="pointer-events-none absolute -bottom-48 -left-24 h-[520px] w-[520px] rounded-full border-2 border-[hsl(var(--accent))]/20" />
        <div className="mx-auto max-w-[1440px] px-5 py-20 md:px-10 md:pb-28 md:pt-2"  id="reviews">
          <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between md:gap-12">
            <div>
              <span className="mono text-[hsl(var(--accent))]">From the women who wear LOZIA</span>
              <h2 id="reviews-heading" className="serif mt-2 text-5xl leading-[.95] tracking-[-.035em] md:text-6xl lg:text-8xl">
                Reviews
              </h2>
              <p className="mt-5 max-w-[520px] text-base leading-7 text-[hsl(var(--muted-foreground))]">
                Real experiences. Beautiful stories. From our amazing customers.
              </p>
              <div className="mt-5 h-px w-32 bg-[hsl(var(--accent))]" />
            </div>

            <button
              type="button"
              onClick={() => setOpen(true)}
              className="review-bubble group relative inline-flex w-fit shrink-0 items-center gap-4 self-start px-8 py-5 text-left text-base transition-transform duration-300 hover:-translate-y-1 md:mt-2"
              aria-label="Leave a review"
            >
              <MessageCircle size={19} strokeWidth={1.5} aria-hidden="true" />
              <span>Leave a review</span>
              <span className="review-bubble-tail" aria-hidden="true" />
              <span className="review-bubble-spark review-bubble-spark-one" aria-hidden="true" />
              <span className="review-bubble-spark review-bubble-spark-two" aria-hidden="true" />
            </button>
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {reviews.slice(0, 6).map((review) => (
              <article
                key={review.id}
                className="review-card flex min-h-[200px] flex-col border border-[hsl(var(--border))] bg-[hsl(var(--card))]/70 p-7 shadow-[0_12px_40px_rgba(48,34,26,0.035)] transition-transform duration-300 hover:-translate-y-1 md:p-9"
              >
                <Stars rating={review.rating} />
                <blockquote className="serif mt-3 max-w-[480px] text-[1.35rem] leading-[1.28] tracking-[-.015em] md:text-[1.1rem]">
                  “{review.text}”
                </blockquote>
                <div className="mt-auto flex items-center gap-1 pt-2">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[hsl(var(--muted))] serif text-md text-[hsl(var(--accent))]">
                    {review.name.charAt(0)}
                  </div>
                  <div>
                    <p className="mono text-xs text-[hsl(var(--foreground))]">{review.name}</p>
                    <p className="mt-1 text-xs tracking-[.16em] text-[hsl(var(--muted-foreground))]">CUSTOMER</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {open && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-[hsl(var(--primary))]/45 p-5 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="review-dialog-title">
          <div className="w-full max-w-[560px] border border-[hsl(var(--border))] bg-[hsl(var(--background))] p-6 shadow-2xl md:p-9">
            <div className="flex items-start justify-between gap-6">
              <div>
                <span className="mono text-[hsl(var(--accent))]">Your experience</span>
                <h3 id="review-dialog-title" className="serif mt-2 text-4xl">Leave a review.</h3>
              </div>
              <button type="button" onClick={() => setOpen(false)} className="flex h-10 w-10 items-center justify-center border border-[hsl(var(--border))]" aria-label="Close review form">
                <X size={18} aria-hidden="true" />
              </button>
            </div>

            <form onSubmit={submit} className="mt-8 space-y-6">
              <label className="block">
                <span className="mono">Your name</span>
                <input value={name} onChange={(event) => setName(event.target.value)} required maxLength={80} className="mt-2 h-12 w-full border border-[hsl(var(--border))] bg-transparent px-4 outline-none transition-colors focus:border-[hsl(var(--accent))]" placeholder="Your name" />
              </label>

              <fieldset>
                <legend className="mono">Your rating</legend>
                <div className="mt-3 flex gap-2">
                  {Array.from({ length: 5 }).map((_, index) => {
                    const value = index + 1;
                    return (
                      <button key={value} type="button" onClick={() => setRating(value)} className="rounded-sm p-1 text-[#a77d46]" aria-label={`${value} star${value > 1 ? 's' : ''}`} aria-pressed={rating === value}>
                        <Star size={24} fill={value <= rating ? 'currentColor' : 'none'} strokeWidth={1.5} />
                      </button>
                    );
                  })}
                </div>
              </fieldset>

              <label className="block">
                <span className="mono">Your review</span>
                <textarea value={text} onChange={(event) => setText(event.target.value)} required maxLength={500} rows={5} className="mt-2 w-full resize-none border border-[hsl(var(--border))] bg-transparent p-4 outline-none transition-colors focus:border-[hsl(var(--accent))]" placeholder="Tell us about your LOZIA experience..." />
              </label>

              <button type="submit" className="inline-flex min-h-12 w-full items-center justify-center gap-3 bg-[hsl(var(--primary))] px-6 py-4 mono text-[hsl(var(--primary-foreground))] transition-opacity hover:opacity-90">
                Publish review
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

'use client';

import { ErrorFallback } from '@/components/error-fallback';
import './globals.css';

// Last-resort boundary for errors in the root layout itself. It must render its own <html> and <body>.
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body>
        <ErrorFallback error={error} reset={reset} />
      </body>
    </html>
  );
}

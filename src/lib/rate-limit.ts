export type RateLimiter = { check: (key: string) => { allowed: boolean; remaining: number; retryAfterSeconds: number } };

/**
 * Fixed-window limiter held in memory. It protects a single server instance. On serverless hosts each instance has its
 * own counter, so put a shared limiter (for example Upstash Redis or Vercel WAF rules) in front for real abuse protection.
 */
export function createRateLimiter({ limit, windowMs, now = Date.now }: { limit: number; windowMs: number; now?: () => number }): RateLimiter {
  const hits = new Map<string, { count: number; resetAt: number }>();

  return {
    check(key) {
      const time = now();
      if (hits.size > 5000) for (const [k, v] of hits) if (v.resetAt <= time) hits.delete(k);

      const current = hits.get(key);
      if (!current || current.resetAt <= time) {
        hits.set(key, { count: 1, resetAt: time + windowMs });
        return { allowed: true, remaining: limit - 1, retryAfterSeconds: 0 };
      }
      current.count += 1;
      const allowed = current.count <= limit;
      return { allowed, remaining: Math.max(0, limit - current.count), retryAfterSeconds: allowed ? 0 : Math.ceil((current.resetAt - time) / 1000) };
    },
  };
}

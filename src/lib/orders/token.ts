import { createHash, randomBytes } from 'node:crypto';

/**
 * Guest orders are protected by a random link token. The customer holds the token; the database holds only its hash,
 * so a database leak does not hand out working order links.
 */
export const hashToken = (token: string): string => createHash('sha256').update(token).digest('hex');

export function createOrderToken(): { token: string; hash: string } {
  const token = randomBytes(32).toString('base64url');
  return { token, hash: hashToken(token) };
}

export const isPlausibleToken = (token: string): boolean => /^[A-Za-z0-9_-]{43}$/.test(token);

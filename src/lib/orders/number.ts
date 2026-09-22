// Letters and digits without look-alikes (no 0/O, 1/I).
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

export type RandomSource = (length: number) => Uint8Array;

const defaultRandom: RandomSource = (length) => globalThis.crypto.getRandomValues(new Uint8Array(length));

/** Human-readable order number such as LOZ-20260918-8F42. The database id is never shown to customers. */
export function generateOrderNumber(now: Date = new Date(), random: RandomSource = defaultRandom): string {
  const date = now.toISOString().slice(0, 10).replaceAll('-', '');
  const suffix = Array.from(random(4), (byte) => ALPHABET[byte % ALPHABET.length]).join('');
  return `LOZ-${date}-${suffix}`;
}

export const ORDER_NUMBER_PATTERN = /^LOZ-\d{8}-[A-Z2-9]{4}$/;
export const isOrderNumber = (value: string): boolean => ORDER_NUMBER_PATTERN.test(value);

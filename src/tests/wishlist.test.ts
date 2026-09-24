import test from 'node:test';
import assert from 'node:assert/strict';
import {
  readWishlist,
  removeFromWishlist,
  toggleWishlist,
} from '@/lib/wishlist/wishlist';

function setupStorage() {
  const store = new Map<string, string>();

  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: {
      localStorage: {
        getItem: (key: string) => store.get(key) ?? null,
        setItem: (key: string, value: string) => store.set(key, value),
      },
      dispatchEvent: () => true,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
    },
  });
}

test('wishlist starts empty when storage has no value', () => {
  setupStorage();
  assert.deepEqual(readWishlist(), []);
});

test('toggle adds and then removes a product', () => {
  setupStorage();

  const product = {
    productId: 'product-1',
    slug: 'amara-dress',
  };

  assert.equal(toggleWishlist(product).length, 1);
  assert.equal(toggleWishlist(product).length, 0);
});

test('removing one product leaves other favorites intact', () => {
  setupStorage();

  toggleWishlist({ productId: 'one', slug: 'one' });
  toggleWishlist({ productId: 'two', slug: 'two' });

  const result = removeFromWishlist('one');

  assert.equal(result.length, 1);
  assert.equal(result[0]?.productId, 'two');
});

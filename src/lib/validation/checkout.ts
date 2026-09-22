import { z } from 'zod';
import { isKnownState } from '@/lib/shipping/states';
import { emailField, nameField, phoneField, uuid } from './common';

/**
 * Everything the browser may tell us about an order. There is deliberately no price, total, stock or status field,
 * and `.strict()` rejects any attempt to send one.
 */
export const checkoutSchema = z
  .object({
    customer: z.object({ fullName: nameField, email: emailField, phone: phoneField }).strict(),
    delivery: z
      .object({
        address: z.string().trim().min(5, 'Enter your delivery address.').max(300),
        city: z.string().trim().min(2, 'Enter your city.').max(100),
        state: z.string().refine(isKnownState, 'Choose a delivery state.'),
        instructions: z.string().trim().max(500).optional(),
      })
      .strict(),
    items: z.array(z.object({ variantId: uuid, quantity: z.number().int().min(1).max(10) }).strict()).min(1, 'Your bag is empty.').max(20),
  })
  .strict();
export type CheckoutInput = z.infer<typeof checkoutSchema>;

export const lookupSchema = z.object({ orderNumber: z.string().trim().toUpperCase().regex(/^LOZ-\d{8}-[A-Z2-9]{4}$/, 'Enter your order number, for example LOZ-20260918-8F42.'), email: emailField }).strict();

export const contactSchema = z
  .object({
    name: nameField,
    email: emailField,
    message: z.string().trim().min(10, 'Please write a little more.').max(3000),
    website: z.string().max(0).optional(), // honeypot: real people leave this empty
  })
  .strict();

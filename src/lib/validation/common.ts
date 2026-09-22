import { z } from 'zod';

export const uuid = z.string().uuid();
export const emailField = z.string().trim().toLowerCase().email('Enter a valid email address.').max(254);
export const phoneField = z.string().trim().min(7, 'Enter a valid phone number.').max(20).regex(/^[+0-9()\-\s]+$/, 'Enter a valid phone number.');
export const nameField = z.string().trim().min(2, 'Enter your full name.').max(120);
export const slugField = z.string().trim().min(1).max(120).regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'Use lowercase letters, numbers and single hyphens.');
export const hexField = z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Use a hex colour such as #6f2637.');
export const money = z.number().finite().min(0).max(1_000_000_000);

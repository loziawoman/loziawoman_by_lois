import 'server-only';

import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { getSiteSettings } from '@/lib/settings/queries';

// Notification boundary. Providers are isolated from callers so adding/changing a
// delivery channel does not change order, payment, or contact flows.

export type NotificationEvent =
  | { type: 'order_received'; orderNumber: string }
  | { type: 'payment_submitted'; orderNumber: string }
  | { type: 'payment_verified'; orderNumber: string }
  | { type: 'payment_rejected'; orderNumber: string; reason: string }
  | { type: 'order_processing'; orderNumber: string }
  | { type: 'order_shipped'; orderNumber: string; tracking?: string }
  | { type: 'order_delivered'; orderNumber: string }
  | { type: 'contact_message'; messageId: string };

export interface NotificationProvider {
  readonly name: string;
  send(event: NotificationEvent): Promise<void>;
}

type Customer = { email: string; full_name: string | null };

async function getOrderCustomer(orderNumber: string): Promise<Customer | null> {
  const { data, error } = await createSupabaseAdminClient()
    .from('orders')
    .select('customer:customers(email, full_name)')
    .eq('order_number', orderNumber)
    .maybeSingle();

  if (error) throw error;
  const customer = data?.customer as Customer | Customer[] | null | undefined;
  return Array.isArray(customer) ? customer[0] ?? null : customer ?? null;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function orderSubject(event: NotificationEvent & { type: Exclude<NotificationEvent['type'], 'contact_message'> }): string {
  switch (event.type) {
    case 'order_received': return `LOZIA order ${event.orderNumber} received`;
    case 'payment_submitted': return `LOZIA payment submitted for ${event.orderNumber}`;
    case 'payment_verified': return `LOZIA payment confirmed for ${event.orderNumber}`;
    case 'payment_rejected': return `Action needed for LOZIA order ${event.orderNumber}`;
    case 'order_processing': return `LOZIA order ${event.orderNumber} is processing`;
    case 'order_shipped': return `Your LOZIA order ${event.orderNumber} has shipped`;
    case 'order_delivered': return `Your LOZIA order ${event.orderNumber} was delivered`;
  }
}

function orderHtml(event: NotificationEvent & { type: Exclude<NotificationEvent['type'], 'contact_message'> }, customerName: string): string {
  const name = escapeHtml(customerName || 'there');
  const order = escapeHtml(event.orderNumber);
  let body = '';

  switch (event.type) {
    case 'order_received':
      body = `<p>Thank you, ${name}. We received your order <strong>${order}</strong>.</p><p>We’ll keep you updated as your order moves through fulfilment.</p>`;
      break;
    case 'payment_submitted':
      body = `<p>We received your payment submission for order <strong>${order}</strong>.</p><p>Our team will review it and update you once it has been verified.</p>`;
      break;
    case 'payment_verified':
      body = `<p>Your payment for order <strong>${order}</strong> has been verified.</p><p>Your order can now move forward.</p>`;
      break;
    case 'payment_rejected':
      body = `<p>We could not verify the payment for order <strong>${order}</strong>.</p><p><strong>Reason:</strong> ${escapeHtml(event.reason)}</p><p>Please review the payment details and contact LOZIA if you need help.</p>`;
      break;
    case 'order_processing':
      body = `<p>Your order <strong>${order}</strong> is now being processed.</p>`;
      break;
    case 'order_shipped':
      body = `<p>Your order <strong>${order}</strong> has been marked as shipped.</p>${event.tracking ? `<p><strong>Tracking:</strong> ${escapeHtml(event.tracking)}</p>` : ''}`;
      break;
    case 'order_delivered':
      body = `<p>Your order <strong>${order}</strong> has been marked as delivered.</p><p>Thank you for choosing LOZIA.</p>`;
      break;
  }

  return `<div style="font-family:Arial,sans-serif;line-height:1.7;color:#211d1b;max-width:600px;margin:auto"><h1 style="font-family:Georgia,serif;font-weight:400">LOZIA Studio</h1>${body}<p style="margin-top:32px;font-size:13px;color:#777">NB: This is an automated message from LOZIA Studio.</p></div>`;
}

/** Default provider: keeps the existing server-side event log as a safe fallback. */
const logProvider: NotificationProvider = {
  name: 'log',
  async send(event) {
    console.info('[notify]', event.type, 'orderNumber' in event ? event.orderNumber : '');
  },
};

/** Resend provider. Requires RESEND_API_KEY and RESEND_FROM_EMAIL on the server. */
const resendProvider: NotificationProvider = {
  name: 'resend',
  async send(event) {
    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.RESEND_FROM_EMAIL;
    if (!apiKey || !from) {
      console.warn('[notify] Resend is not configured. Set RESEND_API_KEY and RESEND_FROM_EMAIL.');
      return;
    }

    let to: string;
    let replyTo: string | undefined;
    let subject: string;
    let html: string;

    if (event.type === 'contact_message') {
      const { data: message, error } = await createSupabaseAdminClient()
        .from('contact_messages')
        .select('name, email, message')
        .eq('id', event.messageId)
        .maybeSingle();
      if (error) throw error;
      if (!message) return;

      const settings = await getSiteSettings();
      to = settings.contactEmail || from;
      replyTo = message.email;
      subject = `New LOZIA contact message from ${message.name}`;
      html = `<div style="font-family:Arial,sans-serif;line-height:1.7;color:#211d1b;max-width:600px;margin:auto"><h1 style="font-family:Georgia,serif;font-weight:400">New LOZIA message</h1><p><strong>From:</strong> ${escapeHtml(message.name)}</p><p><strong>Email:</strong> ${escapeHtml(message.email)}</p><p style="white-space:pre-wrap">${escapeHtml(message.message)}</p></div>`;
    } else {
      const customer = await getOrderCustomer(event.orderNumber);
      if (!customer?.email) return;
      to = customer.email;
      subject = orderSubject(event);
      html = orderHtml(event, customer.full_name ?? 'there');
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [to],
        ...(replyTo ? { reply_to: replyTo } : {}),
        subject,
        html,
      }),
    });

    if (!response.ok) {
      const detail = await response.text();
      throw new Error(`Resend ${response.status}: ${detail}`);
    }
  },
};

const providers: NotificationProvider[] = [logProvider, resendProvider];

export async function notify(event: NotificationEvent): Promise<void> {
  await Promise.all(
    providers.map((provider) =>
      provider.send(event).catch((error: unknown) =>
        console.error(`[notify] ${provider.name} failed`, error),
      ),
    ),
  );
}

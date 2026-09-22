// Notification boundary. Nothing here sends email, SMS or WhatsApp yet. To add a channel, implement NotificationProvider
// and register it in `providers`. Callers use notify() and never know which channels exist. A failing provider never
// blocks an order or an admin action.

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

/** Default provider: writes the event type and order number to the server log. No customer details. */
const logProvider: NotificationProvider = {
  name: 'log',
  async send(event) {
    console.info('[notify]', event.type, 'orderNumber' in event ? event.orderNumber : '');
  },
};

const providers: NotificationProvider[] = [logProvider];

export async function notify(event: NotificationEvent): Promise<void> {
  await Promise.all(
    providers.map((provider) =>
      provider.send(event).catch((error: unknown) => console.error(`[notify] ${provider.name} failed`, error)),
    ),
  );
}

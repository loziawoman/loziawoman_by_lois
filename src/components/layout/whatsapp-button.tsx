import { MessageCircle } from 'lucide-react';
import { whatsappHref } from '@/lib/settings/definitions';

/** Floating enquiry button. The number and message come from site settings; with no number set it opens WhatsApp's chooser. */
export function WhatsAppButton({ number, message }: { number: string; message: string }) {
  return (
    <a
      href={whatsappHref(number, message)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with LOZIA on WhatsApp (opens in a new tab)"
      className="fixed right-4 z-30 inline-flex h-12 items-center gap-2 rounded-full bg-[#2f6f55] px-4 text-xs text-white shadow-lg transition-transform hover:-translate-y-0.5 motion-reduce:transition-none sm:right-5"
      style={{ bottom: 'max(1rem, env(safe-area-inset-bottom))' }}
      data-testid="floating-whatsapp"
    >
      <MessageCircle size={18} strokeWidth={1.5} aria-hidden="true" />
      <span className="hidden sm:inline">WhatsApp us</span>
    </a>
  );
}

import { ArrowRight, Mail, MapPin, MessageCircle } from 'lucide-react';
import { Link } from 'wouter';
import { whatsappDisplay, whatsappHref } from '@/config/contact';

type PolicyKind = 'shipping' | 'returns' | 'privacy';

const policyContent: Record<
  PolicyKind,
  {
    eyebrow: string;
    title: string;
    intro: string;
    sections: { title: string; body: string }[];
  }
> = {
  shipping: {
    eyebrow: 'The practical details',
    title: 'Shipping.',
    intro:
      'Every LOZIA order is wrapped at the Lagos studio and sent with care. We will share delivery updates as soon as your order is on its way.',
    sections: [
      {
        title: 'Delivery windows',
        body:
          'Lagos deliveries usually arrive within 2–5 working days. Deliveries to other Nigerian cities usually take 3–7 working days. International orders generally arrive within 5–10 working days, depending on destination and customs.',
      },
      {
        title: 'Fees and tracking',
        body:
          'Delivery fees are calculated at checkout based on your destination. Once your parcel leaves the studio, our team will send the available tracking or courier details to the email or phone number on the order.',
      },
      {
        title: 'A small studio note',
        body:
          'Orders are checked and packed by hand. If your delivery address changes, message the studio as quickly as possible on WhatsApp before the parcel has been dispatched.',
      },
    ],
  },
  returns: {
    eyebrow: 'The considered choice',
    title: 'Returns.',
    intro:
      'If a piece is not quite right, contact the studio within 7 days of delivery. We will help you work through the next step.',
    sections: [
      {
        title: 'Eligibility',
        body:
          'Items must be unworn, unwashed, undamaged and returned with their original tags and packaging. Please check your order as soon as it arrives and keep the piece protected while a return is arranged.',
      },
      {
        title: 'How to start',
        body:
          'Send your order number, the piece you would like to return and a short reason to hello@lozia.studio or WhatsApp. We will confirm the return address and the available resolution before you send anything back.',
      },
      {
        title: 'Exceptions',
        body:
          'For hygiene and production reasons, altered, personalised, worn, washed or final-sale pieces cannot be returned. Return delivery is the customer’s responsibility unless the item arrived damaged or incorrect.',
      },
    ],
  },
  privacy: {
    eyebrow: 'A quiet promise',
    title: 'Privacy.',
    intro:
      'Your details stay between you and LOZIA. We only use the information needed to fulfil your order, answer your questions and keep the studio running.',
    sections: [
      {
        title: 'What we collect',
        body:
          'When you place an order or contact us, we may receive your name, delivery details, email address, phone number and the information needed to help with your request.',
      },
      {
        title: 'How we use it',
        body:
          'We use these details to confirm orders, arrange delivery, respond to messages, handle returns and improve the shopping experience. We do not sell your personal information.',
      },
      {
        title: 'Your choices',
        body:
          'You can ask what personal information we hold, request a correction or ask us to stop using it where there is no legal or fulfilment reason to keep it. Write to hello@lozia.studio and we will help.',
      },
    ],
  },
};

export function PolicyPage({ kind }: { kind: PolicyKind }) {
  const content = policyContent[kind];

  return (
    <main className="mx-auto max-w-[1180px] px-5 py-14 md:px-10 md:py-24">
      <div className="grid gap-12 md:grid-cols-[.75fr_1.25fr] md:gap-24">
        <div>
          <span className="mono text-[hsl(var(--accent))]">{content.eyebrow}</span>
          <h1 className="serif mt-5 text-6xl md:text-8xl">{content.title}</h1>
          <p className="mt-7 max-w-[420px] text-base leading-7 text-[hsl(var(--muted-foreground))]">
            {content.intro}
          </p>
          <Link href="/contact" className="mt-9 inline-flex items-center gap-3 border-b border-current pb-2 mono">
            Need a hand? Contact the studio <ArrowRight size={14} />
          </Link>
        </div>
        <div className="border-t border-[hsl(var(--border))]">
          {content.sections.map((section, index) => (
            <section key={section.title} className="grid gap-5 border-b border-[hsl(var(--border))] py-8 md:grid-cols-[.4fr_1fr] md:gap-10">
              <span className="mono text-[hsl(var(--muted-foreground))]">0{index + 1}</span>
              <div>
                <h2 className="serif text-3xl">{section.title}</h2>
                <p className="mt-4 text-sm leading-7 text-[hsl(var(--muted-foreground))]">{section.body}</p>
              </div>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}

export function ContactPage() {
  return (
    <main>
      <section className="bg-[hsl(var(--primary))] px-5 py-20 text-[hsl(var(--primary-foreground))] md:px-16 md:py-32">
        <div className="mx-auto grid max-w-[1200px] gap-12 md:grid-cols-[1fr_.8fr] md:items-end">
          <div>
            <span className="mono text-[hsl(var(--secondary))]">The studio is here</span>
            <h1 className="serif mt-6 max-w-[760px] text-6xl leading-[.92] md:text-9xl">
              Come say <i>hello.</i>
            </h1>
            <p className="mt-8 max-w-[440px] text-base leading-7 text-[hsl(var(--primary-foreground))]/70">
              Questions about a size, a delivery or a piece you have been thinking about? Send us a message and we will reply from the Lagos studio.
            </p>
          </div>
          <div className="border-t border-[hsl(var(--primary-foreground))]/20 pt-6 md:border-l md:border-t-0 md:pl-8 md:pt-0">
            <a href={whatsappHref} target="_blank" rel="noreferrer" className="flex items-center gap-4 border border-[hsl(var(--secondary))] px-5 py-4 mono text-[hsl(var(--secondary))] transition-colors hover:bg-[hsl(var(--secondary))] hover:text-[hsl(var(--primary))]" data-testid="link-contact-whatsapp">
              <MessageCircle size={19} strokeWidth={1.4} />
              Message us on WhatsApp
              <ArrowRight className="ml-auto" size={15} />
            </a>
            <a href="mailto:hello@lozia.studio" className="mt-3 flex items-center gap-4 border border-[hsl(var(--primary-foreground))]/25 px-5 py-4 mono text-[hsl(var(--primary-foreground))]/80 transition-colors hover:border-[hsl(var(--primary-foreground))] hover:text-[hsl(var(--primary-foreground))]" data-testid="link-contact-email">
              <Mail size={18} strokeWidth={1.4} />
              hello@lozia.studio
              <ArrowRight className="ml-auto" size={15} />
            </a>
          </div>
        </div>
      </section>
      <section className="mx-auto grid max-w-[1200px] gap-10 px-5 py-16 md:grid-cols-3 md:px-10 md:py-24">
        <div>
          <MapPin className="text-[hsl(var(--accent))]" size={22} strokeWidth={1.2} />
          <h2 className="serif mt-5 text-3xl">Visit the studio.</h2>
          <p className="mt-3 text-sm leading-7 text-[hsl(var(--muted-foreground))]">Lagos, Nigeria<br />Mon–Fri, 10:00–17:00</p>
        </div>
        <div>
          <MessageCircle className="text-[hsl(var(--accent))]" size={22} strokeWidth={1.2} />
          <h2 className="serif mt-5 text-3xl">WhatsApp.</h2>
          <p className="mt-3 text-sm leading-7 text-[hsl(var(--muted-foreground))]">{whatsappDisplay}<br />Replies during studio hours.</p>
        </div>
        <div>
          <Mail className="text-[hsl(var(--accent))]" size={22} strokeWidth={1.2} />
          <h2 className="serif mt-5 text-3xl">Email.</h2>
          <p className="mt-3 text-sm leading-7 text-[hsl(var(--muted-foreground))]">hello@lozia.studio<br />For order and studio enquiries.</p>
        </div>
      </section>
    </main>
  );
}
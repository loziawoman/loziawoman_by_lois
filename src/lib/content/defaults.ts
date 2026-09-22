import type { HomepageContent, PolicyContent, ShippingRates, SizeGuideContent } from '@/types';

// Everything in this file is starter copy. Anything in [square brackets] is a placeholder that LOZIA must replace
// with real business information in /admin > Content. No delivery prices, times, return windows or legal
// commitments are stated here. Policies keep `isPlaceholder: true` (which shows a notice on the page) until LOZIA turns it off.

const TBC = '[To be confirmed by LOZIA]';

export const defaultHomepage: HomepageContent = {
  announcement: '',
  eyebrow: 'LOZIA / Collection 01',
  headline: 'Defined by',
  italicHeadline: 'elegance.',
  description: 'Contemporary pieces for the woman who knows that presence does not need to be loud.',
  ctaLabel: 'Shop the collection',
};

export const defaultShippingRates: ShippingRates = { defaultFee: 0, byState: {}, freeAbove: null, placeholder: true };

export const defaultShippingPolicy: PolicyContent = {
  title: 'Shipping',
  intro: 'How your LOZIA order reaches you.',
  isPlaceholder: true,
  sections: [
    { title: 'Delivery areas', body: `${TBC}. List the states and cities LOZIA delivers to.` },
    { title: 'Processing time', body: `${TBC}. Orders are prepared after payment has been verified by the studio.` },
    { title: 'Estimated delivery times', body: `${TBC}. Add an estimate for each delivery area.` },
    { title: 'Delivery charges', body: 'Delivery is charged separately from the price of your pieces and is shown at checkout before you place your order. [Delivery prices to be confirmed by LOZIA.]' },
    { title: 'Delivery updates', body: `${TBC}. Say how customers hear about their order (email, WhatsApp or SMS).` },
    { title: 'If a delivery is delayed', body: `${TBC}. If your order has not arrived within the estimated time, contact us with your order number.` },
    { title: 'Delivery problems', body: 'Contact the studio using the details on the Contact page and quote your order number so we can help quickly.' },
  ],
};

export const defaultReturnsPolicy: PolicyContent = {
  title: 'Returns',
  intro: 'Our approach to returns, exchanges and refunds.',
  isPlaceholder: true,
  sections: [
    { title: 'Eligibility', body: `${TBC}. State which pieces can be returned or exchanged.` },
    { title: 'Return window', body: `${TBC}. State how many days customers have after delivery.` },
    { title: 'Condition requirements', body: `${TBC}. For example: unworn, unwashed, with tags attached.` },
    { title: 'Excluded items', body: `${TBC}. List anything that cannot be returned.` },
    { title: 'Exchanges', body: `${TBC}. Describe how a customer asks for a different size or colour.` },
    { title: 'Refunds', body: `${TBC}. Describe how and when refunds are issued for bank-transfer payments.` },
    { title: 'Return shipping', body: `${TBC}. State who pays for return delivery.` },
    { title: 'Damaged or wrong items', body: `${TBC}. Describe how to report a damaged or incorrect piece and what LOZIA will do.` },
    { title: 'How to contact us', body: 'Use the details on the Contact page and include your order number.' },
  ],
};

export const defaultPrivacyPolicy: PolicyContent = {
  title: 'Privacy',
  intro: 'What LOZIA collects, why, and where it is kept. This text is a structured draft that the business owner should review before launch.',
  isPlaceholder: true,
  sections: [
    { title: 'Information we collect', body: 'When you place an order we collect your name, email address, phone number and delivery address. If you write to us we keep your message and email address.' },
    { title: 'Account information', body: 'Shopping does not require an account. Accounts are currently used only by LOZIA staff to manage the shop.' },
    { title: 'Order information', body: 'We keep a record of what you ordered, the prices charged, delivery details and the status of your order so we can fulfil it and answer questions later.' },
    { title: 'Payment information', body: 'Payment is by bank transfer. We do not collect or store card numbers. We record whether a payment has been submitted, verified or rejected.' },
    { title: 'Uploaded receipts', body: 'If you upload a payment receipt it is stored privately and can only be opened by authorised LOZIA staff reviewing your payment.' },
    { title: 'Delivery information', body: 'Your delivery details are used to prepare and send your order and to contact you about it.' },
    { title: 'Cookies and local storage', body: 'Your shopping bag is kept in your browser\'s local storage so it is still there when you return. Staff sign-in uses a session cookie. [Confirm any additional cookies before launch.]' },
    { title: 'Analytics', body: '[Describe any analytics in use, or state that none is used.] Analytics events, if enabled, do not include personal details.' },
    { title: 'Third-party services', body: 'The shop uses Supabase for its database and file storage and a hosting provider to serve the website. [List any other providers, such as email or analytics.]' },
    { title: 'How long we keep information', body: `${TBC}. State retention periods for orders, receipts and messages.` },
    { title: 'Your rights', body: `${TBC}. Describe how customers can ask to see, correct or delete their information. Have this section reviewed by a qualified adviser for the laws that apply to LOZIA.` },
    { title: 'Contact', body: 'Questions about your information can be sent to the studio using the details on the Contact page.' },
  ],
};

export const defaultTermsPolicy: PolicyContent = {
  title: 'Terms',
  intro: 'The terms for using the LOZIA website and buying from LOZIA. This is a structured draft for the business owner to review before launch.',
  isPlaceholder: true,
  sections: [
    { title: 'Using this website', body: 'By using this website you agree to use it lawfully and not to interfere with its operation.' },
    { title: 'Product information', body: 'We take care to describe and photograph each piece accurately. Colours can look different on different screens, and the colour preview on product pages is an illustration rather than a photograph of the finished piece.' },
    { title: 'Pricing', body: 'Prices are shown in Nigerian naira. Delivery is charged separately and shown at checkout. Prices can change; the price shown when you place your order is the price charged.' },
    { title: 'Orders', body: 'Placing an order is a request to buy. An order is confirmed only once we have verified your payment, and we may cancel an order if a piece turns out to be unavailable.' },
    { title: 'Payment', body: 'Payment is currently by bank transfer. An order stays pending until the studio has verified that the transfer has arrived.' },
    { title: 'Shipping', body: 'See the Shipping page for delivery information.' },
    { title: 'Returns', body: 'See the Returns page for our returns and exchanges information.' },
    { title: 'Intellectual property', body: 'The LOZIA name, logo, photography and designs belong to LOZIA and may not be copied or used without permission.' },
    { title: 'Limitation of liability', body: `${TBC}. Have this section written or reviewed by a qualified adviser.` },
    { title: 'Contact', body: 'Questions about these terms can be sent to the studio using the details on the Contact page.' },
  ],
};

export const defaultSizeGuide: SizeGuideContent = {
  intro: 'Our pieces are designed to follow the body, not fight it. If you are between sizes, we recommend sizing up for a more relaxed line.',
  howToMeasure: [
    'Bust: measure around the fullest part of your chest, keeping the tape level.',
    'Waist: measure around the narrowest part of your waist.',
    'Hip: measure around the fullest part of your hips.',
    'Keep the tape snug but not tight, and stand naturally.',
  ],
  isPlaceholder: true,
  rows: [
    { size: 'XS', bust: '80–84 cm', waist: '62–66 cm', hip: '88–92 cm', uk: '6' },
    { size: 'S', bust: '85–89 cm', waist: '67–71 cm', hip: '93–97 cm', uk: '8' },
    { size: 'M', bust: '90–94 cm', waist: '72–76 cm', hip: '98–102 cm', uk: '10' },
    { size: 'L', bust: '95–100 cm', waist: '77–82 cm', hip: '103–108 cm', uk: '12' },
    { size: 'XL', bust: '101–106 cm', waist: '83–88 cm', hip: '109–114 cm', uk: '14' },
  ],
};

export const defaultAboutStory =
  'We make pieces that hold their shape in the world. Quietly expressive, made in small numbers, and designed with the kind of intention that reveals itself over time. Every collection is an invitation to dress for the self you are becoming, not the version anyone else expects.';

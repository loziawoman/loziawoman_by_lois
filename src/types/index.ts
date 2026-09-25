// Shared domain types. These are the shapes the UI and services use; database rows are mapped into them in lib/products and lib/orders.

export type UserRole = 'customer' | 'staff' | 'admin' | 'super_admin';
export type ProductStatus = 'draft' | 'published' | 'archived';
export type DiscountType = 'fixed' | 'percentage';
export type ProductDiscount = { enabled: boolean; type: DiscountType; value: number };
export type PaymentStatus = 'PENDING' | 'SUBMITTED' | 'VERIFIED' | 'REJECTED' | 'REFUNDED';
export type FulfillmentStatus = 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';

export type ReviewStatus = 'visible' | 'hidden' | 'spotlight';
export type Review = {
  id: string;
  name: string;
  email: string | null;
  rating: number;
  message: string;
  status: ReviewStatus;
  createdAt: string;
};

export type Category = { id: string; name: string; slug: string; description: string; imageUrl: string | null; sortOrder: number };
export type ProductColour = { id: string; name: string; slug: string; hex: string; sortOrder: number };
export type ProductSize = { id: string; name: string; sortOrder: number };

export type ProductImage = {
  id: string;
  src: string;
  alt: string;
  /** Optional garment mask for precise recolouring. */
  maskSrc: string | null;
  sortOrder: number;
  isPrimary: boolean;
};

export type ProductVariant = {
  id: string;
  productId: string;
  colourId: string;
  sizeId: string;
  sku: string;
  /** Effective unit price: the variant's own price, or the product's base price. */
  price: number;
  stockQuantity: number;
  reservedQuantity: number;
  /** stockQuantity - reservedQuantity, never below zero. */
  available: number;
  isActive: boolean;
};

export type Product = {
  id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription: string;
  fabric: string;
  care: string;
  category: Category | null;
  basePrice: number;
  discount: ProductDiscount;
  status: ProductStatus;
  featured: boolean;
  originalColourId: string | null;
  createdAt: string;
  updatedAt: string;
  images: ProductImage[];
  colours: ProductColour[];
  sizes: ProductSize[];
  variants: ProductVariant[];
};

export type CartItem = {
  variantId: string;
  productId: string;
  slug: string;
  name: string;
  colourName: string;
  sizeName: string;
  /** For display only. The server always re-prices from the database. */
  unitPrice: number;
  quantity: number;
  image: string;
};

export type Customer = { id: string; email: string; fullName: string; phone: string; createdAt: string };
export type Address = { id: string; fullName: string; phone: string; addressLine: string; city: string; state: string; instructions: string | null };

export type OrderItem = {
  id: string;
  variantId: string | null;
  productId: string | null;
  productName: string;
  colourName: string;
  sizeName: string;
  sku: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
};

export type Payment = {
  status: PaymentStatus;
  amount: number;
  method: string;
  receiptPath: string | null;
  customerNote: string | null;
  submittedAt: string | null;
  reviewedAt: string | null;
  rejectionReason: string | null;
};

export type Shipping = { carrier: string | null; trackingNumber: string | null; shippedAt: string | null; deliveredAt: string | null };

export type Order = {
  id: string;
  orderNumber: string;
  paymentStatus: PaymentStatus;
  fulfillmentStatus: FulfillmentStatus;
  subtotal: number;
  shippingFee: number;
  total: number;
  currency: string;
  adminNotes: string;
  cancelledReason: string | null;
  createdAt: string;
  customer: Customer | null;
  address: Address | null;
  items: OrderItem[];
  payment: Payment | null;
  shipping: Shipping | null;
};

export type ShippingRates = {
  /** Fee applied when a state has no specific fee. */
  defaultFee: number;
  byState: Record<string, number>;
  /** Orders with a subtotal at or above this amount ship free. null = never. */
  freeAbove: number | null;
  /** True until the business has supplied real delivery prices. */
  placeholder: boolean;
};

export type PolicySection = { title: string; body: string };
export type PolicyContent = { title: string; intro: string; sections: PolicySection[]; isPlaceholder: boolean };

export type SiteImageKey = 'logo' | 'home_hero' | 'home_tailoring' | 'home_everyday' | 'home_evening' | 'home_editorial' | 'about_hero' | 'about_editorial' | 'contact_hero';
export type SiteImage = { src: string; alt: string; storagePath: string | null };
export type SiteImages = Record<SiteImageKey, SiteImage>;

export type HomepageContent = {
  announcement: string;
  eyebrow: string;
  headline: string;
  italicHeadline: string;
  description: string;
  ctaLabel: string;
};

export type SizeGuideRow = { size: string; bust: string; waist: string; hip: string; uk: string };
export type SizeGuideContent = { intro: string; howToMeasure: string[]; rows: SizeGuideRow[]; isPlaceholder: boolean };

export type SiteSettings = {
  brandName: string;
  tagline: string;
  contactEmail: string;
  whatsappNumber: string;
  whatsappMessage: string;
  instagramUrl: string;
  tiktokUrl: string;
  studioLocation: string;
  studioHours: string;
  reservationHours: number;
  shippingRates: ShippingRates;
  homepage: HomepageContent;
  policies: { shipping: PolicyContent; returns: PolicyContent; privacy: PolicyContent; terms: PolicyContent };
  sizeGuide: SizeGuideContent;
  aboutStory: string;
  reviewSubmissionEnabled: boolean;
  siteImages: SiteImages;
};

/** Bank details are never part of the public settings. They are only shown to someone holding a valid order link. */
export type BankDetails = { bankName: string; accountName: string; accountNumber: string; configured: boolean };

export type AdminUser = { id: string; email: string; role: UserRole };

/** What a customer may see about their own order. No email, phone or full address. */
export type CustomerOrderView = {
  orderNumber: string;
  paymentStatus: PaymentStatus;
  fulfillmentStatus: FulfillmentStatus;
  subtotal: number;
  shippingFee: number;
  total: number;
  createdAt: string;
  deliveryCity: string | null;
  deliveryState: string | null;
  rejectionReason: string | null;
  hasReceipt: boolean;
  items: { productName: string; colourName: string; sizeName: string; quantity: number; lineTotal: number }[];
};

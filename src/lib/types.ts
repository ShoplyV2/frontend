export type OrderStatus = 'DRAFT' | 'AWAITING_PAYMENT' | 'PAID' | 'DISPATCHED' | 'DELIVERED' | 'CANCELLED' | 'EXPIRED';

export type HandoffReason =
  | 'LOW_CONFIDENCE_MATCH'
  | 'NO_MATCH'
  | 'OUT_OF_CATALOG'
  | 'PRICE_NEGOTIATION'
  | 'COMPLAINT'
  | 'MONEY_DISPUTE'
  | 'UNSUPPORTED_REQUEST'
  | 'GUARDRAIL';

export type HandoffStatus = 'PENDING' | 'ANSWERED' | 'TIMED_OUT' | 'ESCALATED' | 'CANCELLED';

export interface FeedOrder {
  _id: string;
  buyer: {
    waId: string;
    phone: string;
    name: string | null;
  };
  item: {
    itemId: string;
    nameSnapshot: string;
    imageUrlSnapshot: string | null;
  };
  variant: {
    variantId: string;
    color: string;
    size: string;
    colorKey: string;
    sizeKey: string;
  };
  qty: number;
  unitPrice: number;
  subtotal: number;
  deliveryFee: number;
  total: number;
  currency: string;
  status: OrderStatus;
  delivery: {
    name: string;
    area: string;
    address: string;
    phone: string;
    notes: string | null;
  };
  payment: {
    channel: string | null;
    paidAt: string | null;
  };
  fulfillmentRisk: 'STOCK_LOST' | null;
  createdAt: string;
}

export interface FeedHandoff {
  _id: string;
  reason: HandoffReason;
  buyerQuestion: string;
  suggestedReply: string | null;
  status: HandoffStatus;
  shortCode: string | null;
  askedAt: string;
  timeoutAt: string | null;
}

export type SellerStatus = 'ONBOARDING' | 'LIVE' | 'SUSPENDED';

export interface SellerProfile {
  id: string;
  shopName: string;
  shopDescription: string;
  status: SellerStatus;
  active: boolean;
  persona: {
    greeting: string;
    tone: string;
    signOff: string | null;
    languageHints: string[];
    voiceSamples: string[];
  };
  currency: string;
  reservationTtlMinutes: number;
}

export interface OnboardingState {
  status: SellerStatus;
  completedSteps: string[];
  payoutConfigured: boolean;
  ready: boolean;
  blockers: string[];
}

export type ChannelKind = 'whatsapp' | 'telegram';

export interface ChannelSummary {
  kind: ChannelKind;
  routingId: string;
  displayName: string | null;
  sellerContactId: string | null;
  active: boolean;
  // Non-null only for an unbound Telegram channel with a live binding window — a bot can never
  // message its owner first, so this is how the seller finishes connecting: tapping it opens the
  // bot and sends /start, which is what sets sellerContactId server-side.
  ownerBindingUrl: string | null;
}

export interface Bank {
  name: string;
  code: string;
}

// Dev-only, unauthenticated seller picker (no multi-tenant auth yet) — see backend/src/routes/admin.route.ts.
export interface AdminSellerSummary {
  id: string;
  shopName: string;
  status: SellerStatus;
  active: boolean;
  feedToken: string;
}

export interface CatalogImage {
  r2Key: string;
  url: string;
  isPrimary: boolean;
}

export interface CatalogVariant {
  _id: string;
  color: string;
  size: string;
  colorKey: string;
  sizeKey: string;
  stock: number;
  price: number | null; // pesewas; null means it falls back to the item's basePrice
  sku: string | null;
}

export interface CatalogItem {
  id: string;
  slug: string;
  name: string;
  description: string;
  images: CatalogImage[];
  basePrice: number; // pesewas
  currency: string;
  available: boolean;
  variants: CatalogVariant[];
  visionReady: boolean;
}

export interface NewVariantInput {
  color: string;
  size: string;
  stock: number;
  priceMajor?: number | null;
  sku?: string | null;
}

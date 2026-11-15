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
  conversationId: string;
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
    amountPaid: number | null; // minor units
  };
  fulfillmentRisk: 'STOCK_LOST' | null;
  statusHistory: Array<{ from: OrderStatus | null; to: OrderStatus; at: string; actor: string; reason: string | null }>;
  createdAt: string;
}

export interface FeedHandoff {
  _id: string;
  conversationId: string;
  reason: HandoffReason;
  buyerQuestion: string;
  suggestedReply: string | null;
  status: HandoffStatus;
  shortCode: string | null;
  askedAt: string;
  timeoutAt: string | null;
}

export type SellerStatus = 'ONBOARDING' | 'LIVE' | 'SUSPENDED' | 'DELETED';

export interface SellerProfile {
  id: string;
  shopName: string;
  email: string | null;
  shopDescription: string;
  whatsappRequestedAt: string | null;
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
  // Non-null only for an unbound channel with a live binding window. Telegram: a t.me link that
  // opens the bot and sends /start. WhatsApp: a wa.me link that prefills `owner_<nonce>`. Either
  // way the seller's own message is what sets sellerContactId server-side.
  ownerBindingUrl: string | null;
  // Where a BUYER starts a chat with this shop — the link the seller shares. Null if unavailable.
  buyerLink: string | null;
}

export interface Bank {
  name: string;
  code: string;
}

// One row of the admin seller list — see backend/src/routes/admin.route.ts.
export interface AdminSellerSummary {
  id: string;
  shopName: string;
  email: string | null;
  status: SellerStatus;
  active: boolean;
  feedToken: string;
  // Set while the seller is waiting for the team to connect their WhatsApp number.
  whatsappRequestedAt: string | null;
  channels: Array<{ kind: ChannelKind; displayName: string | null; active: boolean; bound: boolean }>;
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

/** One line of a buyer–shop chat, as GET /feed/conversations/:id/messages returns it. */
export interface TranscriptMessage {
  role: 'buyer' | 'assistant';
  text: string;
  at: string;
  /** The buyer attached a photo (shown as a placeholder, the image itself isn't served). */
  hasMedia: boolean;
}

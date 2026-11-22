export type OrderStatus = 'DRAFT' | 'AWAITING_PAYMENT' | 'PAID' | 'DISPATCHED' | 'DELIVERED' | 'CANCELLED' | 'EXPIRED';

export type HandoffReason =
  | 'LOW_CONFIDENCE_MATCH'
  | 'NO_MATCH'
  | 'OUT_OF_CATALOG'
  | 'PRICE_NEGOTIATION'
  | 'COMPLAINT'
  | 'MONEY_DISPUTE'
  | 'UNSUPPORTED_REQUEST'
  | 'GUARDRAIL'
  | 'REPLY_FAILED'
  | 'TRIAL_ENDED'
  | 'SHOP_PAUSED';

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
    // Null when the buyer shared a map pin instead of typing where they are.
    area: string | null;
    address: string | null;
    phone: string;
    notes: string | null;
    location?: { latitude: number; longitude: number; name: string | null; address: string | null } | null;
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

// --- Admin (see backend/src/services/adminShop.service.ts) ---

export type SetupStepKey = 'profile' | 'channel' | 'owner' | 'catalog' | 'payout' | 'activated';
export type SuspensionReason = 'UNPAID_INVOICE' | 'POLICY_VIOLATION' | 'SELLER_REQUEST' | 'OTHER';
export type PlanTier = 'starter' | 'growth' | 'pro' | 'scale';
export type AttentionKind = 'WHATSAPP_REQUESTED' | 'TRIAL_ENDING' | 'STUCK_IN_SETUP' | 'OVER_PLAN';

export interface TrialCounter {
  used: number;
  limit: number;
}

/** One row of the admin shop list. The feedToken is only on the detail read. */
export interface AdminShopRow {
  id: string;
  shopName: string;
  email: string | null;
  status: SellerStatus;
  active: boolean;
  createdAt: string;
  whatsappRequestedAt: string | null;
  channels: Array<{ kind: ChannelKind; displayName: string | null; active: boolean; bound: boolean }>;
  setup: { done: number; total: number; firstOpen: SetupStepKey | null };
  plan: PlanTier | null;
  trial: { started: boolean; ended: boolean; daysLeft: number; orders: TrialCounter; chats: TrialCounter } | null;
  chats: number;
  orders: number;
  chatsIncluded: number | null;
  ordersIncluded: number | null;
  lastBuyerChatAt: string | null;
}

export interface AdminShopDetail {
  id: string;
  shopName: string;
  email: string | null;
  status: SellerStatus;
  active: boolean;
  createdAt: string;
  activatedAt: string | null;
  whatsappRequestedAt: string | null;
  suspension: { reason: SuspensionReason; note: string | null; at: string; byEmail: string } | null;
  checklist: Array<{ key: SetupStepKey; done: boolean }>;
  catalog: { items: number; variants: number };
  channels: Array<ChannelSummary & { ownerBindingExpiresAt: string | null }>;
  plan: PlanTier | null;
  trial: (UsageTrial & { orders: TrialCounter; chats: TrialCounter }) | null;
  usage: UsageSummary;
  lastBuyerChatAt: string | null;
  feedToken: string;
}

export interface AdminUsageRow {
  sellerId: string;
  shopName: string;
  plan: PlanTier | null;
  onTrial: boolean;
  chatsIncluded: number | null;
  ordersIncluded: number | null;
  orders: number;
  chats: number;
  conversion: number | null;
  llmCostUsd: number;
  llmCalls: number;
  costPerChatUsd: number | null;
  costPerOrderUsd: number | null;
  overageMinor: number;
}

export interface AdminUsageReport {
  period: string;
  sellers: AdminUsageRow[];
  totals: { orders: number; chats: number; conversion: number | null; llmCostUsd: number; llmCalls: number; costPerChatUsd: number | null; costPerOrderUsd: number | null };
}

export interface AdminAttentionItem {
  kind: AttentionKind;
  shopId: string;
  shopName: string;
  whatsappRequestedAt: string | null;
  createdAt: string;
  setup: AdminShopRow['setup'];
  trial: AdminShopRow['trial'];
  chats: number;
  orders: number;
  chatsIncluded: number | null;
  ordersIncluded: number | null;
}

export interface AdminOverview {
  period: string;
  shops: { total: number; live: number; onboarding: number; suspended: number };
  totals: AdminUsageReport['totals'];
  previous: { period: string; orders: number; chats: number };
  attention: AdminAttentionItem[];
  queue: Record<AttentionKind, number> & { total: number };
  funnel: Array<{ key: 'signedUp' | 'profile' | 'channel' | 'catalog' | 'payout' | 'activated'; count: number }>;
  topShops: AdminUsageRow[];
  trials: { count: number; shops: Array<{ shopId: string; shopName: string; trial: NonNullable<AdminShopRow['trial']>; progress: number }> };
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

// One month's use of what a plan includes (GET /me/usage). `included` is null when the shop has no
// plan set yet — usage is counted anyway, there is just no allowance to compare it with.
export interface UsageMetric {
  used: number;
  included: number | null;
  over: number;
  overageMinor: number;
}

export interface UsageSummary {
  /** 'YYYY-MM' */
  period: string;
  currency: string;
  plan: { tier: string; name: string; priceMinor: number } | null;
  orders: UsageMetric;
  chats: UsageMetric;
  overageTotalMinor: number;
  /** Set while the shop has no plan: the free trial and how much of it is left. Null on a plan. */
  trial: UsageTrial | null;
}

export interface UsageTrial {
  startedAt: string | null;
  endsAt: string | null;
  endedAt: string | null;
  endReason: 'ORDERS' | 'CHATS' | 'DAYS' | null;
  ended: boolean;
  daysLeft: number;
}

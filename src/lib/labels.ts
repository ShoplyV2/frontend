// The single vocabulary file — every enum a seller might see gets a human label here, once.
// Nothing outside this file should render a raw backend enum, kind, or warning code.

import type { ChannelKind, HandoffReason, OrderStatus, SellerStatus } from './types';

export type Tone = 'neutral' | 'info' | 'success' | 'warning' | 'danger' | 'muted';

export const ORDER_STATUS: Record<OrderStatus, { label: string; tone: Tone; hint: string }> = {
  DRAFT: { label: 'Not confirmed yet', tone: 'muted', hint: "The buyer hasn't finished ordering." },
  AWAITING_PAYMENT: { label: 'Waiting for payment', tone: 'warning', hint: 'Stock is held for this buyer until they pay.' },
  PAID: { label: 'Paid — ready to send', tone: 'success', hint: 'Money received. Pack it and send it out.' },
  DISPATCHED: { label: 'On the way', tone: 'info', hint: 'Sent to the buyer.' },
  DELIVERED: { label: 'Delivered', tone: 'muted', hint: 'Done.' },
  CANCELLED: { label: 'Cancelled', tone: 'danger', hint: "This order won't go ahead." },
  EXPIRED: { label: 'Expired', tone: 'danger', hint: "The buyer didn't pay in time. Stock is back." },
};

export const SELLER_STATUS: Record<SellerStatus, { label: string; tone: Tone }> = {
  ONBOARDING: { label: 'Setting up', tone: 'warning' },
  LIVE: { label: 'Open for orders', tone: 'success' },
  SUSPENDED: { label: 'Paused', tone: 'danger' },
};

export const CHANNEL_KIND: Record<ChannelKind, string> = {
  whatsapp: 'WhatsApp',
  telegram: 'Telegram',
};

export function channelFallbackName(kind: ChannelKind): string {
  return kind === 'telegram' ? 'Telegram bot' : 'WhatsApp number';
}

export const HANDOFF_REASON: Record<HandoffReason, string> = {
  PRICE_NEGOTIATION: 'Asking about price',
  COMPLAINT: 'Complaint',
  MONEY_DISPUTE: 'Payment problem',
  OUT_OF_CATALOG: "Asked for something you don't stock",
  UNSUPPORTED_REQUEST: "Your assistant can't handle this one",
  GUARDRAIL: 'Needs your approval',
  LOW_CONFIDENCE_MATCH: 'Not sure which item they mean',
  NO_MATCH: "Couldn't find their photo in your catalog",
};

// Codes returned by GET /catalog/items's `warnings` array.
export const CATALOG_WARNING: Record<string, string> = {
  VISION_CANDIDATE_CAP_EXCEEDED:
    'Photo matching currently checks 6 of your items at a time. Buyers can still order everything by name — we\'re working on lifting this.',
};

// The vision pipeline's "not ready" state, shown on a catalog item.
export const PHOTO_PROCESSING = {
  label: 'Photo still processing',
  hint: "Buyers can't match this item by photo yet. Usually under a minute.",
};

export const STOCK_LOST_ALERT = 'Paid, but you marked this size sold out. Sort this with the buyer.';

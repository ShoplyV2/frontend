// The single vocabulary file — every enum a seller might see gets a human label here, once.
// Nothing outside this file should render a raw backend enum, kind, or warning code.

import type { ChannelKind, HandoffReason, OrderStatus, SellerStatus } from './types';

export type Tone = 'neutral' | 'info' | 'success' | 'warning' | 'danger' | 'muted';

// `chip` is the short form for dense lists; `label` is the full phrase for a detail view.
export const ORDER_STATUS: Record<OrderStatus, { label: string; chip: string; tone: Tone; hint: string }> = {
  DRAFT: { label: 'Not confirmed yet', chip: 'Draft', tone: 'muted', hint: "The buyer hasn't finished ordering." },
  AWAITING_PAYMENT: { label: 'Waiting for payment', chip: 'Unpaid', tone: 'warning', hint: 'Stock is held for this buyer until they pay.' },
  PAID: { label: 'Paid — ready to send', chip: 'To send', tone: 'success', hint: 'Money received. Pack it and send it out.' },
  DISPATCHED: { label: 'On the way', chip: 'On the way', tone: 'info', hint: 'Sent to the buyer.' },
  DELIVERED: { label: 'Delivered', chip: 'Delivered', tone: 'muted', hint: 'Done.' },
  CANCELLED: { label: 'Cancelled', chip: 'Cancelled', tone: 'danger', hint: "This order won't go ahead." },
  EXPIRED: { label: 'Expired', chip: 'Expired', tone: 'danger', hint: "The buyer didn't pay in time. Stock is back." },
};

// How a buyer paid, from Paystack's `channel` on the verified transaction.
const PAYMENT_CHANNEL: Record<string, string> = {
  card: 'Card',
  mobile_money: 'Mobile money',
  bank: 'Bank',
  bank_transfer: 'Bank transfer',
  ussd: 'USSD',
  qr: 'QR code',
  eft: 'EFT',
  apple_pay: 'Apple Pay',
};

export function paymentChannelLabel(channel: string | null): string {
  if (!channel) return 'Paystack';
  return PAYMENT_CHANNEL[channel] ?? channel.replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase());
}

export const SELLER_STATUS: Record<SellerStatus, { label: string; tone: Tone }> = {
  ONBOARDING: { label: 'Setting up', tone: 'warning' },
  LIVE: { label: 'Open for orders', tone: 'success' },
  SUSPENDED: { label: 'Paused', tone: 'danger' },
  DELETED: { label: 'Closed', tone: 'muted' },
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

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

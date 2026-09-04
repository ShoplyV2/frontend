import type { FeedOrder, OrderStatus } from './types';

// Lower rank = more urgent. Replaces "newest is the hero" (HeroOrder used to give emphasis to
// the newest order regardless of status, so a delivered order could outrank a paid one still
// awaiting dispatch).
const STATUS_RANK: Record<OrderStatus, number> = {
  DRAFT: 4,
  AWAITING_PAYMENT: 2,
  PAID: 1,
  DISPATCHED: 3,
  DELIVERED: 5,
  CANCELLED: 6,
  EXPIRED: 6,
};

export function orderRank(order: FeedOrder): number {
  if (order.fulfillmentRisk === 'STOCK_LOST') return 0;
  return STATUS_RANK[order.status];
}

export function sortByPriority(orders: FeedOrder[]): FeedOrder[] {
  return [...orders].sort((a, b) => {
    const rankDiff = orderRank(a) - orderRank(b);
    if (rankDiff !== 0) return rankDiff;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

// Emphasis ("Do this next") is reserved for genuinely urgent orders — stock-lost or paid-and-
// unsent — not simply whichever sorts first.
export function isUrgent(order: FeedOrder): boolean {
  return orderRank(order) <= 1;
}

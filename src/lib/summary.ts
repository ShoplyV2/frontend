import type { FeedOrder } from './types';

export interface ShopSummary {
  currency: string;
  paidToday: number; // minor units
  paidTodayCount: number;
  toSendCount: number;
  waitingCount: number;
  waitingTotal: number; // minor units
}

/**
 * Day totals worked out from the orders the app already has (the most recent 200). "Today" is the
 * seller's own local day. If a shop ever outgrows 200 orders in a day this undercounts, and a
 * server-side summary endpoint is the fix — not needed at today's volumes.
 */
export function summarize(orders: FeedOrder[], now: number): ShopSummary {
  const today = new Date(now).toDateString();
  const summary: ShopSummary = { currency: orders[0]?.currency ?? 'GHS', paidToday: 0, paidTodayCount: 0, toSendCount: 0, waitingCount: 0, waitingTotal: 0 };

  for (const order of orders) {
    if (order.payment.paidAt && new Date(order.payment.paidAt).toDateString() === today) {
      summary.paidToday += order.payment.amountPaid ?? order.total;
      summary.paidTodayCount += 1;
    }
    if (order.status === 'PAID') summary.toSendCount += 1;
    if (order.status === 'AWAITING_PAYMENT') {
      summary.waitingCount += 1;
      summary.waitingTotal += order.total;
    }
  }
  return summary;
}

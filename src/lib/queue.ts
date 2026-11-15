import { sortByPriority } from './orderPriority';
import type { FeedHandoff, FeedOrder } from './types';

/**
 * Home's work queue: everything the seller has to look at or act on, in one list. A question the
 * assistant couldn't answer ("needs you") outranks any order, since a buyer is waiting on it; orders
 * follow in the existing priority order (stock-lost, paid, unpaid, on the way).
 */
export type QueueItem =
  | { key: string; kind: 'question'; handoff: FeedHandoff; at: string }
  | { key: string; kind: 'order'; order: FeedOrder; at: string };

export type QueueFilter = 'all' | 'needs' | 'send';

// Orders that are finished or never became real have nothing left to do.
const DONE: ReadonlySet<FeedOrder['status']> = new Set(['DELIVERED', 'CANCELLED', 'EXPIRED', 'DRAFT']);

export function buildQueue(orders: FeedOrder[], handoffs: FeedHandoff[]): QueueItem[] {
  const questions: QueueItem[] = [...handoffs]
    .sort((a, b) => new Date(b.askedAt).getTime() - new Date(a.askedAt).getTime())
    .map((handoff) => ({ key: `q:${handoff._id}`, kind: 'question', handoff, at: handoff.askedAt }));

  const active: QueueItem[] = sortByPriority(orders.filter((o) => !DONE.has(o.status))).map((order) => ({
    key: `o:${order._id}`,
    kind: 'order',
    order,
    at: order.createdAt,
  }));

  return [...questions, ...active];
}

/** "Needs you": a waiting question, or a paid order whose stock is gone. "To send": paid, not yet sent. */
export function isNeedsYou(item: QueueItem): boolean {
  return item.kind === 'question' || item.order.fulfillmentRisk === 'STOCK_LOST';
}

export function isToSend(item: QueueItem): boolean {
  return item.kind === 'order' && item.order.status === 'PAID';
}

export function filterQueue(queue: QueueItem[], filter: QueueFilter): QueueItem[] {
  if (filter === 'needs') return queue.filter(isNeedsYou);
  if (filter === 'send') return queue.filter(isToSend);
  return queue;
}

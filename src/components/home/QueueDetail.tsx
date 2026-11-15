'use client';

import { HandoffCard } from '@/components/feed/HandoffCard';
import { OrderDetail } from '@/components/orders/OrderDetail';
import type { QueueItem } from '@/lib/queue';
import type { FeedOrder } from '@/lib/types';

/**
 * The right-hand side of Home: the selected question (with the chat and a reply box) or order
 * (with its actions). Keyed by the caller on the item, so switching items resets its local state.
 */
export function QueueDetail({
  item,
  token,
  onAction,
  onPatched,
}: {
  item: QueueItem;
  token: string;
  onAction: () => void;
  onPatched: (order: FeedOrder) => void;
}) {
  if (item.kind === 'question') {
    return <HandoffCard handoff={item.handoff} token={token} onAction={onAction} />;
  }

  return (
    <div className="card stack stack--panel">
      <OrderDetail order={item.order} token={token} onPatched={onPatched} />
    </div>
  );
}

'use client';

import { HandoffCard } from '@/components/feed/HandoffCard';
import { OrderDetail } from '@/components/orders/OrderDetail';
import type { QueueItem } from '@/lib/queue';
import type { FeedOrder } from '@/lib/types';
import { ConversationView } from './ConversationView';

/**
 * The right-hand side of Home: the selected question or order with its actions, and the chat
 * with that buyer. Keyed by the caller on the item, so switching items resets its local state.
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
    return (
      <div className="stack">
        <section className="section">
          <p className="section-title">The conversation</p>
          <div className="card">
            <ConversationView token={token} conversationId={item.handoff.conversationId} version={item.handoff.status} />
          </div>
        </section>
        <section className="section">
          <p className="section-title">Your reply</p>
          <HandoffCard handoff={item.handoff} token={token} onAction={onAction} />
        </section>
      </div>
    );
  }

  return <OrderDetail order={item.order} token={token} onPatched={onPatched} />;
}

'use client';

import Link from 'next/link';
import { HandoffCard } from '@/components/feed/HandoffCard';
import { OrderDetail } from '@/components/orders/OrderDetail';
import { ChatPanel } from '@/components/home/ChatPanel';
import type { InboxItem } from '@/lib/queue';
import type { FeedOrder } from '@/lib/types';

const CHANNEL_LABEL = { whatsapp: 'WhatsApp', telegram: 'Telegram' } as const;

/**
 * The right-hand side of Home: the selected question (with the chat and a reply box), taken-over
 * chat (with the box to write to the buyer), or parcel (with its actions). Keyed by the caller on
 * the item, so switching items resets its local state.
 */
export function InboxDetail({
  item,
  token,
  onAction,
  onPatched,
  onTakenOver,
}: {
  item: InboxItem;
  token: string;
  onAction: () => void;
  onPatched: (order: FeedOrder) => void;
  /** A question was turned into a taken-over chat, so Home can select it. */
  onTakenOver: (conversationId: string) => void;
}) {
  if (item.kind === 'question') {
    return <HandoffCard handoff={item.handoff} token={token} onAction={onAction} onTakenOver={onTakenOver} />;
  }

  if (item.kind === 'chat') {
    const c = item.conversation;
    return (
      <div className="card stack stack--panel">
        <div className="cluster">
          <h2>{[c.buyerName, c.area].filter(Boolean).join(' · ')}</h2>
          <span className="text-xs text-muted handoff-reason">{CHANNEL_LABEL[c.channel]}</span>
        </div>
        <ChatPanel token={token} conversationId={c._id} />
      </div>
    );
  }

  return (
    <div className="card stack stack--panel">
      <OrderDetail order={item.order} token={token} onPatched={onPatched} />
      <Link href={`/orders?order=${item.order._id}`} className="text-sm">
        Open in Orders
      </Link>
    </div>
  );
}

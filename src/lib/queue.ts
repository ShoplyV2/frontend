import { sortByPriority } from './orderPriority';
import type { FeedConversation, FeedHandoff, FeedOrder } from './types';

/**
 * Home's inbox: only what needs the seller right now. Three kinds of thing, each with something to
 * do, and each leaves the list once it has been dealt with:
 * - a question your assistant couldn't answer (a buyer is waiting);
 * - a chat you have taken over (you are the one answering that buyer);
 * - a paid order still to be sent.
 *
 * Orders that need nothing from the seller (waiting for the buyer to pay, already on the way, done)
 * are not here — they live in Orders, and Home only says how many there are.
 */
export type InboxItem =
  | { key: string; kind: 'question'; handoff: FeedHandoff; at: string }
  | { key: string; kind: 'chat'; conversation: FeedConversation; at: string }
  | { key: string; kind: 'parcel'; order: FeedOrder; at: string };

export type InboxKind = InboxItem['kind'];

/** The sections Home shows, in order — a buyer waiting on an answer comes before a parcel. */
export const INBOX_SECTIONS: Array<{ kind: InboxKind; title: string }> = [
  { kind: 'question', title: 'Questions from buyers' },
  { kind: 'chat', title: "Chats you've taken over" },
  { kind: 'parcel', title: 'Parcels to send' },
];

function time(iso: string): number {
  return new Date(iso).getTime();
}

export function buildInbox(orders: FeedOrder[], handoffs: FeedHandoff[], conversations: FeedConversation[]): InboxItem[] {
  const questions: InboxItem[] = [...handoffs]
    .sort((a, b) => time(b.askedAt) - time(a.askedAt))
    .map((handoff) => ({ key: `q:${handoff._id}`, kind: 'question', handoff, at: handoff.askedAt }));

  // A buyer who wrote after you last did is waiting on you, so those chats come first.
  const chats: InboxItem[] = [...conversations]
    .sort((a, b) => Number(b.waitingOnSeller) - Number(a.waitingOnSeller) || time(chatAt(b)) - time(chatAt(a)))
    .map((conversation) => ({ key: `c:${conversation._id}`, kind: 'chat', conversation, at: chatAt(conversation) }));

  // An order paid for stock that turned out to be gone ranks first (see orderPriority).
  const parcels: InboxItem[] = sortByPriority(orders.filter((o) => o.status === 'PAID')).map((order) => ({
    key: `o:${order._id}`,
    kind: 'parcel',
    order,
    at: order.createdAt,
  }));

  return [...questions, ...chats, ...parcels];
}

function chatAt(conversation: FeedConversation): string {
  return conversation.lastBuyerMessage?.at ?? conversation.takeoverStartedAt ?? new Date(0).toISOString();
}

/** What Home says about the orders that are not its business: buyers yet to pay, and parcels already sent. */
export function waitingOnOthers(orders: FeedOrder[]): { unpaid: number; onTheWay: number } {
  return {
    unpaid: orders.filter((o) => o.status === 'AWAITING_PAYMENT').length,
    onTheWay: orders.filter((o) => o.status === 'DISPATCHED').length,
  };
}

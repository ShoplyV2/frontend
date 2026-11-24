'use client';

import Link from 'next/link';
import { orderPhoto, orderTitle } from '@/lib/orderLines';
import { INBOX_SECTIONS, type InboxItem } from '@/lib/queue';
import { timeAgoShort } from '@/lib/time';
import { useNow } from '@/lib/useNow';
import type { FeedConversation, FeedOrder } from '@/lib/types';

function QuestionIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v5M12 16.5h.01" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 6v12M15 6v12" />
    </svg>
  );
}

function BagIcon() {
  return (
    <svg viewBox="0 0 48 48" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 18h24l2.5 22h-29L12 18z" />
      <path d="M18 18a6 6 0 0 1 12 0" />
    </svg>
  );
}

interface RowParts {
  tile: React.ReactNode;
  title: string;
  subtitle: string;
  /** Set on a subtitle that is the buyer waiting on you, so it reads as the thing to act on. */
  subtitleStrong?: boolean;
  badge?: { label: string; className: string };
  action: { label: string; primary: boolean; run: () => void };
}

function Row({
  item,
  selected,
  now,
  busy,
  onSelect,
  onDispatch,
  onHandBack,
}: {
  item: InboxItem;
  selected: boolean;
  now: number | null;
  busy: boolean;
  onSelect: () => void;
  onDispatch: (order: FeedOrder) => void;
  onHandBack: (conversation: FeedConversation) => void;
}) {
  let parts: RowParts;

  if (item.kind === 'question') {
    parts = {
      tile: (
        <span className="tile tile--40 tile--accent" aria-hidden="true">
          <QuestionIcon />
        </span>
      ),
      title: 'Question from a buyer',
      subtitle: item.handoff.buyerQuestion,
      action: { label: 'Reply', primary: true, run: onSelect },
    };
  } else if (item.kind === 'chat') {
    const c = item.conversation;
    parts = {
      tile: (
        <span className="tile tile--40" aria-hidden="true">
          <PauseIcon />
        </span>
      ),
      title: [c.buyerName, c.area].filter(Boolean).join(' · '),
      subtitle: c.waitingOnSeller && c.lastBuyerMessage ? `Buyer: “${c.lastBuyerMessage.text}”` : 'Waiting for the buyer',
      subtitleStrong: c.waitingOnSeller,
      action: { label: 'Hand back', primary: false, run: () => onHandBack(c) },
    };
  } else {
    const o = item.order;
    const lostStock = o.fulfillmentRisk === 'STOCK_LOST';
    const photo = orderPhoto(o);
    parts = {
      tile: (
        <span className="tile tile--40" aria-hidden="true">
          {photo ? (
            // eslint-disable-next-line @next/next/no-img-element -- seller-uploaded R2 URL, not a local/optimizable asset
            <img src={photo} alt="" />
          ) : (
            <BagIcon />
          )}
        </span>
      ),
      title: orderTitle(o),
      subtitle: [o.delivery.name || o.buyer.name || 'Buyer', o.delivery.area].filter(Boolean).join(' · '),
      badge: lostStock ? { label: 'Sold out', className: 'badge badge--danger' } : undefined,
      // A parcel whose stock ran out can't be sent: the seller has to sort it out with the buyer first.
      action: lostStock ? { label: 'Open', primary: true, run: onSelect } : { label: 'Mark as sent', primary: false, run: () => onDispatch(o) },
    };
  }

  return (
    <li className="inbox-row">
      <button type="button" className="queue-row" aria-current={selected ? 'true' : undefined} onClick={onSelect}>
        {parts.tile}
        <span className="queue-row-main">
          <span className="truncate queue-row-title">{parts.title}</span>
          <span className={`truncate queue-row-sub${parts.subtitleStrong ? ' queue-row-sub--strong' : ''}`}>{parts.subtitle}</span>
        </span>
        <span className="queue-row-side">
          {parts.badge && <span className={parts.badge.className}>{parts.badge.label}</span>}
          <span className="queue-row-time tabular">{now != null ? timeAgoShort(item.at, now) : ''}</span>
        </span>
      </button>
      <button type="button" className={`btn btn--sm ${parts.action.primary ? 'btn--primary' : 'btn--secondary'} inbox-row-action`} disabled={busy} onClick={parts.action.run}>
        {parts.action.label}
      </button>
    </li>
  );
}

/**
 * Home's list of what needs you, in sections, each row with the one thing to do (Reply, Hand back,
 * Mark as sent). A footer says how many orders are not waiting on you and links to the full list.
 */
export function InboxList({
  items,
  selectedKey,
  busyKey,
  unpaid,
  onTheWay,
  onSelect,
  onDispatch,
  onHandBack,
}: {
  items: InboxItem[];
  selectedKey: string | null;
  busyKey: string | null;
  unpaid: number;
  onTheWay: number;
  onSelect: (key: string) => void;
  onDispatch: (order: FeedOrder) => void;
  onHandBack: (conversation: FeedConversation) => void;
}) {
  const now = useNow(30_000);
  const elsewhere = [unpaid > 0 ? `${unpaid} unpaid` : null, onTheWay > 0 ? `${onTheWay} on the way` : null].filter(Boolean).join(', ');

  return (
    <section className="queue" aria-label="Needs you">
      <div className="queue-head">
        <h2>Needs you</h2>
      </div>

      {items.length === 0 ? (
        <div className="empty-state">
          <p className="empty-state-title">You&apos;re all caught up.</p>
          <p>When a buyer asks something your assistant can&apos;t answer, or an order is paid, it shows up here.</p>
        </div>
      ) : (
        INBOX_SECTIONS.map((section) => {
          const inSection = items.filter((i) => i.kind === section.kind);
          if (inSection.length === 0) return null;
          return (
            <div key={section.kind}>
              <h3 className="inbox-section">{section.title}</h3>
              <ul className="queue-list">
                {inSection.map((item) => (
                  <Row
                    key={item.key}
                    item={item}
                    selected={item.key === selectedKey}
                    now={now}
                    busy={busyKey === item.key}
                    onSelect={() => onSelect(item.key)}
                    onDispatch={onDispatch}
                    onHandBack={onHandBack}
                  />
                ))}
              </ul>
            </div>
          );
        })
      )}

      <Link href="/orders" className="inbox-foot">
        <span>{elsewhere ? `Not waiting on you: ${elsewhere}.` : 'Nothing else is waiting on you.'}</span>
        <span className="inbox-foot-link">See all orders</span>
      </Link>
    </section>
  );
}

'use client';

import { ORDER_STATUS } from '@/lib/labels';
import { orderPhoto, orderTitle } from '@/lib/orderLines';
import { filterQueue, isNeedsYou, isToSend, type QueueFilter, type QueueItem } from '@/lib/queue';
import { timeAgoShort } from '@/lib/time';
import { useNow } from '@/lib/useNow';

const FILTERS: Array<{ key: QueueFilter; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'needs', label: 'Needs you' },
  { key: 'send', label: 'To send' },
];

function QuestionIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v5M12 16.5h.01" />
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

function Row({ item, selected, onSelect, now }: { item: QueueItem; selected: boolean; onSelect: () => void; now: number | null }) {
  let title: string;
  let subtitle: string;
  let badge: { label: string; className: string };
  let tile: React.ReactNode;

  if (item.kind === 'question') {
    title = 'Question from a buyer';
    subtitle = item.handoff.buyerQuestion;
    badge = { label: 'Needs you', className: 'badge badge--accent' };
    tile = (
      <span className="tile tile--40 tile--accent" aria-hidden="true">
        <QuestionIcon />
      </span>
    );
  } else {
    const o = item.order;
    const info = ORDER_STATUS[o.status];
    title = orderTitle(o);
    subtitle = [o.delivery.name || o.buyer.name || 'Buyer', o.delivery.area].filter(Boolean).join(' · ');
    badge = o.fulfillmentRisk === 'STOCK_LOST' ? { label: 'Sold out', className: 'badge badge--danger' } : { label: info.chip, className: `badge badge--${info.tone}` };
    tile = (
      <span className="tile tile--40" aria-hidden="true">
        {orderPhoto(o) ? (
          // eslint-disable-next-line @next/next/no-img-element -- seller-uploaded R2 URL, not a local/optimizable asset
          <img src={orderPhoto(o) ?? ''} alt="" />
        ) : (
          <BagIcon />
        )}
      </span>
    );
  }

  return (
    <li>
      <button type="button" className="queue-row" aria-current={selected ? 'true' : undefined} onClick={onSelect}>
        {tile}
        <span className="queue-row-main">
          <span className="truncate queue-row-title">{title}</span>
          <span className="truncate queue-row-sub">{subtitle}</span>
        </span>
        <span className="queue-row-side">
          <span className={badge.className}>{badge.label}</span>
          <span className="queue-row-time tabular">{now != null ? timeAgoShort(item.at, now) : ''}</span>
        </span>
      </button>
    </li>
  );
}

export function QueueList({
  queue,
  filter,
  onFilter,
  selectedKey,
  onSelect,
}: {
  queue: QueueItem[];
  filter: QueueFilter;
  onFilter: (filter: QueueFilter) => void;
  selectedKey: string | null;
  onSelect: (key: string) => void;
}) {
  const now = useNow(30_000);
  const shown = filterQueue(queue, filter);
  const counts: Record<QueueFilter, number> = { all: queue.length, needs: queue.filter(isNeedsYou).length, send: queue.filter(isToSend).length };

  return (
    <section className="queue" aria-label="Queue">
      <div className="queue-head">
        <h2>Queue</h2>
        <div className="pill-group" role="group" aria-label="Filter the queue">
          {FILTERS.map((f) => (
            <button key={f.key} type="button" className="pill pill--sm" aria-pressed={filter === f.key} onClick={() => onFilter(f.key)}>
              {f.label} <span className="pill-count">{counts[f.key]}</span>
            </button>
          ))}
        </div>
      </div>

      {shown.length === 0 ? (
        <div className="empty-state">
          <p className="empty-state-title">{queue.length === 0 ? 'Nothing to do right now.' : 'Nothing here.'}</p>
          <p>{queue.length === 0 ? 'When a buyer orders or your assistant needs you, it shows up here.' : 'Try another filter.'}</p>
        </div>
      ) : (
        <ul className="queue-list">
          {shown.map((item) => (
            <Row key={item.key} item={item} selected={item.key === selectedKey} onSelect={() => onSelect(item.key)} now={now} />
          ))}
        </ul>
      )}
    </section>
  );
}

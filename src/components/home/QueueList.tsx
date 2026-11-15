'use client';

import { HANDOFF_REASON, ORDER_STATUS } from '@/lib/labels';
import { filterQueue, isNeedsYou, isToSend, type QueueFilter, type QueueItem } from '@/lib/queue';
import { timeAgo } from '@/lib/time';
import { useNow } from '@/lib/useNow';

const FILTERS: Array<{ key: QueueFilter; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'needs', label: 'Needs you' },
  { key: 'send', label: 'To send' },
];

function Row({ item, selected, onSelect, now }: { item: QueueItem; selected: boolean; onSelect: () => void; now: number | null }) {
  let title: string;
  let subtitle: string;
  let badge: { label: string; className: string };

  if (item.kind === 'question') {
    title = item.handoff.buyerQuestion;
    subtitle = HANDOFF_REASON[item.handoff.reason];
    badge = { label: 'Needs you', className: 'badge badge--accent' };
  } else {
    const o = item.order;
    const info = ORDER_STATUS[o.status];
    title = o.item.nameSnapshot;
    subtitle = [o.delivery.name || o.buyer.name || 'Buyer', o.delivery.area].filter(Boolean).join(' · ');
    badge = o.fulfillmentRisk === 'STOCK_LOST' ? { label: 'Sold out', className: 'badge badge--danger' } : { label: info.label, className: `badge badge--${info.tone}` };
  }

  return (
    <li>
      <button type="button" className="queue-row" aria-current={selected ? 'true' : undefined} onClick={onSelect}>
        <span className="queue-row-main">
          <span className="truncate queue-row-title">{title}</span>
          <span className="truncate text-sm text-muted">{subtitle}</span>
        </span>
        <span className="queue-row-side">
          <span className={badge.className}>{badge.label}</span>
          <span className="text-xs text-muted">{now != null ? timeAgo(item.at, now) : ''}</span>
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
    <div className="queue">
      <div className="pill-group" role="group" aria-label="Filter the queue">
        {FILTERS.map((f) => (
          <button key={f.key} type="button" className="pill" aria-pressed={filter === f.key} onClick={() => onFilter(f.key)}>
            {f.label} <span className="pill-count">{counts[f.key]}</span>
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <div className="empty-state">
          <p className="empty-state-title">{queue.length === 0 ? 'Nothing to do right now.' : 'Nothing here.'}</p>
          <p>{queue.length === 0 ? "When a buyer orders or your assistant needs you, it shows up here." : 'Try another filter.'}</p>
        </div>
      ) : (
        <ul className="queue-list">
          {shown.map((item) => (
            <Row key={item.key} item={item} selected={item.key === selectedKey} onSelect={() => onSelect(item.key)} now={now} />
          ))}
        </ul>
      )}
    </div>
  );
}

'use client';

import { formatMoney } from '@/lib/format';
import { summarize } from '@/lib/summary';
import { useNow } from '@/lib/useNow';
import type { FeedOrder } from '@/lib/types';

/** Three numbers for the day, worked out from the loaded orders. Shows nothing until the clock is known (see useNow). */
export function StatsStrip({ orders }: { orders: FeedOrder[] }) {
  const now = useNow(60_000);
  if (now == null) return <div className="stats" aria-hidden="true" />;
  const s = summarize(orders, now);

  return (
    <dl className="stats">
      <div className="stat">
        <dt>Paid today</dt>
        <dd className="tabular">{formatMoney(s.paidToday, s.currency)}</dd>
        <p className="stat-note">{s.paidTodayCount === 1 ? '1 order' : `${s.paidTodayCount} orders`}</p>
      </div>
      <div className="stat">
        <dt>To send</dt>
        <dd className="tabular">{s.toSendCount}</dd>
        <p className="stat-note">paid, not yet sent</p>
      </div>
      <div className="stat">
        <dt>Waiting for payment</dt>
        <dd className="tabular">{s.waitingCount}</dd>
        <p className="stat-note">{s.waitingCount > 0 ? formatMoney(s.waitingTotal, s.currency) : 'nothing held'}</p>
      </div>
    </dl>
  );
}

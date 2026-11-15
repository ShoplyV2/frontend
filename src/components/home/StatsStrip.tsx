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
      </div>
      <div className="stat">
        <dt>To send</dt>
        <dd className="tabular">{s.toSendCount}</dd>
      </div>
      <div className="stat">
        <dt>
          <span className="stat-long">Waiting for payment</span>
          <span className="stat-short">Unpaid</span>
        </dt>
        <dd className="tabular">{formatMoney(s.waitingTotal, s.currency)}</dd>
      </div>
    </dl>
  );
}

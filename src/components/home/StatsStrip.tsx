'use client';

import Link from 'next/link';
import { formatMoney } from '@/lib/format';
import { summarize } from '@/lib/summary';
import { useNow } from '@/lib/useNow';
import type { FeedOrder } from '@/lib/types';

/**
 * Three numbers for the day, worked out from the loaded orders. Shows nothing until the clock is known
 * (see useNow). What is waiting for payment isn't yours to act on, so it links to Orders (filtered to
 * the unpaid ones) rather than sitting in the inbox.
 */
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
        <dt>Orders today</dt>
        <dd className="tabular">{s.ordersToday}</dd>
      </div>
      <div className="stat">
        <dt>
          <Link href="/orders?filter=unpaid" className="stat-link">
            <span className="stat-long">Waiting for payment</span>
            <span className="stat-short">Unpaid</span>
          </Link>
        </dt>
        <dd className="tabular">{formatMoney(s.waitingTotal, s.currency)}</dd>
      </div>
    </dl>
  );
}

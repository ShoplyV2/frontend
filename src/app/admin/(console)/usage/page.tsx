'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Alert } from '@/components/ui/Alert';
import { PageSkeleton } from '@/components/ui/PageSkeleton';
import { Page } from '@/components/shell/Page';
import { PageHeader } from '@/components/shell/PageHeader';
import { useAdmin } from '@/components/admin/AdminProvider';
import { ApiError, getAdminUsage } from '@/lib/apiClient';
import { adminMessage } from '@/lib/adminError';
import { percent, periodLabel, planLabel, recentPeriods, usd } from '@/lib/adminShops';
import { formatMoney } from '@/lib/format';
import type { AdminUsageReport, AdminUsageRow } from '@/lib/types';

const periods = recentPeriods();

export default function AdminUsagePage() {
  const { token, signOut } = useAdmin();
  const [period, setPeriod] = useState(periods[0]!);
  const [report, setReport] = useState<AdminUsageReport | null>(null);
  const [error, setError] = useState<unknown>(null);

  const load = useCallback(async () => {
    try {
      setReport(await getAdminUsage(token, period));
      setError(null);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) return signOut();
      setError(err);
    }
  }, [token, period, signOut]);

  useEffect(() => {
    function run() {
      void load();
    }
    run();
  }, [load]);

  const rows = useMemo(() => report?.sellers ?? [], [report]);
  const overage = rows.reduce((sum, r) => sum + r.overageMinor, 0);
  const overCount = rows.filter((r) => r.overageMinor > 0).length;

  function exportCsv() {
    const header = ['Shop', 'Plan', 'Chats', 'Chats included', 'Orders', 'Orders included', 'Conversion', 'Model cost USD', 'Cost per chat USD', 'Cost per order USD', 'Overage GHS'];
    const lines = rows.map((r) => [r.shopName, r.plan ?? 'trial', r.chats, r.chatsIncluded ?? '', r.orders, r.ordersIncluded ?? '', r.conversion ?? '', r.llmCostUsd.toFixed(4), r.costPerChatUsd?.toFixed(4) ?? '', r.costPerOrderUsd?.toFixed(4) ?? '', (r.overageMinor / 100).toFixed(2)]);
    const csv = [header, ...lines].map((line) => line.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `shoply-usage-${period}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Page width="wide">
      <div className="stack">
        <PageHeader
          title="Usage and cost"
          subtitle="What each shop used in a month, next to what the model cost to serve it."
          action={
            <div className="cluster cluster--sm">
              <label className="visually-hidden" htmlFor="usage-period">
                Month
              </label>
              <select id="usage-period" className="select admin-period" value={period} onChange={(e) => setPeriod(e.target.value)}>
                {periods.map((p) => (
                  <option key={p} value={p}>
                    {periodLabel(p)}
                  </option>
                ))}
              </select>
              <button type="button" className="btn btn--secondary" onClick={exportCsv} disabled={rows.length === 0}>
                Export CSV
              </button>
            </div>
          }
        />

        {error != null && (
          <Alert variant="danger" action={<button type="button" className="btn btn--secondary btn--sm" onClick={() => void load()}>Try again</button>}>
            {adminMessage(error, 'Could not load usage.')}
          </Alert>
        )}

        {!report && !error ? (
          <PageSkeleton />
        ) : (
          report && (
            <>
              <dl className="stats stats--six">
                <Stat label="Paid orders" value={report.totals.orders.toLocaleString()} />
                <Stat label="Buyer chats" value={report.totals.chats.toLocaleString()} />
                <Stat label="Conversion" value={percent(report.totals.conversion)} />
                <Stat label="Model cost" value={usd(report.totals.llmCostUsd)} />
                <Stat label="Cost per order" value={report.totals.costPerOrderUsd === null ? '—' : usd(report.totals.costPerOrderUsd, 3)} />
                <Stat label="Overage owed" value={formatMoney(overage)} sub={overCount > 0 ? `${overCount} ${overCount === 1 ? 'shop' : 'shops'} over plan` : 'No shop over plan'} />
              </dl>

              <div className="card card--flush scroll-x">
                <table className="table admin-table">
                  <thead>
                    <tr>
                      <th>Shop</th>
                      <th>Plan</th>
                      <th>Chats vs plan</th>
                      <th className="num">Orders</th>
                      <th className="num">Conversion</th>
                      <th className="num">Model cost</th>
                      <th className="num">Per chat</th>
                      <th className="num">Per order</th>
                      <th className="num">Overage</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <UsageRow key={row.sellerId} row={row} />
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td>Total</td>
                      <td />
                      <td className="num">{report.totals.chats.toLocaleString()}</td>
                      <td className="num">{report.totals.orders.toLocaleString()}</td>
                      <td className="num">{percent(report.totals.conversion)}</td>
                      <td className="num">{usd(report.totals.llmCostUsd)}</td>
                      <td className="num">{report.totals.costPerChatUsd === null ? '—' : usd(report.totals.costPerChatUsd, 3)}</td>
                      <td className="num">{report.totals.costPerOrderUsd === null ? '—' : usd(report.totals.costPerOrderUsd, 3)}</td>
                      <td className="num">{formatMoney(overage)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </>
          )
        )}
      </div>
    </Page>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="stat">
      <dt>{label}</dt>
      <dd>{value}</dd>
      {sub && <p className="text-xs text-muted">{sub}</p>}
    </div>
  );
}

function UsageRow({ row }: { row: AdminUsageRow }) {
  const share = row.chatsIncluded ? row.chats / row.chatsIncluded : null;
  const tone = share === null ? '' : share > 1 ? ' bar--danger' : share >= 0.8 ? ' bar--warn' : '';
  return (
    <tr>
      <td>
        <Link href={`/admin/shops/${row.sellerId}`} className="admin-shop-name">
          {row.shopName}
        </Link>
      </td>
      <td>{row.onTrial ? <span className="badge badge--muted">Trial</span> : planLabel(row.plan)}</td>
      <td>
        {share === null ? (
          <span>{row.chats.toLocaleString()}</span>
        ) : (
          <div className="stack stack--xs admin-usage-cell">
            <span>
              {row.chats.toLocaleString()} / {row.chatsIncluded!.toLocaleString()} <span className="text-muted">{Math.round(share * 100)}%</span>
            </span>
            <span className={`bar${tone}`} role="presentation">
              <i style={{ inlineSize: `${Math.min(100, share * 100)}%` }} />
            </span>
          </div>
        )}
      </td>
      <td className="num">{row.orders.toLocaleString()}</td>
      <td className="num">{percent(row.conversion)}</td>
      <td className="num">{usd(row.llmCostUsd)}</td>
      <td className="num">{row.costPerChatUsd === null ? '—' : usd(row.costPerChatUsd, 3)}</td>
      <td className="num">{row.costPerOrderUsd === null ? '—' : usd(row.costPerOrderUsd, 3)}</td>
      <td className="num">{row.onTrial ? <span className="text-muted">n/a</span> : formatMoney(row.overageMinor)}</td>
    </tr>
  );
}

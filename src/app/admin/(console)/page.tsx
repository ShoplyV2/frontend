'use client';

import Link from 'next/link';
import { Alert } from '@/components/ui/Alert';
import { PageSkeleton } from '@/components/ui/PageSkeleton';
import { Page } from '@/components/shell/Page';
import { PageHeader } from '@/components/shell/PageHeader';
import { useAdmin } from '@/components/admin/AdminProvider';
import { percent, periodLabel, trialProgress, usd } from '@/lib/adminShops';
import { adminMessage } from '@/lib/adminError';
import { ATTENTION, SETUP_STEP } from '@/lib/labels';
import { timeAgo } from '@/lib/time';
import type { AdminAttentionItem, AdminOverview } from '@/lib/types';

const FUNNEL_LABEL: Record<AdminOverview['funnel'][number]['key'], string> = {
  signedUp: 'Signed up',
  profile: 'Profile done',
  channel: 'Chat app connected',
  catalog: 'Catalog added',
  payout: 'Payout set',
  activated: 'Live',
};

const ACTION: Record<AdminAttentionItem['kind'], string> = { WHATSAPP_REQUESTED: 'Connect', TRIAL_ENDING: 'Set plan', STUCK_IN_SETUP: 'Open', OVER_PLAN: 'Review' };

function detail(item: AdminAttentionItem): string {
  switch (item.kind) {
    case 'WHATSAPP_REQUESTED':
      return `Asked ${item.whatsappRequestedAt ? timeAgo(item.whatsappRequestedAt) : 'recently'} · no number connected`;
    case 'TRIAL_ENDING':
      return item.trial ? trialProgress(item.trial).text : 'Trial ending';
    case 'STUCK_IN_SETUP': {
      const days = Math.floor((Date.now() - new Date(item.createdAt).getTime()) / 86_400_000);
      return `${days} days in setup${item.setup.firstOpen ? ` · next: ${SETUP_STEP[item.setup.firstOpen].toLowerCase()}` : ''}`;
    }
    case 'OVER_PLAN':
      return item.chatsIncluded !== null && item.chats > item.chatsIncluded ? `${item.chats} / ${item.chatsIncluded} chats this month` : `${item.orders} / ${item.ordersIncluded} orders this month`;
  }
}

export default function AdminOverviewPage() {
  const { overview, overviewError, refreshOverview } = useAdmin();

  if (!overview) {
    return (
      <Page width="wide">
        {overviewError != null ? (
          <Alert variant="danger" action={<button type="button" className="btn btn--secondary btn--sm" onClick={() => void refreshOverview()}>Try again</button>}>
            {adminMessage(overviewError, 'Could not load the overview.')}
          </Alert>
        ) : (
          <PageSkeleton />
        )}
      </Page>
    );
  }

  const { shops, totals, previous, attention, funnel, topShops, trials } = overview;
  const change = previous.orders > 0 ? Math.round(((totals.orders - previous.orders) / previous.orders) * 100) : null;
  const top = funnel[0]?.count || 1;

  return (
    <Page width="wide">
      <div className="stack">
        <PageHeader title="Overview" subtitle={`${periodLabel(overview.period)} · everything the team needs to look at today.`} />

        <dl className="stats stats--four">
          <div className="stat">
            <dt>Live shops</dt>
            <dd>
              {shops.live} <small>of {shops.total}</small>
            </dd>
            <p className="text-xs text-muted">
              {shops.onboarding} setting up · {shops.suspended} suspended
            </p>
          </div>
          <div className="stat">
            <dt>Paid orders</dt>
            <dd>{totals.orders.toLocaleString()}</dd>
            <p className="text-xs text-muted">{change === null ? 'No orders last month' : `${change >= 0 ? '+' : ''}${change}% vs last month`}</p>
          </div>
          <div className="stat">
            <dt>Buyer chats</dt>
            <dd>{totals.chats.toLocaleString()}</dd>
            <p className="text-xs text-muted">{totals.conversion === null ? 'No chats yet' : `${percent(totals.conversion)} became an order`}</p>
          </div>
          <div className="stat">
            <dt>Model cost</dt>
            <dd>{usd(totals.llmCostUsd)}</dd>
            <p className="text-xs text-muted">
              {totals.costPerChatUsd === null ? '—' : `${usd(totals.costPerChatUsd, 3)} per chat`}
              {totals.costPerOrderUsd !== null && ` · ${usd(totals.costPerOrderUsd, 3)} per order`}
            </p>
          </div>
        </dl>

        <div className="admin-columns">
          <div className="stack">
            <section className="card stack" aria-labelledby="attention-title">
              <div className="split">
                <div className="cluster cluster--sm">
                  <h2 id="attention-title">Needs attention</h2>
                  <span className="badge badge--accent">{attention.length}</span>
                </div>
                <Link href="/admin/shops" className="btn btn--ghost btn--sm">
                  All shops
                </Link>
              </div>
              {attention.length === 0 ? (
                <p className="text-secondary">Nothing needs the team right now.</p>
              ) : (
                <ul className="admin-rows">
                  {attention.map((item) => (
                    <li key={`${item.kind}-${item.shopId}`} className="admin-row">
                      <div className="admin-row-main">
                        <span className={`badge badge--${ATTENTION[item.kind].tone === 'danger' ? 'danger' : ATTENTION[item.kind].tone === 'warning' ? 'warning' : 'accent'}`}>{ATTENTION[item.kind].label}</span>
                        <div>
                          <strong>{item.shopName}</strong>
                        </div>
                        <div className="text-sm text-secondary">{detail(item)}</div>
                      </div>
                      <Link href={`/admin/shops/${item.shopId}`} className="btn btn--secondary btn--sm">
                        {ACTION[item.kind]}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="card stack" aria-labelledby="funnel-title">
              <h2 id="funnel-title">Setup funnel</h2>
              <ul className="admin-rows">
                {funnel.map((step) => (
                  <li key={step.key} className="admin-row">
                    <span className="admin-funnel-label">{FUNNEL_LABEL[step.key]}</span>
                    <span className="bar admin-funnel-bar" role="presentation">
                      <i style={{ inlineSize: `${(step.count / top) * 100}%` }} />
                    </span>
                    <strong className="admin-funnel-count">{step.count}</strong>
                  </li>
                ))}
              </ul>
            </section>
          </div>

          <div className="stack">
            <section className="card card--flush" aria-labelledby="busy-title">
              <div className="split admin-card-head">
                <h2 id="busy-title">Busiest this month</h2>
                <Link href="/admin/usage" className="btn btn--ghost btn--sm">
                  Full report
                </Link>
              </div>
              <div className="scroll-x">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Shop</th>
                      <th className="num">Chats</th>
                      <th className="num">Orders</th>
                      <th className="num">Cost</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topShops.map((row) => (
                      <tr key={row.sellerId}>
                        <td>
                          <Link href={`/admin/shops/${row.sellerId}`} className="admin-shop-name">
                            {row.shopName}
                          </Link>
                        </td>
                        <td className="num">{row.chats}</td>
                        <td className="num">{row.orders}</td>
                        <td className="num">{usd(row.llmCostUsd)}</td>
                      </tr>
                    ))}
                    {topShops.length === 0 && (
                      <tr>
                        <td colSpan={4} className="text-muted">
                          No shops yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="card stack" aria-labelledby="trials-title">
              <div className="cluster cluster--sm">
                <h2 id="trials-title">Trials in progress</h2>
                <span className="badge badge--muted">{trials.count}</span>
              </div>
              {trials.shops.length === 0 ? (
                <p className="text-secondary">No trial is running.</p>
              ) : (
                <ul className="admin-rows">
                  {trials.shops.map((t) => (
                    <li key={t.shopId} className="admin-row">
                      <Link href={`/admin/shops/${t.shopId}`} className="admin-shop-name admin-row-main">
                        {t.shopName}
                      </Link>
                      <span className="text-sm text-secondary">{trialProgress(t.trial).text}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </div>
      </div>
    </Page>
  );
}

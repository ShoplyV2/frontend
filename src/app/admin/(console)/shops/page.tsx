'use client';

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Alert } from '@/components/ui/Alert';
import { PageHeader } from '@/components/shell/PageHeader';
import { Page } from '@/components/shell/Page';
import { PageSkeleton } from '@/components/ui/PageSkeleton';
import { useAdmin } from '@/components/admin/AdminProvider';
import { ApiError, listAdminSellers } from '@/lib/apiClient';
import { attentionByShop, isAttentionKind, planLabel, trialProgress } from '@/lib/adminShops';
import { sellerMessage } from '@/lib/errorMessage';
import { ATTENTION, CHANNEL_KIND, SELLER_STATUS, SETUP_STEP } from '@/lib/labels';
import { timeAgo } from '@/lib/time';
import type { AdminShopRow } from '@/lib/types';

type Filter = 'all' | 'attention' | 'live' | 'onboarding' | 'trial' | 'suspended';

const FILTERS: Array<{ key: Filter; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'attention', label: 'Needs attention' },
  { key: 'live', label: 'Live' },
  { key: 'onboarding', label: 'Setting up' },
  { key: 'trial', label: 'On trial' },
  { key: 'suspended', label: 'Suspended' },
];

export default function AdminShopsPage() {
  // useSearchParams needs a Suspense boundary above it.
  return (
    <Suspense fallback={<Page width="wide"><PageSkeleton /></Page>}>
      <ShopsList />
    </Suspense>
  );
}

function ShopsList() {
  const { token, signOut, overview } = useAdmin();
  const needs = useSearchParams().get('needs');
  const needsKind = isAttentionKind(needs) ? needs : null;

  const [shops, setShops] = useState<AdminShopRow[] | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');

  const load = useCallback(async () => {
    try {
      setShops((await listAdminSellers(token)).sellers);
      setError(null);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) return signOut();
      setError(err);
    }
  }, [token, signOut]);

  useEffect(() => {
    function run() {
      void load();
    }
    run();
  }, [load]);

  const attention = useMemo(() => attentionByShop(overview?.attention), [overview]);

  const matches = useCallback(
    (shop: AdminShopRow, which: Filter): boolean => {
      switch (which) {
        case 'all':
          return shop.status !== 'DELETED';
        case 'attention':
          return attention.has(shop.id);
        case 'live':
          return shop.status === 'LIVE';
        case 'onboarding':
          return shop.status === 'ONBOARDING';
        case 'trial':
          return shop.plan === null && shop.status !== 'DELETED';
        case 'suspended':
          return shop.status === 'SUSPENDED';
      }
    },
    [attention],
  );

  const visible = useMemo(() => {
    const text = query.trim().toLowerCase();
    return (shops ?? []).filter((shop) => {
      if (needsKind) return attention.get(shop.id)?.includes(needsKind);
      if (!matches(shop, filter)) return false;
      return !text || shop.shopName.toLowerCase().includes(text) || (shop.email ?? '').toLowerCase().includes(text);
    });
  }, [shops, query, filter, needsKind, attention, matches]);

  const count = (which: Filter) => (shops ?? []).filter((shop) => matches(shop, which)).length;
  const open = (shops ?? []).filter((s) => s.status !== 'DELETED').length;

  if (!shops && !error) {
    return (
      <Page width="wide">
        <PageSkeleton />
      </Page>
    );
  }

  return (
    <Page width="wide">
      <div className="stack">
        <PageHeader title="Shops" subtitle={`${open} shops · newest first.`} />

        {error != null && (
          <Alert variant="danger" action={<button type="button" className="btn btn--secondary btn--sm" onClick={() => void load()}>Try again</button>}>
            {sellerMessage(error, 'Could not load shops.')}
          </Alert>
        )}

        {needsKind ? (
          <div className="cluster cluster--sm">
            <span className="badge badge--accent">{ATTENTION[needsKind].label}</span>
            <Link href="/admin/shops" className="btn btn--ghost btn--sm">
              Show all shops
            </Link>
          </div>
        ) : (
          <div className="admin-toolbar">
            <div className="pill-group pill-group--scroll" role="group" aria-label="Filter shops">
              {FILTERS.map((f) => (
                <button key={f.key} type="button" className="pill pill--sm" aria-pressed={filter === f.key} onClick={() => setFilter(f.key)}>
                  {f.label} <span className="pill-count">{f.key === 'attention' && !overview ? '–' : count(f.key)}</span>
                </button>
              ))}
            </div>
            <input className="input admin-search" type="search" placeholder="Search by shop or email" aria-label="Search shops" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
        )}

        {visible.length === 0 ? (
          <div className="empty-state">
            <p className="empty-state-title">{shops?.length ? 'No shops match.' : 'No shops yet.'}</p>
            <p>{shops?.length ? 'Try a different filter or search.' : 'Shops appear here as sellers sign up.'}</p>
          </div>
        ) : (
          <div className="card card--flush scroll-x">
            <table className="table admin-table">
              <thead>
                <tr>
                  <th>Shop</th>
                  <th>Status</th>
                  <th>Plan</th>
                  <th>Chat apps</th>
                  <th>Setup</th>
                  <th className="num">Chats</th>
                  <th className="num">Orders</th>
                  <th>Last buyer chat</th>
                  <th>
                    <span className="visually-hidden">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {visible.map((shop) => (
                  <ShopRow key={shop.id} shop={shop} ending={attention.get(shop.id)?.includes('TRIAL_ENDING') ?? false} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Page>
  );
}

function ShopRow({ shop, ending }: { shop: AdminShopRow; ending: boolean }) {
  const status = SELLER_STATUS[shop.status];
  const progress = shop.trial ? trialProgress(shop.trial) : null;
  return (
    <tr>
      <td>
        <Link href={`/admin/shops/${shop.id}`} className="admin-shop-name">
          {shop.shopName}
        </Link>
        {shop.email && <div className="text-xs text-muted">{shop.email}</div>}
      </td>
      <td>
        <span className={`badge badge--${status.tone}`}>{status.label}</span>
      </td>
      <td>
        {shop.plan ? (
          planLabel(shop.plan)
        ) : (
          <div className="stack stack--xs">
            <span className={`badge ${ending ? 'badge--warning' : 'badge--muted'}`}>{ending ? 'Trial ending' : 'Trial'}</span>
            {progress && <span className="text-xs text-muted">{progress.text}</span>}
          </div>
        )}
      </td>
      <td>
        <div className="cluster cluster--sm">
          {shop.channels.map((channel) => (
            <span key={channel.kind} className={`badge ${channel.active && channel.bound ? 'badge--accent' : 'badge--warning'}`}>
              {CHANNEL_KIND[channel.kind]}
              {channel.active && channel.bound ? '' : ' (not receiving alerts)'}
            </span>
          ))}
          {shop.channels.length === 0 && <span className="badge badge--muted">None</span>}
          {shop.whatsappRequestedAt && !shop.channels.some((c) => c.kind === 'whatsapp') && <span className="badge badge--accent">WhatsApp requested</span>}
        </div>
      </td>
      <td>
        <div className="stack stack--xs">
          <span>
            {shop.setup.done} of {shop.setup.total}
            {shop.setup.firstOpen && shop.setup.done < shop.setup.total && shop.status !== 'LIVE' ? ` · next: ${SETUP_STEP[shop.setup.firstOpen].toLowerCase()}` : ''}
          </span>
          <span className="bar" role="presentation">
            <i style={{ inlineSize: `${(shop.setup.done / shop.setup.total) * 100}%` }} />
          </span>
        </div>
      </td>
      <td className="num">{shop.chats}</td>
      <td className="num">{shop.orders}</td>
      <td>{shop.lastBuyerChatAt ? timeAgo(shop.lastBuyerChatAt) : <span className="text-muted">None yet</span>}</td>
      <td>
        <Link href={`/admin/shops/${shop.id}`} className="btn btn--secondary btn--sm">
          Manage
        </Link>
      </td>
    </tr>
  );
}

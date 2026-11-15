'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ApiError } from '@/lib/apiClient';
import { formatMoney } from '@/lib/format';
import { ORDER_STATUS } from '@/lib/labels';
import { sellerMessage } from '@/lib/errorMessage';
import { timeAgo } from '@/lib/time';
import { useFeedData } from '@/lib/useFeedData';
import { useNow } from '@/lib/useNow';
import { Page } from '@/components/shell/Page';
import { useShop } from '@/components/shell/ShopProvider';
import { OrderDetail } from '@/components/orders/OrderDetail';
import { PageSkeleton } from '@/components/ui/PageSkeleton';
import { Alert } from '@/components/ui/Alert';
import { Sheet } from '@/components/ui/Sheet';
import type { FeedOrder } from '@/lib/types';

type OrderFilter = 'all' | 'active' | 'send' | 'unpaid' | 'done';

const FILTERS: Array<{ key: OrderFilter; label: string; test: (o: FeedOrder) => boolean }> = [
  { key: 'all', label: 'All', test: () => true },
  { key: 'active', label: 'Active', test: (o) => o.status === 'AWAITING_PAYMENT' || o.status === 'PAID' || o.status === 'DISPATCHED' },
  { key: 'send', label: 'To send', test: (o) => o.status === 'PAID' },
  { key: 'unpaid', label: 'Unpaid', test: (o) => o.status === 'AWAITING_PAYMENT' },
  { key: 'done', label: 'Completed', test: (o) => o.status === 'DELIVERED' },
];

function buyerName(o: FeedOrder): string {
  return o.delivery.name || o.buyer.name || 'Buyer';
}

function OrdersContent() {
  const router = useRouter();
  const params = useSearchParams();
  const { token, refresh: refreshShop } = useShop();
  const now = useNow(30_000);
  const { orders, handoffs, loading, error, pendingUpdates, applyPending, refresh, patchOrder } = useFeedData(token);
  const [filter, setFilter] = useState<OrderFilter>('all');

  // The drawer follows ?order=<id> (the search box and links point there), and the seller can also
  // open one by clicking. A new value in the URL wins; it is read during render rather than in an
  // effect so the drawer opens on the same pass.
  const paramId = params.get('order');
  const [lastParam, setLastParam] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  if (paramId !== lastParam) {
    setLastParam(paramId);
    if (paramId) setOpenId(paramId);
  }

  // The orders API only serves an open shop and answers 403 to anyone else. That's a seller who
  // hasn't finished setup — send them there rather than showing an error.
  const shopNotOpen = error instanceof ApiError && error.code === 'FORBIDDEN';
  useEffect(() => {
    if (shopNotOpen) router.replace('/welcome');
  }, [shopNotOpen, router]);

  const real = orders.filter((o) => o.status !== 'DRAFT');
  const test = FILTERS.find((f) => f.key === filter)!.test;
  const shown = real.filter(test);
  const open = real.find((o) => o._id === openId) ?? null;

  // The sidebar's "to send" badge counts orders, so it has to hear about a change made here.
  function handlePatched(order: FeedOrder) {
    patchOrder(order);
    void refreshShop();
  }

  function close() {
    setOpenId(null);
    if (paramId) router.replace('/orders');
  }

  return (
    <Page width="wide">
      <div className="stack">
        <h1>Orders</h1>

        {error != null && (
          <Alert variant="danger" action={<button className="btn btn--secondary btn--sm" onClick={() => refresh()}>Try again</button>}>
            {sellerMessage(error, 'Could not load your orders.')}
          </Alert>
        )}
        {pendingUpdates > 0 && (
          <button type="button" className="btn btn--secondary btn--block" onClick={applyPending}>
            {pendingUpdates} new update{pendingUpdates === 1 ? '' : 's'} — Show
          </button>
        )}
        {handoffs.length > 0 && (
          <Alert variant="info" action={<Link href="/home" className="btn btn--secondary btn--sm">Open Home</Link>}>
            {handoffs.length === 1 ? 'A buyer is waiting on you.' : `${handoffs.length} buyers are waiting on you.`}
          </Alert>
        )}

        <div className="pill-group" role="group" aria-label="Filter orders">
          {FILTERS.map((f) => (
            <button key={f.key} type="button" className="pill" aria-pressed={filter === f.key} onClick={() => setFilter(f.key)}>
              {f.label} <span className="pill-count">{real.filter(f.test).length}</span>
            </button>
          ))}
        </div>

        {loading && orders.length === 0 ? (
          <PageSkeleton />
        ) : shown.length === 0 ? (
          <div className="empty-state">
            <p className="empty-state-title">{real.length === 0 ? 'No orders yet.' : 'No orders here.'}</p>
            <p>{real.length === 0 ? 'When a buyer orders through your chat, it shows up here.' : 'Try another filter.'}</p>
          </div>
        ) : (
          <>
            <table className="table orders-table">
              <thead>
                <tr>
                  <th scope="col">Buyer</th>
                  <th scope="col">Item</th>
                  <th scope="col">Status</th>
                  <th scope="col" className="table-num">Total</th>
                  <th scope="col">Placed</th>
                </tr>
              </thead>
              <tbody>
                {shown.map((o) => (
                  <tr key={o._id} className="table-row" aria-selected={o._id === openId} onClick={() => setOpenId(o._id)}>
                    <td>
                      <button type="button" className="table-link" onClick={() => setOpenId(o._id)}>
                        {buyerName(o)}
                      </button>
                      <div className="text-xs text-muted">{o.delivery.area}</div>
                    </td>
                    <td>
                      {o.item.nameSnapshot}
                      <div className="text-xs text-muted">
                        {o.variant.color}, {o.variant.size} × {o.qty}
                      </div>
                    </td>
                    <td>
                      <span className={`badge badge--${ORDER_STATUS[o.status].tone}`}>{ORDER_STATUS[o.status].label}</span>
                    </td>
                    <td className="table-num tabular">{formatMoney(o.total, o.currency)}</td>
                    <td className="text-sm text-muted">{now != null ? timeAgo(o.createdAt, now) : ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <ul className="order-cards">
              {shown.map((o) => (
                <li key={o._id}>
                  <button type="button" className="order-card" onClick={() => setOpenId(o._id)}>
                    <span className="split">
                      <strong className="truncate">{o.item.nameSnapshot}</strong>
                      <span className="tabular">{formatMoney(o.total, o.currency)}</span>
                    </span>
                    <span className="split">
                      <span className="text-sm text-muted truncate">
                        {buyerName(o)} · {o.delivery.area}
                      </span>
                      <span className={`badge badge--${ORDER_STATUS[o.status].tone}`}>{ORDER_STATUS[o.status].label}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      <Sheet open={open != null} onClose={close} title="Order details" drawer>
        {open && token && <OrderDetail key={open._id} order={open} token={token} onPatched={handlePatched} />}
      </Sheet>
    </Page>
  );
}

export default function OrdersPage() {
  // useSearchParams needs a Suspense boundary so the page can still be prerendered.
  return (
    <Suspense fallback={<PageSkeleton />}>
      <OrdersContent />
    </Suspense>
  );
}

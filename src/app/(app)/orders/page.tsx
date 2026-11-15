'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ApiError } from '@/lib/apiClient';
import { formatMoney } from '@/lib/format';
import { ORDER_STATUS } from '@/lib/labels';
import { sellerMessage } from '@/lib/errorMessage';
import { timeAgoShort } from '@/lib/time';
import { useFeedData } from '@/lib/useFeedData';
import { useNow } from '@/lib/useNow';
import { useMediaQuery } from '@/lib/useMediaQuery';
import { Page } from '@/components/shell/Page';
import { PageHeader } from '@/components/shell/PageHeader';
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
  const { orders, loading, error, pendingUpdates, applyPending, refresh, patchOrder } = useFeedData(token);
  const [filter, setFilter] = useState<OrderFilter>('all');
  // Wide screens keep the selected order beside the list; narrower ones open it in a drawer.
  const isWide = useMediaQuery('(min-width: 1200px)');

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
  const selected = isWide ? (shown.find((o) => o._id === openId) ?? shown[0] ?? null) : null;

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
        <PageHeader title="Orders" subtitle="Everything buyers have ordered through your chats." />

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
        <div className="pill-group pill-group--scroll" role="group" aria-label="Filter orders">
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
          <div className="orders-layout">
            <div className="orders-main">
              <section className="order-list" aria-label="Orders">
                <div className="order-row order-row--head" aria-hidden="true">
                  <span />
                  <span>Item</span>
                  <span>Buyer</span>
                  <span>Status</span>
                  <span className="order-num">Amount</span>
                  <span className="order-num">When</span>
                </div>
                <ul className="order-rows">
                  {shown.map((o) => (
                    <li key={o._id}>
                      <button type="button" className="order-row" aria-current={o._id === (selected?._id ?? openId) ? 'true' : undefined} onClick={() => setOpenId(o._id)}>
                        <span className="tile tile--44" aria-hidden="true">
                          {o.item.imageUrlSnapshot ? (
                            // eslint-disable-next-line @next/next/no-img-element -- seller-uploaded R2 URL, not a local/optimizable asset
                            <img src={o.item.imageUrlSnapshot} alt="" />
                          ) : (
                            <svg viewBox="0 0 48 48" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M12 18h24l2.5 22h-29L12 18z" />
                              <path d="M18 18a6 6 0 0 1 12 0" />
                            </svg>
                          )}
                        </span>
                        <span className="order-main">
                          <span className="truncate order-name">{o.item.nameSnapshot}</span>
                          <span className="truncate order-sub">
                            {o.variant.color}, {o.variant.size} × {o.qty}
                          </span>
                        </span>
                        <span className="order-buyer truncate">
                          {buyerName(o)} · {o.delivery.area}
                        </span>
                        <span className="order-status">
                          <span className={`badge badge--${ORDER_STATUS[o.status].tone}`}>{ORDER_STATUS[o.status].chip}</span>
                        </span>
                        <span className="order-num order-total tabular">{formatMoney(o.total, o.currency)}</span>
                        <span className="order-num order-when">{now != null ? timeAgoShort(o.createdAt, now) : ''}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </section>

              <ul className="order-cards">
                {shown.map((o) => (
                  <li key={o._id}>
                    <button type="button" className="order-card" onClick={() => setOpenId(o._id)}>
                      <span className="tile tile--48" aria-hidden="true">
                        {o.item.imageUrlSnapshot ? (
                          // eslint-disable-next-line @next/next/no-img-element -- seller-uploaded R2 URL, not a local/optimizable asset
                          <img src={o.item.imageUrlSnapshot} alt="" />
                        ) : (
                          <svg viewBox="0 0 48 48" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 18h24l2.5 22h-29L12 18z" />
                            <path d="M18 18a6 6 0 0 1 12 0" />
                          </svg>
                        )}
                      </span>
                      <span className="order-main">
                        <span className="truncate order-name">{o.item.nameSnapshot}</span>
                        <span className="truncate order-sub">
                          {buyerName(o)} · {o.delivery.area} · {formatMoney(o.total, o.currency)}
                        </span>
                      </span>
                      <span className="queue-row-side">
                        <span className={`badge badge--${ORDER_STATUS[o.status].tone}`}>{ORDER_STATUS[o.status].chip}</span>
                        <span className="queue-row-time tabular">{now != null ? timeAgoShort(o.createdAt, now) : ''}</span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {isWide && selected && token && (
              <aside className="card orders-aside" aria-label="Order details">
                <OrderDetail key={selected._id} order={selected} token={token} onPatched={handlePatched} />
              </aside>
            )}
          </div>
        )}
      </div>

      <Sheet open={!isWide && open != null} onClose={close} title="Order details" drawer>
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

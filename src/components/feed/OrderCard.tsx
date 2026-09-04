'use client';

import { useState } from 'react';
import { dispatchOrder, deliverOrder, markSoldOut } from '@/lib/apiClient';
import { formatMoney, mapsHref, telHref } from '@/lib/format';
import { sellerMessage } from '@/lib/errorMessage';
import { ORDER_STATUS, STOCK_LOST_ALERT } from '@/lib/labels';
import { timeAgo } from '@/lib/time';
import { useNow } from '@/lib/useNow';
import { useConfirm } from '@/components/ui/ConfirmProvider';
import { useToast } from '@/components/ui/ToastProvider';
import { Alert } from '@/components/ui/Alert';
import type { FeedOrder } from '@/lib/types';

export function OrderCard({ order, token, onPatched, emphasis = false }: { order: FeedOrder; token: string; onPatched: (order: FeedOrder) => void; emphasis?: boolean }) {
  const now = useNow();
  const confirm = useConfirm();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [breakdownOpen, setBreakdownOpen] = useState(false);

  const statusInfo = ORDER_STATUS[order.status];

  async function run(action: () => Promise<{ order: FeedOrder }>) {
    setBusy(true);
    setActionError(null);
    try {
      const res = await action();
      onPatched(res.order);
    } catch (err) {
      setActionError(sellerMessage(err, 'Could not update that order.'));
    } finally {
      setBusy(false);
    }
  }

  async function handleDispatch() {
    const ok = await confirm({ title: 'Mark this as sent?', body: 'Only do this once the item is on its way to the buyer.', confirmLabel: "Yes, it's sent" });
    if (!ok) return;
    await run(() => dispatchOrder(token, order._id));
  }

  async function handleDeliver() {
    const ok = await confirm({ title: 'Mark this as delivered?', body: 'This closes the order.', confirmLabel: 'Yes, delivered' });
    if (!ok) return;
    await run(() => deliverOrder(token, order._id));
  }

  async function handleHideSize() {
    const label = `${order.variant.color} · ${order.variant.size}`;
    const ok = await confirm({
      title: 'Hide this size from buyers?',
      body: `"${label}" will show as sold out across your whole catalog. This order stays open — talk to the buyer about it.`,
      confirmLabel: 'Hide it',
      tone: 'danger',
    });
    if (!ok) return;
    setBusy(true);
    setActionError(null);
    try {
      await markSoldOut(token, order._id);
      toast({ tone: 'success', text: `"${label}" is now sold out.` });
    } catch (err) {
      setActionError(sellerMessage(err, 'Could not hide that size.'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={`card${emphasis ? ' card--accent' : ''}`}>
      <div className="stack stack--sm">
        {emphasis && <span className="badge badge--accent">Do this next</span>}
        <div className="split">
          <div className="cluster">
            {order.item.imageUrlSnapshot ? (
              // eslint-disable-next-line @next/next/no-img-element -- seller-uploaded R2 URL, not a local/optimizable asset
              <img src={order.item.imageUrlSnapshot} alt="" className="thumb" style={{ inlineSize: '3.5rem', blockSize: '3.5rem' }} />
            ) : (
              <div className="thumb" style={{ inlineSize: '3.5rem', blockSize: '3.5rem' }} />
            )}
            <div>
              <strong>{order.item.nameSnapshot}</strong>
              <p className="text-sm text-muted">
                {order.variant.color}, {order.variant.size} × {order.qty}
              </p>
            </div>
          </div>
          <span className={`badge badge--${statusInfo.tone}`}>{statusInfo.label}</span>
        </div>

        {order.fulfillmentRisk === 'STOCK_LOST' && <Alert variant="danger">{STOCK_LOST_ALERT}</Alert>}
        {emphasis && <p className="text-sm text-muted">{statusInfo.hint}</p>}

        <div className="split">
          <button type="button" className="btn btn--ghost btn--sm tabular" style={{ paddingInline: 0 }} onClick={() => setBreakdownOpen((o) => !o)}>
            {formatMoney(order.total, order.currency)}
          </button>
          {now != null && <span className="text-sm text-muted">{timeAgo(order.createdAt, now)}</span>}
        </div>
        {breakdownOpen && (
          <div className="text-sm text-muted stack stack--xs">
            <span>
              {order.qty} × {formatMoney(order.unitPrice, order.currency)} = {formatMoney(order.subtotal, order.currency)}
            </span>
            <span>Delivery {formatMoney(order.deliveryFee, order.currency)}</span>
            {order.payment.paidAt && now != null && <span>Paid {timeAgo(order.payment.paidAt, now)}</span>}
          </div>
        )}

        <div className="text-sm">
          <div>
            {order.delivery.name || order.buyer.name || 'Buyer'} ·{' '}
            <a href={telHref(order.delivery.phone || order.buyer.phone)}>{order.delivery.phone || order.buyer.phone}</a>
          </div>
          <div>
            <strong>{order.delivery.area}</strong>, {order.delivery.address} ·{' '}
            <a href={mapsHref(order.delivery.area, order.delivery.address)} target="_blank" rel="noreferrer">
              Open in Maps
            </a>
          </div>
          {order.delivery.notes && <div>Note: {order.delivery.notes}</div>}
        </div>

        {actionError && <Alert variant="danger" inline>{actionError}</Alert>}

        <div className="card-actions">
          {(order.status === 'AWAITING_PAYMENT' || order.status === 'PAID') && (
            <button type="button" className="btn btn--secondary btn--sm" disabled={busy} onClick={handleHideSize}>
              Hide this size
            </button>
          )}
          {order.status === 'PAID' && (
            <button type="button" className="btn btn--primary btn--sm" disabled={busy} onClick={handleDispatch}>
              Mark as sent
            </button>
          )}
          {order.status === 'DISPATCHED' && (
            <button type="button" className="btn btn--primary btn--sm" disabled={busy} onClick={handleDeliver}>
              Mark as delivered
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

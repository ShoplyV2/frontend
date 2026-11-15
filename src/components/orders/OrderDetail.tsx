'use client';

import { useState } from 'react';
import { dispatchOrder, deliverOrder, markSoldOut } from '@/lib/apiClient';
import { formatMoney, mapsHref, telHref } from '@/lib/format';
import { sellerMessage } from '@/lib/errorMessage';
import { ORDER_STATUS, STOCK_LOST_ALERT, paymentChannelLabel } from '@/lib/labels';
import { clockTime, dayLabel, timeAgo } from '@/lib/time';
import { useNow } from '@/lib/useNow';
import { useConfirm } from '@/components/ui/ConfirmProvider';
import { useToast } from '@/components/ui/ToastProvider';
import { Alert } from '@/components/ui/Alert';
import { ConversationView } from '@/components/home/ConversationView';
import type { FeedOrder } from '@/lib/types';

/** When the order reached `status`, from its history (the payment time is stored separately and is the more exact one). */
function reachedAt(order: FeedOrder, status: FeedOrder['status']): string | null {
  if (status === 'PAID' && order.payment.paidAt) return order.payment.paidAt;
  return order.statusHistory.find((h) => h.to === status)?.at ?? null;
}

function stamp(iso: string): string {
  return `${dayLabel(iso)}, ${clockTime(iso)}`;
}

const STEPS: Array<{ status: FeedOrder['status']; label: string }> = [
  { status: 'AWAITING_PAYMENT', label: 'Ordered' },
  { status: 'PAID', label: 'Paid' },
  { status: 'DISPATCHED', label: 'Sent' },
  { status: 'DELIVERED', label: 'Delivered' },
];

/**
 * Everything about one order, with the actions the seller can take on it. Used in the Orders drawer
 * and in Home's detail pane.
 */
export function OrderDetail({ order, token, onPatched }: { order: FeedOrder; token: string; onPatched: (order: FeedOrder) => void }) {
  const now = useNow();
  const confirm = useConfirm();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [chatOpen, setChatOpen] = useState(false);

  const statusInfo = ORDER_STATUS[order.status];
  const closed = order.status === 'CANCELLED' || order.status === 'EXPIRED';
  const phone = order.delivery.phone || order.buyer.phone;

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
    if (ok) await run(() => dispatchOrder(token, order._id));
  }

  async function handleDeliver() {
    const ok = await confirm({ title: 'Mark this as delivered?', body: 'This closes the order.', confirmLabel: 'Yes, delivered' });
    if (ok) await run(() => deliverOrder(token, order._id));
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
    <div className="stack">
      <div className="cluster order-head">
        {order.item.imageUrlSnapshot ? (
          // eslint-disable-next-line @next/next/no-img-element -- seller-uploaded R2 URL, not a local/optimizable asset
          <img src={order.item.imageUrlSnapshot} alt="" className="thumb thumb--lg" />
        ) : (
          <div className="thumb thumb--lg" />
        )}
        <div className="order-head-text">
          <h2>{order.item.nameSnapshot}</h2>
          <p className="text-sm text-muted">
            {order.variant.color}, {order.variant.size} × {order.qty}
          </p>
        </div>
        <span className={`badge badge--${statusInfo.tone}`}>{statusInfo.label}</span>
      </div>

      {order.fulfillmentRisk === 'STOCK_LOST' && <Alert variant="danger">{STOCK_LOST_ALERT}</Alert>}
      <p className="text-secondary">{statusInfo.hint}</p>

      {!closed && (
        <ol className="order-steps" aria-label="Order progress">
          {STEPS.map((step) => {
            const at = reachedAt(order, step.status);
            return (
              <li key={step.status} className="order-step" data-done={at ? 'true' : 'false'}>
                <span className="order-step-dot" aria-hidden="true" />
                <span className="order-step-label">{step.label}</span>
                <span className="text-xs text-muted">{at ? stamp(at) : ''}</span>
              </li>
            );
          })}
        </ol>
      )}

      <section className="section">
        <p className="section-title">Payment</p>
        <dl className="facts">
          <div>
            <dt>Total</dt>
            <dd className="tabular">{formatMoney(order.total, order.currency)}</dd>
          </div>
          <div>
            <dt>
              {order.qty} × {formatMoney(order.unitPrice, order.currency)}
            </dt>
            <dd className="tabular">{formatMoney(order.subtotal, order.currency)}</dd>
          </div>
          <div>
            <dt>Delivery</dt>
            <dd className="tabular">{formatMoney(order.deliveryFee, order.currency)}</dd>
          </div>
          {order.payment.paidAt ? (
            <div>
              <dt>Paid by</dt>
              <dd>
                {paymentChannelLabel(order.payment.channel)}
                {now != null && <span className="text-muted"> · {timeAgo(order.payment.paidAt, now)}</span>}
              </dd>
            </div>
          ) : (
            <div>
              <dt>Paid by</dt>
              <dd className="text-muted">Not paid yet</dd>
            </div>
          )}
        </dl>
      </section>

      <section className="section">
        <p className="section-title">Buyer and delivery</p>
        <dl className="facts">
          <div>
            <dt>Buyer</dt>
            <dd>
              {order.delivery.name || order.buyer.name || 'Buyer'} · <a href={telHref(phone)}>{phone}</a>
            </dd>
          </div>
          <div>
            <dt>Deliver to</dt>
            <dd>
              <strong>{order.delivery.area}</strong>, {order.delivery.address} ·{' '}
              <a href={mapsHref(order.delivery.area, order.delivery.address)} target="_blank" rel="noreferrer">
                Open in Maps
              </a>
            </dd>
          </div>
          {order.delivery.notes && (
            <div>
              <dt>Note</dt>
              <dd>{order.delivery.notes}</dd>
            </div>
          )}
        </dl>
      </section>

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

      <section className="section">
        <button type="button" className="btn btn--ghost btn--sm self-start" aria-expanded={chatOpen} onClick={() => setChatOpen((o) => !o)}>
          {chatOpen ? 'Hide chat with this buyer' : 'Show chat with this buyer'}
        </button>
        {chatOpen && (
          <div className="card">
            <ConversationView token={token} conversationId={order.conversationId} version={order.status} />
          </div>
        )}
      </section>
    </div>
  );
}

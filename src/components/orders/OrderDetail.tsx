'use client';

import { useState } from 'react';
import { dispatchOrder, deliverOrder, markSoldOut } from '@/lib/apiClient';
import { formatMoney, mapsHref, telHref } from '@/lib/format';
import { sellerMessage } from '@/lib/errorMessage';
import { ORDER_STATUS, STOCK_LOST_ALERT, paymentChannelLabel } from '@/lib/labels';
import { clockTime, dayLabel } from '@/lib/time';
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

  const photo = order.item.imageUrlSnapshot;
  const pin = order.delivery.location ?? null;

  return (
    <div className="stack stack--panel">
      <div className="order-head">
        <span className="tile tile--52" aria-hidden="true">
          {photo ? (
            // eslint-disable-next-line @next/next/no-img-element -- seller-uploaded R2 URL, not a local/optimizable asset
            <img src={photo} alt="" />
          ) : (
            <svg viewBox="0 0 48 48" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 18h24l2.5 22h-29L12 18z" />
              <path d="M18 18a6 6 0 0 1 12 0" />
            </svg>
          )}
        </span>
        <div className="order-head-text">
          <h2>{order.item.nameSnapshot}</h2>
          <p className="text-sm text-muted">
            {order.variant.color}, {order.variant.size} × {order.qty}
          </p>
        </div>
        <div className="order-head-side">
          <p className="order-amount tabular">{formatMoney(order.total, order.currency)}</p>
          <span className={`badge badge--${statusInfo.tone}`}>{statusInfo.label}</span>
        </div>
      </div>

      {order.fulfillmentRisk === 'STOCK_LOST' && <Alert variant="danger">{STOCK_LOST_ALERT}</Alert>}
      {order.status === 'AWAITING_PAYMENT' && <p className="note note--warning">{statusInfo.hint}</p>}

      <div className="order-boxes">
        <div className="order-box">
          <p className="label">Buyer</p>
          <p className="order-box-main">{order.delivery.name || order.buyer.name || 'Buyer'}</p>
          <a href={telHref(phone)} className="order-box-link">
            {phone}
          </a>
        </div>
        <div className="order-box">
          <p className="label">Deliver to</p>
          <p className="order-box-main">{order.delivery.area || pin?.name || (pin ? 'Shared location' : 'Not given')}</p>
          <a href={mapsHref(order.delivery.area, order.delivery.address, pin)} target="_blank" rel="noreferrer" className="order-box-link">
            {[order.delivery.address || pin?.address, 'Open in Maps'].filter(Boolean).join(' · ')}
          </a>
        </div>
      </div>
      {order.delivery.notes && (
        <div className="order-box">
          <p className="label">Note from the buyer</p>
          <p className="order-box-main">{order.delivery.notes}</p>
        </div>
      )}

      <dl className="facts">
        {order.deliveryFee > 0 && (
          <div>
            <dt>Delivery</dt>
            <dd className="tabular">{formatMoney(order.deliveryFee, order.currency)}</dd>
          </div>
        )}
        <div>
          <dt>Payment</dt>
          <dd>
            {order.payment.paidAt ? `${paymentChannelLabel(order.payment.channel)} · ${clockTime(order.payment.paidAt)}` : <span className="text-muted">Not paid yet</span>}
          </dd>
        </div>
      </dl>

      {!closed && (
        <div>
          <p className="label order-steps-label">Progress</p>
          <ol className="order-steps" aria-label="Order progress">
            {STEPS.map((step) => {
              const at = reachedAt(order, step.status);
              return (
                <li key={step.status} className="order-step" data-done={at ? 'true' : 'false'}>
                  <span className="order-step-dot" aria-hidden="true">
                    {at && (
                      <svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 12l5 5 9-10" />
                      </svg>
                    )}
                  </span>
                  <span>{step.label}</span>
                  <span className="order-step-time">{at ? stamp(at) : ''}</span>
                </li>
              );
            })}
          </ol>
        </div>
      )}

      {actionError && <Alert variant="danger" inline>{actionError}</Alert>}

      <div className="order-actions">
        {order.status === 'PAID' && (
          <button type="button" className="btn btn--primary btn--block" disabled={busy} onClick={handleDispatch}>
            Mark as sent
          </button>
        )}
        {order.status === 'DISPATCHED' && (
          <button type="button" className="btn btn--primary btn--block" disabled={busy} onClick={handleDeliver}>
            Mark as delivered
          </button>
        )}
        <button type="button" className="btn btn--secondary btn--block" aria-expanded={chatOpen} onClick={() => setChatOpen((o) => !o)}>
          {chatOpen ? 'Hide chat with this buyer' : 'Show chat with this buyer'}
        </button>
        {(order.status === 'AWAITING_PAYMENT' || order.status === 'PAID') && (
          <button type="button" className="btn btn--quiet" disabled={busy} onClick={handleHideSize}>
            Hide this size
          </button>
        )}
      </div>

      {chatOpen && <ConversationView token={token} conversationId={order.conversationId} version={order.status} />}
    </div>
  );
}

'use client';

import { useState } from 'react';
import { dispatchOrder, deliverOrder, markSoldOut } from '@/lib/apiClient';
import { formatMoney } from '@/lib/format';
import type { FeedOrder } from '@/lib/types';

function statusPillClass(status: FeedOrder['status']): string {
  if (status === 'CANCELLED' || status === 'EXPIRED') return 'pill pill-danger';
  if (status === 'AWAITING_PAYMENT') return 'pill pill-warning';
  return 'pill';
}

export function OrderRow({ order, token, onAction, hero = false }: { order: FeedOrder; token: string; onAction: () => void; hero?: boolean }) {
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  async function run(action: () => Promise<unknown>) {
    setBusy(true);
    setActionError(null);
    try {
      await action();
      onAction();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card" style={hero ? { borderColor: 'var(--accent)', borderWidth: 2 } : undefined}>
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <strong>
          {order.item.nameSnapshot} — {order.variant.color}, {order.variant.size} × {order.qty}
        </strong>
        <span className={statusPillClass(order.status)}>{order.status}</span>
      </div>
      {order.fulfillmentRisk === 'STOCK_LOST' && <p className="pill pill-danger">Stock lost — paid but not fulfillable</p>}
      <p>{formatMoney(order.total, order.currency)}</p>
      <p>
        {order.buyer.name ?? 'Buyer'} · {order.buyer.phone}
      </p>
      <p>
        {order.delivery.area}, {order.delivery.address}
      </p>
      {order.delivery.notes && <p>Note: {order.delivery.notes}</p>}
      {actionError && <p className="pill pill-danger">{actionError}</p>}
      <div className="row" style={{ marginTop: '0.5rem' }}>
        {(order.status === 'AWAITING_PAYMENT' || order.status === 'PAID') && (
          <button className="secondary" disabled={busy} onClick={() => run(() => markSoldOut(token, order._id))}>
            Mark sold out
          </button>
        )}
        {order.status === 'PAID' && (
          <button disabled={busy} onClick={() => run(() => dispatchOrder(token, order._id))}>
            Mark dispatched
          </button>
        )}
        {order.status === 'DISPATCHED' && (
          <button disabled={busy} onClick={() => run(() => deliverOrder(token, order._id))}>
            Mark delivered
          </button>
        )}
      </div>
    </div>
  );
}

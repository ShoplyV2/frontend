'use client';

import { OrderRow } from './OrderRow';
import type { FeedOrder } from '@/lib/types';

export function OrderList({ orders, token, onAction }: { orders: FeedOrder[]; token: string; onAction: () => void }) {
  if (orders.length === 0) return null;

  return (
    <section>
      <h2 style={{ margin: '1rem 0 0.5rem' }}>Recent orders</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {orders.map((order) => (
          <OrderRow key={order._id} order={order} token={token} onAction={onAction} />
        ))}
      </div>
    </section>
  );
}

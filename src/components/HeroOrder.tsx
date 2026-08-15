'use client';

import { OrderRow } from './OrderRow';
import type { FeedOrder } from '@/lib/types';

export function HeroOrder({ order, token, onAction }: { order: FeedOrder; token: string; onAction: () => void }) {
  return (
    <section>
      <h2 style={{ marginBottom: '0.5rem' }}>Latest order</h2>
      <OrderRow order={order} token={token} onAction={onAction} hero />
    </section>
  );
}

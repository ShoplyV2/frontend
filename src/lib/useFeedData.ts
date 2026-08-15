'use client';

import { useCallback, useEffect, useState } from 'react';
import { DEFAULT_BASE_URL, getHandoffs, getOrders } from './apiClient';
import type { FeedHandoff, FeedOrder } from './types';

export function useFeedData(token: string | null) {
  const [orders, setOrders] = useState<FeedOrder[]>([]);
  const [handoffs, setHandoffs] = useState<FeedHandoff[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [ordersRes, handoffsRes] = await Promise.all([getOrders(token), getHandoffs(token)]);
      setOrders(ordersRes.orders);
      setHandoffs(handoffsRes.handoffs);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load feed data');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!token) return;
    function load() {
      refresh();
    }
    load();
  }, [token, refresh]);

  useEffect(() => {
    if (!token) return;
    const source = new EventSource(`${DEFAULT_BASE_URL}/feed/sse?token=${encodeURIComponent(token)}`);
    source.addEventListener('order', () => refresh());
    source.addEventListener('handoff', () => refresh());
    return () => source.close();
  }, [token, refresh]);

  return { orders, handoffs, loading, error, refresh };
}

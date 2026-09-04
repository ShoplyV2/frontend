'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { DEFAULT_BASE_URL, getHandoffs, getOrders } from './apiClient';
import type { FeedHandoff, FeedOrder } from './types';

interface FeedSnapshot {
  orders: FeedOrder[];
  handoffs: FeedHandoff[];
}

export function useFeedData(token: string | null) {
  const [orders, setOrders] = useState<FeedOrder[]>([]);
  const [handoffs, setHandoffs] = useState<FeedHandoff[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  // The raw error, not a pre-extracted message — sellerMessage() needs the ApiError's `code`.
  const [error, setError] = useState<unknown>(null);
  const [pendingUpdates, setPendingUpdates] = useState(0);
  const pendingSnapshot = useRef<FeedSnapshot | null>(null);

  const applyPending = useCallback(() => {
    const snapshot = pendingSnapshot.current;
    if (!snapshot) return;
    setOrders(snapshot.orders);
    setHandoffs(snapshot.handoffs);
    pendingSnapshot.current = null;
    setPendingUpdates(0);
  }, []);

  // A refetch triggered by an SSE event applies immediately only when it's safe to move cards
  // under the seller's finger — no reply textarea focused and no confirm dialog open. Otherwise
  // the new data is staged and a "N new updates" pill offers to apply it.
  function safeToApplyNow(): boolean {
    if (document.querySelector('dialog[open]')) return false;
    const active = document.activeElement;
    if (active && (active.tagName === 'TEXTAREA' || active.tagName === 'INPUT')) return false;
    return true;
  }

  const load = useCallback(
    async (isBackgroundRefresh: boolean) => {
      if (!token) return;
      if (isBackgroundRefresh) setRefreshing(true);
      else setLoading(true);
      try {
        const [ordersRes, handoffsRes] = await Promise.all([getOrders(token), getHandoffs(token)]);
        const snapshot: FeedSnapshot = { orders: ordersRes.orders, handoffs: handoffsRes.handoffs };
        if (isBackgroundRefresh && !safeToApplyNow()) {
          pendingSnapshot.current = snapshot;
          setPendingUpdates((n) => n + 1);
        } else {
          setOrders(snapshot.orders);
          setHandoffs(snapshot.handoffs);
        }
        setError(null);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [token],
  );

  const refresh = useCallback(() => load(false), [load]);

  useEffect(() => {
    if (!token) return;
    function initial() {
      load(false);
    }
    initial();
  }, [token, load]);

  useEffect(() => {
    if (!token) return;
    const source = new EventSource(`${DEFAULT_BASE_URL}/feed/sse?token=${encodeURIComponent(token)}`);
    const onEvent = () => load(true);
    source.addEventListener('order', onEvent);
    source.addEventListener('handoff', onEvent);
    return () => source.close();
  }, [token, load]);

  // Lets a mutation's own response patch one order in place instead of a full list refetch.
  const patchOrder = useCallback((order: FeedOrder) => {
    setOrders((current) => current.map((o) => (o._id === order._id ? order : o)));
  }, []);

  return { orders, handoffs, loading, refreshing, error, pendingUpdates, applyPending, refresh, patchOrder };
}

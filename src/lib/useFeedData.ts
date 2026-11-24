'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { DEFAULT_BASE_URL, getHandoffs, getOrders } from './apiClient';
import type { FeedHandoff, FeedOrder } from './types';

// Enough recent orders for Home's day totals and the Orders list, without paging.
const FEED_ORDER_LIMIT = 200;

// Safety net for anything the live stream misses (a dropped connection, a laptop that slept).
const POLL_MS = 60_000;
const RECONNECT_BASE_MS = 1_000;
const RECONNECT_MAX_MS = 30_000;

interface FeedSnapshot {
  orders: FeedOrder[];
  handoffs: FeedHandoff[];
}

// A refetch triggered by a live event applies immediately only when it's safe to move cards
// under the seller's finger — no reply textarea focused and no confirm dialog open. Otherwise
// the new data is staged and a "N new updates" pill offers to apply it.
function safeToApplyNow(): boolean {
  if (document.querySelector('dialog[open]')) return false;
  const active = document.activeElement;
  if (active && (active.tagName === 'TEXTAREA' || active.tagName === 'INPUT')) return false;
  return true;
}

/**
 * The seller's orders and assistant questions, kept live.
 *
 * Live updates come from a server-sent-events stream that only says "something changed"; each
 * event triggers a refetch. The stream is not trusted to stay up on its own:
 * - A browser EventSource reconnects by itself after a dropped connection, but NOT after an HTTP
 *   error (too many tabs open, a restart returning 502). That case is reconnected here with backoff.
 * - Every reconnect refetches once, since events sent while it was down are gone.
 * - The feed also refetches when the tab becomes visible or the network returns, and once a minute
 *   while visible, so a single missed event repairs itself.
 *
 * Use it through FeedProvider so the whole signed-in app shares one stream and one copy of the data.
 */
export function useFeedData(token: string | null) {
  const [orders, setOrders] = useState<FeedOrder[]>([]);
  const [handoffs, setHandoffs] = useState<FeedHandoff[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  // The raw error, not a pre-extracted message — sellerMessage() needs the ApiError's `code`.
  const [error, setError] = useState<unknown>(null);
  const [pendingUpdates, setPendingUpdates] = useState(0);
  const pendingSnapshot = useRef<FeedSnapshot | null>(null);
  // Only the newest request's answer is used, so a slow older response can't overwrite a newer one.
  const requestSeq = useRef(0);
  const loadedOnce = useRef(false);

  const applyPending = useCallback(() => {
    const snapshot = pendingSnapshot.current;
    if (!snapshot) return;
    setOrders(snapshot.orders);
    setHandoffs(snapshot.handoffs);
    pendingSnapshot.current = null;
    setPendingUpdates(0);
  }, []);

  const load = useCallback(
    async (isBackgroundRefresh: boolean) => {
      if (!token) return;
      const mine = ++requestSeq.current;
      // Until the first load has landed the seller sees a skeleton, not stale content, so there is
      // nothing to protect from moving: apply directly even if the trigger was a live event.
      const background = isBackgroundRefresh && loadedOnce.current;
      if (background) setRefreshing(true);
      else setLoading(true);
      try {
        const [ordersRes, handoffsRes] = await Promise.all([getOrders(token, undefined, FEED_ORDER_LIMIT), getHandoffs(token)]);
        if (mine !== requestSeq.current) return; // a newer request has started; its answer wins
        const snapshot: FeedSnapshot = { orders: ordersRes.orders, handoffs: handoffsRes.handoffs };
        if (background && !safeToApplyNow()) {
          pendingSnapshot.current = snapshot;
          setPendingUpdates((n) => n + 1);
        } else {
          pendingSnapshot.current = null;
          setPendingUpdates(0);
          setOrders(snapshot.orders);
          setHandoffs(snapshot.handoffs);
        }
        loadedOnce.current = true;
        setError(null);
      } catch (err) {
        if (mine !== requestSeq.current) return;
        setError(err);
      } finally {
        if (mine === requestSeq.current) {
          setLoading(false);
          setRefreshing(false);
        }
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

  // The live stream, with reconnects.
  useEffect(() => {
    if (!token) return;
    let source: EventSource | null = null;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    let failures = 0;
    let droppedSinceLastOpen = false;
    let stopped = false;

    const onEvent = () => load(true);

    function connect() {
      if (stopped) return;
      const next = new EventSource(`${DEFAULT_BASE_URL}/feed/sse?token=${encodeURIComponent(token ?? '')}`);
      source = next;
      next.addEventListener('order', onEvent);
      next.addEventListener('handoff', onEvent);
      // Sent after a gap in the live stream (the server lost its place): anything could have changed.
      next.addEventListener('resync', onEvent);
      next.onopen = () => {
        // Events sent while we were disconnected are gone — catch up once.
        if (droppedSinceLastOpen) load(true);
        droppedSinceLastOpen = false;
        failures = 0;
      };
      next.onerror = () => {
        droppedSinceLastOpen = true;
        // CONNECTING means the browser is already retrying a dropped connection. CLOSED means it
        // gave up (an HTTP error such as 429 or 502), so retry ourselves.
        if (next.readyState !== EventSource.CLOSED || stopped) return;
        next.close();
        const delay = Math.min(RECONNECT_MAX_MS, RECONNECT_BASE_MS * 2 ** failures);
        failures += 1;
        retryTimer = setTimeout(connect, delay);
      };
    }

    connect();
    return () => {
      stopped = true;
      if (retryTimer) clearTimeout(retryTimer);
      source?.close();
    };
  }, [token, load]);

  // Safety net: refetch when the tab comes back, the network returns, and once a minute while visible.
  useEffect(() => {
    if (!token) return;
    function refetchIfVisible() {
      if (document.visibilityState === 'visible') load(true);
    }
    document.addEventListener('visibilitychange', refetchIfVisible);
    window.addEventListener('online', refetchIfVisible);
    const timer = setInterval(refetchIfVisible, POLL_MS);
    return () => {
      document.removeEventListener('visibilitychange', refetchIfVisible);
      window.removeEventListener('online', refetchIfVisible);
      clearInterval(timer);
    };
  }, [token, load]);

  // Staged updates apply on their own once the seller leaves the field they were typing in, so the
  // "new updates" pill can't sit there looking stuck.
  useEffect(() => {
    function applyIfSettled() {
      // focusout fires before the next element takes focus; look again once it has.
      setTimeout(() => {
        if (pendingSnapshot.current && safeToApplyNow()) applyPending();
      }, 0);
    }
    document.addEventListener('focusout', applyIfSettled);
    return () => document.removeEventListener('focusout', applyIfSettled);
  }, [applyPending]);

  // Lets a mutation's own response patch one order in place instead of a full list refetch.
  const patchOrder = useCallback((order: FeedOrder) => {
    setOrders((current) => current.map((o) => (o._id === order._id ? order : o)));
  }, []);

  return { orders, handoffs, loading, refreshing, error, pendingUpdates, applyPending, refresh, patchOrder };
}

export type FeedData = ReturnType<typeof useFeedData>;

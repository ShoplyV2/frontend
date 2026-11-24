'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { ApiError, getMe, getOrders, listChannels } from '@/lib/apiClient';
import type { ChannelSummary, FeedOrder, SellerProfile } from '@/lib/types';

const REFRESH_MS = 60_000;
const ORDER_LIMIT = 200;

interface ShopValue {
  token: string;
  setToken: (token: string | null) => void;
  profile: SellerProfile | null;
  channels: ChannelSummary[];
  /** Recent orders, newest first — what the sidebar badge and the search read. */
  orders: FeedOrder[];
  refresh: () => Promise<void>;
}

const ShopContext = createContext<ShopValue | null>(null);

export function useShop(): ShopValue {
  const value = useContext(ShopContext);
  if (!value) throw new Error('useShop must be used inside the signed-in app (the (app) layout).');
  return value;
}

/**
 * Loads the few things every signed-in screen wants — the shop's profile, its chat apps and its
 * recent orders — once, and keeps them fresh. It lives in the (app) layout, which stays mounted as
 * the seller moves between pages, so navigating doesn't refetch the shop name or flash the sidebar.
 *
 * Refreshes when the tab becomes visible again and once a minute while it is. Pages that change
 * something the shell shows (renaming the shop, say) call `refresh()`.
 */
export function ShopProvider({ token, setToken, children }: { token: string; setToken: (token: string | null) => void; children: ReactNode }) {
  const [profile, setProfile] = useState<SellerProfile | null>(null);
  const [channels, setChannels] = useState<ChannelSummary[]>([]);
  const [orders, setOrders] = useState<FeedOrder[]>([]);

  const refresh = useCallback(async () => {
    try {
      const [me, channelRes, orderRes] = await Promise.all([
        getMe(token),
        listChannels(token),
        // A shop that isn't open yet has no orders API (403). That means "no orders", not a failure.
        getOrders(token, undefined, ORDER_LIMIT).catch((err: unknown) => {
          if (err instanceof ApiError && err.code === 'FORBIDDEN') return { orders: [] as FeedOrder[] };
          throw err;
        }),
      ]);
      setProfile(me);
      setChannels(channelRes.channels);
      setOrders(orderRes.orders);
    } catch {
      // The shell is a convenience view, so keep what we have. A dead session is handled globally
      // (apiClient announces a 401 and useFeedToken signs the seller out).
    }
  }, [token]);

  useEffect(() => {
    function load() {
      void refresh();
    }
    load();
  }, [refresh]);

  useEffect(() => {
    function refreshIfVisible() {
      if (document.visibilityState === 'visible') void refresh();
    }
    document.addEventListener('visibilitychange', refreshIfVisible);
    const timer = setInterval(refreshIfVisible, REFRESH_MS);
    return () => {
      document.removeEventListener('visibilitychange', refreshIfVisible);
      clearInterval(timer);
    };
  }, [refresh]);

  const value = useMemo<ShopValue>(
    () => ({ token, setToken, profile, channels, orders, refresh }),
    [token, setToken, profile, channels, orders, refresh],
  );

  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>;
}

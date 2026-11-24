'use client';

import { createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import { useFeedData, type FeedData } from '@/lib/useFeedData';
import { useShop } from './ShopProvider';

const FeedContext = createContext<FeedData | null>(null);

export function useFeed(): FeedData {
  const value = useContext(FeedContext);
  if (!value) throw new Error('useFeed must be used inside the signed-in app (the (app) layout).');
  return value;
}

/**
 * One live feed of orders and assistant questions for the whole signed-in app. It lives in the
 * (app) layout, next to ShopProvider, so there is a single stream and a single copy of the data:
 * moving between Home and Orders no longer drops the connection and refetches, and an order that
 * arrives while the seller is on any page is already there when they switch.
 *
 * The orders API only serves an open shop (it answers 403 to anyone else, and so does the stream),
 * so nothing is requested until the shop's profile says it is open.
 */
export function FeedProvider({ children }: { children: ReactNode }) {
  const { token, profile } = useShop();
  const feed = useFeedData(profile?.status === 'LIVE' ? token : null);
  return <FeedContext.Provider value={feed}>{children}</FeedContext.Provider>;
}

'use client';

import { useCallback, useEffect, useState } from 'react';
import { SESSION_EXPIRED_EVENT } from './apiClient';
import { announceShopName } from './useShopName';

const STORAGE_KEY = 'shoply_feed_token';

export function useFeedToken() {
  const [token, setTokenState] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    function hydrate() {
      setTokenState(localStorage.getItem(STORAGE_KEY));
      setHydrated(true);
    }
    hydrate();
  }, []);

  // apiClient announces a 401 on a seller route; clear the token so the page falls back to login.
  useEffect(() => {
    function onExpired() {
      localStorage.removeItem(STORAGE_KEY);
      announceShopName(null);
      setTokenState(null);
    }
    window.addEventListener(SESSION_EXPIRED_EVENT, onExpired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, onExpired);
  }, []);

  const setToken = useCallback((next: string | null) => {
    if (next) {
      localStorage.setItem(STORAGE_KEY, next);
    } else {
      localStorage.removeItem(STORAGE_KEY);
      // Another shop may sign in next in this tab; don't flash this one's name at them.
      announceShopName(null);
    }
    setTokenState(next);
  }, []);

  return { token, setToken, hydrated };
}

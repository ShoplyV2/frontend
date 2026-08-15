'use client';

import { useCallback, useEffect, useState } from 'react';

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

  const setToken = useCallback((next: string | null) => {
    if (next) {
      localStorage.setItem(STORAGE_KEY, next);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
    setTokenState(next);
  }, []);

  return { token, setToken, hydrated };
}

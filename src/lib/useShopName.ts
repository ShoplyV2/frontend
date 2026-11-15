'use client';

import { useEffect, useState } from 'react';
import { getMe } from './apiClient';

const CACHE_KEY = 'shoply_shop_name';
const CHANGED_EVENT = 'shoply:shop-name-changed';

/** Call after the name is saved (or on sign-out, with null) so the top bar and sidebar update at once. */
export function announceShopName(name: string | null): void {
  try {
    if (name) sessionStorage.setItem(CACHE_KEY, name);
    else sessionStorage.removeItem(CACHE_KEY);
  } catch {
    // sessionStorage can be unavailable (private mode); the event below still updates open pages.
  }
  window.dispatchEvent(new CustomEvent<string | null>(CHANGED_EVENT, { detail: name }));
}

/**
 * The shop's name for the app shell (top bar and sidebar), so every page can show it without each
 * one loading the profile. Remembered for the tab's lifetime so moving between pages doesn't flash
 * a blank name; a failure just leaves it blank, because the name is decoration, not data.
 */
export function useShopName(token: string): string | undefined {
  const [name, setName] = useState<string | undefined>(undefined);

  useEffect(() => {
    function load() {
      try {
        const cached = sessionStorage.getItem(CACHE_KEY);
        if (cached) setName(cached);
      } catch {
        // sessionStorage can be unavailable (private mode); fall through to the fetch.
      }
      getMe(token)
        .then((profile) => {
          setName(profile.shopName);
          try {
            sessionStorage.setItem(CACHE_KEY, profile.shopName);
          } catch {
            // see above
          }
        })
        .catch(() => undefined);
    }
    load();
  }, [token]);

  useEffect(() => {
    function onChanged(event: Event) {
      setName((event as CustomEvent<string | null>).detail ?? undefined);
    }
    window.addEventListener(CHANGED_EVENT, onChanged);
    return () => window.removeEventListener(CHANGED_EVENT, onChanged);
  }, []);

  return name;
}

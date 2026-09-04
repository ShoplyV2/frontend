'use client';

import { useEffect, useState } from 'react';

/** Tracks browser connectivity. Starts `true` (assume online) to avoid a false offline flash
 * before hydration — `navigator` isn't available during SSR anyway. */
export function useOnline(): boolean {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    function sync() {
      setOnline(navigator.onLine);
    }
    sync();
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  return online;
}

'use client';

import { useEffect, useState } from 'react';

/**
 * Returns `null` on first render, then the current time ticking every `intervalMs`.
 * The null-first tick is NOT optional: every page in this app is 'use client' but still
 * prerendered, so a server-rendered "3 min ago" would mismatch the client's on hydration.
 * Callers render a neutral placeholder until the first tick lands.
 */
export function useNow(intervalMs = 30_000): number | null {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    function tick() {
      setNow(Date.now());
    }
    tick();
    const id = setInterval(tick, intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);

  return now;
}

'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { ApiError, getAdminOverview } from '@/lib/apiClient';
import type { AdminOverview } from '@/lib/types';

const POLL_MS = 60_000;

interface AdminContextValue {
  token: string;
  /** The overview for this month. Null until the first load. The sidebar's counts and the Overview page both read it. */
  overview: AdminOverview | null;
  overviewError: unknown;
  refreshOverview: () => Promise<void>;
  signOut: () => void;
}

const AdminContext = createContext<AdminContextValue | null>(null);

export function useAdmin(): AdminContextValue {
  const value = useContext(AdminContext);
  if (!value) throw new Error('useAdmin must be used inside <AdminProvider>');
  return value;
}

/**
 * What every admin page shares: the session token, the sign-out, and the overview, polled once a
 * minute so the sidebar's "Needs you" counts stay fresh. An expired or replaced admin session (each
 * login replaces the previous one) signs out here, once, for every page.
 */
export function AdminProvider({ token, setToken, children }: { token: string; setToken: (token: string | null) => void; children: ReactNode }) {
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [overviewError, setOverviewError] = useState<unknown>(null);

  const refreshOverview = useCallback(async () => {
    try {
      setOverview(await getAdminOverview(token));
      setOverviewError(null);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setToken(null);
        return;
      }
      setOverviewError(err);
    }
  }, [token, setToken]);

  useEffect(() => {
    function load() {
      void refreshOverview();
    }
    load();
    const timer = setInterval(load, POLL_MS);
    return () => clearInterval(timer);
  }, [refreshOverview]);

  const value = useMemo<AdminContextValue>(
    () => ({ token, overview, overviewError, refreshOverview, signOut: () => setToken(null) }),
    [token, overview, overviewError, refreshOverview, setToken],
  );
  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
}

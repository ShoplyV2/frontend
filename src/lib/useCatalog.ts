'use client';

import { useCallback, useEffect, useState } from 'react';
import { listCatalogItems } from './apiClient';
import type { CatalogItem } from './types';

export function useCatalog(token: string | null) {
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  // The raw error, not a pre-extracted message — sellerMessage() needs the ApiError's `code` to
  // decide what's safe to show, which is lost if we stringify it here.
  const [error, setError] = useState<unknown>(null);

  const refresh = useCallback(async () => {
    if (!token) return;
    setRefreshing(true);
    try {
      const res = await listCatalogItems(token);
      setItems(res.items);
      setWarnings(res.warnings);
      setError(null);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => {
    function load() {
      refresh();
    }
    load();
  }, [refresh]);

  // replaceItem/patchItem let mutation call sites update the single affected item without a full
  // refetch — patchItem returns a rollback fn for optimistic updates.
  const replaceItem = useCallback((item: CatalogItem) => {
    setItems((current) => current.map((i) => (i.id === item.id ? item : i)));
  }, []);

  const patchItem = useCallback((id: string, fn: (item: CatalogItem) => CatalogItem) => {
    let previous: CatalogItem | undefined;
    setItems((current) =>
      current.map((item) => {
        if (item.id !== id) return item;
        previous = item;
        return fn(item);
      }),
    );
    return () => {
      if (!previous) return;
      const snapshot = previous;
      setItems((current) => current.map((item) => (item.id === id ? snapshot : item)));
    };
  }, []);

  return { items, warnings, loading, refreshing, error, refresh, replaceItem, patchItem };
}

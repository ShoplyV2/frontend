'use client';

import { useCallback, useEffect, useState } from 'react';
import { listCatalogItems } from './apiClient';
import type { CatalogItem } from './types';

export function useCatalog(token: string | null) {
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await listCatalogItems(token);
      setItems(res.items);
      setWarnings(res.warnings);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load your catalog');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    function load() {
      refresh();
    }
    load();
  }, [refresh]);

  return { items, warnings, loading, error, refresh };
}

'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ApiError, listAdminSellers } from '@/lib/apiClient';
import { sellerMessage } from '@/lib/errorMessage';
import { SELLER_STATUS } from '@/lib/labels';
import { useAdminToken } from '@/lib/useAdminToken';
import { useFeedToken } from '@/lib/useFeedToken';
import { CopyButton } from '@/components/ui/CopyButton';
import { Alert } from '@/components/ui/Alert';
import { PageSkeleton } from '@/components/ui/PageSkeleton';
import type { AdminSellerSummary } from '@/lib/types';

export default function AdminPage() {
  const router = useRouter();
  const { token: adminToken, setToken: setAdminToken, hydrated } = useAdminToken();
  const { setToken: setSellerToken } = useFeedToken();
  const [sellers, setSellers] = useState<AdminSellerSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  const refresh = useCallback(async () => {
    if (!adminToken) return;
    setLoading(true);
    try {
      const res = await listAdminSellers(adminToken);
      setSellers(res.sellers);
      setError(null);
    } catch (err) {
      // An expired or replaced admin session (every login replaces the previous one) — back to login.
      if (err instanceof ApiError && err.status === 401) {
        setAdminToken(null);
        return;
      }
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [adminToken, setAdminToken]);

  useEffect(() => {
    if (hydrated && !adminToken) router.replace('/admin/login');
  }, [hydrated, adminToken, router]);

  useEffect(() => {
    function load() {
      refresh();
    }
    load();
  }, [refresh]);

  function openAsSeller(seller: AdminSellerSummary) {
    setSellerToken(seller.feedToken);
    router.push('/catalog');
  }

  if (!hydrated || !adminToken) {
    return (
      <div className="page">
        <PageSkeleton />
      </div>
    );
  }

  return (
    <main className="page page--wide stack">
      <div className="split">
        <div className="cluster cluster--sm">
          <h1>Shops</h1>
          <span className="badge badge--warning">Team only</span>
        </div>
        <button type="button" className="btn btn--secondary" onClick={() => setAdminToken(null)}>
          Sign out
        </button>
      </div>
      <p className="text-secondary">Opening a shop signs this browser in as that shop.</p>

      {error != null && (
        <Alert variant="danger" action={<button className="btn btn--secondary btn--sm" onClick={() => refresh()}>Try again</button>}>
          {sellerMessage(error, 'Could not load sellers.')}
        </Alert>
      )}

      {loading && sellers.length === 0 ? (
        <div className="grid">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="skeleton skeleton--card" />
          ))}
        </div>
      ) : sellers.length === 0 ? (
        <div className="empty-state">
          <p className="empty-state-title">No shops yet.</p>
          <p>Shops appear here as sellers sign up.</p>
        </div>
      ) : (
        <div className="grid">
          {sellers.map((seller) => {
            // Sellers created before `status` existed come back without one — treat an active one as
            // open and anything else as still setting up, rather than crashing the whole list.
            const statusInfo = SELLER_STATUS[seller.status ?? (seller.active ? 'LIVE' : 'ONBOARDING')];
            return (
              <div key={seller.id} className="card stack stack--sm">
                <div className="split">
                  <strong>{seller.shopName}</strong>
                  <span className={`badge badge--${statusInfo.tone}`}>{statusInfo.label}</span>
                </div>
                <div className="split">
                  <code className="text-sm text-muted">••••{seller.feedToken.slice(-4)}</code>
                  <CopyButton value={seller.feedToken} label="Copy key" className="btn btn--ghost btn--sm" />
                </div>
                <button type="button" className="btn btn--primary" onClick={() => openAsSeller(seller)}>
                  Open as this shop
                </button>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}

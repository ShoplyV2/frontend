'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { listAdminSellers } from '@/lib/apiClient';
import { sellerMessage } from '@/lib/errorMessage';
import { SELLER_STATUS } from '@/lib/labels';
import { useFeedToken } from '@/lib/useFeedToken';
import { useConfirm } from '@/components/ui/ConfirmProvider';
import { CopyButton } from '@/components/ui/CopyButton';
import { Alert } from '@/components/ui/Alert';
import type { AdminSellerSummary } from '@/lib/types';

export default function SellersPage() {
  const router = useRouter();
  const confirm = useConfirm();
  const { token: currentToken, setToken } = useFeedToken();
  const [sellers, setSellers] = useState<AdminSellerSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listAdminSellers();
      setSellers(res.sellers);
      setError(null);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    function load() {
      refresh();
    }
    load();
  }, [refresh]);

  async function openSeller(seller: AdminSellerSummary) {
    if (currentToken && currentToken !== seller.feedToken) {
      const ok = await confirm({
        title: `Switch to ${seller.shopName}?`,
        body: (
          <div className="stack stack--sm">
            <p>You&apos;ll be signed out of your current shop on this device. Copy your current key first if you haven&apos;t saved it.</p>
            <CopyButton value={currentToken} label="Copy current key" />
          </div>
        ),
        confirmLabel: 'Switch shops',
      });
      if (!ok) return;
    }
    setToken(seller.feedToken);
    router.push('/catalog');
  }

  return (
    <main className="page page--wide stack">
      <div className="split">
        <div>
          <div className="cluster cluster--sm">
            <h1>Shops</h1>
            <span className="badge badge--warning">Developer tool</span>
          </div>
          <p className="text-secondary">Opening a shop signs you in as that shop on this device.</p>
        </div>
        <Link href="/onboarding/signup" className="btn btn--primary">
          New shop
        </Link>
      </div>

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
          <p>Create the first one to get started.</p>
          <Link href="/onboarding/signup" className="btn btn--primary">
            Create a shop
          </Link>
        </div>
      ) : (
        <div className="grid">
          {sellers.map((seller) => {
            const statusInfo = SELLER_STATUS[seller.status];
            return (
              <div key={seller.id} className="card stack stack--sm">
                <div className="split">
                  <strong>{seller.shopName}</strong>
                  <span className={`badge badge--${statusInfo.tone}`}>{statusInfo.label}</span>
                </div>
                {seller.active && <span className="badge badge--accent" style={{ alignSelf: 'flex-start' }}>Open for orders</span>}
                <div className="split">
                  <code className="text-sm text-muted">••••{seller.feedToken.slice(-4)}</code>
                  <CopyButton value={seller.feedToken} label="Copy key" className="btn btn--ghost btn--sm" />
                </div>
                <button type="button" className="btn btn--primary" onClick={() => openSeller(seller)}>
                  Open this shop
                </button>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}

'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ApiError, listAdminSellers } from '@/lib/apiClient';
import { useFeedToken } from '@/lib/useFeedToken';
import type { AdminSellerSummary } from '@/lib/types';

export default function SellersPage() {
  const router = useRouter();
  const { setToken } = useFeedToken();
  const [sellers, setSellers] = useState<AdminSellerSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listAdminSellers();
      setSellers(res.sellers);
      setError(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not load sellers.');
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

  function openSeller(seller: AdminSellerSummary) {
    setToken(seller.feedToken);
    router.push('/catalog');
  }

  return (
    <main style={{ maxWidth: '40rem', margin: '0 auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <h1>Sellers</h1>
        <Link href="/onboarding/signup">
          <button>New shop</button>
        </Link>
      </div>

      {error && (
        <div className="card pill-danger">
          <p>{error}</p>
          <button onClick={() => refresh()}>Retry</button>
        </div>
      )}

      {loading && sellers.length === 0 ? (
        <p>Loading…</p>
      ) : sellers.length === 0 ? (
        <p>
          No shops yet — <Link href="/onboarding/signup">create the first one</Link>.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {sellers.map((seller) => (
            <button
              key={seller.id}
              className="card"
              onClick={() => openSeller(seller)}
              style={{ textAlign: 'left', display: 'block', width: '100%' }}
            >
              <div className="row" style={{ justifyContent: 'space-between' }}>
                <strong>{seller.shopName}</strong>
                <span className="row" style={{ gap: '0.35rem' }}>
                  <span className="pill">{seller.status}</span>
                  {seller.active && <span className="pill" style={{ background: 'var(--accent)', color: '#fff' }}>Active</span>}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </main>
  );
}

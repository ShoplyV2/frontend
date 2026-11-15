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
import { WhatsAppConnectForm } from '@/components/admin/WhatsAppConnectForm';
import { CHANNEL_KIND } from '@/lib/labels';
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
                {seller.email && <span className="text-sm text-secondary truncate">{seller.email}</span>}
                <div className="cluster cluster--sm">
                  {seller.channels.map((channel) => (
                    <span key={channel.kind} className={`badge ${channel.active && channel.bound ? 'badge--success' : 'badge--warning'}`}>
                      {CHANNEL_KIND[channel.kind]}
                      {channel.active && channel.bound ? '' : ' (not receiving alerts)'}
                    </span>
                  ))}
                  {seller.channels.length === 0 && <span className="badge badge--muted">No chat app</span>}
                  {seller.whatsappRequestedAt && <span className="badge badge--accent">WhatsApp requested {new Date(seller.whatsappRequestedAt).toLocaleDateString()}</span>}
                </div>
                <div className="split">
                  <code className="text-sm text-muted">••••{seller.feedToken.slice(-4)}</code>
                  <CopyButton value={seller.feedToken} label="Copy key" className="btn btn--ghost btn--sm" />
                </div>
                <button type="button" className="btn btn--primary" onClick={() => openAsSeller(seller)}>
                  Open as this shop
                </button>
                {/* Always shown: right after connecting, the refresh clears the request and adds the channel,
                    and the form is also where the seller's link appears — it must not vanish with them.
                    Re-posting is safe (refreshes the token and issues a new link), hence "Reconnect". */}
                <details>
                  <summary className="text-sm">
                    {seller.channels.some((c) => c.kind === 'whatsapp') ? 'Reconnect WhatsApp' : seller.whatsappRequestedAt ? 'Connect their WhatsApp' : 'Connect WhatsApp'}
                  </summary>
                  <WhatsAppConnectForm adminToken={adminToken} sellerId={seller.id} onConnected={refresh} />
                </details>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}

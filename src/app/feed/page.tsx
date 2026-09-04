'use client';

import { HandoffQueue } from '@/components/HandoffQueue';
import { HeroOrder } from '@/components/HeroOrder';
import { OrderList } from '@/components/OrderList';
import { TokenGate } from '@/components/TokenGate';
import { SellerNav } from '@/components/SellerNav';
import { useFeedData } from '@/lib/useFeedData';
import { useFeedToken } from '@/lib/useFeedToken';

export default function FeedPage() {
  const { token, setToken, hydrated } = useFeedToken();
  const { orders, handoffs, loading, error, refresh } = useFeedData(token);

  if (!hydrated) return null;

  if (!token) {
    return <TokenGate onSubmit={setToken} />;
  }

  const [hero, ...rest] = orders;

  return (
    <main style={{ maxWidth: '40rem', margin: '0 auto', padding: '1rem' }}>
      <SellerNav active="/feed" onSignOut={() => setToken(null)} />
      <h1 style={{ marginBottom: '1rem' }}>Orders &amp; handoffs</h1>

      {error && (
        <div className="card pill-danger" style={{ marginBottom: '1rem' }}>
          <p>{error}</p>
          <button onClick={() => refresh()}>Retry</button>
        </div>
      )}

      {loading && orders.length === 0 && handoffs.length === 0 ? (
        <p>Loading…</p>
      ) : (
        <>
          <HandoffQueue handoffs={handoffs} token={token} onAction={refresh} />
          {hero && <HeroOrder order={hero} token={token} onAction={refresh} />}
          <OrderList orders={rest} token={token} onAction={refresh} />
          {orders.length === 0 && <p>No orders yet.</p>}
        </>
      )}
    </main>
  );
}

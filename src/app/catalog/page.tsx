'use client';

import { useFeedToken } from '@/lib/useFeedToken';
import { useCatalog } from '@/lib/useCatalog';
import { ItemForm } from '@/components/ItemForm';
import { ItemCard } from '@/components/ItemCard';
import { TokenGate } from '@/components/TokenGate';
import { SellerNav } from '@/components/SellerNav';

export default function CatalogPage() {
  const { token, setToken, hydrated } = useFeedToken();
  const { items, warnings, loading, error, refresh } = useCatalog(token);

  if (!hydrated) return null;
  if (!token) return <TokenGate onSubmit={setToken} />;

  return (
    <main style={{ maxWidth: '40rem', margin: '0 auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <SellerNav active="/catalog" onSignOut={() => setToken(null)} />
      <h1>Your catalog</h1>

      {error && (
        <div className="card pill-danger">
          <p>{error}</p>
          <button onClick={() => refresh()}>Retry</button>
        </div>
      )}

      {warnings.includes('VISION_CANDIDATE_CAP_EXCEEDED') && (
        <div className="card pill-warning">
          <p>You have more than 6 available items — screenshot matching only considers the first 6. Hide some to keep matching accurate.</p>
        </div>
      )}

      <ItemForm token={token} onCreated={refresh} />

      {loading && items.length === 0 ? (
        <p>Loading…</p>
      ) : items.length === 0 ? (
        <p>No items yet — add your first one above.</p>
      ) : (
        items.map((item) => <ItemCard key={item.id} token={token} item={item} onChanged={refresh} />)
      )}
    </main>
  );
}

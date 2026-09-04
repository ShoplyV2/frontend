'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useFeedToken } from '@/lib/useFeedToken';
import { useCatalog } from '@/lib/useCatalog';
import { sellerMessage } from '@/lib/errorMessage';
import { CATALOG_WARNING } from '@/lib/labels';
import { ItemTile } from '@/components/catalog/ItemTile';
import { TokenGate } from '@/components/TokenGate';
import { AppShell } from '@/components/shell/AppShell';
import { PageSkeleton } from '@/components/ui/PageSkeleton';
import { Alert } from '@/components/ui/Alert';

export default function CatalogPage() {
  const { token, setToken, hydrated } = useFeedToken();
  const { items, warnings, loading, error, refresh } = useCatalog(token);
  const [warningDismissed, setWarningDismissed] = useState(false);

  if (!hydrated) {
    return (
      <div className="page">
        <PageSkeleton />
      </div>
    );
  }
  if (!token) return <TokenGate onSubmit={setToken} />;

  return (
    <AppShell token={token} pageWidth="wide">
      <div className="stack">
        <div className="split">
          <h1>Your catalog</h1>
          <Link href="/catalog/new" className="btn btn--primary">
            ＋ Add item
          </Link>
        </div>

        {error != null && (
          <Alert variant="danger" action={<button className="btn btn--secondary btn--sm" onClick={() => refresh()}>Try again</button>}>
            {sellerMessage(error, 'Could not load your catalog.')}
          </Alert>
        )}

        {warnings.includes('VISION_CANDIDATE_CAP_EXCEEDED') && !warningDismissed && (
          <Alert
            variant="warning"
            action={
              <button className="btn btn--ghost btn--sm" onClick={() => setWarningDismissed(true)}>
                Dismiss
              </button>
            }
          >
            {CATALOG_WARNING.VISION_CANDIDATE_CAP_EXCEEDED}
          </Alert>
        )}

        {loading && items.length === 0 ? (
          <div className="grid grid--catalog">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="skeleton skeleton--card" style={{ aspectRatio: '4 / 5' }} />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="empty-state">
            <p className="empty-state-title">Your catalog is empty</p>
            <p>Add your first item so your assistant can sell it. You&apos;ll need a clear photo, a price, and the sizes or colours you have.</p>
            <Link href="/catalog/new" className="btn btn--primary">
              Add your first item
            </Link>
          </div>
        ) : (
          <div className="grid grid--catalog">
            {items.map((item) => (
              <ItemTile key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}

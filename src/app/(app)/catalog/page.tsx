'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useCatalog } from '@/lib/useCatalog';
import { sellerMessage } from '@/lib/errorMessage';
import { CATALOG_WARNING, PHOTO_PROCESSING } from '@/lib/labels';
import { updateCatalogItem } from '@/lib/apiClient';
import { useToast } from '@/components/ui/ToastProvider';
import type { CatalogItem } from '@/lib/types';
import { ProductCard, totalStock } from '@/components/catalog/ProductCard';
import { Page } from '@/components/shell/Page';
import { useShop } from '@/components/shell/ShopProvider';
import { Alert } from '@/components/ui/Alert';

export default function CatalogPage() {
  const { token } = useShop();
  const toast = useToast();
  const { items, warnings, loading, error, refresh, patchItem, replaceItem } = useCatalog(token);
  const [warningDismissed, setWarningDismissed] = useState(false);
  const [photoNoteDismissed, setPhotoNoteDismissed] = useState(false);
  const [filter, setFilter] = useState<'all' | 'in' | 'out'>('all');

  const counts = { all: items.length, in: items.filter((i) => totalStock(i) > 0).length, out: items.filter((i) => totalStock(i) === 0).length };
  const shown = items.filter((i) => (filter === 'in' ? totalStock(i) > 0 : filter === 'out' ? totalStock(i) === 0 : true));
  const photosPending = items.some((i) => !i.visionReady);

  // Flips at once and puts it back if the server says no.
  async function handleToggle(item: CatalogItem) {
    const rollback = patchItem(item.id, (i) => ({ ...i, available: !i.available }));
    try {
      const res = await updateCatalogItem(token, item.id, { available: !item.available });
      replaceItem(res.item);
    } catch (err) {
      rollback();
      toast({ tone: 'danger', text: sellerMessage(err, 'Could not update that item.') });
    }
  }


  return (
    <Page width="wide">
      <div className="stack">
        <h1>Your catalog</h1>

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

        {photosPending && !photoNoteDismissed && (
          <Alert
            variant="info"
            action={
              <button className="btn btn--ghost btn--sm" onClick={() => setPhotoNoteDismissed(true)}>
                Dismiss
              </button>
            }
          >
            {PHOTO_PROCESSING.hint} Items still processing are marked on their card.
          </Alert>
        )}

        {items.length > 0 && (
          <div className="pill-group" role="group" aria-label="Filter items">
            {([['all', 'All'], ['in', 'In stock'], ['out', 'Sold out']] as const).map(([key, label]) => (
              <button key={key} type="button" className="pill" aria-pressed={filter === key} onClick={() => setFilter(key)}>
                {label} <span className="pill-count">{counts[key]}</span>
              </button>
            ))}
          </div>
        )}

        {loading && items.length === 0 ? (
          <div className="grid grid--catalog">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="skeleton skeleton--card product-skeleton" />
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
            {shown.map((item) => (
              <ProductCard key={item.id} item={item} onToggleAvailable={handleToggle} />
            ))}
          </div>
        )}
      </div>
    </Page>
  );
}

'use client';

import Link from 'next/link';
import { formatMoney } from '@/lib/format';
import { PHOTO_PROCESSING } from '@/lib/labels';
import type { CatalogItem } from '@/lib/types';

function stockSummary(item: CatalogItem): { text: string; tone: 'success' | 'warning' | 'danger' } {
  const total = item.variants.reduce((sum, v) => sum + v.stock, 0);
  if (total === 0) return { text: 'Sold out', tone: 'danger' };
  if (total <= 3) return { text: `${total} left`, tone: 'warning' };
  return { text: `${total} in stock`, tone: 'success' };
}

export function ItemTile({ item }: { item: CatalogItem }) {
  const primaryImage = item.images.find((i) => i.isPrimary) ?? item.images[0];
  const stock = stockSummary(item);

  return (
    <Link href={`/catalog/${item.id}`} className="card card--interactive" style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ position: 'relative', aspectRatio: '4 / 5', background: 'var(--color-surface-sunken)' }}>
        {primaryImage ? (
          // eslint-disable-next-line @next/next/no-img-element -- seller-uploaded R2 URLs, not a local/optimizable asset
          <img src={primaryImage.url} alt={item.name} loading="lazy" style={{ inlineSize: '100%', blockSize: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{ inlineSize: '100%', blockSize: '100%' }} />
        )}
        <div className="cluster cluster--sm" style={{ position: 'absolute', insetBlockStart: 'var(--space-2)', insetInlineStart: 'var(--space-2)' }}>
          {!item.available && <span className="badge badge--muted">Hidden</span>}
          {!item.visionReady && <span className="badge badge--warning">{PHOTO_PROCESSING.label}</span>}
        </div>
      </div>
      <div className="stack stack--xs" style={{ padding: 'var(--space-3)' }}>
        <span className="truncate" style={{ fontWeight: 'var(--weight-medium)' }}>
          {item.name}
        </span>
        <div className="split">
          <span className="tabular">{formatMoney(item.basePrice, item.currency)}</span>
          <span className={`badge badge--${stock.tone}`}>{stock.text}</span>
        </div>
      </div>
    </Link>
  );
}

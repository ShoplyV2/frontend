'use client';

import Link from 'next/link';
import { formatMoney } from '@/lib/format';
import { PHOTO_PROCESSING } from '@/lib/labels';
import type { CatalogItem } from '@/lib/types';

export function totalStock(item: CatalogItem): number {
  return item.variants.reduce((sum, v) => sum + v.stock, 0);
}

function stockSummary(item: CatalogItem): { text: string; tone: 'success' | 'warning' | 'danger' } {
  const total = totalStock(item);
  if (total === 0) return { text: 'Sold out', tone: 'danger' };
  if (total <= 3) return { text: `${total} left`, tone: 'warning' };
  return { text: `${total} in stock`, tone: 'success' };
}

/**
 * One item in the catalog grid: photo, name, price and stock, and a switch that shows or hides it
 * from buyers without opening the item. The rest of the editing is on the item's own page.
 */
export function ProductCard({ item, onToggleAvailable }: { item: CatalogItem; onToggleAvailable: (item: CatalogItem) => void }) {
  const primaryImage = item.images.find((i) => i.isPrimary) ?? item.images[0];
  const stock = stockSummary(item);
  const sizes = item.variants.length;

  return (
    <div className="card product">
      <Link href={`/catalog/${item.id}`} className="product-link">
        <div className="product-photo">
          {primaryImage ? (
            // eslint-disable-next-line @next/next/no-img-element -- seller-uploaded R2 URLs, not a local/optimizable asset
            <img src={primaryImage.url} alt={item.name} loading="lazy" className="product-img" />
          ) : null}
          {!item.visionReady && <span className="badge badge--warning product-flag">{PHOTO_PROCESSING.label}</span>}
        </div>
        <div className="product-body">
          <span className="truncate product-name">{item.name}</span>
          <div className="split">
            <span className="tabular">{formatMoney(item.basePrice, item.currency)}</span>
            <span className={`badge badge--${stock.tone}`}>{stock.text}</span>
          </div>
          <span className="text-xs text-muted">
            {sizes} size{sizes === 1 ? '' : 's'} &amp; colours
          </span>
        </div>
      </Link>
      <div className="product-foot">
        <span className="text-sm text-secondary">{item.available ? 'Showing to buyers' : 'Hidden from buyers'}</span>
        <button type="button" role="switch" className="switch" aria-checked={item.available} aria-label={`Show ${item.name} to buyers`} onClick={() => onToggleAvailable(item)} />
      </div>
    </div>
  );
}

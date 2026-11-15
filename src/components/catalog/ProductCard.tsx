'use client';

import Link from 'next/link';
import { formatMoney } from '@/lib/format';
import { PHOTO_PROCESSING } from '@/lib/labels';
import type { CatalogItem } from '@/lib/types';

export function totalStock(item: CatalogItem): number {
  return item.variants.reduce((sum, v) => sum + v.stock, 0);
}

/** "M: 5 · L: 3": what is left, by size (with the colour when an item comes in several). */
function stockLine(item: CatalogItem): string {
  if (totalStock(item) === 0) return 'All sizes sold out';
  const inStock = item.variants.filter((v) => v.stock > 0);
  const manyColours = new Set(item.variants.map((v) => (v.color ?? '').toLowerCase())).size > 1;
  const labels = inStock.map((v) => `${manyColours && v.color ? `${v.color} ` : ''}${v.size}: ${v.stock}`);
  return labels.length > 3 ? `${labels.slice(0, 3).join(' · ')} · +${labels.length - 3} more` : labels.join(' · ');
}

/**
 * One item in the catalog grid: photo, name, price and stock, and a switch that shows or hides it
 * from buyers without opening the item. The rest of the editing is on the item's own page.
 */
export function ProductCard({ item, onToggleAvailable }: { item: CatalogItem; onToggleAvailable: (item: CatalogItem) => void }) {
  const primaryImage = item.images.find((i) => i.isPrimary) ?? item.images[0];
  const soldOut = totalStock(item) === 0;

  return (
    <div className="card product">
      <Link href={`/catalog/${item.id}`} className="product-link">
        <div className="product-photo">
          {primaryImage ? (
            // eslint-disable-next-line @next/next/no-img-element -- seller-uploaded R2 URLs, not a local/optimizable asset
            <img src={primaryImage.url} alt={item.name} loading="lazy" className="product-img" />
          ) : null}
          {soldOut && <span className="product-flag product-flag--ink">Sold out</span>}
          {!item.visionReady && <span className="badge badge--warning product-flag product-flag--end">{PHOTO_PROCESSING.label}</span>}
        </div>
        <div className="product-body">
          <div>
            <p className="truncate product-name">{item.name}</p>
            <p className="tabular product-price">{formatMoney(item.basePrice, item.currency)}</p>
          </div>
          <p className="truncate text-xs text-muted">{stockLine(item)}</p>
        </div>
      </Link>
      <div className="product-foot">
        <span className="text-secondary">Available</span>
        <button type="button" role="switch" className="switch" aria-checked={item.available} aria-label={`Show ${item.name} to buyers`} onClick={() => onToggleAvailable(item)} />
      </div>
    </div>
  );
}

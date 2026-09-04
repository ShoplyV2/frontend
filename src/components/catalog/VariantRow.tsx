'use client';

import { useState } from 'react';
import { MenuButton } from '@/components/ui/MenuButton';
import { formatMoney } from '@/lib/format';
import type { CatalogVariant } from '@/lib/types';

export function VariantRow({
  variant,
  currency,
  busy,
  onDelta,
  onSetExact,
  onMarkSoldOut,
}: {
  variant: CatalogVariant;
  currency: string;
  busy: boolean;
  onDelta: (delta: number) => void;
  onSetExact: (value: number) => void;
  onMarkSoldOut: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(variant.stock));
  const soldOut = variant.stock <= 0;

  function commitEdit() {
    setEditing(false);
    const value = Number(draft);
    if (Number.isInteger(value) && value >= 0 && value !== variant.stock) onSetExact(value);
    else setDraft(String(variant.stock));
  }

  return (
    <div className="split" style={{ paddingBlock: 'var(--space-2)', borderBlockEnd: '1px solid var(--color-border-subtle)', opacity: soldOut ? 0.6 : 1 }}>
      <div className="stack stack--xs">
        <div className="cluster cluster--sm">
          <span className="badge">{variant.color}</span>
          <span className="badge">{variant.size}</span>
          {soldOut && <span className="badge badge--danger">Sold out</span>}
        </div>
        {(variant.price != null || variant.sku) && (
          <span className="text-sm text-muted">
            {variant.price != null && `${formatMoney(variant.price, currency)} (own price)`}
            {variant.price != null && variant.sku && ' · '}
            {variant.sku && `SKU ${variant.sku}`}
          </span>
        )}
      </div>

      <div className="cluster cluster--sm">
        <div className="stepper">
          <button type="button" className="btn btn--secondary btn--icon btn--sm" disabled={busy || soldOut} onClick={() => onDelta(-1)} aria-label={`Decrease ${variant.color} ${variant.size} stock`}>
            −
          </button>
          {editing ? (
            <input
              autoFocus
              type="number"
              min={0}
              className="input input--number"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={commitEdit}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitEdit();
                if (e.key === 'Escape') {
                  setDraft(String(variant.stock));
                  setEditing(false);
                }
              }}
            />
          ) : (
            <button
              type="button"
              className="stepper-value btn btn--ghost btn--sm"
              disabled={busy}
              onClick={() => {
                setDraft(String(variant.stock));
                setEditing(true);
              }}
              aria-label={`${variant.color} ${variant.size} stock, tap to set an exact amount`}
            >
              {variant.stock}
            </button>
          )}
          <button type="button" className="btn btn--secondary btn--icon btn--sm" disabled={busy} onClick={() => onDelta(1)} aria-label={`Increase ${variant.color} ${variant.size} stock`}>
            +
          </button>
        </div>
        <MenuButton
          items={[{ label: 'Mark sold out', onSelect: onMarkSoldOut, disabled: busy || soldOut }]}
          label={`More actions for ${variant.color} ${variant.size}`}
        />
      </div>
    </div>
  );
}

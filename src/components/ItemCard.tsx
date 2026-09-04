'use client';

import { useState } from 'react';
import {
  ApiError,
  addCatalogImage,
  addCatalogVariant,
  deleteCatalogImage,
  depleteVariant,
  setPrimaryCatalogImage,
  setVariantStock,
  updateCatalogItem,
} from '@/lib/apiClient';
import { formatMoney } from '@/lib/format';
import type { CatalogItem } from '@/lib/types';

export function ItemCard({ token, item, onChanged }: { token: string; item: CatalogItem; onChanged: () => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newVariant, setNewVariant] = useState({ color: '', size: '', stock: '' });
  const [addingImage, setAddingImage] = useState(false);

  async function run(action: () => Promise<unknown>) {
    setBusy(true);
    setError(null);
    try {
      await action();
      onChanged();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Action failed');
    } finally {
      setBusy(false);
    }
  }

  async function handleAddVariant(event: React.FormEvent) {
    event.preventDefault();
    if (!newVariant.color.trim() || !newVariant.size.trim() || !newVariant.stock.trim()) return;
    await run(() =>
      addCatalogVariant(token, item.id, { color: newVariant.color.trim(), size: newVariant.size.trim(), stock: Number(newVariant.stock) }),
    );
    setNewVariant({ color: '', size: '', stock: '' });
  }

  async function handleAddImage(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setAddingImage(true);
    await run(() => addCatalogImage(token, item.id, file));
    setAddingImage(false);
  }

  return (
    <div className="card">
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <strong>{item.name}</strong>
        <span className="row" style={{ gap: '0.35rem' }}>
          {!item.visionReady && <span className="pill pill-warning">Not match-ready yet</span>}
          <span className="pill">{item.available ? 'Available' : 'Hidden'}</span>
        </span>
      </div>
      <p style={{ margin: '0.25rem 0' }}>{item.description}</p>
      <p>{formatMoney(item.basePrice, item.currency)}</p>
      {error && <p style={{ color: 'var(--danger)' }}>{error}</p>}

      <div className="row" style={{ marginBottom: '0.5rem' }}>
        {item.images.map((image) => (
          <div key={image.r2Key} style={{ position: 'relative' }}>
            {/* eslint-disable-next-line @next/next/no-img-element -- seller-uploaded R2 URLs, not a local/optimizable asset */}
            <img
              src={image.url}
              alt={item.name}
              style={{ width: '4.5rem', height: '4.5rem', objectFit: 'cover', borderRadius: '6px', border: image.isPrimary ? '2px solid var(--accent)' : '1px solid var(--border)' }}
            />
            {!image.isPrimary && (
              <div className="row" style={{ marginTop: '0.15rem', gap: '0.25rem' }}>
                <button
                  className="secondary"
                  style={{ fontSize: '0.7rem', padding: '0.15rem 0.4rem' }}
                  disabled={busy}
                  onClick={() => run(() => setPrimaryCatalogImage(token, item.id, image.r2Key))}
                >
                  Set primary
                </button>
                {item.images.length > 1 && (
                  <button
                    className="secondary"
                    style={{ fontSize: '0.7rem', padding: '0.15rem 0.4rem' }}
                    disabled={busy}
                    onClick={() => run(() => deleteCatalogImage(token, item.id, image.r2Key))}
                  >
                    Delete
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
        <label className="secondary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '4.5rem', height: '4.5rem', border: '1px dashed var(--border)', borderRadius: '6px', cursor: 'pointer', textAlign: 'center', fontSize: '0.75rem' }}>
          {addingImage ? 'Uploading…' : '+ Photo'}
          <input type="file" accept="image/png,image/jpeg,image/webp" onChange={handleAddImage} style={{ display: 'none' }} disabled={busy} />
        </label>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '0.5rem' }}>
        <thead>
          <tr style={{ textAlign: 'left', fontSize: '0.8rem' }}>
            <th>Color</th>
            <th>Size</th>
            <th>Stock</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {item.variants.map((variant) => (
            <tr key={variant._id}>
              <td>{variant.color}</td>
              <td>{variant.size}</td>
              <td>{variant.stock}</td>
              <td>
                <div className="row" style={{ gap: '0.25rem' }}>
                  <button
                    className="secondary"
                    style={{ padding: '0.15rem 0.5rem' }}
                    disabled={busy || variant.stock <= 0}
                    onClick={() => run(() => setVariantStock(token, item.id, variant._id, { delta: -1 }))}
                  >
                    −
                  </button>
                  <button
                    className="secondary"
                    style={{ padding: '0.15rem 0.5rem' }}
                    disabled={busy}
                    onClick={() => run(() => setVariantStock(token, item.id, variant._id, { delta: 1 }))}
                  >
                    +
                  </button>
                  {variant.stock > 0 && (
                    <button
                      className="secondary"
                      style={{ padding: '0.15rem 0.5rem' }}
                      disabled={busy}
                      onClick={() => run(() => depleteVariant(token, item.id, variant._id))}
                    >
                      Mark sold out
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <form className="row" onSubmit={handleAddVariant} style={{ marginBottom: '0.5rem' }}>
        <input
          type="text"
          placeholder="Color"
          value={newVariant.color}
          onChange={(event) => setNewVariant((v) => ({ ...v, color: event.target.value }))}
          style={{ flex: 1, minWidth: '5rem' }}
        />
        <input
          type="text"
          placeholder="Size"
          value={newVariant.size}
          onChange={(event) => setNewVariant((v) => ({ ...v, size: event.target.value }))}
          style={{ flex: 1, minWidth: '4rem' }}
        />
        <input
          type="number"
          min="0"
          placeholder="Stock"
          value={newVariant.stock}
          onChange={(event) => setNewVariant((v) => ({ ...v, stock: event.target.value }))}
          style={{ width: '4.5rem' }}
        />
        <button type="submit" disabled={busy || !newVariant.color.trim() || !newVariant.size.trim() || !newVariant.stock.trim()}>
          Add variant
        </button>
      </form>

      <button className="secondary" disabled={busy} onClick={() => run(() => updateCatalogItem(token, item.id, { available: !item.available }))}>
        {item.available ? 'Hide from buyers' : 'Make available'}
      </button>
    </div>
  );
}

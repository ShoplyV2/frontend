'use client';

import { useState } from 'react';
import { ApiError, createCatalogItem } from '@/lib/apiClient';
import type { NewVariantInput } from '@/lib/types';

interface VariantRow {
  color: string;
  size: string;
  stock: string;
}

function emptyRow(): VariantRow {
  return { color: '', size: '', stock: '' };
}

export function ItemForm({ token, onCreated }: { token: string; onCreated: () => void }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [basePriceMajor, setBasePriceMajor] = useState('');
  const [variantRows, setVariantRows] = useState<VariantRow[]>([emptyRow()]);
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  function updateRow(index: number, patch: Partial<VariantRow>) {
    setVariantRows((rows) => rows.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  function addRow() {
    setVariantRows((rows) => [...rows, emptyRow()]);
  }

  function removeRow(index: number) {
    setVariantRows((rows) => rows.filter((_, i) => i !== index));
  }

  function resetForm() {
    setName('');
    setDescription('');
    setBasePriceMajor('');
    setVariantRows([emptyRow()]);
    setFile(null);
  }

  const priceValue = Number(basePriceMajor);
  const variants: NewVariantInput[] = variantRows
    .filter((row) => row.color.trim() && row.size.trim() && row.stock.trim())
    .map((row) => ({ color: row.color.trim(), size: row.size.trim(), stock: Number(row.stock) }));

  const canSubmit =
    name.trim().length > 0 &&
    description.trim().length >= 15 &&
    Number.isFinite(priceValue) &&
    priceValue > 0 &&
    variants.length > 0 &&
    file != null;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!canSubmit || !file) return;
    setSubmitting(true);
    setError(null);
    setNotice(null);
    try {
      const { visionReady, warnings } = await createCatalogItem(token, {
        name: name.trim(),
        description: description.trim(),
        basePriceMajor: priceValue,
        variants,
        image: file,
      });
      resetForm();
      onCreated();
      const messages = [visionReady ? null : 'Photo uploaded — the match-ready version is still processing.', ...warnings].filter(
        (m): m is string => m != null,
      );
      if (messages.length > 0) setNotice(messages.join(' '));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not create that item.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="card">
      <h2 style={{ marginBottom: '0.5rem' }}>Add an item</h2>
      {error && <p style={{ color: 'var(--danger)', marginBottom: '0.5rem' }}>{error}</p>}
      {notice && <p style={{ color: 'var(--warning)', marginBottom: '0.5rem' }}>{notice}</p>}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <label>
          Name
          <input type="text" value={name} onChange={(event) => setName(event.target.value)} style={{ width: '100%', marginTop: '0.25rem' }} />
        </label>
        <label>
          Description (mention the color and category, e.g. &ldquo;Black leather crossbody bag&rdquo; — at least 15 characters)
          <textarea
            rows={2}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            style={{ width: '100%', marginTop: '0.25rem' }}
          />
        </label>
        <label>
          Base price (GHS)
          <input
            type="number"
            min="0"
            step="0.01"
            value={basePriceMajor}
            onChange={(event) => setBasePriceMajor(event.target.value)}
            style={{ width: '100%', marginTop: '0.25rem' }}
          />
        </label>

        <div>
          <p style={{ marginBottom: '0.25rem' }}>Variants (color, size, stock)</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            {variantRows.map((row, index) => (
              <div key={index} className="row">
                <input
                  type="text"
                  placeholder="Color"
                  value={row.color}
                  onChange={(event) => updateRow(index, { color: event.target.value })}
                  style={{ flex: 1, minWidth: '6rem' }}
                />
                <input
                  type="text"
                  placeholder="Size"
                  value={row.size}
                  onChange={(event) => updateRow(index, { size: event.target.value })}
                  style={{ flex: 1, minWidth: '5rem' }}
                />
                <input
                  type="number"
                  min="0"
                  placeholder="Stock"
                  value={row.stock}
                  onChange={(event) => updateRow(index, { stock: event.target.value })}
                  style={{ width: '5rem' }}
                />
                {variantRows.length > 1 && (
                  <button type="button" className="secondary" onClick={() => removeRow(index)}>
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>
          <button type="button" className="secondary" onClick={addRow} style={{ marginTop: '0.4rem' }}>
            Add variant
          </button>
        </div>

        <label>
          Photo
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            style={{ display: 'block', marginTop: '0.25rem' }}
          />
        </label>

        <button type="submit" disabled={submitting || !canSubmit} style={{ alignSelf: 'flex-start' }}>
          {submitting ? 'Adding…' : 'Add item'}
        </button>
      </form>
    </div>
  );
}

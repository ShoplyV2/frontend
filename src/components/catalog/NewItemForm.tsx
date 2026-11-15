'use client';

import { useEffect, useRef, useState } from 'react';
import { createCatalogItem } from '@/lib/apiClient';
import { sellerMessage } from '@/lib/errorMessage';
import { MIN_ITEM_DESCRIPTION } from '@/lib/checklist';
import { ACCEPT_ATTR, ImageTooLargeError, UnsupportedImageError, prepareUpload } from '@/lib/image';
import { Alert } from '@/components/ui/Alert';
import type { NewVariantInput } from '@/lib/types';

interface VariantRow {
  color: string;
  size: string;
  stock: string;
}

function emptyRow(): VariantRow {
  return { color: '', size: '', stock: '' };
}

/**
 * The add-an-item form, photo first — shared by /catalog/new and the onboarding wizard so a seller's
 * first item and every later one go through exactly the same validation. The parent decides what
 * happens next (`onCreated`) and, if it wants to guard against losing typed text, listens to
 * `onDirtyChange`.
 */
export function NewItemForm({
  token,
  onCreated,
  onDirtyChange,
  submitLabel = 'Add item',
  layout = 'stacked',
}: {
  token: string;
  onCreated: (result: { name: string; notes: string[] }) => void;
  onDirtyChange?: (dirty: boolean) => void;
  submitLabel?: string;
  /** 'split' puts the photo beside the fields on wide screens (the setup wizard). */
  layout?: 'stacked' | 'split';
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [basePriceMajor, setBasePriceMajor] = useState('');
  const [variantRows, setVariantRows] = useState<VariantRow[]>([emptyRow()]);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [preparingPhoto, setPreparingPhoto] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [phase, setPhase] = useState<'idle' | 'uploading' | 'saving'>('idle');
  const [error, setError] = useState<unknown>(null);
  const [summary, setSummary] = useState<string[]>([]);
  const [touched, setTouched] = useState(false);

  const nameRef = useRef<HTMLInputElement>(null);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);
  const priceRef = useRef<HTMLInputElement>(null);
  const variantsRef = useRef<HTMLDivElement>(null);
  const photoRef = useRef<HTMLDivElement>(null);


  const dirty = name.trim() !== '' || description.trim() !== '' || basePriceMajor !== '' || file != null || variantRows.some((r) => r.color || r.size || r.stock);

  useEffect(() => {
    onDirtyChange?.(dirty);
  }, [dirty, onDirtyChange]);

  function updateRow(index: number, patch: Partial<VariantRow>) {
    setVariantRows((rows) => rows.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }
  function addRow() {
    setVariantRows((rows) => [...rows, emptyRow()]);
  }
  function removeRow(index: number) {
    setVariantRows((rows) => rows.filter((_, i) => i !== index));
  }

  async function handleFileChange(picked: File | null) {
    setPhotoError(null);
    if (!picked) {
      setFile(null);
      setPreviewUrl(null);
      return;
    }
    setPreparingPhoto(true);
    try {
      const prepared = await prepareUpload(picked);
      setFile(prepared);
      setPreviewUrl(URL.createObjectURL(prepared));
    } catch (err) {
      if (err instanceof UnsupportedImageError || err instanceof ImageTooLargeError) {
        setPhotoError(err.message);
      } else {
        setPhotoError('Could not use that photo. Try a different one.');
      }
      setFile(null);
      setPreviewUrl(null);
    } finally {
      setPreparingPhoto(false);
    }
  }

  const priceValue = Number(basePriceMajor);
  const variants: NewVariantInput[] = variantRows
    .filter((row) => row.color.trim() && row.size.trim() && row.stock.trim())
    .map((row) => ({ color: row.color.trim(), size: row.size.trim(), stock: Number(row.stock) }));

  // Plain messages during render (no refs touched here — the lint rule for this codebase flags
  // any ref access reachable from render, even inside a closure that isn't called yet). The refs
  // are only read inside focusFirstProblem(), called from the submit handler.
  const problemMessages: string[] = [];
  if (!name.trim()) problemMessages.push('Give your item a name.');
  if (description.trim().length < MIN_ITEM_DESCRIPTION) {
    problemMessages.push(`Say a bit more — at least ${MIN_ITEM_DESCRIPTION} characters, and mention the colour.`);
  }
  if (!Number.isFinite(priceValue) || priceValue <= 0) {
    problemMessages.push('Enter a price above 0.');
  }
  if (variants.length === 0) {
    problemMessages.push('Add at least one size or colour, with how many you have.');
  }
  if (!file) {
    problemMessages.push('Add a photo — buyers match items by photo.');
  }

  function focusFirstProblem() {
    if (!name.trim()) return nameRef.current?.focus();
    if (description.trim().length < MIN_ITEM_DESCRIPTION) return descriptionRef.current?.focus();
    if (!Number.isFinite(priceValue) || priceValue <= 0) return priceRef.current?.focus();
    if (variants.length === 0) return variantsRef.current?.scrollIntoView({ block: 'center' });
    if (!file) return photoRef.current?.scrollIntoView({ block: 'center' });
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setTouched(true);
    setError(null);
    if (problemMessages.length > 0 || !file) {
      setSummary(problemMessages);
      focusFirstProblem();
      return;
    }
    setSummary([]);
    setPhase('uploading');
    try {
      const { visionReady, warnings } = await createCatalogItem(token, {
        name: name.trim(),
        description: description.trim(),
        basePriceMajor: priceValue,
        variants,
        image: file,
      });
      setPhase('saving');
      const notes = [!visionReady ? 'Photo saved — we\'re still preparing it for photo matching.' : null, ...warnings].filter((m): m is string => m != null);
      onCreated({ name: name.trim(), notes });
    } catch (err) {
      setError(err);
      setPhase('idle');
    }
  }

  return (
    <div className="stack">
    {error != null && <Alert variant="danger">{sellerMessage(error, 'Could not add that item.')}</Alert>}
    {touched && summary.length > 0 && (
      <Alert variant="warning" title="Almost there — fix these first:">
        <ul className="stack stack--xs">
          {summary.map((message) => (
            <li key={message}>{message}</li>
          ))}
        </ul>
      </Alert>
    )}


    <form onSubmit={handleSubmit} className="stack">
      <div className={`form-grid${layout === 'split' ? ' form-grid--split' : ''}`}>
        <div className="field field--full" ref={photoRef}>
          <span className="field-label">Photo</span>
          <label className="file-tile file-tile--photo">
            {previewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- local object URL preview, not an optimizable asset
              <img src={previewUrl} alt="" className="file-tile-img" />
            ) : preparingPhoto ? (
              <span>Preparing…</span>
            ) : (
              <span>Take a photo or choose one</span>
            )}
            <input
              type="file"
              accept={ACCEPT_ATTR}
              onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
            />
          </label>
          {previewUrl && (
            <button type="button" className="btn btn--secondary btn--sm self-start" onClick={() => handleFileChange(null)}>
              Change photo
            </button>
          )}
          <p className="field-hint">Clear, well-lit, one item. JPG, PNG or WebP, under 8 MB.</p>
          {photoError && <p className="field-error">{photoError}</p>}
        </div>

        <div className="field field--full">
          <label className="field-label" htmlFor="item-name">
            What is it?
          </label>
          <input id="item-name" ref={nameRef} className="input" type="text" placeholder="Black leather crossbody bag" value={name} onChange={(e) => setName(e.target.value)} />
        </div>

        <div className="field field--full">
          <label className="field-label" htmlFor="item-description">
            Describe it for buyers
          </label>
          <textarea id="item-description" ref={descriptionRef} className="textarea" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
          <p className="field-hint">
            Include the colour and what kind of thing it is — that&apos;s how photo matching finds it. {description.trim().length} / {MIN_ITEM_DESCRIPTION} characters
          </p>
        </div>

        <div className="field">
          <label className="field-label" htmlFor="item-price">
            Price (GHS)
          </label>
          <input id="item-price" ref={priceRef} className="input" type="number" inputMode="decimal" min="0" step="0.01" value={basePriceMajor} onChange={(e) => setBasePriceMajor(e.target.value)} />
        </div>
      </div>

      <div className="stack stack--sm" ref={variantsRef}>
        <p className="field-label">Sizes &amp; colours</p>
        <p className="field-hint">Add one row for each colour and size you have.</p>
        <div className="stack stack--sm">
          {variantRows.map((row, index) => (
            <div key={index} className="cluster">
              <input className="input field--grow" type="text" placeholder="Color" value={row.color} onChange={(e) => updateRow(index, { color: e.target.value })} />
              <input className="input field--grow" type="text" placeholder="Size" value={row.size} onChange={(e) => updateRow(index, { size: e.target.value })} />
              <input className="input input--number" type="number" min="0" placeholder="Stock" value={row.stock} onChange={(e) => updateRow(index, { stock: e.target.value })} />
              {variantRows.length > 1 && (
                <button type="button" className="btn btn--ghost btn--icon btn--sm" aria-label="Remove this size" onClick={() => removeRow(index)}>
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
        <button type="button" className="btn btn--secondary btn--sm self-start" onClick={addRow}>
          ＋ Add another
        </button>
      </div>

      <div className="form-actions">
        <button type="submit" className="btn btn--primary" data-loading={phase !== 'idle' || undefined}>
          {phase === 'uploading' ? 'Uploading photo…' : phase === 'saving' ? 'Saving…' : submitLabel}
        </button>
      </div>
    </form>
    </div>
  );
}

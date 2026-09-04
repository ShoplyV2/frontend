'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useFeedToken } from '@/lib/useFeedToken';
import { useCatalog } from '@/lib/useCatalog';
import { sellerMessage } from '@/lib/errorMessage';
import { PHOTO_PROCESSING } from '@/lib/labels';
import { formatMoney } from '@/lib/format';
import { ACCEPT_ATTR, prepareUpload } from '@/lib/image';
import {
  addCatalogImage,
  addCatalogVariant,
  deleteCatalogImage,
  depleteVariant,
  setPrimaryCatalogImage,
  setVariantStock,
  updateCatalogItem,
} from '@/lib/apiClient';
import { TokenGate } from '@/components/TokenGate';
import { AppShell } from '@/components/shell/AppShell';
import { PageSkeleton } from '@/components/ui/PageSkeleton';
import { Alert } from '@/components/ui/Alert';
import { MenuButton } from '@/components/ui/MenuButton';
import { VariantRow } from '@/components/catalog/VariantRow';
import { useConfirm } from '@/components/ui/ConfirmProvider';
import { useToast } from '@/components/ui/ToastProvider';
import type { CatalogItem } from '@/lib/types';

const STOCK_COALESCE_MS = 400;

export default function ItemDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const confirm = useConfirm();
  const toast = useToast();
  const { token, setToken, hydrated } = useFeedToken();
  const { items, loading, error, refresh, replaceItem, patchItem } = useCatalog(token);
  const [pending, setPending] = useState<Set<string>>(new Set());
  const [rowError, setRowError] = useState<string | null>(null);
  const [addingImage, setAddingImage] = useState(false);
  const pendingDeltas = useRef<Map<string, { total: number; rollback: () => void; timer: ReturnType<typeof setTimeout> }>>(new Map());

  if (!hydrated) {
    return (
      <div className="page">
        <PageSkeleton />
      </div>
    );
  }
  if (!token) return <TokenGate onSubmit={setToken} />;

  const item = items.find((i) => i.id === params.id);

  function isBusy(key: string) {
    return pending.has(key);
  }
  function setBusy(key: string, busy: boolean) {
    setPending((current) => {
      const next = new Set(current);
      if (busy) next.add(key);
      else next.delete(key);
      return next;
    });
  }

  async function run(key: string, action: () => Promise<{ item: CatalogItem }>) {
    setBusy(key, true);
    setRowError(null);
    try {
      const res = await action();
      replaceItem(res.item);
    } catch (err) {
      setRowError(sellerMessage(err, 'Could not update that item.'));
    } finally {
      setBusy(key, false);
    }
  }

  function handleStockDelta(variantId: string, delta: number) {
    if (!item || !token) return;
    const key = `stock:${variantId}`;
    const rollback = patchItem(item.id, (current) => ({
      ...current,
      variants: current.variants.map((v) => (v._id === variantId ? { ...v, stock: Math.max(0, v.stock + delta) } : v)),
    }));

    const existing = pendingDeltas.current.get(variantId);
    if (existing) {
      clearTimeout(existing.timer);
      existing.total += delta;
    }
    const total = existing ? existing.total : delta;
    const combinedRollback = existing ? existing.rollback : rollback;
    if (existing) rollback(); // fold the new optimistic patch on top of the previous one; only the base rollback is kept

    const timer = setTimeout(async () => {
      pendingDeltas.current.delete(variantId);
      setBusy(key, true);
      try {
        const res = await setVariantStock(token, item.id, variantId, { delta: total });
        replaceItem(res.item);
      } catch (err) {
        combinedRollback();
        toast({ tone: 'danger', text: sellerMessage(err, 'Could not update stock.') });
      } finally {
        setBusy(key, false);
      }
    }, STOCK_COALESCE_MS);

    pendingDeltas.current.set(variantId, { total, rollback: combinedRollback, timer });
  }

  async function handleMarkSoldOut(variantId: string) {
    if (!item || !token) return;
    const variant = item.variants.find((v) => v._id === variantId);
    const ok = await confirm({
      title: 'Hide this size from buyers?',
      body: `"${variant?.color} · ${variant?.size}" will show as sold out across your whole catalog. This won't affect any orders already placed.`,
      confirmLabel: 'Hide it',
      tone: 'danger',
    });
    if (!ok) return;
    await run(`stock:${variantId}`, () => depleteVariant(token, item.id, variantId));
    toast({ tone: 'success', text: `"${variant?.color} · ${variant?.size}" is now sold out.` });
  }

  async function handleSetPrimary(r2Key: string) {
    if (!item || !token) return;
    setBusy(`image:${r2Key}`, true);
    setRowError(null);
    try {
      await setPrimaryCatalogImage(token, item.id, r2Key);
      await refresh();
    } catch (err) {
      setRowError(sellerMessage(err, 'Could not update that photo.'));
    } finally {
      setBusy(`image:${r2Key}`, false);
    }
  }

  async function handleDeleteImage(r2Key: string) {
    if (!item || !token) return;
    const ok = await confirm({ title: 'Remove this photo?', body: 'This cannot be undone.', confirmLabel: 'Remove', tone: 'danger' });
    if (!ok) return;
    setBusy(`image:${r2Key}`, true);
    setRowError(null);
    try {
      await deleteCatalogImage(token, item.id, r2Key);
      await refresh();
    } catch (err) {
      setRowError(sellerMessage(err, 'Could not remove that photo.'));
    } finally {
      setBusy(`image:${r2Key}`, false);
    }
  }

  async function handleAddImage(file: File | null) {
    if (!item || !token || !file) return;
    setAddingImage(true);
    setRowError(null);
    try {
      const prepared = await prepareUpload(file);
      await addCatalogImage(token, item.id, prepared);
      await refresh();
    } catch (err) {
      setRowError(sellerMessage(err, 'Could not add that photo.'));
    } finally {
      setAddingImage(false);
    }
  }

  async function handleToggleAvailable() {
    if (!item || !token) return;
    await run('available', () => updateCatalogItem(token, item.id, { available: !item.available }));
  }

  if (loading && !item) {
    return (
      <AppShell token={token}>
        <PageSkeleton />
      </AppShell>
    );
  }

  if (!item) {
    return (
      <AppShell token={token}>
        <div className="empty-state">
          <p className="empty-state-title">That item isn&apos;t here any more.</p>
          <Link href="/catalog" className="btn btn--secondary">
            Back to catalog
          </Link>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell token={token}>
      <div className="stack">
        <div className="cluster">
          <button type="button" className="btn btn--ghost btn--icon" onClick={() => router.push('/catalog')} aria-label="Back to catalog">
            ←
          </button>
          <h1 className="truncate">{item.name}</h1>
        </div>

        {error != null && <Alert variant="danger">{sellerMessage(error, 'Could not load your catalog.')}</Alert>}
        {rowError && <Alert variant="danger">{rowError}</Alert>}

        <div className="split">
          <span className="tabular" style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-semibold)' }}>
            {formatMoney(item.basePrice, item.currency)}
          </span>
          <div className="cluster cluster--sm">
            {!item.visionReady && <span className="badge badge--warning">{PHOTO_PROCESSING.label}</span>}
            <span className={`badge ${item.available ? 'badge--accent' : 'badge--muted'}`}>{item.available ? 'Available' : 'Hidden'}</span>
          </div>
        </div>
        {!item.visionReady && <p className="field-hint">{PHOTO_PROCESSING.hint}</p>}
        <p>{item.description}</p>

        <div className="section">
          <p className="section-title">Photos</p>
          <div className="cluster">
            {item.images.map((image) => (
              <div key={image.r2Key} style={{ position: 'relative' }}>
                {/* eslint-disable-next-line @next/next/no-img-element -- seller-uploaded R2 URLs, not a local/optimizable asset */}
                <img src={image.url} alt={item.name} className={`thumb${image.isPrimary ? ' thumb--primary' : ''}`} style={{ inlineSize: '6rem', blockSize: '6rem' }} />
                {image.isPrimary && <span className="badge badge--accent" style={{ position: 'absolute', insetBlockEnd: 2, insetInlineStart: 2 }}>Main</span>}
                <div style={{ position: 'absolute', insetBlockStart: 2, insetInlineEnd: 2 }}>
                  <MenuButton
                    label={`Photo actions`}
                    items={[
                      { label: 'Make main photo', onSelect: () => handleSetPrimary(image.r2Key), disabled: image.isPrimary || isBusy(`image:${image.r2Key}`) },
                      { label: 'Remove photo', onSelect: () => handleDeleteImage(image.r2Key), disabled: item.images.length <= 1 || isBusy(`image:${image.r2Key}`), danger: true },
                    ]}
                  />
                </div>
              </div>
            ))}
            <label className="file-tile">
              {addingImage ? 'Uploading…' : '＋ Add photo'}
              <input type="file" accept={ACCEPT_ATTR} onChange={(e) => handleAddImage(e.target.files?.[0] ?? null)} disabled={addingImage} />
            </label>
          </div>
        </div>

        <div className="section">
          <p className="section-title">Sizes &amp; stock</p>
          <div className="stack" style={{ gap: 0 }}>
            {item.variants.map((variant) => (
              <VariantRow
                key={variant._id}
                variant={variant}
                currency={item.currency}
                busy={isBusy(`stock:${variant._id}`)}
                onDelta={(delta) => handleStockDelta(variant._id, delta)}
                onSetExact={(value) => {
                  if (!token) return;
                  run(`stock:${variant._id}`, () => setVariantStock(token, item.id, variant._id, { set: value }));
                }}
                onMarkSoldOut={() => handleMarkSoldOut(variant._id)}
              />
            ))}
          </div>
          <AddVariantForm
            busy={isBusy('add-variant')}
            onAdd={async (input) => {
              if (!token) return;
              await run('add-variant', () => addCatalogVariant(token, item.id, input));
            }}
          />
        </div>

        <button type="button" className="btn btn--secondary" disabled={isBusy('available')} onClick={handleToggleAvailable}>
          {item.available ? 'Hide from buyers' : 'Make available'}
        </button>
      </div>
    </AppShell>
  );
}

function AddVariantForm({ busy, onAdd }: { busy: boolean; onAdd: (input: { color: string; size: string; stock: number }) => Promise<void> }) {
  const [color, setColor] = useState('');
  const [size, setSize] = useState('');
  const [stock, setStock] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!color.trim() || !size.trim() || !stock.trim()) return;
    await onAdd({ color: color.trim(), size: size.trim(), stock: Number(stock) });
    setColor('');
    setSize('');
    setStock('');
  }

  return (
    <form className="cluster" onSubmit={handleSubmit} style={{ marginTop: 'var(--space-2)' }}>
      <input className="input field--grow" type="text" placeholder="Color" value={color} onChange={(e) => setColor(e.target.value)} />
      <input className="input field--grow" type="text" placeholder="Size" value={size} onChange={(e) => setSize(e.target.value)} />
      <input className="input input--number" type="number" min="0" placeholder="Stock" value={stock} onChange={(e) => setStock(e.target.value)} />
      <button type="submit" className="btn btn--secondary" disabled={busy || !color.trim() || !size.trim() || !stock.trim()}>
        Add
      </button>
    </form>
  );
}

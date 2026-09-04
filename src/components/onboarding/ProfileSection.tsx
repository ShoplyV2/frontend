'use client';

import { useState } from 'react';
import { updateProfile } from '@/lib/apiClient';
import { sellerMessage } from '@/lib/errorMessage';
import { MIN_SHOP_DESCRIPTION } from '@/lib/checklist';
import { useToast } from '@/components/ui/ToastProvider';
import { Alert } from '@/components/ui/Alert';
import type { SellerProfile } from '@/lib/types';

export function ProfileSection({ token, profile, onSaved }: { token: string; profile: SellerProfile; onSaved: () => void }) {
  const toast = useToast();
  const [shopName, setShopName] = useState(profile.shopName);
  const [shopDescription, setShopDescription] = useState(profile.shopDescription);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const dirty = shopName !== profile.shopName || shopDescription !== profile.shopDescription;

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      await updateProfile(token, { shopName: shopName.trim(), shopDescription: shopDescription.trim() });
      toast({ tone: 'success', text: 'Shop details saved.' });
      onSaved();
    } catch (err) {
      setError(err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div id="profile" className="card stack">
      <h2>Your shop details</h2>
      {error != null && <Alert variant="danger">{sellerMessage(error, 'Could not save your shop details.')}</Alert>}
      <div className="field">
        <label className="field-label" htmlFor="shop-name">
          Shop name
        </label>
        <input id="shop-name" className="input" type="text" value={shopName} onChange={(event) => setShopName(event.target.value)} />
      </div>
      <div className="field">
        <label className="field-label" htmlFor="shop-description">
          What do you sell?
        </label>
        <textarea id="shop-description" className="textarea" rows={3} value={shopDescription} onChange={(event) => setShopDescription(event.target.value)} />
        <p className="field-hint">
          At least {MIN_SHOP_DESCRIPTION} characters — e.g. &ldquo;Women&apos;s bags and shoes, imported, sizes 36–42.&rdquo; {shopDescription.trim().length} / {MIN_SHOP_DESCRIPTION}
        </p>
      </div>
      <div className="form-actions">
        <button type="button" className="btn btn--primary" onClick={handleSave} disabled={saving || !dirty || !shopName.trim()}>
          {saving ? 'Saving…' : 'Save changes'}
        </button>
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { ApiError, updateProfile } from '@/lib/apiClient';
import type { SellerProfile } from '@/lib/types';

export function OnboardingProfileCard({ token, profile, onSaved }: { token: string; profile: SellerProfile; onSaved: () => void }) {
  const [shopName, setShopName] = useState(profile.shopName);
  const [shopDescription, setShopDescription] = useState(profile.shopDescription);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dirty = shopName !== profile.shopName || shopDescription !== profile.shopDescription;

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      await updateProfile(token, { shopName: shopName.trim(), shopDescription: shopDescription.trim() });
      onSaved();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save your profile.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="card">
      <h2 style={{ marginBottom: '0.5rem' }}>Shop profile</h2>
      {error && <p style={{ color: 'var(--danger)', marginBottom: '0.5rem' }}>{error}</p>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <label>
          Shop name
          <input type="text" value={shopName} onChange={(event) => setShopName(event.target.value)} style={{ width: '100%', marginTop: '0.25rem' }} />
        </label>
        <label>
          What do you sell? (shown to buyers indirectly, at least 20 characters)
          <textarea
            value={shopDescription}
            onChange={(event) => setShopDescription(event.target.value)}
            rows={3}
            style={{ width: '100%', marginTop: '0.25rem' }}
          />
        </label>
        <button onClick={handleSave} disabled={saving || !dirty || !shopName.trim()} style={{ alignSelf: 'flex-start' }}>
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
    </div>
  );
}

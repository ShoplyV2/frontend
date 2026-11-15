'use client';

import { useState } from 'react';
import { updateProfile } from '@/lib/apiClient';
import { sellerMessage } from '@/lib/errorMessage';
import { MIN_SHOP_DESCRIPTION } from '@/lib/checklist';
import { Alert } from '@/components/ui/Alert';
import { StepFooter, StepHeading } from './WizardShell';
import type { SellerProfile } from '@/lib/types';

export function DetailsStep({ token, profile, refresh, onBack, onNext }: { token: string; profile: SellerProfile; refresh: () => Promise<void>; onBack: () => void; onNext: () => void }) {
  const [shopName, setShopName] = useState(profile.shopName);
  const [shopDescription, setShopDescription] = useState(profile.shopDescription);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const valid = shopName.trim() !== '' && shopDescription.trim().length >= MIN_SHOP_DESCRIPTION;
  const dirty = shopName.trim() !== profile.shopName || shopDescription.trim() !== profile.shopDescription;

  async function handleContinue() {
    if (!dirty) return onNext();
    setSaving(true);
    setError(null);
    try {
      await updateProfile(token, { shopName: shopName.trim(), shopDescription: shopDescription.trim() });
      await refresh();
      onNext();
    } catch (err) {
      setError(err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="step step--card step--560">
      <StepHeading title="Tell us about your shop">Your assistant uses this to describe your shop to buyers.</StepHeading>
      {error != null && <Alert variant="danger">{sellerMessage(error, 'Could not save your shop details.')}</Alert>}
      <div className="field">
        <label className="field-label" htmlFor="wizard-shop-name">
          Shop name
        </label>
        <input id="wizard-shop-name" className="input" type="text" value={shopName} onChange={(e) => setShopName(e.target.value)} />
      </div>
      <div className="field">
        <label className="field-label" htmlFor="wizard-shop-description">
          What do you sell?
        </label>
        <textarea id="wizard-shop-description" className="textarea" rows={4} value={shopDescription} onChange={(e) => setShopDescription(e.target.value)} />
        <p className="field-hint">
          At least {MIN_SHOP_DESCRIPTION} characters. For example: &ldquo;Women&apos;s bags and shoes, imported, sizes 36–42.&rdquo; {shopDescription.trim().length} / {MIN_SHOP_DESCRIPTION}
        </p>
      </div>
      <StepFooter onBack={onBack}>
        <button type="button" className="btn btn--primary btn--lg" onClick={handleContinue} disabled={!valid || saving}>
          {saving ? 'Saving…' : 'Continue'}
        </button>
      </StepFooter>
    </div>
  );
}

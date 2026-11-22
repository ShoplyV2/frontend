'use client';

import { useState } from 'react';
import { Alert } from '@/components/ui/Alert';
import { Sheet } from '@/components/ui/Sheet';
import { setAdminShopPlan } from '@/lib/apiClient';
import { adminMessage } from '@/lib/adminError';
import { formatMoney } from '@/lib/format';
import { PLAN_DETAILS, PLAN_NAME } from '@/lib/labels';
import type { PlanTier } from '@/lib/types';

const TIERS = Object.keys(PLAN_NAME) as PlanTier[];

/** Puts a shop on a plan, or back on the free trial. There is no self-serve upgrade, so this is how a plan gets set. */
export function PlanSheet({ open, onClose, token, shopId, shopName, current, onDone }: { open: boolean; onClose: () => void; token: string; shopId: string; shopName: string; current: PlanTier | null; onDone: () => void }) {
  const [choice, setChoice] = useState<PlanTier | null>(current);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setError(null);
    try {
      await setAdminShopPlan(token, shopId, choice);
      onDone();
    } catch (err) {
      setError(adminMessage(err, "Couldn't reach the server."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Sheet open={open} onClose={onClose} title={`Choose a plan for ${shopName}`}>
      <div className="stack">
        <div className="stack stack--sm">
          <h2>Choose a plan for {shopName}</h2>
          <p className="text-secondary">Going over a plan is never blocked. Extra orders and chats are priced per item.</p>
        </div>
        {error && <Alert variant="danger">{error}</Alert>}
        <div className="stack stack--sm" role="radiogroup" aria-label="Plan">
          <PlanOption selected={choice === null} onSelect={() => setChoice(null)} title="No plan (free trial)">
            15 orders, 100 chats or 45 days, whichever comes first. The bot hands buyers to the seller when it ends.
          </PlanOption>
          {TIERS.map((tier) => {
            const d = PLAN_DETAILS[tier];
            return (
              <PlanOption key={tier} selected={choice === tier} onSelect={() => setChoice(tier)} title={PLAN_NAME[tier]} aside={`${formatMoney(d.priceMinor)} /mo`}>
                {d.orders.toLocaleString()} orders · {d.chats.toLocaleString()} chats · {formatMoney(d.orderOverageMinor)} per extra order · {formatMoney(d.chatOverageMinor)} per extra chat
              </PlanOption>
            );
          })}
        </div>
        <div className="form-actions">
          <button type="button" className="btn btn--secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="btn btn--primary" disabled={saving || choice === current} onClick={() => void save()}>
            {saving ? 'Saving…' : 'Save plan'}
          </button>
        </div>
      </div>
    </Sheet>
  );
}

function PlanOption({ selected, onSelect, title, aside, children }: { selected: boolean; onSelect: () => void; title: string; aside?: string; children: React.ReactNode }) {
  return (
    <button type="button" role="radio" aria-checked={selected} className={`radio-card${selected ? ' radio-card--on' : ''}`} onClick={onSelect}>
      <span className={`radio${selected ? ' radio--on' : ''}`} aria-hidden="true" />
      <span className="radio-card-body">
        <strong>{title}</strong>
        <span className="text-sm text-secondary">{children}</span>
      </span>
      {aside && <span className="radio-card-aside">{aside}</span>}
    </button>
  );
}

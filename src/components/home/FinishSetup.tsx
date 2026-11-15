'use client';

import { useState } from 'react';
import { PayoutSection } from '@/components/onboarding/PayoutSection';
import { WhatsAppCard } from '@/components/channels/ChannelCards';
import { Sheet } from '@/components/ui/Sheet';
import type { ChannelSummary, OnboardingState, SellerProfile } from '@/lib/types';

/**
 * What a shop that is already open can still add: bank payout, and WhatsApp (which the team sets up).
 * Shows only what's still undone and disappears once there's nothing left — the setup wizard covers
 * everything required to open, so these are the optional extras.
 */
export function FinishSetup({
  token,
  profile,
  state,
  channels,
  refresh,
}: {
  token: string;
  profile: SellerProfile;
  state: OnboardingState;
  channels: ChannelSummary[];
  refresh: () => Promise<void>;
}) {
  const [payoutOpen, setPayoutOpen] = useState(false);
  const whatsapp = channels.find((c) => c.kind === 'whatsapp');
  const payoutPending = !state.payoutConfigured;
  const whatsappPending = whatsapp?.sellerContactId == null;

  if (!payoutPending && !whatsappPending) return null;

  return (
    <section className="section">
      <p className="section-title">Finish setup</p>
      <div className="stack">
        {payoutPending && (
          <div className="card stack stack--sm">
            <h2>Get paid to your bank</h2>
            <p className="text-secondary">Buyers&apos; payments only reach your bank once this is set.</p>
            <button type="button" className="btn btn--secondary self-start" onClick={() => setPayoutOpen(true)}>
              Add bank details
            </button>
          </div>
        )}
        {whatsappPending && <WhatsAppCard token={token} channel={whatsapp} requestedAt={profile.whatsappRequestedAt} refresh={refresh} />}
      </div>

      <Sheet open={payoutOpen} onClose={() => setPayoutOpen(false)} title="Bank details">
        <PayoutSection
          token={token}
          payoutConfigured={state.payoutConfigured}
          onChanged={() => {
            setPayoutOpen(false);
            void refresh();
          }}
        />
      </Sheet>
    </section>
  );
}

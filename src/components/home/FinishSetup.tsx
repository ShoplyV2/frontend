'use client';

import { useState } from 'react';
import { PayoutSection } from '@/components/onboarding/PayoutSection';
import { WhatsAppCard } from '@/components/channels/ChannelCards';
import { Sheet } from '@/components/ui/Sheet';
import type { ChannelSummary, OnboardingState, SellerProfile } from '@/lib/types';

/**
 * What a shop that is already open can still add: bank payout, and WhatsApp (which the team sets up).
 * A slim strip that lists only what's still undone and disappears once there's nothing left — the
 * setup wizard covers everything required to open, so these are the optional extras. Each link opens
 * the real form in a sheet.
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
  const [whatsappOpen, setWhatsappOpen] = useState(false);
  const [finishOpen, setFinishOpen] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const whatsapp = channels.find((c) => c.kind === 'whatsapp');
  const payoutPending = !state.payoutConfigured;
  const whatsappPending = whatsapp?.sellerContactId == null;
  const pending = Number(payoutPending) + Number(whatsappPending);

  if (pending === 0 || dismissed) return null;

  return (
    <>
      <div className="finish-strip">
        <strong>Finish setup</strong>
        <span className="text-sm text-muted">
          {2 - pending} of 2 done
        </span>
        <span className="finish-strip-links">
          {payoutPending && (
            <button type="button" className="btn btn--link btn--sm" onClick={() => setPayoutOpen(true)}>
              Add bank details
            </button>
          )}
          {whatsappPending && (
            <button type="button" className="btn btn--link btn--sm" onClick={() => setWhatsappOpen(true)}>
              {profile.whatsappRequestedAt ? 'WhatsApp requested' : 'Request WhatsApp'}
            </button>
          )}
        </span>
        <button type="button" className="btn btn--link btn--sm finish-strip-continue" onClick={() => setFinishOpen(true)}>
          Continue
        </button>
        <button type="button" className="btn btn--ghost btn--icon finish-strip-dismiss" aria-label="Dismiss" onClick={() => setDismissed(true)}>
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </div>

      <Sheet open={finishOpen} onClose={() => setFinishOpen(false)} title="Finish setup">
        <h2>Finish setup</h2>
        <div className="stack stack--sm">
          {payoutPending && (
            <button
              type="button"
              className="btn btn--secondary btn--block"
              onClick={() => {
                setFinishOpen(false);
                setPayoutOpen(true);
              }}
            >
              Add bank details
            </button>
          )}
          {whatsappPending && (
            <button
              type="button"
              className="btn btn--secondary btn--block"
              onClick={() => {
                setFinishOpen(false);
                setWhatsappOpen(true);
              }}
            >
              {profile.whatsappRequestedAt ? 'WhatsApp requested' : 'Request WhatsApp'}
            </button>
          )}
        </div>
      </Sheet>
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
      <Sheet open={whatsappOpen} onClose={() => setWhatsappOpen(false)} title="WhatsApp">
        <WhatsAppCard token={token} channel={whatsapp} requestedAt={profile.whatsappRequestedAt} refresh={refresh} />
      </Sheet>
    </>
  );
}

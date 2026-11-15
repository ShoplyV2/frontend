'use client';

import { useState } from 'react';
import Link from 'next/link';
import { activateSeller } from '@/lib/apiClient';
import { sellerMessage } from '@/lib/errorMessage';
import { stepForBlocker } from '@/lib/welcome';
import { ShareLinks } from '@/components/ShareLinks';
import { Alert } from '@/components/ui/Alert';
import { StepFooter, StepHeading } from './WizardShell';
import type { ChannelSummary, OnboardingState } from '@/lib/types';

export function OpenStep({
  token,
  shopName,
  state,
  channels,
  opened,
  refresh,
  onOpened,
  onBack,
  onGoToStep,
}: {
  token: string;
  shopName: string;
  state: OnboardingState;
  channels: ChannelSummary[];
  opened: boolean;
  refresh: () => Promise<void>;
  onOpened: () => void;
  onBack: () => void;
  onGoToStep: (step: number) => void;
}) {
  const [opening, setOpening] = useState(false);
  const [error, setError] = useState<unknown>(null);

  async function handleOpen() {
    setOpening(true);
    setError(null);
    try {
      await activateSeller(token);
      onOpened();
    } catch (err) {
      setError(err);
      // Something changed since this step was last loaded (a chat app disconnected, an item sold
      // out): reload so the list of what's missing is current rather than the one we opened with.
      await refresh();
    } finally {
      setOpening(false);
    }
  }

  if (opened) {
    return (
      <div className="stack">
        <div className="wizard-success">
          <span className="wizard-success-mark" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12.5l4.5 4.5L19 7.5" />
            </svg>
          </span>
          <StepHeading title="Your shop is open">Buyers can message your shop now and your assistant will answer them. Anything it can&apos;t handle shows up under Orders.</StepHeading>
        </div>
        <div className="card stack stack--sm">
          <h2>Share your link</h2>
          <ShareLinks shopName={shopName} channels={channels} />
        </div>
        <Link href="/home" className="btn btn--primary">
          Go to my shop
        </Link>
      </div>
    );
  }

  return (
    <div className="stack">
      <StepHeading title="Ready to open?">Once your shop is open, buyers who message it get answers from your assistant.</StepHeading>

      {!state.ready && (
        <Alert variant="warning" title="A few things are still missing">
          <ul className="stack stack--xs">
            {state.blockers.map((blocker) => (
              <li key={blocker} className="split">
                <span>{blocker}</span>
                <button type="button" className="btn btn--secondary btn--sm" onClick={() => onGoToStep(stepForBlocker(blocker))}>
                  Fix
                </button>
              </li>
            ))}
          </ul>
        </Alert>
      )}
      {/* When something is missing the warning above already says what; this is for any other failure. */}
      {error != null && state.ready && <Alert variant="danger">{sellerMessage(error, 'Could not open your shop yet.')}</Alert>}

      <StepFooter onBack={onBack}>
        <button type="button" className="btn btn--primary" onClick={handleOpen} disabled={!state.ready || opening}>
          {opening ? 'Opening…' : 'Open my shop'}
        </button>
      </StepFooter>
      <p className="field-hint">Bank payout isn&apos;t needed to open. You can add it afterwards.</p>
    </div>
  );
}

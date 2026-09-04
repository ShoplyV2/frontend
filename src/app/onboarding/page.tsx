'use client';

import { useState } from 'react';
import { activateSeller } from '@/lib/apiClient';
import { sellerMessage } from '@/lib/errorMessage';
import { buildChecklist } from '@/lib/checklist';
import { useFeedToken } from '@/lib/useFeedToken';
import { useOnboarding } from '@/lib/useOnboarding';
import { ProfileSection } from '@/components/onboarding/ProfileSection';
import { ChannelSection } from '@/components/onboarding/ChannelSection';
import { PayoutSection } from '@/components/onboarding/PayoutSection';
import { ActivationChecklist } from '@/components/onboarding/ActivationChecklist';
import { LiveCelebration } from '@/components/onboarding/LiveCelebration';
import { TokenGate } from '@/components/TokenGate';
import { AppShell } from '@/components/shell/AppShell';
import { PageSkeleton } from '@/components/ui/PageSkeleton';
import { Alert } from '@/components/ui/Alert';

export default function OnboardingPage() {
  const { token, setToken, hydrated } = useFeedToken();
  const { profile, state, channels, loading, error, refresh } = useOnboarding(token);
  const [activating, setActivating] = useState(false);
  const [activateError, setActivateError] = useState<string | null>(null);
  const [justActivated, setJustActivated] = useState(false);

  if (!hydrated) {
    return (
      <div className="page">
        <PageSkeleton />
      </div>
    );
  }
  if (!token) return <TokenGate onSubmit={setToken} />;

  async function handleActivate() {
    if (!token) return;
    setActivating(true);
    setActivateError(null);
    try {
      await activateSeller(token);
      setJustActivated(true);
    } catch (err) {
      setActivateError(sellerMessage(err, 'Could not open your shop yet.'));
      refresh();
    } finally {
      setActivating(false);
    }
  }

  const checklist = profile && state ? buildChecklist(state, profile, channels) : null;
  const incompleteRequired = checklist?.filter((s) => s.required && !s.done).length ?? 0;

  if (justActivated) {
    return (
      <AppShell token={token} shopName={profile?.shopName}>
        <LiveCelebration />
      </AppShell>
    );
  }

  return (
    <AppShell token={token} shopName={profile?.shopName} setupBadgeCount={incompleteRequired}>
      <div className="stack">
        <h1>Set up your shop</h1>

        {error != null && (
          <Alert variant="danger" action={<button className="btn btn--secondary btn--sm" onClick={() => refresh()}>Try again</button>}>
            {sellerMessage(error, 'Could not load your shop setup.')}
          </Alert>
        )}

        {loading && !profile ? (
          <PageSkeleton />
        ) : (
          profile &&
          state &&
          checklist && (
            <>
              <ActivationChecklist
                status={state.status}
                steps={checklist}
                ready={state.ready}
                activating={activating}
                activateError={activateError}
                onActivate={handleActivate}
              />
              <ProfileSection token={token} profile={profile} onSaved={refresh} />
              <ChannelSection token={token} channels={channels} onChanged={refresh} />
              <PayoutSection token={token} payoutConfigured={state.payoutConfigured} onChanged={refresh} />
            </>
          )
        )}
      </div>
    </AppShell>
  );
}

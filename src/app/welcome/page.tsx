'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useFeedToken } from '@/lib/useFeedToken';
import { useOnboarding } from '@/lib/useOnboarding';
import { sellerMessage } from '@/lib/errorMessage';
import { STEP, firstIncompleteStep, wizardProgress } from '@/lib/welcome';
import { RequireLogin } from '@/components/RequireLogin';
import { PageSkeleton } from '@/components/ui/PageSkeleton';
import { Alert } from '@/components/ui/Alert';
import { WizardShell } from '@/components/welcome/WizardShell';
import { ItemStep } from '@/components/welcome/ItemStep';
import { DetailsStep } from '@/components/welcome/DetailsStep';
import { ChatStep } from '@/components/welcome/ChatStep';
import { TestStep } from '@/components/welcome/TestStep';
import { OpenStep } from '@/components/welcome/OpenStep';

export default function WelcomePage() {
  const router = useRouter();
  const { token, setToken, hydrated } = useFeedToken();
  const { profile, state, channels, loading, error, refresh } = useOnboarding(token);
  // null until the seller presses Continue/Back — until then the wizard sits on the first step that
  // isn't done yet, which is also how it resumes after a refresh or a login days later.
  const [chosenStep, setChosenStep] = useState<number | null>(null);
  const [opened, setOpened] = useState(false);

  // A shop that's already open has nothing to set up here. `opened` is set before the profile
  // refreshes, so finishing the wizard doesn't bounce the seller away from the success screen.
  const alreadyLive = profile?.status === 'LIVE' && !opened;
  useEffect(() => {
    if (alreadyLive) router.replace('/home');
  }, [alreadyLive, router]);

  if (!hydrated) {
    return (
      <div className="page">
        <PageSkeleton />
      </div>
    );
  }
  if (!token) return <RequireLogin />;

  function handleSignOut() {
    setToken(null);
    router.push('/login');
  }

  if (error != null && !profile) {
    return (
      <main className="page page--narrow">
        <Alert variant="danger" action={<button className="btn btn--secondary btn--sm" onClick={() => refresh()}>Try again</button>}>
          {sellerMessage(error, 'Could not load your shop setup.')}
        </Alert>
      </main>
    );
  }
  if (!profile || !state || alreadyLive || (loading && !profile)) {
    return (
      <div className="page">
        <PageSkeleton />
      </div>
    );
  }

  const progress = wizardProgress(state, profile, channels);
  const step = opened ? STEP.open : (chosenStep ?? firstIncompleteStep(progress));
  const goTo = (n: number) => setChosenStep(Math.max(STEP.item, Math.min(STEP.open, n)));

  return (
    <WizardShell stepIndex={step} shopName={profile.shopName} onSignOut={handleSignOut}>
      {step === STEP.item && <ItemStep token={token} itemDone={progress.item} refresh={refresh} onNext={() => goTo(STEP.details)} />}
      {step === STEP.details && <DetailsStep token={token} profile={profile} refresh={refresh} onBack={() => goTo(STEP.item)} onNext={() => goTo(STEP.chat)} />}
      {step === STEP.chat && (
        <ChatStep
          token={token}
          profile={profile}
          channels={channels}
          chatDone={progress.chat}
          refresh={refresh}
          onBack={() => goTo(STEP.details)}
          onNext={() => goTo(STEP.test)}
          onLater={() => router.push('/catalog')}
        />
      )}
      {step === STEP.test && <TestStep token={token} shopName={profile.shopName} channels={channels} onBack={() => goTo(STEP.chat)} onNext={() => goTo(STEP.open)} />}
      {step === STEP.open && (
        <OpenStep token={token} shopName={profile.shopName} state={state} channels={channels} opened={opened} refresh={refresh} onOpened={() => setOpened(true)} onBack={() => goTo(STEP.test)} onGoToStep={goTo} />
      )}
    </WizardShell>
  );
}

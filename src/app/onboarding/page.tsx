'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ApiError, activateSeller } from '@/lib/apiClient';
import { useFeedToken } from '@/lib/useFeedToken';
import { useOnboarding } from '@/lib/useOnboarding';
import { OnboardingProfileCard } from '@/components/OnboardingProfileCard';
import { OnboardingChannelCard } from '@/components/OnboardingChannelCard';
import { OnboardingPayoutCard } from '@/components/OnboardingPayoutCard';
import { TokenGate } from '@/components/TokenGate';
import { SellerNav } from '@/components/SellerNav';

export default function OnboardingPage() {
  const router = useRouter();
  const { token, setToken, hydrated } = useFeedToken();
  const { profile, state, channels, loading, error, refresh } = useOnboarding(token);
  const [activating, setActivating] = useState(false);
  const [activateError, setActivateError] = useState<string | null>(null);

  if (!hydrated) return null;
  if (!token) return <TokenGate onSubmit={setToken} />;

  async function handleActivate() {
    if (!token) return;
    setActivating(true);
    setActivateError(null);
    try {
      await activateSeller(token);
      router.push('/catalog');
    } catch (err) {
      setActivateError(err instanceof ApiError ? err.message : 'Could not activate your shop yet.');
    } finally {
      setActivating(false);
    }
  }

  return (
    <main style={{ maxWidth: '40rem', margin: '0 auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <SellerNav active="/onboarding" onSignOut={() => setToken(null)} />
      <h1>Set up your shop</h1>

      {error && (
        <div className="card pill-danger">
          <p>{error}</p>
          <button onClick={() => refresh()}>Retry</button>
        </div>
      )}

      {loading && !profile ? (
        <p>Loading…</p>
      ) : (
        profile &&
        state && (
          <>
            <div className="card">
              <div className="row" style={{ justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <h2>Status</h2>
                <span className="pill">{state.status}</span>
              </div>
              {state.ready ? (
                <p>Everything is set — you are ready to go live.</p>
              ) : (
                <ul style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  {state.blockers.map((blocker) => (
                    <li key={blocker}>{blocker}</li>
                  ))}
                </ul>
              )}
              {activateError && <p style={{ color: 'var(--danger)', marginTop: '0.5rem' }}>{activateError}</p>}
              <button onClick={handleActivate} disabled={!state.ready || activating} style={{ marginTop: '0.75rem' }}>
                {activating ? 'Activating…' : 'Activate shop'}
              </button>
            </div>

            <OnboardingProfileCard token={token} profile={profile} onSaved={refresh} />
            <OnboardingChannelCard token={token} channels={channels} onChanged={refresh} />
            <OnboardingPayoutCard token={token} payoutConfigured={state.payoutConfigured} onChanged={refresh} />
          </>
        )
      )}
    </main>
  );
}

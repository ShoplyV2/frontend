'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signupSeller } from '@/lib/apiClient';
import { sellerMessage } from '@/lib/errorMessage';
import { useFeedToken } from '@/lib/useFeedToken';
import { CopyButton } from '@/components/ui/CopyButton';
import { Alert } from '@/components/ui/Alert';

export default function SignupPage() {
  const router = useRouter();
  const { setToken } = useFeedToken();
  const [shopName, setShopName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [feedToken, setFeedToken] = useState<string | null>(null);
  const [keySaved, setKeySaved] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!shopName.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const { feedToken: token } = await signupSeller(shopName.trim());
      setToken(token);
      setFeedToken(token);
    } catch (err) {
      setError(err);
    } finally {
      setSubmitting(false);
    }
  }

  if (feedToken) {
    return (
      <main className="page page--narrow page--centered">
        <div className="card stack">
          <h1>Save your shop key</h1>
          <p>
            This key is how you get back into <strong>{shopName}</strong> on any phone. There&apos;s no password and no way to email it to
            you — save it somewhere safe now.
          </p>
          <code className="card card--quiet text-sm" style={{ wordBreak: 'break-all', display: 'block' }}>
            {feedToken}
          </code>
          <CopyButton value={feedToken} label="Copy key" className="btn btn--secondary" />
          <label className="cluster">
            <input type="checkbox" checked={keySaved} onChange={(e) => setKeySaved(e.target.checked)} />
            I&apos;ve saved my key somewhere safe.
          </label>
          <button type="button" className="btn btn--primary" disabled={!keySaved} onClick={() => router.push('/onboarding')}>
            Continue to setup
          </button>
          <p className="field-hint">You can see your key again any time from your shop menu, as long as you&apos;re still signed in on this device.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="page page--narrow page--centered">
      <div className="card stack">
        <h1>Create your shop</h1>
        <p>What&apos;s your shop called? You can fill in everything else after.</p>

        {error != null && <Alert variant="danger">{sellerMessage(error, 'Could not create your shop.')}</Alert>}

        <form onSubmit={handleSubmit} className="stack">
          <div className="field">
            <label className="field-label" htmlFor="signup-shop-name">
              Shop name
            </label>
            <input
              id="signup-shop-name"
              className="input"
              type="text"
              value={shopName}
              onChange={(event) => setShopName(event.target.value)}
              placeholder="e.g. Ama's Boutique"
              autoFocus
            />
          </div>
          <button type="submit" className="btn btn--primary" disabled={submitting || !shopName.trim()}>
            {submitting ? 'Creating…' : 'Create my shop'}
          </button>
        </form>
      </div>
    </main>
  );
}

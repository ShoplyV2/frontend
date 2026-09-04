'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ApiError, signupSeller } from '@/lib/apiClient';
import { useFeedToken } from '@/lib/useFeedToken';

export default function SignupPage() {
  const router = useRouter();
  const { setToken } = useFeedToken();
  const [shopName, setShopName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!shopName.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const { feedToken } = await signupSeller(shopName.trim());
      setToken(feedToken);
      router.push('/onboarding');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main style={{ maxWidth: '28rem', margin: '3rem auto', padding: '1rem' }}>
      <div className="card">
        <h1 style={{ marginBottom: '0.75rem' }}>Set up your shop</h1>
        <p style={{ marginBottom: '1rem' }}>What&apos;s your shop called? You can fill in the rest after.</p>

        {error && (
          <div className="card pill-danger" style={{ marginBottom: '1rem' }}>
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <label>
            Shop name
            <input
              type="text"
              value={shopName}
              onChange={(event) => setShopName(event.target.value)}
              placeholder="e.g. Ama's Boutique"
              style={{ width: '100%', marginTop: '0.25rem' }}
              autoFocus
            />
          </label>
          <button type="submit" disabled={submitting || !shopName.trim()}>
            {submitting ? 'Creating…' : 'Create my shop'}
          </button>
        </form>
      </div>
    </main>
  );
}

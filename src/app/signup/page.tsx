'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signupSeller } from '@/lib/apiClient';
import { authMessage } from '@/lib/errorMessage';
import { useFeedToken } from '@/lib/useFeedToken';
import { PasswordField } from '@/components/auth/PasswordField';
import { Alert } from '@/components/ui/Alert';

const MIN_PASSWORD_LENGTH = 8; // mirrors backend/src/lib/password.ts

export default function SignupPage() {
  const router = useRouter();
  const { token, setToken, hydrated } = useFeedToken();
  const [shopName, setShopName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Saving the token flips `token` before our own redirect to /welcome lands, and the effect
  // below would win that race and send a brand-new seller to /catalog. It's only for visitors who
  // arrive here already signed in.
  const justSignedUp = useRef(false);

  useEffect(() => {
    if (hydrated && token && !justSignedUp.current) router.replace('/catalog');
  }, [hydrated, token, router]);

  const canSubmit = shopName.trim() !== '' && email.trim() !== '' && password.length >= MIN_PASSWORD_LENGTH;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      const { feedToken } = await signupSeller({ email: email.trim(), password, shopName: shopName.trim() });
      justSignedUp.current = true;
      setToken(feedToken);
      router.replace('/welcome');
    } catch (err) {
      setError(authMessage(err, 'Could not create your shop.'));
      setSubmitting(false);
    }
  }

  return (
    <main className="page page--narrow page--centered">
      <div className="card stack">
        <div className="stack stack--xs">
          <h1>Create your shop</h1>
          <p className="text-secondary">It takes a few minutes. You can finish setting up after.</p>
        </div>

        {error && <Alert variant="danger">{error}</Alert>}

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
          <div className="field">
            <label className="field-label" htmlFor="signup-email">
              Email
            </label>
            <input
              id="signup-email"
              className="input"
              type="email"
              inputMode="email"
              autoComplete="username"
              autoCapitalize="none"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>
          <PasswordField
            id="signup-password"
            label="Password"
            value={password}
            onChange={setPassword}
            autoComplete="new-password"
            hint={`At least ${MIN_PASSWORD_LENGTH} characters.`}
          />
          <button type="submit" className="btn btn--primary" disabled={submitting || !canSubmit}>
            {submitting ? 'Creating…' : 'Create my shop'}
          </button>
        </form>

        <p className="text-sm">
          Already have a shop? <Link href="/login">Sign in</Link>
        </p>
      </div>
    </main>
  );
}

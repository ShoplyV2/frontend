'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { loginSeller } from '@/lib/apiClient';
import { authMessage } from '@/lib/errorMessage';
import { useFeedToken } from '@/lib/useFeedToken';
import { PasswordField } from '@/components/auth/PasswordField';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { Alert } from '@/components/ui/Alert';

export default function LoginPage() {
  const router = useRouter();
  const { token, setToken, hydrated } = useFeedToken();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (hydrated && token) router.replace('/home');
  }, [hydrated, token, router]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const { feedToken } = await loginSeller({ email: email.trim(), password });
      setToken(feedToken);
      router.replace('/home');
    } catch (err) {
      setError(authMessage(err, 'Could not sign you in.'));
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout variant="login" title="Welcome back" subtitle="Sign in to your shop.">
      {error && <Alert variant="danger">{error}</Alert>}

      <form onSubmit={handleSubmit} className="stack">
        <div className="field">
          <label className="field-label" htmlFor="login-email">
            Email
          </label>
          <input
            id="login-email"
            className="input"
            type="email"
            inputMode="email"
            placeholder="you@example.com"
            autoComplete="username"
            autoCapitalize="none"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoFocus
          />
        </div>
        <PasswordField id="login-password" label="Password" value={password} onChange={setPassword} autoComplete="current-password" />
        <button type="submit" className="btn btn--primary btn--lg" disabled={submitting || !email.trim() || !password}>
          {submitting ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      <p className="auth-switch">
        New to shoply? <Link href="/signup">Create your shop</Link>
      </p>
    </AuthLayout>
  );
}

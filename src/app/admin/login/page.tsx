'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { adminLogin, ApiError } from '@/lib/apiClient';
import { useAdminToken } from '@/lib/useAdminToken';
import { Alert } from '@/components/ui/Alert';

export default function AdminLoginPage() {
  const router = useRouter();
  const { token, setToken, hydrated } = useAdminToken();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (hydrated && token) router.replace('/admin');
  }, [hydrated, token, router]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const { sessionToken } = await adminLogin(email.trim(), password);
      setToken(sessionToken);
      router.replace('/admin');
    } catch (err) {
      // The backend's own message is safe to show here ("Wrong email or password.") — this page is
      // for the team, so the seller-facing sellerMessage() copy ("enter your shop key") would be wrong.
      setError(err instanceof ApiError ? err.message : "Couldn't reach the server. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="page page--narrow page--centered">
      <div className="card stack">
        <div className="cluster cluster--sm">
          <h1>Shoply admin</h1>
          <span className="badge badge--warning">Team only</span>
        </div>
        {error && <Alert variant="danger">{error}</Alert>}
        <form onSubmit={handleSubmit} className="stack">
          <div className="field">
            <label className="field-label" htmlFor="admin-email">
              Email
            </label>
            <input id="admin-email" className="input" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} autoFocus />
          </div>
          <div className="field">
            <label className="field-label" htmlFor="admin-password">
              Password
            </label>
            <input id="admin-password" className="input" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <button type="submit" className="btn btn--primary" disabled={submitting || !email.trim() || !password}>
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </main>
  );
}

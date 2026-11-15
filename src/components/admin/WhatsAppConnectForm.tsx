'use client';

import { useState } from 'react';
import { ApiError, connectSellerWhatsApp } from '@/lib/apiClient';
import { CopyButton } from '@/components/ui/CopyButton';
import { Alert } from '@/components/ui/Alert';

/**
 * The team's half of the WhatsApp request flow: paste the Meta details for the seller's number and
 * connect it. The result is a link the seller opens on their own phone so alerts reach them there —
 * send it to them (the seller's wizard also shows it as soon as the channel exists).
 */
export function WhatsAppConnectForm({ adminToken, sellerId, onConnected }: { adminToken: string; sellerId: string; onConnected: () => void }) {
  const [phoneNumberId, setPhoneNumberId] = useState('');
  const [wabaId, setWabaId] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ displayName: string | null; ownerBindingUrl: string | null } | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const connected = await connectSellerWhatsApp(adminToken, sellerId, {
        phoneNumberId: phoneNumberId.trim(),
        wabaId: wabaId.trim(),
        accessToken: accessToken.trim(),
      });
      setResult(connected);
      setAccessToken('');
      onConnected();
    } catch (err) {
      // This is the team's own tool, so Meta's rejection wording from the backend is the useful part.
      setError(err instanceof ApiError ? err.message : "Couldn't reach the server.");
    } finally {
      setSubmitting(false);
    }
  }

  if (result) {
    return (
      <div className="stack stack--sm">
        <Alert variant="success">Connected {result.displayName ?? 'the number'}.</Alert>
        {result.ownerBindingUrl && (
          <div className="stack stack--xs">
            <p className="text-sm">Send the seller this link (valid 30 minutes) so alerts reach their phone:</p>
            <code className="card card--quiet text-sm truncate">{result.ownerBindingUrl}</code>
            <CopyButton value={result.ownerBindingUrl} label="Copy link" />
          </div>
        )}
      </div>
    );
  }

  const ready = phoneNumberId.trim() !== '' && wabaId.trim() !== '' && accessToken.trim() !== '';
  return (
    <form onSubmit={handleSubmit} className="stack stack--sm">
      {error && <Alert variant="danger">{error}</Alert>}
      <input className="input" placeholder="Phone number ID" aria-label="Phone number ID" value={phoneNumberId} onChange={(e) => setPhoneNumberId(e.target.value)} />
      <input className="input" placeholder="WhatsApp Business account ID" aria-label="WhatsApp Business account ID" value={wabaId} onChange={(e) => setWabaId(e.target.value)} />
      <input className="input" type="password" autoComplete="off" placeholder="Access token" aria-label="Access token" value={accessToken} onChange={(e) => setAccessToken(e.target.value)} />
      <button type="submit" className="btn btn--primary" disabled={!ready || submitting}>
        {submitting ? 'Connecting…' : 'Connect WhatsApp'}
      </button>
    </form>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { ApiError, createPayout, listBanks } from '@/lib/apiClient';
import type { Bank } from '@/lib/types';

export function OnboardingPayoutCard({ token, payoutConfigured, onChanged }: { token: string; payoutConfigured: boolean; onChanged: () => void }) {
  const [banks, setBanks] = useState<Bank[]>([]);
  const [businessName, setBusinessName] = useState('');
  const [bankCode, setBankCode] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listBanks(token)
      .then((res) => setBanks(res.banks))
      .catch(() => setBanks([]));
  }, [token]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!businessName.trim() || !bankCode || !accountNumber.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await createPayout(token, { businessName: businessName.trim(), bankCode, accountNumber: accountNumber.trim() });
      onChanged();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save your payout details.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="card">
      <h2 style={{ marginBottom: '0.5rem' }}>Payout (optional)</h2>
      <p style={{ marginBottom: '0.75rem' }}>
        {payoutConfigured ? <span className="pill">Configured</span> : 'Not required to go live, but you need this before buyer payments can settle to your bank.'}
      </p>

      {error && <p style={{ color: 'var(--danger)', marginBottom: '0.5rem' }}>{error}</p>}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <label>
          Business name
          <input type="text" value={businessName} onChange={(event) => setBusinessName(event.target.value)} style={{ width: '100%', marginTop: '0.25rem' }} />
        </label>
        <label>
          Bank
          <select value={bankCode} onChange={(event) => setBankCode(event.target.value)} style={{ width: '100%', marginTop: '0.25rem' }}>
            <option value="">Select a bank</option>
            {banks.map((bank) => (
              <option key={bank.code} value={bank.code}>
                {bank.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Account number
          <input type="text" value={accountNumber} onChange={(event) => setAccountNumber(event.target.value)} style={{ width: '100%', marginTop: '0.25rem' }} />
        </label>
        <button type="submit" disabled={saving || !businessName.trim() || !bankCode || !accountNumber.trim()} style={{ alignSelf: 'flex-start' }}>
          {saving ? 'Saving…' : payoutConfigured ? 'Update payout details' : 'Save payout details'}
        </button>
      </form>
    </div>
  );
}

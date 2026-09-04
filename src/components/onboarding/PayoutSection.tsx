'use client';

import { useCallback, useEffect, useState } from 'react';
import { createPayout, listBanks } from '@/lib/apiClient';
import { sellerMessage } from '@/lib/errorMessage';
import { useToast } from '@/components/ui/ToastProvider';
import { Alert } from '@/components/ui/Alert';
import type { Bank } from '@/lib/types';

type BankListState = { status: 'loading' } | { status: 'ready'; banks: Bank[] } | { status: 'error'; error: unknown };

export function PayoutSection({ token, payoutConfigured, onChanged }: { token: string; payoutConfigured: boolean; onChanged: () => void }) {
  const toast = useToast();
  const [bankList, setBankList] = useState<BankListState>({ status: 'loading' });
  const [businessName, setBusinessName] = useState('');
  const [bankCode, setBankCode] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState<{ businessName: string; bankName: string; accountNumber: string } | null>(null);
  const [error, setError] = useState<unknown>(null);

  const loadBanks = useCallback(() => {
    setBankList({ status: 'loading' });
    listBanks(token)
      .then((res) => setBankList({ status: 'ready', banks: res.banks }))
      .catch((err) => setBankList({ status: 'error', error: err }));
  }, [token]);

  useEffect(() => {
    function load() {
      loadBanks();
    }
    load();
  }, [loadBanks]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!businessName.trim() || !bankCode || !accountNumber.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await createPayout(token, { businessName: businessName.trim(), bankCode, accountNumber: accountNumber.trim() });
      const bankName = bankList.status === 'ready' ? bankList.banks.find((b) => b.code === bankCode)?.name ?? bankCode : bankCode;
      setSaved({ businessName: businessName.trim(), bankName, accountNumber: accountNumber.trim() });
      toast({ tone: 'success', text: 'Payout details saved.' });
      onChanged();
    } catch (err) {
      setError(err);
    } finally {
      setSaving(false);
    }
  }

  const submitReason = !businessName.trim() ? null : !bankCode ? 'Pick a bank first.' : !accountNumber.trim() ? 'Enter an account number.' : null;

  return (
    <div id="payout" className="card stack">
      <h2>Get paid to your bank</h2>
      <p className="text-secondary">Optional. You can open your shop first — but buyer payments only reach your bank once this is set.</p>

      {(payoutConfigured || saved) && (
        <Alert variant="success">{saved ? `Payouts go to ${saved.businessName} · ${saved.bankName} · ••••${saved.accountNumber.slice(-4)}` : 'Payout set up.'}</Alert>
      )}

      {error != null && <Alert variant="danger">{sellerMessage(error, 'Could not save your payout details.')}</Alert>}
      {bankList.status === 'error' && (
        <Alert variant="warning" action={<button className="btn btn--secondary btn--sm" onClick={loadBanks}>Try again</button>}>
          {sellerMessage(bankList.error, "Couldn't load the bank list right now.")}
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="form-grid">
        <div className="field field--full">
          <label className="field-label" htmlFor="payout-business-name">
            Business name
          </label>
          <input id="payout-business-name" className="input" type="text" value={businessName} onChange={(event) => setBusinessName(event.target.value)} />
        </div>
        <div className="field">
          <label className="field-label" htmlFor="payout-bank">
            Bank
          </label>
          <select
            id="payout-bank"
            className="select"
            value={bankCode}
            onChange={(event) => setBankCode(event.target.value)}
            disabled={bankList.status !== 'ready'}
          >
            <option value="">{bankList.status === 'loading' ? 'Loading banks…' : 'Select a bank'}</option>
            {bankList.status === 'ready' && bankList.banks.map((bank) => (
              <option key={bank.code} value={bank.code}>
                {bank.name}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label className="field-label" htmlFor="payout-account-number">
            Account number
          </label>
          <input id="payout-account-number" className="input" type="text" value={accountNumber} onChange={(event) => setAccountNumber(event.target.value)} />
        </div>
        <div className="form-actions">
          <button type="submit" className="btn btn--primary" disabled={saving || !businessName.trim() || !bankCode || !accountNumber.trim()}>
            {saving ? 'Saving…' : payoutConfigured || saved ? 'Update payout details' : 'Save payout details'}
          </button>
          {submitReason && <span className="field-hint">{submitReason}</span>}
        </div>
      </form>
    </div>
  );
}

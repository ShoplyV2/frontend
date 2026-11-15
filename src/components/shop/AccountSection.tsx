'use client';

import { useState } from 'react';
import { changePassword, updateProfile } from '@/lib/apiClient';
import { sellerMessage } from '@/lib/errorMessage';
import { PasswordField } from '@/components/auth/PasswordField';
import { useToast } from '@/components/ui/ToastProvider';
import { Alert } from '@/components/ui/Alert';
import type { SellerProfile } from '@/lib/types';

const MIN_PASSWORD_LENGTH = 8; // mirrors backend/src/lib/password.ts

export function AccountSection({
  token,
  profile,
  onSaved,
  onTokenChanged,
}: {
  token: string;
  profile: SellerProfile;
  onSaved: () => void;
  // Changing the password replaces this device's session token (and signs every other device out), so
  // whoever owns the token has to adopt the new one — otherwise the very next request would 401.
  onTokenChanged: (token: string) => void;
}) {
  return (
    <div className="card stack">
      <h2>Sign-in</h2>
      <EmailForm token={token} email={profile.email ?? ''} onSaved={onSaved} />
      <PasswordForm token={token} onTokenChanged={onTokenChanged} />
    </div>
  );
}

function EmailForm({ token, email, onSaved }: { token: string; email: string; onSaved: () => void }) {
  const toast = useToast();
  const [value, setValue] = useState(email);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<unknown>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await updateProfile(token, { email: value.trim() });
      toast({ tone: 'success', text: 'Email updated.' });
      onSaved();
    } catch (err) {
      setError(err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="stack stack--sm">
      {error != null && <Alert variant="danger">{sellerMessage(error, 'Could not update your email.')}</Alert>}
      <div className="field">
        <label className="field-label" htmlFor="account-email">
          Email
        </label>
        <input id="account-email" className="input" type="email" inputMode="email" autoComplete="username" autoCapitalize="none" value={value} onChange={(e) => setValue(e.target.value)} />
      </div>
      <button type="submit" className="btn btn--secondary self-start" disabled={saving || value.trim() === '' || value.trim().toLowerCase() === email}>
        {saving ? 'Saving…' : 'Save email'}
      </button>
    </form>
  );
}

function PasswordForm({ token, onTokenChanged }: { token: string; onTokenChanged: (token: string) => void }) {
  const toast = useToast();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<unknown>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const { feedToken } = await changePassword(token, { currentPassword, newPassword });
      onTokenChanged(feedToken);
      setCurrentPassword('');
      setNewPassword('');
      toast({ tone: 'success', text: 'Password changed. Other devices have been signed out.' });
    } catch (err) {
      setError(err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="stack stack--sm">
      <h3>Change password</h3>
      {error != null && <Alert variant="danger">{sellerMessage(error, 'Could not change your password.')}</Alert>}
      <PasswordField id="account-current-password" label="Current password" value={currentPassword} onChange={setCurrentPassword} autoComplete="current-password" />
      <PasswordField
        id="account-new-password"
        label="New password"
        value={newPassword}
        onChange={setNewPassword}
        autoComplete="new-password"
        hint={`At least ${MIN_PASSWORD_LENGTH} characters. This signs you out everywhere else.`}
      />
      <button type="submit" className="btn btn--secondary self-start" disabled={saving || !currentPassword || newPassword.length < MIN_PASSWORD_LENGTH}>
        {saving ? 'Changing…' : 'Change password'}
      </button>
    </form>
  );
}

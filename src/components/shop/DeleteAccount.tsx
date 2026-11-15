'use client';

import { useState } from 'react';
import { deleteAccount } from '@/lib/apiClient';
import { sellerMessage } from '@/lib/errorMessage';
import { PasswordField } from '@/components/auth/PasswordField';
import { Sheet } from '@/components/ui/Sheet';
import { Alert } from '@/components/ui/Alert';

/**
 * Closing the shop. A soft delete on the server (nothing is erased, the team can restore it), but
 * from the seller's side it is final: the shop stops answering buyers and they are signed out. So it
 * asks for the password again, which also stops someone with a borrowed, signed-in phone from doing it.
 */
export function DeleteAccount({ token, onDeleted }: { token: string; onDeleted: () => void }) {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<unknown>(null);

  function close() {
    setOpen(false);
    setPassword('');
    setError(null);
  }

  async function handleDelete(event: React.FormEvent) {
    event.preventDefault();
    setDeleting(true);
    setError(null);
    try {
      await deleteAccount(token, password);
      onDeleted();
    } catch (err) {
      setError(err);
      setDeleting(false);
    }
  }

  return (
    <div className="card stack stack--sm">
      <h2>Close your shop</h2>
      <p className="text-secondary">Your shop stops answering buyers and you&apos;re signed out. You can&apos;t sign back in or reuse this email.</p>
      <button type="button" className="btn btn--danger self-start" onClick={() => setOpen(true)}>
        Delete my account
      </button>

      <Sheet open={open} onClose={close} title="Delete your account">
        <form onSubmit={handleDelete} className="stack">
          <h2>Delete your account?</h2>
          <p>
            Buyers who message your shop will stop getting replies, and you won&apos;t be able to sign in again. Your catalog and past orders are kept on our side. Enter your password to
            confirm.
          </p>
          {error != null && <Alert variant="danger">{sellerMessage(error, 'Could not delete your account.')}</Alert>}
          <PasswordField id="delete-password" label="Password" value={password} onChange={setPassword} autoComplete="current-password" />
          <div className="cluster cluster--sm">
            <button type="submit" className="btn btn--danger" disabled={deleting || !password}>
              {deleting ? 'Deleting…' : 'Delete my account'}
            </button>
            <button type="button" className="btn btn--secondary" onClick={close} disabled={deleting}>
              Keep my shop
            </button>
          </div>
        </form>
      </Sheet>
    </div>
  );
}

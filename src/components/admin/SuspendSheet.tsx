'use client';

import { useState } from 'react';
import { Alert } from '@/components/ui/Alert';
import { Sheet } from '@/components/ui/Sheet';
import { setAdminShopStatus } from '@/lib/apiClient';
import { adminMessage } from '@/lib/adminError';
import { SUSPENSION_REASON } from '@/lib/labels';
import type { SuspensionReason } from '@/lib/types';

/** Pauses a shop. A reason is required, and the team can tell the seller why in the same step. */
export function SuspendSheet({ open, onClose, token, shopId, shopName, onDone }: { open: boolean; onClose: () => void; token: string; shopId: string; shopName: string; onDone: () => void }) {
  const [reason, setReason] = useState<SuspensionReason | ''>('');
  const [note, setNote] = useState('');
  const [tell, setTell] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!reason) return;
    setSaving(true);
    setError(null);
    try {
      await setAdminShopStatus(token, shopId, { status: 'SUSPENDED', reason, note: note.trim() || undefined, notifySeller: tell });
      setReason('');
      setNote('');
      setTell(false);
      onDone();
    } catch (err) {
      setError(adminMessage(err, "Couldn't reach the server."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Sheet open={open} onClose={onClose} title={`Suspend ${shopName}`}>
      <form onSubmit={submit} className="stack">
        <div className="stack stack--sm">
          <h2>Suspend {shopName}?</h2>
          <p className="text-secondary">The shop is paused straight away. You can bring it back at any time.</p>
        </div>
        <ul className="admin-bullets text-secondary">
          <li>The seller can&apos;t sign in.</li>
          <li>Buyers who message the shop are handed to the seller instead of the assistant.</li>
          <li>Nothing is deleted. Catalog, orders and chats stay as they are.</li>
        </ul>
        {error && <Alert variant="danger">{error}</Alert>}
        <div className="field">
          <label className="field-label" htmlFor="suspend-reason">
            Reason
          </label>
          <select id="suspend-reason" className="select" value={reason} onChange={(e) => setReason(e.target.value as SuspensionReason | '')}>
            <option value="">Choose a reason</option>
            {(Object.keys(SUSPENSION_REASON) as SuspensionReason[]).map((key) => (
              <option key={key} value={key}>
                {SUSPENSION_REASON[key]}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label className="field-label" htmlFor="suspend-note">
            Note for the team
          </label>
          <textarea id="suspend-note" className="textarea" placeholder="Only admins see this." value={note} onChange={(e) => setNote(e.target.value)} />
        </div>
        <label className="cluster cluster--sm">
          <input type="checkbox" checked={tell} onChange={(e) => setTell(e.target.checked)} />
          <span>Message the seller to tell them it&apos;s paused</span>
        </label>
        <div className="form-actions">
          <button type="button" className="btn btn--secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn--danger" disabled={!reason || saving}>
            {saving ? 'Suspending…' : 'Suspend shop'}
          </button>
        </div>
      </form>
    </Sheet>
  );
}

'use client';

import { useState } from 'react';
import { answerHandoff, takeoverHandoff } from '@/lib/apiClient';
import type { FeedHandoff, HandoffReason } from '@/lib/types';

const REASON_LABELS: Record<HandoffReason, string> = {
  PRICE_NEGOTIATION: 'Price question',
  COMPLAINT: 'Complaint',
  MONEY_DISPUTE: 'Payment dispute',
  OUT_OF_CATALOG: 'Asked about something not in your catalog',
  UNSUPPORTED_REQUEST: "Sent something she can't handle",
  GUARDRAIL: 'Needs your input',
  LOW_CONFIDENCE_MATCH: 'Not sure about a photo match',
  NO_MATCH: "Couldn't match a photo to your catalog",
};

export function HandoffCard({ handoff, token, onAction }: { handoff: FeedHandoff; token: string; onAction: () => void }) {
  const [reply, setReply] = useState(handoff.suggestedReply ?? '');
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  async function run(action: () => Promise<unknown>) {
    setBusy(true);
    setActionError(null);
    try {
      await action();
      onAction();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card">
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <span className="pill">{REASON_LABELS[handoff.reason]}</span>
        {handoff.shortCode && <span className="pill">{handoff.shortCode}</span>}
      </div>
      <p style={{ margin: '0.5rem 0' }}>Buyer asked: &ldquo;{handoff.buyerQuestion}&rdquo;</p>
      <textarea
        rows={3}
        value={reply}
        onChange={(event) => setReply(event.target.value)}
        style={{ width: '100%' }}
      />
      {actionError && <p className="pill pill-danger">{actionError}</p>}
      <div className="row" style={{ marginTop: '0.5rem' }}>
        <button disabled={busy || !reply.trim()} onClick={() => run(() => answerHandoff(token, handoff._id, reply.trim()))}>
          Send
        </button>
        <button className="secondary" disabled={busy} onClick={() => run(() => takeoverHandoff(token, handoff._id))}>
          Take over this chat
        </button>
      </div>
    </div>
  );
}

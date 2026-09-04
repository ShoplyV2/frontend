'use client';

import { useState } from 'react';
import { answerHandoff, takeoverHandoff } from '@/lib/apiClient';
import { sellerMessage } from '@/lib/errorMessage';
import { HANDOFF_REASON } from '@/lib/labels';
import { timeAgo, timeLeft } from '@/lib/time';
import { useNow } from '@/lib/useNow';
import { useConfirm } from '@/components/ui/ConfirmProvider';
import { Alert } from '@/components/ui/Alert';
import type { FeedHandoff } from '@/lib/types';

export function HandoffCard({ handoff, token, onAction }: { handoff: FeedHandoff; token: string; onAction: () => void }) {
  const now = useNow(1000);
  const confirm = useConfirm();
  const [reply, setReply] = useState(handoff.suggestedReply ?? '');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const deadline = handoff.timeoutAt && now != null ? timeLeft(handoff.timeoutAt, now) : null;

  async function handleSend() {
    setBusy(true);
    setActionError(null);
    try {
      await answerHandoff(token, handoff._id, reply.trim());
      setSent(true);
      setTimeout(onAction, 1600);
    } catch (err) {
      setActionError(sellerMessage(err, 'Could not send your reply.'));
      setBusy(false);
    }
  }

  async function handleTakeover() {
    const ok = await confirm({
      title: 'Take this chat over yourself?',
      body: (
        <>
          Your assistant will stop replying to this buyer. Message them from your own WhatsApp or Telegram. When you&apos;re done, send{' '}
          <strong>HANDBACK {handoff.shortCode}</strong> in your chat app and your assistant takes over again.
        </>
      ),
      confirmLabel: "Yes, I'll handle it",
    });
    if (!ok) return;
    setBusy(true);
    setActionError(null);
    try {
      await takeoverHandoff(token, handoff._id);
      onAction();
    } catch (err) {
      setActionError(sellerMessage(err, 'Could not take over that chat.'));
      setBusy(false);
    }
  }

  if (sent) {
    return (
      <div className="card">
        <Alert variant="success">Sent to the buyer.</Alert>
      </div>
    );
  }

  return (
    <div className="card stack stack--sm">
      <div className="split">
        <span className="badge">{HANDOFF_REASON[handoff.reason]}</span>
        <div className="cluster cluster--sm">
          {handoff.shortCode && <span className="badge badge--muted">Chat code {handoff.shortCode}</span>}
          {deadline && <span className={`badge badge--${deadline.urgent ? 'danger' : 'muted'}`}>{deadline.text}</span>}
        </div>
      </div>

      <p>
        Buyer asked: &ldquo;{handoff.buyerQuestion}&rdquo;
        {now != null && <span className="text-sm text-muted"> · asked {timeAgo(handoff.askedAt, now)}</span>}
      </p>

      <div className="field">
        <span className="field-label">
          {handoff.suggestedReply ? (
            <>
              Suggested reply — edit before you send <span className="badge badge--accent">AI draft</span>
            </>
          ) : (
            'Your reply'
          )}
        </span>
        <textarea className="textarea" rows={3} value={reply} onChange={(event) => setReply(event.target.value)} placeholder="Type your reply to the buyer" />
      </div>

      {handoff.shortCode && <p className="field-hint">You can also answer from WhatsApp: reply &lsquo;{handoff.shortCode} your message&rsquo;.</p>}

      {actionError && <Alert variant="danger" inline>{actionError}</Alert>}

      <div className="cluster">
        <button type="button" className="btn btn--primary" disabled={busy || !reply.trim()} onClick={handleSend}>
          Send reply
        </button>
        <button type="button" className="btn btn--secondary" disabled={busy} onClick={handleTakeover}>
          I&apos;ll chat to them myself
        </button>
      </div>
    </div>
  );
}

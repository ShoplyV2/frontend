'use client';

import { useState } from 'react';
import { answerHandoff, takeoverHandoff } from '@/lib/apiClient';
import { sellerMessage } from '@/lib/errorMessage';
import { HANDOFF_REASON } from '@/lib/labels';
import { timeLeft } from '@/lib/time';
import { useNow } from '@/lib/useNow';
import { useConfirm } from '@/components/ui/ConfirmProvider';
import { Alert } from '@/components/ui/Alert';
import { ConversationView } from '@/components/home/ConversationView';
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
      <div className="card stack stack--panel">
        <Alert variant="success">Sent to the buyer.</Alert>
      </div>
    );
  }

  return (
    <div className="card stack stack--panel">
      <div className="cluster">
        <h2>Question from a buyer</h2>
        {handoff.shortCode && <span className="badge badge--muted badge--code">Code {handoff.shortCode}</span>}
        {deadline && <span className={`badge badge--${deadline.urgent ? 'danger' : 'accent'}`}>{deadline.text}</span>}
        <span className="text-xs text-muted handoff-reason">{HANDOFF_REASON[handoff.reason]}</span>
      </div>

      <ConversationView token={token} conversationId={handoff.conversationId} version={handoff.status} highlightLast />

      <div className="field">
        <label className="field-label" htmlFor={`reply-${handoff._id}`}>
          {handoff.suggestedReply ? (
            <>
              Suggested reply — edit before you send <span className="badge badge--accent">AI draft</span>
            </>
          ) : (
            'Your reply'
          )}
        </label>
        <textarea id={`reply-${handoff._id}`} className="textarea" rows={3} value={reply} onChange={(event) => setReply(event.target.value)} placeholder="Type your reply to the buyer" />
        {handoff.shortCode && <p className="field-hint">You can also answer from WhatsApp: reply &lsquo;{handoff.shortCode} your message&rsquo;.</p>}
      </div>

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

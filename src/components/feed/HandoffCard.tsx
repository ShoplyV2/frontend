'use client';

import { useState } from 'react';
import { answerHandoff, takeoverConversation } from '@/lib/apiClient';
import { sellerMessage } from '@/lib/errorMessage';
import { HANDOFF_REASON } from '@/lib/labels';
import { timeLeft } from '@/lib/time';
import { useNow } from '@/lib/useNow';
import { useConfirm } from '@/components/ui/ConfirmProvider';
import { Alert } from '@/components/ui/Alert';
import { ConversationView } from '@/components/home/ConversationView';
import type { FeedHandoff } from '@/lib/types';

export function HandoffCard({ handoff, token, onAction, onTakenOver }: { handoff: FeedHandoff; token: string; onAction: () => void; onTakenOver?: (conversationId: string) => void }) {
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
      body: 'Your assistant will stop replying to this buyer, and you can write to them right here. You can hand the chat back whenever you like.',
      confirmLabel: "Yes, I'll handle it",
    });
    if (!ok) return;
    setBusy(true);
    setActionError(null);
    try {
      await takeoverConversation(token, handoff.conversationId);
      onAction();
      onTakenOver?.(handoff.conversationId);
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
        {handoff.shortCode && <p className="field-hint">You can also answer from your chat app: reply &lsquo;{handoff.shortCode} your message&rsquo;.</p>}
      </div>

      {actionError && <Alert variant="danger" inline>{actionError}</Alert>}

      <div className="cluster">
        <button type="button" className="btn btn--primary" disabled={busy || !reply.trim()} onClick={handleSend}>
          Send reply
        </button>
        <button type="button" className="btn btn--secondary" disabled={busy} onClick={handleTakeover}>
          Take over this chat
        </button>
      </div>
    </div>
  );
}

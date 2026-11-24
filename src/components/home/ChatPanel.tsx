'use client';

import { useEffect, useState } from 'react';
import { ApiError, getConversationMessages, handBackConversation, sendSellerMessage, takeoverConversation } from '@/lib/apiClient';
import { sellerMessage } from '@/lib/errorMessage';
import { useFeed } from '@/components/shell/FeedProvider';
import { useConfirm } from '@/components/ui/ConfirmProvider';
import { useToast } from '@/components/ui/ToastProvider';
import { Alert } from '@/components/ui/Alert';
import { ChatLog } from '@/components/home/ChatLog';
import type { ConversationMode, TranscriptMessage } from '@/lib/types';

type ChatState = { status: 'loading' } | { status: 'error' } | { status: 'ready'; messages: TranscriptMessage[]; mode: ConversationMode };

/**
 * One buyer chat you can take over. While your assistant has it, you see the conversation and a
 * "Take over this chat" button. Once you have taken it over, the assistant stays out of it: you get a
 * box to write to the buyer, and "Hand back to assistant" when you are done (the assistant also
 * takes it back by itself after a couple of hours without a message from you). Updates live — the
 * feed tells it when the buyer writes.
 */
export function ChatPanel({ token, conversationId, onChanged }: { token: string; conversationId: string; onChanged?: () => void }) {
  const { conversationTick, refresh } = useFeed();
  const confirm = useConfirm();
  const toast = useToast();
  const [state, setState] = useState<ChatState>({ status: 'loading' });
  const [reloads, setReloads] = useState(0);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getConversationMessages(token, conversationId)
      .then((res) => {
        if (!cancelled) setState({ status: 'ready', messages: res.messages, mode: res.mode });
      })
      .catch(() => {
        if (!cancelled) setState({ status: 'error' });
      });
    return () => {
      cancelled = true;
    };
  }, [token, conversationId, conversationTick, reloads]);

  // Something changed that the rest of the app shows too (the Home list, the badge): fetch the chat
  // again here and ask the feed to catch up.
  function changed() {
    setReloads((n) => n + 1);
    void refresh();
    onChanged?.();
  }

  async function handleTakeover() {
    const ok = await confirm({
      title: 'Take this chat over?',
      body: 'Your assistant will stop replying to this buyer, and you can write to them right here. You can hand the chat back whenever you like.',
      confirmLabel: "Yes, I'll handle it",
    });
    if (!ok) return;
    setBusy(true);
    setActionError(null);
    try {
      await takeoverConversation(token, conversationId);
      changed();
    } catch (err) {
      setActionError(sellerMessage(err, 'Could not take over that chat.'));
    } finally {
      setBusy(false);
    }
  }

  async function handleHandBack() {
    const ok = await confirm({
      title: 'Hand this chat back?',
      body: 'Your assistant will answer this buyer from now on.',
      confirmLabel: 'Hand back',
    });
    if (!ok) return;
    setBusy(true);
    setActionError(null);
    try {
      await handBackConversation(token, conversationId);
      toast({ tone: 'success', text: 'Handed back to your assistant.' });
      changed();
    } catch (err) {
      setActionError(sellerMessage(err, 'Could not hand that chat back.'));
    } finally {
      setBusy(false);
    }
  }

  async function handleSend() {
    const text = draft.trim();
    if (!text) return;
    setBusy(true);
    setActionError(null);
    try {
      await sendSellerMessage(token, conversationId, text);
      setDraft('');
      changed();
    } catch (err) {
      // The server words a failed send for the seller (e.g. WhatsApp's 24-hour rule); the generic
      // "service isn't responding" copy would hide the reason they need.
      setActionError(err instanceof ApiError && err.code === 'UPSTREAM_ERROR' ? err.message : sellerMessage(err, 'Could not send that message.'));
    } finally {
      setBusy(false);
    }
  }

  if (state.status === 'loading') return <p className="text-sm text-muted">Loading the conversation…</p>;
  if (state.status === 'error') return <p className="text-sm text-muted">Could not load the conversation.</p>;

  const youHaveIt = state.mode === 'SELLER_TAKEOVER';

  return (
    <div className="stack">
      {youHaveIt && (
        <div className="note chat-control">
          <p>You&apos;re in control. Your assistant is paused and won&apos;t reply to this buyer until you hand the chat back.</p>
          <button type="button" className="btn btn--secondary btn--sm" disabled={busy} onClick={handleHandBack}>
            Hand back to assistant
          </button>
        </div>
      )}

      {state.messages.length === 0 ? <p className="text-sm text-muted">No messages to show yet.</p> : <ChatLog messages={state.messages} />}

      {actionError && <Alert variant="danger" inline>{actionError}</Alert>}

      {youHaveIt ? (
        <div className="field">
          <label className="field-label" htmlFor={`compose-${conversationId}`}>
            Message to the buyer
          </label>
          <textarea
            id={`compose-${conversationId}`}
            className="textarea"
            rows={3}
            value={draft}
            maxLength={4000}
            placeholder="Write to the buyer — it goes out from your shop's chat"
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) void handleSend();
            }}
          />
          <p className="field-hint">Your assistant takes the chat back by itself after two hours without a message from you.</p>
          <div className="cluster">
            <button type="button" className="btn btn--primary" disabled={busy || !draft.trim()} onClick={handleSend}>
              Send
            </button>
          </div>
        </div>
      ) : (
        <div className="cluster">
          <button type="button" className="btn btn--secondary" disabled={busy} onClick={handleTakeover}>
            Take over this chat
          </button>
        </div>
      )}
    </div>
  );
}

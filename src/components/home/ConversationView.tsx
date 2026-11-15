'use client';

import { useEffect, useRef, useState } from 'react';
import { getConversationMessages } from '@/lib/apiClient';
import type { TranscriptMessage } from '@/lib/types';

/**
 * What the buyer and your assistant have said, oldest first, newest at the bottom. `version` is
 * anything that changes when the thread may have moved on (a handoff answered, an order's status),
 * so the transcript is fetched again then.
 */
export function ConversationView({ token, conversationId, version, highlightLast = false }: { token: string; conversationId: string; version?: string; highlightLast?: boolean }) {
  const [state, setState] = useState<{ status: 'loading' } | { status: 'error' } | { status: 'ready'; messages: TranscriptMessage[] }>({ status: 'loading' });
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    getConversationMessages(token, conversationId)
      .then((res) => {
        if (!cancelled) setState({ status: 'ready', messages: res.messages });
      })
      .catch(() => {
        if (!cancelled) setState({ status: 'error' });
      });
    return () => {
      cancelled = true;
    };
  }, [token, conversationId, version]);

  useEffect(() => {
    if (state.status === 'ready') endRef.current?.scrollIntoView({ block: 'nearest' });
  }, [state]);

  if (state.status === 'loading') return <p className="text-sm text-muted">Loading the conversation…</p>;
  if (state.status === 'error') return <p className="text-sm text-muted">Could not load the conversation.</p>;
  if (state.messages.length === 0) return <p className="text-sm text-muted">No messages to show yet.</p>;

  return (
    <div className="chat" role="log" aria-label="Conversation with the buyer">
      {state.messages.map((m, i) => {
        const isPendingQuestion = highlightLast && i === state.messages.length - 1 && m.role !== 'assistant';
        return (
          <div key={`${m.at}-${i}`} className={`chat-row chat-row--${m.role}`}>
            <p className={`chat-bubble${isPendingQuestion ? ' chat-bubble--ask' : ''}`}>
              {m.role === 'assistant' && <span className="chat-who">Your assistant</span>}
              {m.hasMedia && <span className="chat-media">Sent a photo</span>}
              {m.text}
            </p>
          </div>
        );
      })}
      <div ref={endRef} />
    </div>
  );
}

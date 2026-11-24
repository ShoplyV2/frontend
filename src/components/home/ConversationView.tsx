'use client';

import { useEffect, useState } from 'react';
import { getConversationMessages } from '@/lib/apiClient';
import { useFeed } from '@/components/shell/FeedProvider';
import { ChatLog } from '@/components/home/ChatLog';
import type { TranscriptMessage } from '@/lib/types';

/**
 * What the buyer and your assistant have said, oldest first, newest at the bottom — read-only
 * context next to a question or an order. `version` is anything that changes when the thread may
 * have moved on (a handoff answered, an order's status); it is also fetched again whenever the
 * live feed reports a chat changed. To write to the buyer, see ChatPanel.
 */
export function ConversationView({ token, conversationId, version, highlightLast = false }: { token: string; conversationId: string; version?: string; highlightLast?: boolean }) {
  const { conversationTick } = useFeed();
  const [state, setState] = useState<{ status: 'loading' } | { status: 'error' } | { status: 'ready'; messages: TranscriptMessage[] }>({ status: 'loading' });

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
  }, [token, conversationId, version, conversationTick]);

  if (state.status === 'loading') return <p className="text-sm text-muted">Loading the conversation…</p>;
  if (state.status === 'error') return <p className="text-sm text-muted">Could not load the conversation.</p>;
  if (state.messages.length === 0) return <p className="text-sm text-muted">No messages to show yet.</p>;

  return <ChatLog messages={state.messages} highlightLast={highlightLast} />;
}

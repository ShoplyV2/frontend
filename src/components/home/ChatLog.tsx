'use client';

import { useEffect, useRef } from 'react';
import type { TranscriptMessage } from '@/lib/types';

const WHO: Partial<Record<TranscriptMessage['role'], string>> = { assistant: 'Your assistant', seller: 'You' };

/** The messages of one buyer chat, oldest first, newest at the bottom. */
export function ChatLog({ messages, highlightLast = false }: { messages: TranscriptMessage[]; highlightLast?: boolean }) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'nearest' });
  }, [messages]);

  return (
    <div className="chat" role="log" aria-label="Conversation with the buyer">
      {messages.map((m, i) => {
        const isPendingQuestion = highlightLast && i === messages.length - 1 && m.role === 'buyer';
        const who = WHO[m.role];
        return (
          <div key={`${m.at}-${i}`} className={`chat-row chat-row--${m.role}`}>
            <p className={`chat-bubble${isPendingQuestion ? ' chat-bubble--ask' : ''}`}>
              {who && <span className="chat-who">{who}</span>}
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

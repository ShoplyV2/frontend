'use client';

import { HandoffCard } from './HandoffCard';
import type { FeedHandoff } from '@/lib/types';

export function HandoffQueue({ handoffs, token, onAction }: { handoffs: FeedHandoff[]; token: string; onAction: () => void }) {
  if (handoffs.length === 0) return null;

  return (
    <section>
      <h2 style={{ margin: '1rem 0 0.5rem' }}>Needs your input ({handoffs.length})</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {handoffs.map((handoff) => (
          <HandoffCard key={handoff._id} handoff={handoff} token={token} onAction={onAction} />
        ))}
      </div>
    </section>
  );
}

import type { ReactNode } from 'react';

export function FeedSection({
  title,
  count,
  emptyTitle,
  emptyBody,
  children,
}: {
  title: string;
  count?: number;
  emptyTitle: string;
  emptyBody: string;
  children: ReactNode[];
}) {
  return (
    <section className="section">
      <p className="section-title">
        {title}
        {count !== undefined ? ` (${count})` : ''}
      </p>
      {children.length === 0 ? (
        <div className="empty-state" style={{ padding: 'var(--space-6) var(--space-4)' }}>
          <p className="empty-state-title">{emptyTitle}</p>
          <p>{emptyBody}</p>
        </div>
      ) : (
        <div className="stack">{children}</div>
      )}
    </section>
  );
}

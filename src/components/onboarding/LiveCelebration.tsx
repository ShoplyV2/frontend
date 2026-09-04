'use client';

import Link from 'next/link';

export function LiveCelebration() {
  return (
    <div className="page--centered stack" style={{ alignItems: 'center', textAlign: 'center', gap: 'var(--space-4)' }}>
      <span style={{ fontSize: '3rem' }} aria-hidden="true">
        🎉
      </span>
      <h1>Your shop is open.</h1>
      <p style={{ maxInlineSize: '28rem' }}>
        Buyers can message your shop now, and your assistant will answer them. Anything it can&apos;t handle shows up under Orders.
      </p>
      <div className="cluster" style={{ justifyContent: 'center' }}>
        <Link href="/catalog" className="btn btn--primary">
          See my catalog
        </Link>
        <Link href="/onboarding" className="btn btn--secondary">
          Back to setup
        </Link>
      </div>
    </div>
  );
}

'use client';

import { useOnline } from '@/lib/useOnline';

export function OfflineBanner() {
  const online = useOnline();
  if (online) return null;

  return (
    <div className="alert alert--warning alert--flush" role="status">
      <div className="alert-body">You&apos;re offline. You can look around, but changes won&apos;t save until you&apos;re back.</div>
    </div>
  );
}

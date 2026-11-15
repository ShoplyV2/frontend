'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PageSkeleton } from '@/components/ui/PageSkeleton';

/**
 * What a signed-out visitor sees on any page that needs a seller session: a skeleton for the
 * instant it takes to send them to /login. Replaces the old shop-key box (TokenGate).
 */
export function RequireLogin() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/login');
  }, [router]);

  return (
    <div className="page">
      <PageSkeleton />
    </div>
  );
}

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { TokenGate } from '@/components/TokenGate';
import { PageSkeleton } from '@/components/ui/PageSkeleton';
import { useFeedToken } from '@/lib/useFeedToken';

// The front door. Signed-in sellers go straight into the app; everyone else sees sign-in. This is
// the seller side only — the team's tooling lives under /admin and is not linked from here.
export default function HomeRedirect() {
  const router = useRouter();
  const { token, setToken, hydrated } = useFeedToken();

  useEffect(() => {
    if (hydrated && token) router.replace('/catalog');
  }, [hydrated, token, router]);

  if (!hydrated || token) {
    return (
      <div className="page">
        <PageSkeleton />
      </div>
    );
  }
  return <TokenGate onSubmit={setToken} />;
}

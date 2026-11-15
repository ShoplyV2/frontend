'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PageSkeleton } from '@/components/ui/PageSkeleton';
import { useFeedToken } from '@/lib/useFeedToken';

// The front door. Signed-in sellers go straight into the app, everyone else to login. The team's
// tooling lives under /admin and is not linked from anywhere a seller can see.
export default function HomeRedirect() {
  const router = useRouter();
  const { token, hydrated } = useFeedToken();

  useEffect(() => {
    if (hydrated) router.replace(token ? '/catalog' : '/login');
  }, [hydrated, token, router]);

  return (
    <div className="page">
      <PageSkeleton />
    </div>
  );
}

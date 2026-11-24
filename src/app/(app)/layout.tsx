'use client';

import type { ReactNode } from 'react';
import { RequireLogin } from '@/components/RequireLogin';
import { AppShell } from '@/components/shell/AppShell';
import { FeedProvider } from '@/components/shell/FeedProvider';
import { ShopProvider } from '@/components/shell/ShopProvider';
import { PageSkeleton } from '@/components/ui/PageSkeleton';
import { useFeedToken } from '@/lib/useFeedToken';

/**
 * Everything a signed-in seller sees. The session gate, the shop data and the live orders feed live
 * here, once, so pages don't repeat them and nothing remounts when the seller moves between tabs.
 */
export default function SignedInLayout({ children }: { children: ReactNode }) {
  const { token, setToken, hydrated } = useFeedToken();

  if (!hydrated) {
    return (
      <div className="page">
        <PageSkeleton />
      </div>
    );
  }
  if (!token) return <RequireLogin />;

  return (
    <ShopProvider token={token} setToken={setToken}>
      <FeedProvider>
        <AppShell>{children}</AppShell>
      </FeedProvider>
    </ShopProvider>
  );
}

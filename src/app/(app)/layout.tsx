'use client';

import type { ReactNode } from 'react';
import { RequireLogin } from '@/components/RequireLogin';
import { AppShell } from '@/components/shell/AppShell';
import { ShopProvider } from '@/components/shell/ShopProvider';
import { PageSkeleton } from '@/components/ui/PageSkeleton';
import { useFeedToken } from '@/lib/useFeedToken';

/**
 * Everything a signed-in seller sees. The session gate and the shop data live here, once, so pages
 * don't repeat them and the shell doesn't remount when the seller moves between tabs.
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
      <AppShell>{children}</AppShell>
    </ShopProvider>
  );
}

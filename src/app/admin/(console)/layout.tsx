'use client';

import { useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { AdminProvider } from '@/components/admin/AdminProvider';
import { AdminShell } from '@/components/admin/AdminShell';
import { PageSkeleton } from '@/components/ui/PageSkeleton';
import { useAdminToken } from '@/lib/useAdminToken';

/**
 * Everything the team sees once signed in. The session gate lives here, once: no admin token (or one
 * the server stopped accepting) goes to /admin/login, which sits outside this route group so it is
 * not wrapped in the shell.
 */
export default function AdminConsoleLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { token, setToken, hydrated } = useAdminToken();

  useEffect(() => {
    if (hydrated && !token) router.replace('/admin/login');
  }, [hydrated, token, router]);

  if (!hydrated || !token) {
    return (
      <div className="page">
        <PageSkeleton />
      </div>
    );
  }

  return (
    <AdminProvider token={token} setToken={setToken}>
      <AdminShell>{children}</AdminShell>
    </AdminProvider>
  );
}

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { Wordmark } from '@/components/ui/Wordmark';
import { NavIcon } from '@/components/shell/navItems';
import { OfflineBanner } from '@/components/shell/OfflineBanner';
import { useAdmin } from './AdminProvider';
import { AdminSidebar } from './AdminSidebar';
import { ADMIN_NAV, isAdminNavActive } from './adminNav';

/** The team's signed-in frame, the same shape as the seller's AppShell: sidebar (desktop) or tab bar (phone), a top bar, the page. */
export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { overview, signOut } = useAdmin();

  return (
    <div className="app-shell">
      <a href="#main" className="btn btn--secondary visually-hidden">
        Skip to content
      </a>
      <AdminSidebar />
      <div className="app-main">
        <header className="topbar">
          <span className="topbar-brand">
            <Wordmark size="sm" href="/admin" />
          </span>
          <div className="topbar-actions">
            <span className="badge badge--warning">Team only</span>
            <button type="button" className="btn btn--secondary topbar-btn admin-signout" onClick={signOut}>
              Sign out
            </button>
          </div>
        </header>
        <OfflineBanner />
        <main id="main">{children}</main>
      </div>
      <nav className="tabbar" aria-label="Main">
        {ADMIN_NAV.map((item) => (
          <Link key={item.key} href={item.href} className="tabbar-item" aria-current={isAdminNavActive(pathname, item.href) ? 'page' : undefined}>
            <NavIcon path={item.icon} />
            <span>{item.key === 'usage' ? 'Usage' : item.label}</span>
            {item.key === 'shops' && overview && overview.queue.total > 0 && (
              <span className="tabbar-badge" aria-label={`${overview.queue.total} need attention`}>
                {overview.queue.total}
              </span>
            )}
          </Link>
        ))}
      </nav>
    </div>
  );
}

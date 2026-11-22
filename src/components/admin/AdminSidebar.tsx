'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Wordmark } from '@/components/ui/Wordmark';
import { ATTENTION } from '@/lib/labels';
import { NavIcon } from '@/components/shell/navItems';
import type { AttentionKind } from '@/lib/types';
import { useAdmin } from './AdminProvider';
import { ADMIN_NAV, isAdminNavActive } from './adminNav';

// The queues that get their own row under "Needs you"; "Over plan" shows only on the Overview page.
const QUEUES: AttentionKind[] = ['WHATSAPP_REQUESTED', 'TRIAL_ENDING', 'STUCK_IN_SETUP'];

/** The desktop left rail. Phones get the tab bar instead (shown/hidden in layout.css). */
export function AdminSidebar() {
  const pathname = usePathname();
  const { overview, signOut } = useAdmin();
  const queue = overview?.queue;

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <Wordmark size="sm" href="/admin" />
      </div>

      <nav className="sidebar-nav" aria-label="Main">
        {ADMIN_NAV.map((item) => (
          <Link key={item.key} href={item.href} className="navlink" aria-current={isAdminNavActive(pathname, item.href) ? 'page' : undefined}>
            <NavIcon path={item.icon} />
            <span>{item.label}</span>
            {item.key === 'shops' && queue && queue.total > 0 && (
              <span className="navlink-badge" aria-label={`${queue.total} need attention`}>
                {queue.total}
              </span>
            )}
          </Link>
        ))}
      </nav>

      <div className="sidebar-section">
        <p className="sidebar-section-title">Needs you</p>
        {QUEUES.map((kind) => (
          <Link key={kind} href={`/admin/shops?needs=${kind}`} className={`status-row${queue?.[kind] ? '' : ' status-row--off'}`}>
            <span className={`status-dot${queue?.[kind] ? '' : ' status-dot--off'}`} aria-hidden="true" />
            <span>{ATTENTION[kind].label}</span>
            <span className="status-row-note">{queue?.[kind] ?? 0}</span>
          </Link>
        ))}
      </div>

      <div className="sidebar-shop">
        <span className="avatar" aria-hidden="true">
          A
        </span>
        <div className="sidebar-shop-text">
          <p className="truncate sidebar-shop-name">Admin</p>
          <p className="text-xs text-muted">Team only</p>
        </div>
        <button type="button" className="btn btn--ghost btn--icon sidebar-signout" aria-label="Sign out" title="Sign out" onClick={signOut}>
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M9 4H6a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h3M16 8l4 4-4 4M20 12H10" />
          </svg>
        </button>
      </div>
    </aside>
  );
}

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

type NavKey = 'catalog' | 'feed' | 'onboarding';

const ICONS: Record<NavKey, string> = {
  catalog: 'M4 7l8-4 8 4v10a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1V7z',
  feed: 'M5 4h14a1 1 0 0 1 1 1v11l-4-3H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z',
  onboarding: 'M12 2l2.4 4.9 5.4.8-3.9 3.8.9 5.4-4.8-2.5-4.8 2.5.9-5.4-3.9-3.8 5.4-.8z',
};

const TABS: Array<{ key: NavKey; href: '/catalog' | '/feed' | '/onboarding'; label: string }> = [
  { key: 'catalog', href: '/catalog', label: 'Catalog' },
  { key: 'feed', href: '/feed', label: 'Orders' },
  { key: 'onboarding', href: '/onboarding', label: 'Setup' },
];

function Icon({ path }: { path: string }) {
  return (
    <svg className="appnav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={path} />
    </svg>
  );
}

export function AppNav({ setupBadgeCount = 0, shopName, onOpenAccount }: { setupBadgeCount?: number; shopName?: string; onOpenAccount: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="appnav" aria-label="Main">
      {TABS.map((tab) => {
        const isActive = pathname === tab.href || pathname?.startsWith(`${tab.href}/`);
        const badge = tab.key === 'onboarding' && setupBadgeCount > 0 ? setupBadgeCount : null;
        return (
          <Link key={tab.key} href={tab.href} className="appnav-item" aria-current={isActive ? 'page' : undefined}>
            <Icon path={ICONS[tab.key]} />
            <span>{tab.label}</span>
            {badge !== null && (
              <span className="appnav-badge" aria-label={`${badge} steps left`}>
                {badge}
              </span>
            )}
          </Link>
        );
      })}
      <span className="appnav-spacer" />
      {/* Desktop-only account row — pinned to the bottom of the sidebar; on mobile the avatar
          button in the topbar opens the same sheet, so this is hidden there via CSS. */}
      <button type="button" className="appnav-item appnav-account" onClick={onOpenAccount}>
        <svg className="appnav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
          <circle cx="12" cy="8" r="3.2" />
          <path d="M5 20c1.2-3.6 4-5.5 7-5.5s5.8 1.9 7 5.5" />
        </svg>
        <span className="truncate">{shopName ?? 'Account'}</span>
      </button>
    </nav>
  );
}

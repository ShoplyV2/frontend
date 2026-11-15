'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

type NavKey = 'home' | 'feed' | 'catalog';

const ICONS: Record<NavKey, string> = {
  home: 'M4 11l8-7 8 7v8a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1v-8z',
  feed: 'M5 4h14a1 1 0 0 1 1 1v11l-4-3H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z',
  catalog: 'M6 8h12l1 12H5L6 8zM9 8a3 3 0 0 1 6 0',
};

const TABS: Array<{ key: NavKey; href: '/home' | '/feed' | '/catalog'; label: string }> = [
  { key: 'home', href: '/home', label: 'Home' },
  { key: 'feed', href: '/feed', label: 'Orders' },
  { key: 'catalog', href: '/catalog', label: 'Catalog' },
];

function Icon({ path }: { path: string }) {
  return (
    <svg className="appnav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={path} />
    </svg>
  );
}

export function AppNav({ shopName, onOpenAccount }: { shopName?: string; onOpenAccount: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="appnav" aria-label="Main">
      {TABS.map((tab) => {
        const isActive = pathname === tab.href || pathname?.startsWith(`${tab.href}/`);
        return (
          <Link key={tab.key} href={tab.href} className="appnav-item" aria-current={isActive ? 'page' : undefined}>
            <Icon path={ICONS[tab.key]} />
            <span>{tab.label}</span>
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

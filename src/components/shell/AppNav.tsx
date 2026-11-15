'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Wordmark } from '@/components/ui/Wordmark';

type NavKey = 'home' | 'feed' | 'catalog' | 'shop';

const ICONS: Record<NavKey, string> = {
  home: 'M4 11l8-7 8 7v8a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1v-8z',
  feed: 'M5 4h14a1 1 0 0 1 1 1v11l-4-3H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z',
  catalog: 'M6 8h12l1 12H5L6 8zM9 8a3 3 0 0 1 6 0',
  shop: 'M4 9l1.5-5h13L20 9a2.5 2.5 0 0 1-4 2 2.5 2.5 0 0 1-4 0 2.5 2.5 0 0 1-4 0 2.5 2.5 0 0 1-4-2zM5 12v8h14v-8',
};

const TABS: Array<{ key: NavKey; href: '/home' | '/feed' | '/catalog' | '/shop'; label: string }> = [
  { key: 'home', href: '/home', label: 'Home' },
  { key: 'feed', href: '/feed', label: 'Orders' },
  { key: 'catalog', href: '/catalog', label: 'Catalog' },
  { key: 'shop', href: '/shop', label: 'Shop' },
];

function Icon({ path }: { path: string }) {
  return (
    <svg className="appnav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={path} />
    </svg>
  );
}

export function AppNav({ shopName }: { shopName?: string }) {
  const pathname = usePathname();

  return (
    <nav className="appnav" aria-label="Main">
      <span className="appnav-brand">
        <Wordmark size="sm" href="/home" />
      </span>
      {shopName && <span className="appnav-shopname truncate">{shopName}</span>}
      {TABS.map((tab) => {
        const isActive = pathname === tab.href || pathname?.startsWith(`${tab.href}/`);
        return (
          <Link key={tab.key} href={tab.href} className="appnav-item" aria-current={isActive ? 'page' : undefined}>
            <Icon path={ICONS[tab.key]} />
            <span>{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

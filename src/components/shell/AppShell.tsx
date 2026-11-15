'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { Wordmark } from '@/components/ui/Wordmark';
import { GlobalSearch } from './GlobalSearch';
import { OfflineBanner } from './OfflineBanner';
import { useShop } from './ShopProvider';
import { Sidebar } from './Sidebar';
import { TabBar } from './TabBar';

/**
 * The signed-in frame: sidebar (desktop) or tab bar (phone), a top bar with search, and the page.
 * Rendered once by the (app) layout, so it stays put while pages change inside it.
 */
export function AppShell({ children }: { children: ReactNode }) {
  const { profile } = useShop();

  return (
    <div className="app-shell">
      <a href="#main" className="btn btn--secondary visually-hidden">
        Skip to content
      </a>
      <Sidebar />
      <div className="app-main">
        <header className="topbar">
          <span className="topbar-brand">
            <Wordmark size="sm" href="/home" />
          </span>
          <GlobalSearch />
          <Link href="/catalog/new" className="btn btn--primary btn--sm topbar-add">
            + Add item
          </Link>
        </header>
        <OfflineBanner />
        <main id="main">{children}</main>
        <span className="visually-hidden" aria-live="polite">
          {profile?.shopName}
        </span>
      </div>
      <TabBar />
    </div>
  );
}

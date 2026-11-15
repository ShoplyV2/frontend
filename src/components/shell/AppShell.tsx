'use client';

import type { ReactNode } from 'react';
import { AppNav } from './AppNav';
import { OfflineBanner } from './OfflineBanner';
import { useShopName } from '@/lib/useShopName';

export function AppShell({
  token,
  pageWidth,
  children,
}: {
  token: string;
  pageWidth?: 'narrow' | 'wide';
  children: ReactNode;
}) {
  const shopName = useShopName(token);

  return (
    <div className="app-shell">
      <a href="#main" className="btn btn--secondary visually-hidden">
        Skip to content
      </a>
      <AppNav shopName={shopName} />
      <div className="stack" style={{ minInlineSize: 0 }}>
        <header className="topbar">
          <strong className="truncate">{shopName ?? 'Shoply'}</strong>
        </header>
        <OfflineBanner />
        <main id="main" className={`page${pageWidth ? ` page--${pageWidth}` : ''}`}>
          {children}
        </main>
      </div>
    </div>
  );
}

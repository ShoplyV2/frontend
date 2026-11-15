'use client';

import { useState } from 'react';
import type { ReactNode } from 'react';
import { AppNav } from './AppNav';
import { AccountSheet } from './AccountSheet';
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
  const [accountOpen, setAccountOpen] = useState(false);
  const shopName = useShopName(token);

  return (
    <div className="app-shell">
      <a href="#main" className="btn btn--secondary visually-hidden">
        Skip to content
      </a>
      <AppNav shopName={shopName} onOpenAccount={() => setAccountOpen(true)} />
      <div className="stack" style={{ minInlineSize: 0 }}>
        <header className="topbar">
          <span className="split" style={{ inlineSize: '100%' }}>
            <strong className="truncate">{shopName ?? 'Shoply'}</strong>
            <button
              type="button"
              className="btn btn--ghost btn--icon btn--sm"
              onClick={() => setAccountOpen(true)}
              aria-label="Account"
            >
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                <circle cx="12" cy="8" r="3.2" />
                <path d="M5 20c1.2-3.6 4-5.5 7-5.5s5.8 1.9 7 5.5" strokeLinecap="round" />
              </svg>
            </button>
          </span>
        </header>
        <OfflineBanner />
        <main id="main" className={`page${pageWidth ? ` page--${pageWidth}` : ''}`}>
          {children}
        </main>
      </div>
      <AccountSheet open={accountOpen} onClose={() => setAccountOpen(false)} shopName={shopName} token={token} />
    </div>
  );
}

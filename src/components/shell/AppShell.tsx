'use client';

import Link from 'next/link';
import { useState, type ReactNode } from 'react';
import { Wordmark } from '@/components/ui/Wordmark';
import { Sheet } from '@/components/ui/Sheet';
import { ShareLinks } from '@/components/ShareLinks';
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
  const { profile, channels } = useShop();
  const [shareOpen, setShareOpen] = useState(false);

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
          <div className="topbar-actions">
            <button type="button" className="btn btn--secondary topbar-btn topbar-share" onClick={() => setShareOpen(true)}>
              Share shop link
            </button>
            <Link href="/catalog/new" className="btn btn--primary topbar-btn topbar-add">
              + Add item
            </Link>
            <Link href="/catalog/new" className="btn btn--ghost btn--icon topbar-add-icon" aria-label="Add item">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <path d="M12 5v14M5 12h14" />
              </svg>
            </Link>
          </div>
        </header>
        <OfflineBanner />
        <main id="main">{children}</main>
        <span className="visually-hidden" aria-live="polite">
          {profile?.shopName}
        </span>
      </div>
      <TabBar />

      <Sheet open={shareOpen} onClose={() => setShareOpen(false)} title="Your shop link">
        <div className="stack stack--sm">
          <h2>Your shop link</h2>
          <p className="text-secondary">Share this anywhere your buyers are: your Instagram bio, WhatsApp status, or a direct message.</p>
        </div>
        <ShareLinks shopName={profile?.shopName ?? 'your shop'} channels={channels} />
        <button type="button" className="btn btn--secondary" onClick={() => setShareOpen(false)}>
          Done
        </button>
      </Sheet>
    </div>
  );
}

'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Wordmark } from '@/components/ui/Wordmark';
import { CHANNEL_KIND, SELLER_STATUS } from '@/lib/labels';
import type { ChannelKind, ChannelSummary, SellerProfile } from '@/lib/types';
import { useShop } from './ShopProvider';
import { NAV, NavIcon, isNavActive } from './navItems';

function chatAppStatus(kind: ChannelKind, channels: ChannelSummary[], profile: SellerProfile | null): { label: string; on: boolean } {
  const channel = channels.find((c) => c.kind === kind);
  if (channel?.active && channel.sellerContactId) return { label: 'Connected', on: true };
  if (channel?.active) return { label: 'Waiting', on: false };
  if (kind === 'whatsapp' && profile?.whatsappRequestedAt) return { label: 'Requested', on: false };
  return { label: 'Not set up', on: false };
}

/** The desktop left rail. Phones get the TabBar instead (shown/hidden in layout.css). */
export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { profile, channels, toSendCount, setToken } = useShop();
  const status = profile ? SELLER_STATUS[profile.status] : null;

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <Wordmark size="sm" href="/home" />
      </div>

      <nav className="sidebar-nav" aria-label="Main">
        {NAV.map((item) => (
          <Link key={item.key} href={item.href} className="navlink" aria-current={isNavActive(pathname, item.href) ? 'page' : undefined}>
            <NavIcon path={item.icon} />
            <span>{item.label}</span>
            {item.key === 'orders' && toSendCount > 0 && (
              <span className="navlink-badge" aria-label={`${toSendCount} to send`}>
                {toSendCount}
              </span>
            )}
          </Link>
        ))}
      </nav>

      <div className="sidebar-section">
        <p className="sidebar-section-title">Chat apps</p>
        {(['telegram', 'whatsapp'] as const).map((kind) => {
          const s = chatAppStatus(kind, channels, profile);
          return (
            <div key={kind} className={`status-row${s.on ? '' : ' status-row--off'}`}>
              <span className={`status-dot${s.on ? '' : ' status-dot--off'}`} aria-hidden="true" />
              <span>{CHANNEL_KIND[kind]}</span>
              <span className="status-row-note">{s.label}</span>
            </div>
          );
        })}
      </div>

      <div className="sidebar-shop">
        <span className="avatar" aria-hidden="true">
          {(profile?.shopName ?? 'S').trim().charAt(0).toUpperCase()}
        </span>
        <div className="sidebar-shop-text">
          <p className="truncate sidebar-shop-name">{profile?.shopName ?? 'Your shop'}</p>
          <p className="text-xs text-muted">{status?.label ?? ''}</p>
        </div>
        <button
          type="button"
          className="btn btn--ghost btn--icon sidebar-signout"
          aria-label="Sign out"
          title="Sign out"
          onClick={() => {
            setToken(null);
            router.push('/login');
          }}
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M9 4H6a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h3M16 8l4 4-4 4M20 12H10" />
          </svg>
        </button>
      </div>
    </aside>
  );
}

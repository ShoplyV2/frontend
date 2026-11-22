'use client';

import { SELLER_STATUS } from '@/lib/labels';
import type { ChannelSummary, OnboardingState, SellerProfile } from '@/lib/types';

const CHEVRON = (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M9 6l6 6-6 6" />
  </svg>
);

/**
 * The phone's Shop screen: who you are, then a list that opens one section at a time. Wide screens
 * show every section on one page instead (see the Shop page).
 */
export function ShopMenu({
  profile,
  state,
  channels,
  onOpen,
}: {
  profile: SellerProfile;
  state: OnboardingState;
  channels: ChannelSummary[];
  onOpen: (id: string) => void;
}) {
  const status = SELLER_STATUS[profile.status];
  const connected = channels.filter((c) => c.active && c.sellerContactId != null);
  const link = channels.find((c) => c.buyerLink != null)?.buyerLink?.replace(/^https?:\/\//, '');

  const rows: Array<{ id: string; title: string; note: string; warn?: boolean }> = [
    { id: 'details', title: 'Shop details', note: 'Name and what you sell' },
    { id: 'chat', title: 'Chat apps', note: connected.length > 0 ? `${connected.map((c) => (c.kind === 'telegram' ? 'Telegram' : 'WhatsApp')).join(' and ')} connected` : 'Not set up yet', warn: connected.length === 0 },
    { id: 'payments', title: 'Payments', note: state.payoutConfigured ? 'Bank details saved' : 'Not set up yet', warn: !state.payoutConfigured },
    { id: 'usage', title: 'Plan and usage', note: 'Orders and chats this month' },
    { id: 'notifications', title: 'Notifications', note: 'Order alerts on this phone' },
    { id: 'link', title: 'Your shop link', note: link ?? 'Shows once a chat app is connected' },
    { id: 'account', title: 'Account', note: 'Email and password' },
  ];

  return (
    <>
      <div className="shop-summary">
        <span className="shop-summary-avatar" aria-hidden="true">
          {profile.shopName.trim().charAt(0).toUpperCase() || 'S'}
        </span>
        <div className="shop-summary-text">
          <p className="truncate shop-summary-name">{profile.shopName}</p>
          {profile.email && <p className="truncate text-sm text-muted">{profile.email}</p>}
        </div>
        <span className={`badge badge--${status.tone}`}>{profile.status === 'LIVE' ? 'Open' : status.label}</span>
      </div>

      <ul className="menu-list">
        {rows.map((row) => (
          <li key={row.id}>
            <button type="button" className="menu-row" onClick={() => onOpen(row.id)}>
              <span className="menu-row-text">
                <span className="menu-row-title">{row.title}</span>
                <span className={`menu-row-note${row.warn ? ' menu-row-note--warn' : ''}`}>{row.note}</span>
              </span>
              <span className="menu-row-chevron">{CHEVRON}</span>
            </button>
          </li>
        ))}
      </ul>
    </>
  );
}

'use client';

import Link from 'next/link';

const TABS = [
  { href: '/catalog', label: 'Catalog' },
  { href: '/feed', label: 'Orders & handoffs' },
  { href: '/onboarding', label: 'Shop setup' },
] as const;

export function SellerNav({ active, onSignOut }: { active: '/catalog' | '/feed' | '/onboarding'; onSignOut: () => void }) {
  return (
    <div className="row" style={{ justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
      <div className="row" style={{ gap: '0.4rem' }}>
        {TABS.map((tab) => (
          <Link key={tab.href} href={tab.href}>
            <button className={active === tab.href ? undefined : 'secondary'}>{tab.label}</button>
          </Link>
        ))}
      </div>
      <div className="row" style={{ gap: '0.4rem' }}>
        <Link href="/">
          <button className="secondary">All sellers</button>
        </Link>
        <button className="secondary" onClick={onSignOut}>
          Sign out
        </button>
      </div>
    </div>
  );
}

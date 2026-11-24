'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useNeedsYouCount } from './FeedProvider';
import { NAV, NavIcon, isNavActive } from './navItems';

/** The phone's bottom tab bar. Desktop gets the Sidebar instead (shown/hidden in layout.css). */
export function TabBar() {
  const pathname = usePathname();
  const needsYou = useNeedsYouCount();

  return (
    <nav className="tabbar" aria-label="Main">
      {NAV.map((item) => (
        <Link key={item.key} href={item.href} className="tabbar-item" aria-current={isNavActive(pathname, item.href) ? 'page' : undefined}>
          <NavIcon path={item.icon} />
          <span>{item.label}</span>
          {item.key === 'home' && needsYou > 0 && (
            <span className="tabbar-badge" aria-label={`${needsYou} waiting on you`}>
              {needsYou}
            </span>
          )}
        </Link>
      ))}
    </nav>
  );
}

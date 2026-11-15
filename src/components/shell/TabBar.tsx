'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useShop } from './ShopProvider';
import { NAV, NavIcon, isNavActive } from './navItems';

/** The phone's bottom tab bar. Desktop gets the Sidebar instead (shown/hidden in layout.css). */
export function TabBar() {
  const pathname = usePathname();
  const { toSendCount } = useShop();

  return (
    <nav className="tabbar" aria-label="Main">
      {NAV.map((item) => (
        <Link key={item.key} href={item.href} className="tabbar-item" aria-current={isNavActive(pathname, item.href) ? 'page' : undefined}>
          <NavIcon path={item.icon} />
          <span>{item.label}</span>
          {item.key === 'orders' && toSendCount > 0 && (
            <span className="tabbar-badge" aria-label={`${toSendCount} to send`}>
              {toSendCount}
            </span>
          )}
        </Link>
      ))}
    </nav>
  );
}

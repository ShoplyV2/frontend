// The four places a seller goes, shared by the desktop sidebar and the phone tab bar.

export type NavKey = 'home' | 'orders' | 'catalog' | 'shop';

export const NAV: Array<{ key: NavKey; href: '/home' | '/orders' | '/catalog' | '/shop'; label: string; icon: string }> = [
  { key: 'home', href: '/home', label: 'Home', icon: 'M4 11l8-7 8 7v8a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1v-8z' },
  { key: 'orders', href: '/orders', label: 'Orders', icon: 'M5 4h14a1 1 0 0 1 1 1v11l-4-3H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z' },
  { key: 'catalog', href: '/catalog', label: 'Catalog', icon: 'M6 8h12l1 12H5L6 8zM9 8a3 3 0 0 1 6 0' },
  { key: 'shop', href: '/shop', label: 'Shop', icon: 'M4 9l1.5-5h13L20 9a2.5 2.5 0 0 1-4 2 2.5 2.5 0 0 1-4 0 2.5 2.5 0 0 1-4 0 2.5 2.5 0 0 1-4-2zM5 12v8h14v-8' },
];

export function isNavActive(pathname: string | null, href: string): boolean {
  return pathname === href || (pathname?.startsWith(`${href}/`) ?? false);
}

export function NavIcon({ path }: { path: string }) {
  return (
    <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={path} />
    </svg>
  );
}

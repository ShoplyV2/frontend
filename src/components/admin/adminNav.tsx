// The three places the team goes, shared by the sidebar and the phone tab bar.

export const ADMIN_NAV = [
  { key: 'overview', href: '/admin', label: 'Overview', icon: 'M4 11l8-7 8 7v8a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1v-8z' },
  { key: 'shops', href: '/admin/shops', label: 'Shops', icon: 'M4 9l1.5-5h13L20 9a2.5 2.5 0 0 1-4 2 2.5 2.5 0 0 1-4 0 2.5 2.5 0 0 1-4 0 2.5 2.5 0 0 1-4-2zM5 12v8h14v-8' },
  { key: 'usage', href: '/admin/usage', label: 'Usage and cost', icon: 'M5 20V10M12 20V4M19 20v-7' },
] as const;

/** "/admin" is only the Overview itself; every other item owns the paths beneath it. */
export function isAdminNavActive(pathname: string | null, href: string): boolean {
  if (href === '/admin') return pathname === '/admin';
  return pathname === href || (pathname?.startsWith(`${href}/`) ?? false);
}

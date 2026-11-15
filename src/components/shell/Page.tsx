import type { ReactNode } from 'react';

/** The padded, width-limited column every page's content sits in. */
export function Page({ width, children }: { width?: 'narrow' | 'wide'; children: ReactNode }) {
  return <div className={`page${width ? ` page--${width}` : ''}`}>{children}</div>;
}

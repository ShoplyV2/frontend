'use client';

import type { ReactNode } from 'react';

type AlertVariant = 'danger' | 'warning' | 'success' | 'info';

export function Alert({
  variant,
  title,
  children,
  action,
  inline,
}: {
  variant: AlertVariant;
  title?: string;
  children?: ReactNode;
  action?: ReactNode;
  inline?: boolean;
}) {
  const role = variant === 'danger' ? 'alert' : 'status';
  return (
    <div className={`alert alert--${variant}${inline ? ' alert--inline' : ''}`} role={role} aria-live={variant === 'danger' ? 'assertive' : 'polite'}>
      <div className="alert-body">
        {title && <span className="alert-title">{title}</span>}
        {children && <span>{children}</span>}
        {action && <div className="alert-actions">{action}</div>}
      </div>
    </div>
  );
}

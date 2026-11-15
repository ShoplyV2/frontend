'use client';

import type { ReactNode } from 'react';

type AlertVariant = 'danger' | 'warning' | 'success' | 'info';

/**
 * A message box. `flat` is the quieter banner: no border, an icon, and an optional × to dismiss it
 * (used for notes the seller can wave away, like "photo matching is still getting ready").
 */
export function Alert({
  variant,
  title,
  children,
  action,
  inline,
  flat,
  onDismiss,
}: {
  variant: AlertVariant;
  title?: string;
  children?: ReactNode;
  action?: ReactNode;
  inline?: boolean;
  flat?: boolean;
  onDismiss?: () => void;
}) {
  const role = variant === 'danger' ? 'alert' : 'status';
  return (
    <div
      className={`alert alert--${variant}${inline ? ' alert--inline' : ''}${flat ? ' alert--flat' : ''}`}
      role={role}
      aria-live={variant === 'danger' ? 'assertive' : 'polite'}
    >
      {flat && (
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="alert-icon">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 8v5M12 16.5h.01" />
        </svg>
      )}
      <div className="alert-body">
        {title && <span className="alert-title">{title}</span>}
        {children && <span>{children}</span>}
        {action && <div className="alert-actions">{action}</div>}
      </div>
      {onDismiss && (
        <button type="button" className="btn btn--ghost btn--icon alert-dismiss" aria-label="Dismiss" onClick={onDismiss}>
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      )}
    </div>
  );
}

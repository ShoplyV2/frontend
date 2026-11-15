'use client';

import type { ReactNode } from 'react';
import { WIZARD_STEPS } from '@/lib/welcome';

/**
 * The frame around every wizard step: where you are, how far along, and a way out. Deliberately has
 * none of the app navigation — during setup the only places to go are the next and previous step.
 */
export function WizardShell({ stepIndex, shopName, onSignOut, children }: { stepIndex: number; shopName?: string; onSignOut: () => void; children: ReactNode }) {
  const total = WIZARD_STEPS.length;
  const progressPct = Math.round(((stepIndex + 1) / total) * 100);

  return (
    <main className="page page--narrow stack">
      <header className="stack stack--sm">
        <div className="split">
          <strong className="truncate">{shopName ?? 'Shoply'}</strong>
          <button type="button" className="btn btn--ghost btn--sm" onClick={onSignOut}>
            Sign out
          </button>
        </div>
        <div className="progress" role="progressbar" aria-valuemin={1} aria-valuemax={total} aria-valuenow={stepIndex + 1} aria-label="Setup progress">
          <div className="progress-bar" style={{ inlineSize: `${progressPct}%` }} />
        </div>
        <p className="text-sm text-muted">
          Step {stepIndex + 1} of {total} · {WIZARD_STEPS[stepIndex]?.title}
        </p>
      </header>
      {children}
    </main>
  );
}

export function StepHeading({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="stack stack--xs">
      <h1>{title}</h1>
      {children && <p className="text-secondary">{children}</p>}
    </div>
  );
}

/** Back on the left, the forward action(s) on the right. */
export function StepFooter({ onBack, children }: { onBack?: () => void; children: ReactNode }) {
  return (
    <div className="split">
      {onBack ? (
        <button type="button" className="btn btn--ghost" onClick={onBack}>
          Back
        </button>
      ) : (
        <span />
      )}
      <div className="cluster cluster--sm">{children}</div>
    </div>
  );
}

'use client';

import type { ReactNode } from 'react';
import { Wordmark } from '@/components/ui/Wordmark';
import { WIZARD_STEPS } from '@/lib/welcome';

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
  );
}

/**
 * The frame around every wizard step: where you are, how far along, and a way out. Deliberately has
 * none of the app navigation — during setup the only places to go are the next and previous step.
 * Wide screens get a step rail on the left; phones get a segmented progress bar on top.
 */
export function WizardShell({ stepIndex, shopName, onSignOut, children }: { stepIndex: number; shopName?: string; onSignOut: () => void; children: ReactNode }) {
  const total = WIZARD_STEPS.length;
  const stateOf = (i: number) => (i < stepIndex ? 'done' : i === stepIndex ? 'active' : 'todo');

  return (
    <div className="wizard">
      <aside className="wizard-rail">
        <Wordmark size="md" />
        <div className="stack stack--xs">
          <p className="text-xs text-muted">Setting up</p>
          <strong className="truncate">{shopName ?? 'Your shop'}</strong>
        </div>
        <ol className="wizard-steps" aria-label="Setup steps">
          {WIZARD_STEPS.map((step, i) => (
            <li key={step.id} className="wizard-step" data-state={stateOf(i)} aria-current={i === stepIndex ? 'step' : undefined}>
              <span className="wizard-step-mark" aria-hidden="true">
                {i < stepIndex ? <CheckIcon /> : i + 1}
              </span>
              {step.title}
            </li>
          ))}
        </ol>
        <div className="wizard-rail-foot">
          <button type="button" className="btn btn--ghost btn--sm self-start" onClick={onSignOut}>
            Sign out
          </button>
        </div>
      </aside>

      <div className="wizard-body">
        <header className="wizard-head stack stack--sm">
          <div className="split">
            <Wordmark size="sm" />
            <button type="button" className="btn btn--ghost btn--sm" onClick={onSignOut}>
              Sign out
            </button>
          </div>
          <div className="wizard-segments" role="progressbar" aria-valuemin={1} aria-valuemax={total} aria-valuenow={stepIndex + 1} aria-label="Setup progress">
            {WIZARD_STEPS.map((step, i) => (
              <span key={step.id} className="wizard-segment" data-state={stateOf(i)} />
            ))}
          </div>
          <p className="wizard-progress-label">
            Step {stepIndex + 1} of {total} · {WIZARD_STEPS[stepIndex]?.title}
          </p>
        </header>
        <main className="wizard-main">{children}</main>
      </div>
    </div>
  );
}

export function StepHeading({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="stack stack--xs">
      <h1>{title}</h1>
      {children && <p className="step-lead">{children}</p>}
    </div>
  );
}

/** Back on the left, the forward action(s) on the right. */
export function StepFooter({ onBack, children }: { onBack?: () => void; children: ReactNode }) {
  return (
    <div className="split step-footer">
      {onBack ? (
        <button type="button" className="btn btn--ghost btn--lg step-back" onClick={onBack}>
          Back
        </button>
      ) : (
        <span />
      )}
      <div className="step-footer-actions">{children}</div>
    </div>
  );
}

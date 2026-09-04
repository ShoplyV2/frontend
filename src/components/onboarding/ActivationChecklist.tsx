'use client';

import Link from 'next/link';
import { SELLER_STATUS } from '@/lib/labels';
import type { ChecklistStep } from '@/lib/checklist';
import type { SellerStatus } from '@/lib/types';

export function ActivationChecklist({
  status,
  steps,
  ready,
  activating,
  activateError,
  onActivate,
}: {
  status: SellerStatus;
  steps: ChecklistStep[];
  ready: boolean;
  activating: boolean;
  activateError: string | null;
  onActivate: () => void;
}) {
  const required = steps.filter((s) => s.required);
  const doneCount = required.filter((s) => s.done).length;
  const statusInfo = SELLER_STATUS[status];
  const progressPct = required.length > 0 ? Math.round((doneCount / required.length) * 100) : 100;

  return (
    <div className="card stack">
      <div className="split">
        <h2>Status</h2>
        <span className={`badge badge--${statusInfo.tone}`}>{statusInfo.label}</span>
      </div>

      {!ready && (
        <div className="stack stack--xs">
          <div className="progress">
            <div className="progress-bar" style={{ inlineSize: `${progressPct}%` }} />
          </div>
          <span className="text-sm text-muted">
            {doneCount} of {required.length} done
          </span>
        </div>
      )}

      <div className="stack">
        {steps.map((step) => (
          <div key={step.id} className="split">
            <div>
              <div className="cluster cluster--sm">
                <span aria-hidden="true">{step.done ? '✓' : step.required ? '○' : '◐'}</span>
                <strong>{step.title}</strong>
                {!step.required && <span className="badge badge--muted">Optional</span>}
              </div>
              <p className="text-sm text-muted">{step.why}</p>
            </div>
            {step.actionTarget.startsWith('/') ? (
              <Link href={step.actionTarget} className="btn btn--secondary btn--sm">
                {step.actionLabel}
              </Link>
            ) : (
              <a href={step.actionTarget} className="btn btn--secondary btn--sm">
                {step.actionLabel}
              </a>
            )}
          </div>
        ))}
      </div>

      {ready ? (
        <p>Everything is set — you are ready to go live.</p>
      ) : (
        <p className="field-hint">Finish the steps above first.</p>
      )}

      {activateError && <div className="alert alert--danger alert--inline">{activateError}</div>}

      <button type="button" className="btn btn--primary" onClick={onActivate} disabled={!ready || activating}>
        {activating ? 'Opening…' : 'Open my shop'}
      </button>
    </div>
  );
}

'use client';

import { useId } from 'react';
import type { ReactNode } from 'react';

interface FieldProps {
  label: string;
  hint?: string;
  error?: string | null;
  children: (props: { id: string; 'aria-describedby': string | undefined; 'aria-invalid': boolean | undefined }) => ReactNode;
  className?: string;
}

/** Wires label/input/hint/error together with real IDs, since labels currently *wrap* inputs in
 * this app, which makes aria-describedby impossible to attach. */
export function Field({ label, hint, error, children, className }: FieldProps) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;

  return (
    <div className={`field${className ? ` ${className}` : ''}`}>
      <label className="field-label" htmlFor={id}>
        {label}
      </label>
      {children({ id, 'aria-describedby': describedBy, 'aria-invalid': error ? true : undefined })}
      {hint && !error && (
        <p className="field-hint" id={hintId}>
          {hint}
        </p>
      )}
      {error && (
        <p className="field-error" id={errorId}>
          {error}
        </p>
      )}
    </div>
  );
}

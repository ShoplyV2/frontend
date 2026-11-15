'use client';

import { useState } from 'react';

/** A password input with a Show/Hide toggle — on a phone keyboard, typos in a hidden password are the main way sign-up goes wrong. */
export function PasswordField({
  id,
  label,
  value,
  onChange,
  autoComplete,
  hint,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: 'new-password' | 'current-password';
  hint?: string;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="field">
      <div className="split">
        <label className="field-label" htmlFor={id}>
          {label}
        </label>
        <button type="button" className="btn btn--link btn--sm" onClick={() => setVisible((v) => !v)} aria-pressed={visible}>
          {visible ? 'Hide' : 'Show'}
        </button>
      </div>
      <input
        id={id}
        className="input"
        type={visible ? 'text' : 'password'}
        autoComplete={autoComplete}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
      {hint && <p className="field-hint">{hint}</p>}
    </div>
  );
}

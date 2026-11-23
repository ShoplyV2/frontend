'use client';

import { useSyncExternalStore } from 'react';
import {
  THEME_EVENT,
  THEME_OPTIONS,
  readThemePreference,
  saveThemePreference,
  type ThemePreference,
} from '@/lib/theme';

function subscribe(onChange: () => void) {
  window.addEventListener(THEME_EVENT, onChange);
  window.addEventListener('storage', onChange);
  return () => {
    window.removeEventListener(THEME_EVENT, onChange);
    window.removeEventListener('storage', onChange);
  };
}

const getServerSnapshot = (): ThemePreference => 'system';

/** System / Light / Dark. The saved choice lives in localStorage; src/lib/theme.ts applies it. */
export function ThemeToggle() {
  const value = useSyncExternalStore(subscribe, readThemePreference, getServerSnapshot);

  return (
    <div className="field">
      <span className="field-label" id="theme-label">
        Appearance
      </span>
      <div className="theme-toggle" role="radiogroup" aria-labelledby="theme-label">
        {THEME_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={value === option.value}
            className={`theme-toggle-option${value === option.value ? ' theme-toggle-option--on' : ''}`}
            onClick={() => saveThemePreference(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

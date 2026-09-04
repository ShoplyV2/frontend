'use client';

import { createContext, useCallback, useContext, useRef, useState } from 'react';
import type { ReactNode } from 'react';

interface ConfirmOptions {
  title: string;
  body: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: 'danger' | 'neutral';
}

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | null>(null);

export function useConfirm(): ConfirmFn {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm must be used within a ConfirmProvider');
  return ctx;
}

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const resolveRef = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback<ConfirmFn>((opts) => {
    setOptions(opts);
    requestAnimationFrame(() => dialogRef.current?.showModal());
    return new Promise((resolve) => {
      resolveRef.current = resolve;
    });
  }, []);

  function close(result: boolean) {
    dialogRef.current?.close();
    resolveRef.current?.(result);
    resolveRef.current = null;
  }

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <dialog
        ref={dialogRef}
        className="sheet"
        onCancel={(e) => {
          e.preventDefault();
          close(false);
        }}
        onClose={() => setOptions(null)}
      >
        {options && (
          <div className="sheet-panel stack">
            <h2>{options.title}</h2>
            <div className="text-secondary">{options.body}</div>
            <div className="cluster cluster--end" style={{ marginTop: 'var(--space-2)' }}>
              <button type="button" className="btn btn--secondary" onClick={() => close(false)}>
                {options.cancelLabel ?? 'Cancel'}
              </button>
              {/* Not autofocused — avoids an accidental double-tap confirming a destructive action. */}
              <button
                type="button"
                className={`btn ${options.tone === 'danger' ? 'btn--danger' : 'btn--primary'}`}
                onClick={() => close(true)}
              >
                {options.confirmLabel ?? 'Confirm'}
              </button>
            </div>
          </div>
        )}
      </dialog>
    </ConfirmContext.Provider>
  );
}

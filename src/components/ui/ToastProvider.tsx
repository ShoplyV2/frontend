'use client';

import { createContext, useCallback, useContext, useRef, useState } from 'react';
import type { ReactNode } from 'react';

type ToastTone = 'neutral' | 'success' | 'danger';

interface Toast {
  id: number;
  tone: ToastTone;
  text: string;
}

interface ToastOptions {
  tone?: ToastTone;
  text: string;
}

const ToastContext = createContext<((options: ToastOptions) => void) | null>(null);

export function useToast(): (options: ToastOptions) => void {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');
  return ctx;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(0);

  const toast = useCallback(({ tone = 'neutral', text }: ToastOptions) => {
    const id = nextId.current++;
    setToasts((current) => [...current, { id, tone, text }]);
    const timeout = tone === 'danger' ? 8000 : 4000;
    setTimeout(() => {
      setToasts((current) => current.filter((t) => t.id !== id));
    }, timeout);
  }, []);

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="toast-region">
        {toasts.map((t) => (
          <div
            key={t.id}
            role={t.tone === 'danger' ? 'alert' : 'status'}
            className={`card${t.tone === 'danger' ? ' alert--danger' : t.tone === 'success' ? ' alert--success' : ''}`}
          >
            {t.text}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

'use client';

import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';

/** A <dialog>-based sheet: slides up from the bottom on mobile, centred modal at >=900px (see
 * .sheet/.sheet-panel in components.css). Handles open/close sync, Escape-to-cancel, and
 * backdrop-click-to-close. */
export function Sheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title?: string; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      className="sheet"
      aria-label={title}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
    >
      <div className="sheet-panel stack">{children}</div>
    </dialog>
  );
}

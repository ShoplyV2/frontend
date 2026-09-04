'use client';

import { useState } from 'react';

export function CopyButton({ value, label = 'Copy', className = 'btn btn--secondary btn--sm' }: { value: string; label?: string; className?: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      // Fallback for browsers/contexts without Clipboard API permission.
      const textarea = document.createElement('textarea');
      textarea.value = value;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button type="button" className={className} onClick={handleCopy}>
      {copied ? 'Copied' : label}
    </button>
  );
}

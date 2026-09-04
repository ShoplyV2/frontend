'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Sheet } from '@/components/ui/Sheet';
import { CopyButton } from '@/components/ui/CopyButton';
import { useConfirm } from '@/components/ui/ConfirmProvider';
import { useFeedToken } from '@/lib/useFeedToken';

export function AccountSheet({ open, onClose, shopName, token }: { open: boolean; onClose: () => void; shopName?: string; token: string }) {
  const router = useRouter();
  const { setToken } = useFeedToken();
  const confirm = useConfirm();
  const [showKey, setShowKey] = useState(false);

  async function handleSignOut() {
    // Close this sheet first — two <dialog>s open at once (this Sheet + the confirm dialog) both
    // centre themselves and visually stack on top of each other.
    onClose();
    const ok = await confirm({
      title: 'Sign out of this shop?',
      body: (
        <div className="stack stack--sm">
          <p>You&apos;ll need your shop key to get back in. Copy it now if you haven&apos;t saved it.</p>
          <CopyButton value={token} label="Copy my key" />
        </div>
      ),
      confirmLabel: 'Sign out',
      cancelLabel: 'Stay signed in',
      tone: 'danger',
    });
    if (!ok) return;
    onClose();
    setToken(null);
    router.push('/');
  }

  return (
    <Sheet open={open} onClose={onClose} title="Account">
      <h2>{shopName ?? 'Your shop'}</h2>

      <div className="stack stack--sm">
        {!showKey ? (
          <button type="button" className="btn btn--secondary" onClick={() => setShowKey(true)}>
            Show my key
          </button>
        ) : (
          <div className="stack stack--xs">
            <code className="card card--quiet text-sm" style={{ wordBreak: 'break-all', display: 'block' }}>
              {token}
            </code>
            <p className="field-hint">This key is the only way back into your shop. Keep it somewhere safe.</p>
            <CopyButton value={token} />
          </div>
        )}
      </div>

      {process.env.NODE_ENV !== 'production' && (
        <Link href="/" className="btn btn--secondary btn--block">
          All shops (dev)
        </Link>
      )}

      <button type="button" className="btn btn--danger btn--block" onClick={handleSignOut}>
        Sign out
      </button>
    </Sheet>
  );
}

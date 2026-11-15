'use client';

import { useRouter } from 'next/navigation';
import { Sheet } from '@/components/ui/Sheet';
import { useFeedToken } from '@/lib/useFeedToken';

// Phase 5 replaces this with a full /shop area (profile, password, delete account); until then the
// sheet only needs what the old shop-key flow can no longer offer: who you are, and sign out.
export function AccountSheet({ open, onClose, shopName }: { open: boolean; onClose: () => void; shopName?: string; token?: string }) {
  const router = useRouter();
  const { setToken } = useFeedToken();

  function handleSignOut() {
    onClose();
    setToken(null);
    router.push('/login');
  }

  return (
    <Sheet open={open} onClose={onClose} title="Account">
      <h2>{shopName ?? 'Your shop'}</h2>
      <button type="button" className="btn btn--secondary btn--block" onClick={handleSignOut}>
        Sign out
      </button>
    </Sheet>
  );
}

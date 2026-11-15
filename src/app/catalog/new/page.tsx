'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useFeedToken } from '@/lib/useFeedToken';
import { useToast } from '@/components/ui/ToastProvider';
import { useConfirm } from '@/components/ui/ConfirmProvider';
import { RequireLogin } from '@/components/RequireLogin';
import { AppShell } from '@/components/shell/AppShell';
import { NewItemForm } from '@/components/catalog/NewItemForm';

export default function NewItemPage() {
  const router = useRouter();
  const toast = useToast();
  const confirm = useConfirm();
  const { token, hydrated } = useFeedToken();
  const [dirty, setDirty] = useState(false);

  if (!hydrated) return <div className="page" />;
  if (!token) return <RequireLogin />;

  async function handleBack() {
    if (dirty) {
      const ok = await confirm({
        title: 'Leave without adding this item?',
        body: "What you've typed will be lost.",
        confirmLabel: 'Leave',
        cancelLabel: 'Keep editing',
        tone: 'danger',
      });
      if (!ok) return;
    }
    router.push('/catalog');
  }

  return (
    <AppShell token={token}>
      <div className="stack">
        <div className="cluster">
          <button type="button" className="btn btn--ghost btn--icon" onClick={handleBack} aria-label="Back to catalog">
            ←
          </button>
          <h1>Add an item</h1>
        </div>

        <NewItemForm
          token={token}
          onDirtyChange={setDirty}
          onCreated={({ name, notes }) => {
            toast({ tone: 'success', text: notes.length > 0 ? `"${name}" added. ${notes.join(' ')}` : `"${name}" is now in your catalog.` });
            router.push('/catalog');
          }}
        />
      </div>
    </AppShell>
  );
}

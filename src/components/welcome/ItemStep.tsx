'use client';

import { useState } from 'react';
import { useToast } from '@/components/ui/ToastProvider';
import { NewItemForm } from '@/components/catalog/NewItemForm';
import { StepFooter, StepHeading } from './WizardShell';

export function ItemStep({ token, itemDone, refresh, onNext }: { token: string; itemDone: boolean; refresh: () => Promise<void>; onNext: () => void }) {
  const toast = useToast();
  // A seller coming back to this step with an item already saved shouldn't be made to add another.
  const [addingAnother, setAddingAnother] = useState(false);

  if (itemDone && !addingAnother) {
    return (
      <div className="stack">
        <StepHeading title="Your first item is in" />
        <div className="alert alert--success">
          <div className="alert-body">Your assistant can already sell it. You can add the rest of your catalog any time.</div>
        </div>
        <StepFooter>
          <button type="button" className="btn btn--secondary" onClick={() => setAddingAnother(true)}>
            Add another item
          </button>
          <button type="button" className="btn btn--primary" onClick={onNext}>
            Continue
          </button>
        </StepFooter>
      </div>
    );
  }

  return (
    <div className="stack">
      <StepHeading title="Add your first item">Start with a photo. Your assistant sells what&apos;s in your catalog, and matches buyers&apos; screenshots to your photos.</StepHeading>
      <NewItemForm
        token={token}
        submitLabel="Save and continue"
        layout="split"
        onCreated={async ({ name, notes }) => {
          toast({ tone: 'success', text: notes.length > 0 ? `"${name}" added. ${notes.join(' ')}` : `"${name}" is in your catalog.` });
          await refresh();
          setAddingAnother(false);
          onNext();
        }}
      />
    </div>
  );
}

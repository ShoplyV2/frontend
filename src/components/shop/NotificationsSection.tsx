'use client';

import { useState } from 'react';
import { usePushNotifications } from '@/lib/usePushNotifications';
import { sellerMessage } from '@/lib/errorMessage';
import { useToast } from '@/components/ui/ToastProvider';
import { Alert } from '@/components/ui/Alert';

/**
 * Switches order and buyer-waiting alerts on for THIS phone or browser. The chat message to your
 * WhatsApp/Telegram still arrives as well; this is the one that reaches you with the app closed,
 * and without WhatsApp's 24-hour window.
 */
export function NotificationsSection({ token }: { token: string }) {
  const toast = useToast();
  const { state, busy, enable, disable, test } = usePushNotifications(token);
  const [error, setError] = useState<unknown>(null);

  async function run(action: () => Promise<unknown>) {
    setError(null);
    try {
      await action();
    } catch (err) {
      setError(err);
    }
  }

  async function handleTest() {
    await run(async () => {
      const { delivered } = await test();
      toast(
        delivered > 0
          ? { tone: 'success', text: 'Sent — check this device.' }
          : { text: "It didn't arrive. Try turning notifications off and on again." },
      );
    });
  }

  return (
    <div className="card stack">
      <div className="stack stack--xs">
        <h2>Notifications</h2>
        <p className="text-secondary">Get an alert on this device when an order is paid or a buyer needs you, even when Shoply is closed.</p>
      </div>

      {error != null && <Alert variant="danger">{sellerMessage(error, 'Something went wrong.')}</Alert>}

      {state === 'loading' && <p className="text-muted">Checking…</p>}
      {state === 'unavailable' && <p className="text-muted">Notifications aren’t switched on for Shoply yet. Alerts still arrive in your chat app.</p>}
      {state === 'unsupported' && <p className="text-muted">This browser can’t show notifications. Alerts still arrive in your chat app.</p>}
      {state === 'needs-install' && (
        <p className="text-muted">
          On iPhone, notifications work once Shoply is added to your Home Screen: tap Share, then “Add to Home Screen”, and open Shoply from there.
        </p>
      )}
      {state === 'blocked' && (
        <p className="text-muted">Notifications are blocked for Shoply on this device. Allow them in your browser’s site settings, then come back here.</p>
      )}

      {state === 'off' && (
        <button type="button" className="btn btn--primary self-start" disabled={busy} onClick={() => run(enable)}>
          {busy ? 'Turning on…' : 'Turn on notifications'}
        </button>
      )}
      {state === 'on' && (
        <div className="stack stack--sm">
          <p>
            <span className="badge badge--success">On</span> <span className="text-secondary">for this device</span>
          </p>
          <div className="row">
            <button type="button" className="btn btn--secondary" disabled={busy} onClick={handleTest}>
              Send a test
            </button>
            <button type="button" className="btn btn--ghost" disabled={busy} onClick={() => run(disable)}>
              Turn off
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

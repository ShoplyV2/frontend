'use client';

import { useCallback, useEffect, useState } from 'react';
import { getPushStatus, removePushSubscription, savePushSubscription, sendTestPush } from '@/lib/apiClient';

/**
 * Where this browser stands on notifications, in the order a seller experiences it:
 *  - 'loading'      still checking
 *  - 'unavailable'  the server has no push keys (alerts arrive as chat messages only)
 *  - 'unsupported'  this browser cannot do web push at all
 *  - 'needs-install' iPhone/iPad in Safari: push only works once Shoply is added to the Home Screen
 *  - 'blocked'      the seller said no to the browser's permission prompt
 *  - 'off'          can be turned on
 *  - 'on'           this device is subscribed
 */
export type PushState = 'loading' | 'unavailable' | 'unsupported' | 'needs-install' | 'blocked' | 'off' | 'on';

function isIos(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

function isInstalled(): boolean {
  return window.matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
}

/** The key arrives URL-safe base64; the browser wants raw bytes. */
function keyToBytes(base64Url: string): Uint8Array<ArrayBuffer> {
  const padded = base64Url + '='.repeat((4 - (base64Url.length % 4)) % 4);
  const raw = atob(padded.replace(/-/g, '+').replace(/_/g, '/'));
  const bytes = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i += 1) bytes[i] = raw.charCodeAt(i);
  return bytes;
}

export function usePushNotifications(token: string) {
  const [state, setState] = useState<PushState>('loading');
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const check = useCallback(async () => {
    const status = await getPushStatus(token);
    if (!status.enabled || !status.publicKey) return setState('unavailable');
    setPublicKey(status.publicKey);

    const capable = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
    if (!capable) return setState(isIos() && !isInstalled() ? 'needs-install' : 'unsupported');
    if (Notification.permission === 'denied') return setState('blocked');

    const registration = await navigator.serviceWorker.ready;
    setState((await registration.pushManager.getSubscription()) ? 'on' : 'off');
  }, [token]);

  useEffect(() => {
    // Checks on mount. The state is only set after the server and the browser have answered, never
    // synchronously — wrapped in a function, as useFeedData's own initial load is, because the
    // lint rule cannot see that. A failed check just leaves the section saying it is unavailable.
    function start() {
      check().catch(() => setState('unavailable'));
    }
    start();
  }, [check]);

  const enable = useCallback(async () => {
    if (!publicKey) return;
    setBusy(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') return setState(permission === 'denied' ? 'blocked' : 'off');
      const registration = await navigator.serviceWorker.ready;
      const subscription =
        (await registration.pushManager.getSubscription()) ??
        (await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyToBytes(publicKey) }));
      await savePushSubscription(token, subscription.toJSON());
      setState('on');
    } finally {
      setBusy(false);
    }
  }, [publicKey, token]);

  const disable = useCallback(async () => {
    setBusy(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await removePushSubscription(token, subscription.endpoint);
        await subscription.unsubscribe();
      }
      setState('off');
    } finally {
      setBusy(false);
    }
  }, [token]);

  const test = useCallback(() => sendTestPush(token), [token]);

  return { state, busy, enable, disable, test };
}

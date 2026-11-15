'use client';

import { CHANNEL_KIND } from '@/lib/labels';
import { useToast } from '@/components/ui/ToastProvider';
import { CopyButton } from '@/components/ui/CopyButton';
import type { ChannelSummary } from '@/lib/types';

/**
 * The links buyers use to message the shop, with Copy and Share for each. Shown in the setup wizard
 * and on Home, so it lives in one place. Share opens the phone's native share sheet and falls back
 * to copying the link on anything without one.
 */
export function ShareLinks({ shopName, channels }: { shopName: string; channels: ChannelSummary[] }) {
  const toast = useToast();
  const links = channels.filter((c) => c.buyerLink != null);

  async function handleShare(link: string) {
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share({ title: shopName, text: `Message ${shopName} to order:`, url: link });
      } catch {
        // The seller closing the share sheet isn't an error.
      }
      return;
    }
    await navigator.clipboard.writeText(link).catch(() => undefined);
    toast({ tone: 'success', text: 'Link copied.' });
  }

  if (links.length === 0) {
    return <p className="text-muted">Your link will show up here once a chat app is connected.</p>;
  }

  return (
    <div className="stack">
      {links.map((channel) => (
        <div key={channel.routingId} className="stack stack--xs">
          <span className="field-label">{CHANNEL_KIND[channel.kind]}</span>
          <code className="link-chip truncate">{channel.buyerLink}</code>
          <div className="cluster cluster--sm">
            <CopyButton value={channel.buyerLink!} label="Copy link" />
            <button type="button" className="btn btn--secondary btn--sm" onClick={() => handleShare(channel.buyerLink!)}>
              Share
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

'use client';

import { useState } from 'react';
import { sendTestAlert } from '@/lib/apiClient';
import { sellerMessage } from '@/lib/errorMessage';
import { CHANNEL_KIND, channelFallbackName } from '@/lib/labels';
import { ShareLinks } from '@/components/ShareLinks';
import { Alert } from '@/components/ui/Alert';
import { StepFooter, StepHeading } from './WizardShell';
import type { ChannelSummary } from '@/lib/types';

export function TestStep({ token, shopName, channels, onBack, onNext }: { token: string; shopName: string; channels: ChannelSummary[]; onBack: () => void; onNext: () => void }) {
  const reachable = channels.filter((c) => c.active && c.sellerContactId != null);
  const [sent, setSent] = useState<Set<string>>(new Set());
  const [sending, setSending] = useState<string | null>(null);
  const [error, setError] = useState<unknown>(null);

  async function handleTest(channel: ChannelSummary) {
    setSending(channel.routingId);
    setError(null);
    try {
      await sendTestAlert(token, channel.routingId);
      setSent((prev) => new Set(prev).add(channel.routingId));
    } catch (err) {
      setError(err);
    } finally {
      setSending(null);
    }
  }

  return (
    <div className="stack">
      <StepHeading title="Try it, then share it">Make sure alerts reach you, and get the link buyers use to message your shop.</StepHeading>

      <div className="card stack">
        <h2>Send yourself a test</h2>
        <p className="text-secondary">We&apos;ll send one message to your chat, the way an order alert will arrive.</p>
        {error != null && <Alert variant="danger">{sellerMessage(error, "We couldn't send that message.")}</Alert>}
        {reachable.map((channel) => {
          const name = channel.displayName ?? channelFallbackName(channel.kind);
          const done = sent.has(channel.routingId);
          return (
            <div key={channel.routingId} className="stack stack--xs">
              <div className="split">
                <span className="cluster cluster--sm">
                  <span className="badge">{CHANNEL_KIND[channel.kind]}</span>
                  {name}
                </span>
                <button type="button" className={`btn btn--sm ${done ? 'btn--secondary' : 'btn--primary'}`} onClick={() => handleTest(channel)} disabled={sending === channel.routingId}>
                  {sending === channel.routingId ? 'Sending…' : done ? 'Send again' : 'Send test message'}
                </button>
              </div>
              {done && <p className="field-hint">Sent. Check {CHANNEL_KIND[channel.kind]} on your phone.</p>}
            </div>
          );
        })}
      </div>

      <div className="card stack">
        <h2>Your shop link</h2>
        <p className="text-secondary">Share this anywhere your buyers are: your Instagram bio, WhatsApp status, or a direct message.</p>
        <ShareLinks shopName={shopName} channels={channels} />
      </div>

      <StepFooter onBack={onBack}>
        <button type="button" className="btn btn--primary" onClick={onNext}>
          Continue
        </button>
      </StepFooter>
    </div>
  );
}

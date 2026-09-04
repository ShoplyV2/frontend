'use client';

import { useState } from 'react';
import { connectTelegramChannel, disconnectChannel } from '@/lib/apiClient';
import { sellerMessage } from '@/lib/errorMessage';
import { channelFallbackName, CHANNEL_KIND } from '@/lib/labels';
import { useToast } from '@/components/ui/ToastProvider';
import { useConfirm } from '@/components/ui/ConfirmProvider';
import { Alert } from '@/components/ui/Alert';
import type { ChannelSummary } from '@/lib/types';

function channelState(channel: ChannelSummary): { label: string; tone: 'warning' | 'success' | 'muted' } {
  if (channel.ownerBindingUrl) return { label: 'Waiting for you to tap Start', tone: 'warning' };
  if (channel.sellerContactId) return { label: 'Getting your alerts', tone: 'success' };
  return { label: 'Not receiving alerts', tone: 'muted' };
}

export function ChannelSection({ token, channels, onChanged }: { token: string; channels: ChannelSummary[]; onChanged: () => void }) {
  const toast = useToast();
  const confirm = useConfirm();
  const [botToken, setBotToken] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [disconnectingId, setDisconnectingId] = useState<string | null>(null);
  const [error, setError] = useState<unknown>(null);

  async function handleConnect(event: React.FormEvent) {
    event.preventDefault();
    if (!botToken.trim()) return;
    setConnecting(true);
    setError(null);
    try {
      const { channel } = await connectTelegramChannel(token, botToken.trim());
      setBotToken('');
      toast({
        tone: 'success',
        text: channel.ownerBindingUrl ? 'Bot connected — tap the button below to finish.' : `${channel.displayName ?? channelFallbackName(channel.kind)} reconnected — alerts are already active.`,
      });
      onChanged();
    } catch (err) {
      setError(err);
    } finally {
      setConnecting(false);
    }
  }

  async function handleDisconnect(channel: ChannelSummary) {
    const name = channel.displayName ?? channelFallbackName(channel.kind);
    const ok = await confirm({
      title: `Disconnect ${name}?`,
      body: "Buyers messaging this bot will stop getting replies, and you'll stop getting alerts here.",
      confirmLabel: 'Disconnect',
      tone: 'danger',
    });
    if (!ok) return;
    setDisconnectingId(channel.routingId);
    setError(null);
    try {
      await disconnectChannel(token, channel.routingId);
      onChanged();
    } catch (err) {
      setError(err);
    } finally {
      setDisconnectingId(null);
    }
  }

  return (
    <div id="channels" className="card stack">
      <h2>Connect your chat app</h2>
      {error != null && <Alert variant="danger">{sellerMessage(error, 'Could not connect that bot.')}</Alert>}

      {channels.length === 0 && <p className="text-secondary">No channels connected yet.</p>}

      <div className="stack">
        {channels.map((channel) => {
          const state = channelState(channel);
          return (
            <div key={channel.routingId} className="stack stack--sm">
              <div className="split">
                <span className="cluster cluster--sm">
                  <span className="badge">{CHANNEL_KIND[channel.kind]}</span>
                  {channel.displayName ?? channelFallbackName(channel.kind)}
                  <span className={`badge badge--${state.tone}`}>{state.label}</span>
                </span>
                <button type="button" className="btn btn--secondary btn--sm" onClick={() => handleDisconnect(channel)} disabled={disconnectingId === channel.routingId}>
                  {disconnectingId === channel.routingId ? 'Removing…' : 'Disconnect'}
                </button>
              </div>
              {channel.ownerBindingUrl && (
                <div className="card card--quiet stack stack--sm">
                  <p>
                    <strong>One last tap</strong> — Telegram bots can&apos;t message you first. Open your bot and tap Start so order alerts reach you.
                  </p>
                  <a href={channel.ownerBindingUrl} target="_blank" rel="noreferrer" className="btn btn--primary" style={{ alignSelf: 'flex-start' }}>
                    Open Telegram and tap Start
                  </a>
                  <p className="field-hint">This link works for 30 minutes. Connect again below to get a fresh one.</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <TelegramSetupGuide expanded={channels.length === 0} />

      <form className="cluster" onSubmit={handleConnect}>
        <input
          type="password"
          className="input field--grow"
          placeholder="Telegram bot token from BotFather"
          value={botToken}
          onChange={(event) => setBotToken(event.target.value)}
        />
        <button type="submit" className="btn btn--primary" disabled={connecting || !botToken.trim()}>
          {connecting ? 'Connecting…' : 'Connect Telegram'}
        </button>
      </form>

      <Alert variant="info">WhatsApp is set up by the Shoply team for now — message us and we&apos;ll connect yours.</Alert>
    </div>
  );
}

function TelegramSetupGuide({ expanded }: { expanded: boolean }) {
  const steps = (
    <ol className="stack stack--sm">
      <li>
        <strong>Open Telegram and search for @BotFather.</strong>
        <p className="field-hint">It&apos;s Telegram&apos;s official bot for making bots.</p>
      </li>
      <li>
        <strong>Send /newbot and follow the prompts.</strong>
        <p className="field-hint">
          Pick any display name, then a username ending in <code>bot</code> — e.g. <code>ama_boutique_bot</code>.
        </p>
      </li>
      <li>
        <strong>BotFather sends you a long token.</strong>
        <p className="field-hint">
          It looks like <code>12345:AAExample-Token</code>. Copy it.
        </p>
      </li>
      <li>
        <strong>Paste the token below and tap Connect Telegram.</strong>
      </li>
    </ol>
  );

  if (expanded) {
    return (
      <div className="card card--quiet stack">
        <p className="field-label">How to connect Telegram</p>
        {steps}
      </div>
    );
  }

  return (
    <details>
      <summary style={{ cursor: 'pointer' }}>How do I get a Telegram bot token?</summary>
      <div style={{ marginTop: 'var(--space-2)' }}>{steps}</div>
    </details>
  );
}

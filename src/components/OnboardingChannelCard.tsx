'use client';

import { useState } from 'react';
import { ApiError, connectTelegramChannel, disconnectChannel } from '@/lib/apiClient';
import type { ChannelSummary } from '@/lib/types';

export function OnboardingChannelCard({ token, channels, onChanged }: { token: string; channels: ChannelSummary[]; onChanged: () => void }) {
  const [botToken, setBotToken] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [disconnectingId, setDisconnectingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function handleConnect(event: React.FormEvent) {
    event.preventDefault();
    if (!botToken.trim()) return;
    setConnecting(true);
    setError(null);
    setNotice(null);
    try {
      const { channel } = await connectTelegramChannel(token, botToken.trim());
      setBotToken('');
      // A reconnect of an already-bound bot changes nothing visible in the channel list below (no
      // new "Awaiting Start" banner appears) — without this, a seller doing that gets zero
      // feedback and reasonably assumes the click did nothing.
      setNotice(
        channel.ownerBindingUrl
          ? 'Bot connected — tap the button below to finish.'
          : `${channel.displayName ?? 'Bot'} reconnected — alerts are already active.`,
      );
      onChanged();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not connect that bot.');
    } finally {
      setConnecting(false);
    }
  }

  async function handleDisconnect(routingId: string) {
    setDisconnectingId(routingId);
    setError(null);
    try {
      await disconnectChannel(token, routingId);
      onChanged();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not disconnect that channel.');
    } finally {
      setDisconnectingId(null);
    }
  }

  return (
    <div className="card">
      <h2 style={{ marginBottom: '0.5rem' }}>Channels</h2>
      {error && <p style={{ color: 'var(--danger)', marginBottom: '0.5rem' }}>{error}</p>}
      {notice && <p style={{ color: 'var(--accent)', marginBottom: '0.5rem' }}>{notice}</p>}

      {channels.length === 0 && <p style={{ marginBottom: '0.75rem' }}>No channels connected yet.</p>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
        {channels.map((channel) => (
          <div key={channel.routingId} style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <div className="row" style={{ justifyContent: 'space-between' }}>
              <span>
                <span className="pill">{channel.kind}</span> {channel.displayName ?? channel.routingId}
                {channel.ownerBindingUrl && <span className="pill pill-warning" style={{ marginLeft: '0.4rem' }}>Awaiting Start</span>}
                {channel.kind === 'telegram' && channel.sellerContactId && !channel.ownerBindingUrl && (
                  <span className="pill" style={{ marginLeft: '0.4rem', background: 'var(--accent)', color: '#fff' }}>
                    Alerts active ✅
                  </span>
                )}
              </span>
              <button className="secondary" onClick={() => handleDisconnect(channel.routingId)} disabled={disconnectingId === channel.routingId}>
                {disconnectingId === channel.routingId ? 'Removing…' : 'Disconnect'}
              </button>
            </div>
            {channel.ownerBindingUrl && (
              <div className="card" style={{ background: 'transparent' }}>
                <p style={{ marginBottom: '0.5rem' }}>
                  One last step — tap this on your phone to receive order and handoff alerts from this bot:
                </p>
                <a href={channel.ownerBindingUrl} target="_blank" rel="noreferrer">
                  <button type="button">Open Telegram &amp; tap Start</button>
                </a>
                <p style={{ marginTop: '0.5rem', fontSize: '0.8rem' }}>
                  Telegram bots can&apos;t message you first, so this is a one-time step. Link expires in 30 minutes — reconnect below to get a fresh one.
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      <details style={{ marginBottom: '0.75rem' }}>
        <summary style={{ cursor: 'pointer' }}>How do I get a Telegram bot token?</summary>
        <ol style={{ paddingLeft: '1.25rem', marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          <li>
            Open Telegram and search for <strong>@BotFather</strong> (the official bot for creating bots).
          </li>
          <li>
            Send <code>/newbot</code> and follow the prompts: a display name (anything), then a username that must end in{' '}
            <code>bot</code> (e.g. <code>ama_boutique_bot</code>).
          </li>
          <li>BotFather replies with a token that looks like {'12345:AAExample-Token'} — copy it.</li>
          <li>Paste it below and hit Connect.</li>
        </ol>
      </details>

      <form className="row" onSubmit={handleConnect}>
        <input
          type="password"
          placeholder="Telegram bot token from BotFather"
          value={botToken}
          onChange={(event) => setBotToken(event.target.value)}
          style={{ flex: 1, minWidth: '14rem' }}
        />
        <button type="submit" disabled={connecting || !botToken.trim()}>
          {connecting ? 'Connecting…' : 'Connect Telegram'}
        </button>
      </form>
      <p style={{ marginTop: '0.5rem', fontSize: '0.85rem' }}>
        WhatsApp channels are set up by the Shoply team for now — reach out if you need one connected.
      </p>
    </div>
  );
}

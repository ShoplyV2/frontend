'use client';

import { useState } from 'react';
import { connectTelegramChannel, refreshOwnerBinding, requestWhatsAppConnection } from '@/lib/apiClient';
import { sellerMessage } from '@/lib/errorMessage';
import { channelFallbackName } from '@/lib/labels';
import { useToast } from '@/components/ui/ToastProvider';
import { Alert } from '@/components/ui/Alert';
import type { ChannelSummary } from '@/lib/types';

// The cards for connecting a chat app. Shared by the setup wizard, Home (finishing WhatsApp later)
// and, next, the Shop area.

// --- Telegram ---------------------------------------------------------------

export function TelegramCard({ token, channel, refresh }: { token: string; channel: ChannelSummary | undefined; refresh: () => Promise<void> }) {
  const toast = useToast();
  const [botToken, setBotToken] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [replacing, setReplacing] = useState(false);

  async function handleConnect(event: React.FormEvent) {
    event.preventDefault();
    if (!botToken.trim()) return;
    setConnecting(true);
    setError(null);
    try {
      await connectTelegramChannel(token, botToken.trim());
      setBotToken('');
      setReplacing(false);
      toast({ tone: 'success', text: 'Bot connected. One more tap to finish.' });
      await refresh();
    } catch (err) {
      setError(err);
    } finally {
      setConnecting(false);
    }
  }

  const showForm = !channel || replacing;

  return (
    <div className="card stack">
      <div className="split">
        <h2>Telegram</h2>
        <span className="badge">Do it yourself</span>
      </div>

      {channel && !replacing && <ChannelState token={token} channel={channel} refresh={refresh} onReplace={() => setReplacing(true)} />}

      {showForm && (
        <>
          <ol className="stack stack--sm">
            <li>
              <strong>Open Telegram and search for @BotFather.</strong>
              <p className="field-hint">It&apos;s Telegram&apos;s official bot for making bots.</p>
            </li>
            <li>
              <strong>Send /newbot and follow the prompts.</strong>
              <p className="field-hint">
                Pick any display name, then a username ending in <code>bot</code>, like <code>ama_boutique_bot</code>.
              </p>
            </li>
            <li>
              <strong>Copy the long token BotFather sends you.</strong>
              <p className="field-hint">
                It looks like <code>12345:AAExample-Token</code>.
              </p>
            </li>
            <li>
              <strong>Paste it here.</strong>
            </li>
          </ol>
          {error != null && <Alert variant="danger">{sellerMessage(error, 'Could not connect that bot.')}</Alert>}
          <form className="cluster" onSubmit={handleConnect}>
            <input
              type="password"
              className="input field--grow"
              placeholder="Bot token from BotFather"
              autoComplete="off"
              aria-label="Telegram bot token"
              value={botToken}
              onChange={(event) => setBotToken(event.target.value)}
            />
            <button type="submit" className="btn btn--primary" disabled={connecting || !botToken.trim()}>
              {connecting ? 'Connecting…' : 'Connect'}
            </button>
          </form>
          {replacing && (
            <button type="button" className="btn btn--ghost btn--sm self-start" onClick={() => setReplacing(false)}>
              Cancel
            </button>
          )}
        </>
      )}
    </div>
  );
}

// --- WhatsApp ---------------------------------------------------------------

export function WhatsAppCard({ token, channel, requestedAt, refresh }: { token: string; channel: ChannelSummary | undefined; requestedAt: string | null; refresh: () => Promise<void> }) {
  const toast = useToast();
  const [requesting, setRequesting] = useState(false);
  const [error, setError] = useState<unknown>(null);

  async function handleRequest() {
    setRequesting(true);
    setError(null);
    try {
      await requestWhatsAppConnection(token);
      toast({ tone: 'success', text: "Request sent. We'll connect your WhatsApp and message you." });
      await refresh();
    } catch (err) {
      setError(err);
    } finally {
      setRequesting(false);
    }
  }

  return (
    <div className="card stack">
      <div className="split">
        <h2>WhatsApp</h2>
        <span className="badge badge--muted">We set it up for you</span>
      </div>

      {channel ? (
        <ChannelState token={token} channel={channel} refresh={refresh} />
      ) : requestedAt ? (
        <Alert variant="info">
          Requested. Our team will connect your WhatsApp number and message you. A link will appear here so alerts reach your phone. You can carry on with Telegram meanwhile.
        </Alert>
      ) : (
        <>
          <p className="text-secondary">Connecting WhatsApp takes a few steps with Meta, so our team does it for you. Ask for it here and we&apos;ll be in touch.</p>
          {error != null && <Alert variant="danger">{sellerMessage(error, 'Could not send your request.')}</Alert>}
          <button type="button" className="btn btn--secondary self-start" onClick={handleRequest} disabled={requesting}>
            {requesting ? 'Sending…' : 'Request WhatsApp'}
          </button>
        </>
      )}
    </div>
  );
}

// --- A connected channel: bound, waiting for the owner tap, or link expired --------

function ChannelState({ token, channel, refresh, onReplace }: { token: string; channel: ChannelSummary; refresh: () => Promise<void>; onReplace?: () => void }) {
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const name = channel.displayName ?? channelFallbackName(channel.kind);
  const isWhatsApp = channel.kind === 'whatsapp';

  async function handleNewLink() {
    setRefreshing(true);
    setError(null);
    try {
      await refreshOwnerBinding(token, channel.routingId);
      await refresh();
    } catch (err) {
      setError(err);
    } finally {
      setRefreshing(false);
    }
  }

  if (channel.sellerContactId) {
    return (
      <div className="stack stack--sm">
        <Alert variant="success">{name} is connected. Order alerts will arrive here.</Alert>
        {onReplace && (
          <button type="button" className="btn btn--ghost btn--sm self-start" onClick={onReplace}>
            Use a different bot
          </button>
        )}
      </div>
    );
  }

  if (channel.ownerBindingUrl) {
    return (
      <div className="card card--quiet stack stack--sm">
        <p>
          <strong>{isWhatsApp ? 'One last step.' : 'One last tap.'}</strong>{' '}
          {isWhatsApp
            ? 'Open WhatsApp on the phone you want alerts on and send the message that is already typed in for you.'
            : "Telegram bots can't message you first. Open your bot and tap Start so order alerts reach you."}
        </p>
        <a href={channel.ownerBindingUrl} target="_blank" rel="noreferrer" className="btn btn--primary self-start">
          {isWhatsApp ? 'Open WhatsApp and send' : 'Open Telegram and tap Start'}
        </a>
        <p className="field-hint">We&apos;ll notice as soon as you do. This link works for 30 minutes.</p>
        {onReplace && (
          <button type="button" className="btn btn--ghost btn--sm self-start" onClick={onReplace}>
            Use a different bot
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="card card--quiet stack stack--sm">
      <p>Your link has expired. Get a new one to start receiving alerts on this phone.</p>
      {error != null && <Alert variant="danger">{sellerMessage(error, 'Could not get a new link.')}</Alert>}
      <button type="button" className="btn btn--primary self-start" onClick={handleNewLink} disabled={refreshing}>
        {refreshing ? 'Getting link…' : 'Get a new link'}
      </button>
    </div>
  );
}

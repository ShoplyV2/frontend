'use client';

import { useState } from 'react';
import { connectTelegramChannel, disconnectChannel, refreshOwnerBinding, requestWhatsAppConnection } from '@/lib/apiClient';
import { sellerMessage } from '@/lib/errorMessage';
import { channelFallbackName } from '@/lib/labels';
import { useToast } from '@/components/ui/ToastProvider';
import { useConfirm } from '@/components/ui/ConfirmProvider';
import { Alert } from '@/components/ui/Alert';
import type { ChannelSummary } from '@/lib/types';

// The cards for connecting a chat app. Shared by the setup wizard, Home (finishing WhatsApp later)
// and, next, the Shop area.

// --- Telegram ---------------------------------------------------------------

/** The how-to and the token box for connecting a Telegram bot, with no card around it. */
export function TelegramConnectForm({ token, refresh, onConnected, onCancel }: { token: string; refresh: () => Promise<void>; onConnected?: () => void; onCancel?: () => void }) {
  const toast = useToast();
  const [botToken, setBotToken] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<unknown>(null);

  async function handleConnect(event: React.FormEvent) {
    event.preventDefault();
    if (!botToken.trim()) return;
    setConnecting(true);
    setError(null);
    try {
      await connectTelegramChannel(token, botToken.trim());
      setBotToken('');
      onConnected?.();
      toast({ tone: 'success', text: 'Bot connected. One more tap to finish.' });
      await refresh();
    } catch (err) {
      setError(err);
    } finally {
      setConnecting(false);
    }
  }

  return (
    <>
      <ol className="stack steps-list">
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
      {onCancel && (
        <button type="button" className="btn btn--ghost btn--sm self-start" onClick={onCancel}>
          Cancel
        </button>
      )}
    </>
  );
}

export function TelegramCard({ token, channel, refresh, canDisconnect = false }: { token: string; channel: ChannelSummary | undefined; refresh: () => Promise<void>; canDisconnect?: boolean }) {
  const [replacing, setReplacing] = useState(false);
  const showForm = !channel || replacing;

  return (
    <div className="card stack">
      <div className="split">
        <h2>Telegram</h2>
        <span className="badge">Do it yourself</span>
      </div>

      {channel && !replacing && <ChannelState token={token} channel={channel} refresh={refresh} onReplace={() => setReplacing(true)} canDisconnect={canDisconnect} />}

      {showForm && <TelegramConnectForm token={token} refresh={refresh} onConnected={() => setReplacing(false)} onCancel={replacing ? () => setReplacing(false) : undefined} />}
    </div>
  );
}

// --- WhatsApp ---------------------------------------------------------------

export function WhatsAppCard({ token, channel, requestedAt, refresh, canDisconnect = false }: { token: string; channel: ChannelSummary | undefined; requestedAt: string | null; refresh: () => Promise<void>; canDisconnect?: boolean }) {
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
        <ChannelState token={token} channel={channel} refresh={refresh} canDisconnect={canDisconnect} />
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

function ChannelStatus({ token, channel, refresh, onReplace }: { token: string; channel: ChannelSummary; refresh: () => Promise<void>; onReplace?: () => void }) {
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

interface ChannelStateProps {
  token: string;
  channel: ChannelSummary;
  refresh: () => Promise<void>;
  onReplace?: () => void;
  canDisconnect?: boolean;
}

// A connected channel: its status, plus (in the Shop area, not the setup wizard) a way to remove it.
function ChannelState({ canDisconnect = false, ...props }: ChannelStateProps) {
  if (!canDisconnect) return <ChannelStatus {...props} />;
  return (
    <div className="stack stack--sm">
      <ChannelStatus {...props} />
      <DisconnectButton token={props.token} channel={props.channel} refresh={props.refresh} />
    </div>
  );
}

export function DisconnectButton({ token, channel, refresh, inline = false }: { token: string; channel: ChannelSummary; refresh: () => Promise<void>; inline?: boolean }) {
  const confirm = useConfirm();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);

  async function handleDisconnect() {
    const name = channel.displayName ?? channelFallbackName(channel.kind);
    const ok = await confirm({
      title: `Disconnect ${name}?`,
      body:
        channel.kind === 'whatsapp'
          ? "Buyers messaging this number will stop getting replies, and you'll stop getting alerts here."
          : "Buyers messaging this bot will stop getting replies, and you'll stop getting alerts here.",
      confirmLabel: 'Disconnect',
      tone: 'danger',
    });
    if (!ok) return;
    setBusy(true);
    setError(null);
    try {
      await disconnectChannel(token, channel.routingId);
      await refresh();
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      {error != null && <Alert variant="danger">{sellerMessage(error, 'Could not disconnect that.')}</Alert>}
      <button type="button" className={inline ? 'btn btn--secondary' : 'btn btn--secondary btn--sm self-start'} onClick={handleDisconnect} disabled={busy}>
        {busy ? 'Disconnecting…' : 'Disconnect'}
      </button>
    </>
  );
}


// --- The Shop page's single "Chat apps" card: one row per app ----------------

function RowIcon({ on }: { on: boolean }) {
  return (
    <span className={`channel-row-icon${on ? ' channel-row-icon--on' : ''}`} aria-hidden="true">
      {on ? (
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12l5 5 9-10" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M12 5v14M5 12h14" />
        </svg>
      )}
    </span>
  );
}

function ChannelRow({ on, title, note, action, children }: { on: boolean; title: string; note: string; action?: React.ReactNode; children?: React.ReactNode }) {
  return (
    <div className="channel-row">
      <div className="channel-row-main">
        <RowIcon on={on} />
        <div className="channel-row-text">
          <p className="channel-row-title">{title}</p>
          <p className="channel-row-note">{note}</p>
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

/** Telegram and WhatsApp in one card, a row each: what's connected, and the one thing to do next. */
export function ChatAppsCard({ token, channels, whatsappRequestedAt, refresh }: { token: string; channels: ChannelSummary[]; whatsappRequestedAt: string | null; refresh: () => Promise<void> }) {
  const toast = useToast();
  const telegram = channels.find((c) => c.kind === 'telegram');
  const whatsapp = channels.find((c) => c.kind === 'whatsapp');
  const [connectOpen, setConnectOpen] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [requestError, setRequestError] = useState<unknown>(null);

  async function handleRequest() {
    setRequesting(true);
    setRequestError(null);
    try {
      await requestWhatsAppConnection(token);
      toast({ tone: 'success', text: "Request sent. We'll connect your WhatsApp and message you." });
      await refresh();
    } catch (err) {
      setRequestError(err);
    } finally {
      setRequesting(false);
    }
  }

  const nameOf = (c: ChannelSummary) => c.displayName ?? channelFallbackName(c.kind);

  return (
    <div className="card stack">
      <h2>Chat apps</h2>

      {telegram?.sellerContactId ? (
        <ChannelRow on title={`Telegram · ${nameOf(telegram)}`} note="Connected. Order alerts arrive here." action={<DisconnectButton token={token} channel={telegram} refresh={refresh} inline />} />
      ) : telegram ? (
        <ChannelRow on={false} title={`Telegram · ${nameOf(telegram)}`} note="One more step to finish.">
          <ChannelStatus token={token} channel={telegram} refresh={refresh} />
        </ChannelRow>
      ) : (
        <ChannelRow
          on={false}
          title="Telegram"
          note="Connect it with a bot token. You do this one yourself."
          action={
            <button type="button" className="btn btn--secondary" aria-expanded={connectOpen} onClick={() => setConnectOpen((o) => !o)}>
              {connectOpen ? 'Close' : 'Connect'}
            </button>
          }
        >
          {connectOpen && (
            <div className="stack channel-row-body">
              <TelegramConnectForm token={token} refresh={refresh} onConnected={() => setConnectOpen(false)} />
            </div>
          )}
        </ChannelRow>
      )}

      {whatsapp?.sellerContactId ? (
        <ChannelRow on title={`WhatsApp · ${nameOf(whatsapp)}`} note="Connected. Order alerts arrive here." action={<DisconnectButton token={token} channel={whatsapp} refresh={refresh} inline />} />
      ) : whatsapp ? (
        <ChannelRow on={false} title={`WhatsApp · ${nameOf(whatsapp)}`} note="One more step to finish.">
          <ChannelStatus token={token} channel={whatsapp} refresh={refresh} />
        </ChannelRow>
      ) : whatsappRequestedAt ? (
        <ChannelRow on={false} title="WhatsApp" note="Requested. Our team will connect your number and message you." />
      ) : (
        <ChannelRow
          on={false}
          title="WhatsApp"
          note="Our team connects it for you."
          action={
            <button type="button" className="btn btn--secondary" onClick={handleRequest} disabled={requesting}>
              {requesting ? 'Sending…' : 'Request WhatsApp'}
            </button>
          }
        >
          {requestError != null && <Alert variant="danger">{sellerMessage(requestError, 'Could not send your request.')}</Alert>}
        </ChannelRow>
      )}
    </div>
  );
}

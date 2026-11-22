'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Alert } from '@/components/ui/Alert';
import { CopyButton } from '@/components/ui/CopyButton';
import { PageSkeleton } from '@/components/ui/PageSkeleton';
import { Page } from '@/components/shell/Page';
import { PageHeader } from '@/components/shell/PageHeader';
import { useAdmin } from '@/components/admin/AdminProvider';
import { PlanSheet } from '@/components/admin/PlanSheet';
import { SuspendSheet } from '@/components/admin/SuspendSheet';
import { WhatsAppConnectForm } from '@/components/admin/WhatsAppConnectForm';
import { ApiError, getAdminShop, refreshAdminOwnerBinding, setAdminShopStatus } from '@/lib/apiClient';
import { adminMessage } from '@/lib/adminError';
import { formatMoney } from '@/lib/format';
import { CHANNEL_KIND, PLAN_NAME, SELLER_STATUS, SETUP_STEP, SUSPENSION_REASON } from '@/lib/labels';
import { timeAgo, timeLeft } from '@/lib/time';
import { useFeedToken } from '@/lib/useFeedToken';
import type { AdminShopDetail, ChannelSummary, SetupStepKey } from '@/lib/types';

const TRIAL_DAYS = 45; // mirrors TRIAL.days in backend/src/config/plans.ts
const date = (iso: string) => new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

export default function AdminShopPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { token, signOut, refreshOverview } = useAdmin();
  const { setToken: setSellerToken } = useFeedToken();

  const [shop, setShop] = useState<AdminShopDetail | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [sheet, setSheet] = useState<'suspend' | 'plan' | null>(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setShop(await getAdminShop(token, id));
      setError(null);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) return signOut();
      setError(err);
    }
  }, [token, id, signOut]);

  useEffect(() => {
    function run() {
      void load();
    }
    run();
  }, [load]);

  // Anything that changes the shop also changes the sidebar's counts.
  const changed = useCallback(async () => {
    setSheet(null);
    await Promise.all([load(), refreshOverview()]);
  }, [load, refreshOverview]);

  async function reinstate() {
    setBusy(true);
    setActionError(null);
    try {
      await setAdminShopStatus(token, id, { status: 'LIVE' });
      await changed();
    } catch (err) {
      setActionError(adminMessage(err, "Couldn't reach the server."));
    } finally {
      setBusy(false);
    }
  }

  // Full access, as today: this browser becomes that shop's session. The read-only version is a later tier.
  function viewAsShop() {
    if (!shop) return;
    setSellerToken(shop.feedToken);
    router.push('/home');
  }

  if (error) {
    return (
      <Page width="wide">
        <Alert variant="danger" action={<button type="button" className="btn btn--secondary btn--sm" onClick={() => void load()}>Try again</button>}>
          {error instanceof ApiError && error.status === 404 ? 'No such shop.' : adminMessage(error, 'Could not load this shop.')}
        </Alert>
        <Link href="/admin/shops" className="btn btn--secondary">
          Back to shops
        </Link>
      </Page>
    );
  }
  if (!shop) {
    return (
      <Page width="wide">
        <PageSkeleton />
      </Page>
    );
  }

  const status = SELLER_STATUS[shop.status];
  const closed = shop.status === 'DELETED';
  // What stops the seller opening the shop (the backend's activation rule): payout and the owner link do not.
  const blockers = shop.checklist.filter((s) => !s.done && (s.key === 'profile' || s.key === 'channel' || s.key === 'catalog')).map((s) => SETUP_STEP[s.key].toLowerCase());
  const done = shop.checklist.filter((s) => s.done).length;

  return (
    <Page width="wide">
      <div className="stack">
        <nav className="crumbs" aria-label="Breadcrumb">
          <Link href="/admin/shops">Shops</Link>
          <span aria-hidden="true">/</span>
          <span>{shop.shopName}</span>
        </nav>

        <PageHeader
          title={shop.shopName}
          subtitle={`${shop.email ?? 'No email'} · signed up ${timeAgo(shop.createdAt)}`}
          action={
            <div className="cluster cluster--sm admin-header-actions">
              <span className={`badge badge--${status.tone}`}>{status.label}</span>
              <button type="button" className="btn btn--primary" onClick={viewAsShop} disabled={closed}>
                View as shop
              </button>
              {shop.status === 'SUSPENDED' ? (
                <button type="button" className="btn btn--secondary" disabled={busy} onClick={() => void reinstate()}>
                  {busy ? 'Reinstating…' : 'Reinstate shop'}
                </button>
              ) : (
                <button type="button" className="btn btn--secondary" disabled={closed} onClick={() => setSheet('suspend')}>
                  Suspend shop
                </button>
              )}
            </div>
          }
        />
        <p className="text-sm text-muted">&ldquo;View as shop&rdquo; signs this browser in as the seller, with full access. Sign out of the shop to come back here.</p>

        {actionError && <Alert variant="danger">{actionError}</Alert>}
        {shop.suspension && (
          <Alert variant="danger" title="This shop is paused">
            {SUSPENSION_REASON[shop.suspension.reason]}
            {shop.suspension.note ? ` — ${shop.suspension.note}` : ''}. Paused {timeAgo(shop.suspension.at)} by {shop.suspension.byEmail}. Buyers are being handed to the seller.
          </Alert>
        )}
        {shop.status === 'ONBOARDING' &&
          (blockers.length > 0 ? (
            <Alert variant="warning" title="This shop can't go live yet">
              Still to do: {blockers.join(', ')}.
            </Alert>
          ) : (
            <Alert variant="info" title="Ready to go live">
              Everything needed is done. The seller opens the shop themselves.
            </Alert>
          ))}

        <div className="admin-columns">
          <div className="stack">
            <section className="card stack" aria-labelledby="checklist-title">
              <div className="split">
                <h2 id="checklist-title">Setup checklist</h2>
                <span className="text-sm text-muted">
                  {done} of {shop.checklist.length} done
                </span>
              </div>
              <ul className="admin-rows">
                {shop.checklist.map((step) => (
                  <li key={step.key} className="admin-row">
                    <span className={`step-mark${step.done ? '' : ' step-mark--open'}`} aria-hidden="true">
                      {step.done && <CheckIcon />}
                    </span>
                    <div className="admin-row-main">
                      <strong>{SETUP_STEP[step.key]}</strong>
                      <div className="text-sm text-secondary">{stepDetail(step.key, step.done, shop)}</div>
                    </div>
                    <span className="visually-hidden">{step.done ? 'Done' : 'Not done'}</span>
                  </li>
                ))}
              </ul>
            </section>

            <ChatApps shop={shop} token={token} onChanged={load} />
          </div>

          <div className="stack">
            <PlanCard shop={shop} onChoose={() => setSheet('plan')} />
            <section className="card stack" aria-labelledby="account-title">
              <h2 id="account-title">Account</h2>
              <dl className="facts">
                <div>
                  <dt>Email</dt>
                  <dd>{shop.email ?? '—'}</dd>
                </div>
                <div>
                  <dt>Signed up</dt>
                  <dd>{date(shop.createdAt)}</dd>
                </div>
                <div>
                  <dt>Currency</dt>
                  <dd>{shop.usage.currency}</dd>
                </div>
                <div>
                  <dt>Last buyer chat</dt>
                  <dd>{shop.lastBuyerChatAt ? timeAgo(shop.lastBuyerChatAt) : 'None yet'}</dd>
                </div>
                <div>
                  <dt>Shop key</dt>
                  <dd className="cluster cluster--sm">
                    <code>••••{shop.feedToken.slice(-4)}</code>
                    <CopyButton value={shop.feedToken} label="Copy" className="btn btn--ghost btn--sm" />
                  </dd>
                </div>
              </dl>
            </section>
          </div>
        </div>
      </div>

      {sheet === 'suspend' && <SuspendSheet open onClose={() => setSheet(null)} token={token} shopId={shop.id} shopName={shop.shopName} onDone={() => void changed()} />}
      {sheet === 'plan' && <PlanSheet open onClose={() => setSheet(null)} token={token} shopId={shop.id} shopName={shop.shopName} current={shop.plan} onDone={() => void changed()} />}
    </Page>
  );
}

function stepDetail(key: SetupStepKey, done: boolean, shop: AdminShopDetail): string {
  const active = shop.channels.filter((c) => c.active);
  switch (key) {
    case 'profile':
      return done ? 'Name and description filled in.' : 'Needs a name and a description of at least 20 characters.';
    case 'channel':
      return done ? active.map((c) => `${CHANNEL_KIND[c.kind]}${c.displayName ? ` · ${c.displayName}` : ''}`).join(', ') : 'No chat app connected yet.';
    case 'owner':
      if (done) return "Alerts reach the seller's own chat.";
      return active.length > 0 ? "The seller hasn't linked their own chat, so order alerts have nowhere to go. Issue a link under Chat apps." : 'Needs a chat app first.';
    case 'catalog':
      if (done) return `${shop.catalog.items} items, ${shop.catalog.variants} variants.`;
      return shop.catalog.items > 0 ? `${shop.catalog.items} items, but none is ready: it needs stock and a photo the assistant can match.` : 'No items yet.';
    case 'payout':
      return done ? 'Settlement account set.' : 'No settlement account set. Only the seller can add this. It does not block going live.';
    case 'activated':
      return done ? `Live since ${shop.activatedAt ? date(shop.activatedAt) : 'earlier'}.` : 'The seller opens the shop once profile, chat app and catalog are done.';
  }
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
  );
}

function ChatApps({ shop, token, onChanged }: { shop: AdminShopDetail; token: string; onChanged: () => Promise<void> }) {
  // A link issued here, kept on screen so it can be copied: the page's own copy only shows live ones.
  const [issued, setIssued] = useState<Record<string, ChannelSummary>>({});
  const [issuing, setIssuing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const hasWhatsApp = shop.channels.some((c) => c.kind === 'whatsapp');

  async function issue(routingId: string) {
    setIssuing(routingId);
    setError(null);
    try {
      const summary = await refreshAdminOwnerBinding(token, shop.id, routingId);
      setIssued((prev) => ({ ...prev, [routingId]: summary }));
      await onChanged();
    } catch (err) {
      setError(adminMessage(err, "Couldn't reach the server."));
    } finally {
      setIssuing(null);
    }
  }

  return (
    <section className="card stack" aria-labelledby="apps-title">
      <h2 id="apps-title">Chat apps</h2>
      {error && <Alert variant="danger">{error}</Alert>}
      {shop.channels.length === 0 && <p className="text-secondary">No chat app connected.</p>}
      <ul className="admin-rows">
        {shop.channels.map((channel) => {
          const link = issued[channel.routingId]?.ownerBindingUrl ?? channel.ownerBindingUrl;
          const linked = channel.sellerContactId != null;
          const expires = channel.ownerBindingExpiresAt && !linked ? timeLeft(channel.ownerBindingExpiresAt) : null;
          return (
            <li key={channel.routingId} className="admin-row">
              <div className="admin-row-main">
                <strong>{CHANNEL_KIND[channel.kind]}</strong> <span className="text-secondary">{channel.displayName ?? ''}</span>
                <div className="text-sm text-secondary">
                  {!channel.active ? 'Not active' : linked ? 'Connected, alerts reach the seller' : 'Connected, not receiving alerts (owner not linked)'}
                  {!linked && expires && (link ? ` · link ${expires.text}` : ' · the last link expired')}
                </div>
                {link && (
                  <div className="cluster cluster--sm">
                    <code className="text-sm truncate admin-link">{link}</code>
                    <CopyButton value={link} label="Copy link" />
                  </div>
                )}
              </div>
              {!linked && (
                <button type="button" className="btn btn--secondary btn--sm" disabled={issuing === channel.routingId} onClick={() => void issue(channel.routingId)}>
                  {issuing === channel.routingId ? 'Issuing…' : 'Issue new link'}
                </button>
              )}
            </li>
          );
        })}
      </ul>
      <details open={!hasWhatsApp && shop.whatsappRequestedAt != null}>
        <summary className="text-sm">{hasWhatsApp ? 'Reconnect WhatsApp' : shop.whatsappRequestedAt ? `Connect their WhatsApp (requested ${timeAgo(shop.whatsappRequestedAt)})` : 'Connect WhatsApp'}</summary>
        <WhatsAppConnectForm adminToken={token} sellerId={shop.id} onConnected={() => void onChanged()} />
      </details>
    </section>
  );
}

function PlanCard({ shop, onChoose }: { shop: AdminShopDetail; onChoose: () => void }) {
  const trial = shop.trial;
  const { usage } = shop;
  return (
    <section className="card stack" aria-labelledby="plan-title">
      <div className="split">
        <h2 id="plan-title">Plan and trial</h2>
        <span className={`badge ${shop.plan ? 'badge--accent' : 'badge--muted'}`}>{shop.plan ? PLAN_NAME[shop.plan] : 'No plan'}</span>
      </div>
      {trial ? (
        <>
          <p className="text-secondary">
            {trial.ended ? 'The free trial has ended. New buyers are being handed to the seller.' : 'On the free trial. It starts at the first buyer message, so setup time does not use it up.'}
          </p>
          <div className="stack stack--sm">
            <Meter label="Orders" used={trial.orders.used} limit={trial.orders.limit} />
            <Meter label="Chats" used={trial.chats.used} limit={trial.chats.limit} />
            <Meter label="Days" used={trial.startedAt ? TRIAL_DAYS - trial.daysLeft : 0} limit={TRIAL_DAYS} />
          </div>
        </>
      ) : (
        <div className="stack stack--sm">
          <p className="text-secondary">
            {usage.plan ? `${formatMoney(usage.plan.priceMinor, usage.currency)} a month. ` : ''}This month so far:
          </p>
          <Meter label="Orders" used={usage.orders.used} limit={usage.orders.included ?? 0} />
          <Meter label="Chats" used={usage.chats.used} limit={usage.chats.included ?? 0} />
          {usage.overageTotalMinor > 0 && <p className="text-sm">{formatMoney(usage.overageTotalMinor, usage.currency)} over the plan this month.</p>}
        </div>
      )}
      <button type="button" className="btn btn--secondary" onClick={onChoose}>
        {shop.plan ? 'Change plan' : 'Choose a plan'}
      </button>
    </section>
  );
}

function Meter({ label, used, limit }: { label: string; used: number; limit: number }) {
  const share = limit > 0 ? used / limit : 0;
  const tone = share > 1 ? ' bar--danger' : share >= 0.8 ? ' bar--warn' : '';
  return (
    <div className="stack stack--xs">
      <div className="split">
        <span className="text-sm">{label}</span>
        <span className="text-sm text-muted">
          {used} / {limit}
        </span>
      </div>
      <span className={`bar${tone}`} role="presentation">
        <i style={{ inlineSize: `${Math.min(100, share * 100)}%` }} />
      </span>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { dispatchOrder, handBackConversation } from '@/lib/apiClient';
import { useOnboarding } from '@/lib/useOnboarding';
import { sellerMessage } from '@/lib/errorMessage';
import { buildInbox, waitingOnOthers } from '@/lib/queue';
import { useMediaQuery } from '@/lib/useMediaQuery';
import { useNow } from '@/lib/useNow';
import { Page } from '@/components/shell/Page';
import { PageHeader } from '@/components/shell/PageHeader';
import { useShop } from '@/components/shell/ShopProvider';
import { useFeed } from '@/components/shell/FeedProvider';
import { PageSkeleton } from '@/components/ui/PageSkeleton';
import { Alert } from '@/components/ui/Alert';
import { useConfirm } from '@/components/ui/ConfirmProvider';
import { useToast } from '@/components/ui/ToastProvider';
import { InboxList } from '@/components/home/InboxList';
import { InboxDetail } from '@/components/home/InboxDetail';
import { StatsStrip } from '@/components/home/StatsStrip';
import { Sheet } from '@/components/ui/Sheet';
import { FinishSetup } from '@/components/home/FinishSetup';
import type { FeedConversation, FeedOrder } from '@/lib/types';

/**
 * Home is what needs you right now: questions your assistant couldn't answer, chats you have taken
 * over, and paid parcels to send — each with its one action, and each gone once handled. Everything
 * else about orders (waiting for payment, on the way, history) is in Orders.
 */
export default function HomePage() {
  const router = useRouter();
  const isWide = useMediaQuery('(min-width: 900px)');
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const { token, refresh: refreshShop } = useShop();
  const confirm = useConfirm();
  const toast = useToast();
  const setup = useOnboarding(token);
  const { profile, state, channels } = setup;

  // Orders and assistant questions only exist for a shop that is open — the feed API refuses anyone
  // else. The shared feed (FeedProvider) doesn't ask for them until the profile says this one is.
  const isLive = profile?.status === 'LIVE';
  const feed = useFeed();
  const now = useNow(60_000);

  // A shop that isn't open yet has nothing to run. Home is where setup resumes.
  const needsSetup = profile != null && profile.status !== 'LIVE';
  useEffect(() => {
    if (needsSetup) router.replace('/welcome');
  }, [needsSetup, router]);

  const ready = isLive && profile && state;
  const inbox = buildInbox(feed.orders, feed.handoffs, feed.conversations);
  const { unpaid, onTheWay } = waitingOnOthers(feed.orders);
  // Wide screens always show a detail pane, defaulting to the first item. A phone shows the list
  // until the seller taps something, so nothing is selected for them until then.
  const selected = inbox.find((i) => i.key === selectedKey) ?? (isWide ? inbox[0] : undefined) ?? null;

  function patched(order: FeedOrder) {
    feed.patchOrder(order);
    void refreshShop(); // the sidebar search reads orders
  }

  async function handleDispatch(order: FeedOrder) {
    const ok = await confirm({ title: 'Mark this as sent?', body: 'Only do this once the item is on its way to the buyer.', confirmLabel: "Yes, it's sent" });
    if (!ok || !token) return;
    setBusyKey(`o:${order._id}`);
    setActionError(null);
    try {
      patched((await dispatchOrder(token, order._id)).order);
    } catch (err) {
      setActionError(sellerMessage(err, 'Could not update that order.'));
    } finally {
      setBusyKey(null);
    }
  }

  async function handleHandBack(conversation: FeedConversation) {
    const ok = await confirm({ title: 'Hand this chat back?', body: 'Your assistant will answer this buyer from now on.', confirmLabel: 'Hand back' });
    if (!ok || !token) return;
    setBusyKey(`c:${conversation._id}`);
    setActionError(null);
    try {
      await handBackConversation(token, conversation._id);
      toast({ tone: 'success', text: 'Handed back to your assistant.' });
      await feed.refresh();
    } catch (err) {
      setActionError(sellerMessage(err, 'Could not hand that chat back.'));
    } finally {
      setBusyKey(null);
    }
  }

  const detail =
    selected && token ? (
      <InboxDetail key={selected.key} item={selected} token={token} onAction={feed.refresh} onPatched={patched} onTakenOver={(conversationId) => setSelectedKey(`c:${conversationId}`)} />
    ) : null;

  // "Good afternoon", and what is waiting. Until the clock is known (see useNow) it just says Home.
  const hour = now == null ? null : new Date(now).getHours();
  const title = hour == null ? 'Home' : hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const subtitle = !ready ? undefined : inbox.length === 0 ? "You're all caught up." : `${inbox.length} ${inbox.length === 1 ? 'thing needs' : 'things need'} you.`;

  return (
    <Page width="wide">
      <div className="stack">
        <PageHeader title={title} subtitle={subtitle} />

        {setup.error != null && !profile && (
          <Alert variant="danger" action={<button className="btn btn--secondary btn--sm" onClick={() => setup.refresh()}>Try again</button>}>
            {sellerMessage(setup.error, 'Could not load your shop.')}
          </Alert>
        )}
        {feed.error != null && (
          <Alert variant="danger" action={<button className="btn btn--secondary btn--sm" onClick={() => feed.refresh()}>Try again</button>}>
            {sellerMessage(feed.error, 'Could not load your orders.')}
          </Alert>
        )}
        {actionError && <Alert variant="danger">{actionError}</Alert>}

        {feed.pendingUpdates > 0 && (
          <button type="button" className="btn btn--secondary btn--block" onClick={feed.applyPending}>
            {feed.pendingUpdates} new update{feed.pendingUpdates === 1 ? '' : 's'} — Show
          </button>
        )}

        {!ready || (feed.loading && feed.orders.length === 0 && feed.handoffs.length === 0) ? (
          <PageSkeleton />
        ) : (
          <>
            <StatsStrip orders={feed.orders} />

            <FinishSetup token={token} profile={profile} state={state} channels={channels} refresh={setup.refresh} />

            <div className="home-grid">
              <InboxList
                items={inbox}
                selectedKey={selected?.key ?? null}
                busyKey={busyKey}
                unpaid={unpaid}
                onTheWay={onTheWay}
                onSelect={setSelectedKey}
                onDispatch={handleDispatch}
                onHandBack={handleHandBack}
              />
              {isWide && <div className="home-detail">{detail ?? <p className="text-muted">Nothing is waiting for you. Past and in-progress orders are in Orders.</p>}</div>}
            </div>
            {!isWide && (
              <Sheet open={selected != null} onClose={() => setSelectedKey(null)} title="Details">
                {detail}
              </Sheet>
            )}
          </>
        )}
      </div>
    </Page>
  );
}

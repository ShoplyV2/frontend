'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useOnboarding } from '@/lib/useOnboarding';
import { useFeedData } from '@/lib/useFeedData';
import { sellerMessage } from '@/lib/errorMessage';
import { buildQueue, filterQueue, type QueueFilter } from '@/lib/queue';
import { useMediaQuery } from '@/lib/useMediaQuery';
import { Page } from '@/components/shell/Page';
import { useShop } from '@/components/shell/ShopProvider';
import { PageSkeleton } from '@/components/ui/PageSkeleton';
import { Alert } from '@/components/ui/Alert';
import { ShareLinks } from '@/components/ShareLinks';
import { QueueList } from '@/components/home/QueueList';
import { QueueDetail } from '@/components/home/QueueDetail';
import { StatsStrip } from '@/components/home/StatsStrip';
import { Sheet } from '@/components/ui/Sheet';
import { FinishSetup } from '@/components/home/FinishSetup';

export default function HomePage() {
  const router = useRouter();
  const isWide = useMediaQuery('(min-width: 900px)');
  const [filter, setFilter] = useState<QueueFilter>('all');
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const { token } = useShop();
  const setup = useOnboarding(token);
  const { profile, state, channels } = setup;

  // Orders and assistant questions only exist for a shop that is open — the feed API refuses anyone
  // else — so don't ask for them until the profile says this one is.
  const isLive = profile?.status === 'LIVE';
  const feed = useFeedData(isLive ? token : null);

  // A shop that isn't open yet has nothing to run. Home is where setup resumes.
  const needsSetup = profile != null && profile.status !== 'LIVE';
  useEffect(() => {
    if (needsSetup) router.replace('/welcome');
  }, [needsSetup, router]);


  const ready = isLive && profile && state;
  const queue = buildQueue(feed.orders, feed.handoffs);
  const visible = filterQueue(queue, filter);
  // Wide screens always show a detail pane, defaulting to the first item. A phone shows the list
  // until the seller taps something, so nothing is selected for them until then.
  const selected = queue.find((q) => q.key === selectedKey && visible.includes(q)) ?? (isWide ? visible[0] : undefined) ?? null;

  const detail = selected && token ? <QueueDetail key={selected.key} item={selected} token={token} onAction={feed.refresh} onPatched={feed.patchOrder} /> : null;

  return (
    <Page width="wide">
      <div className="stack">
        <h1>Home</h1>

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

            <div className="home-grid">
              <QueueList queue={queue} filter={filter} onFilter={setFilter} selectedKey={selected?.key ?? null} onSelect={setSelectedKey} />
              {isWide && <div className="home-detail">{detail ?? <p className="text-muted">Pick something from the list to see it here.</p>}</div>}
            </div>
            {!isWide && (
              <Sheet open={selected != null} onClose={() => setSelectedKey(null)} title="Details">
                {detail}
              </Sheet>
            )}

            <FinishSetup token={token} profile={profile} state={state} channels={channels} refresh={setup.refresh} />

            <section className="section">
              <p className="section-title">Your shop link</p>
              <div className="card stack">
                <p className="text-secondary">Share this anywhere your buyers are: your Instagram bio, WhatsApp status, or a direct message.</p>
                <ShareLinks shopName={profile.shopName} channels={channels} />
              </div>
            </section>
          </>
        )}
      </div>
    </Page>
  );
}

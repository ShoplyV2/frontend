'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useOnboarding } from '@/lib/useOnboarding';
import { useFeedData } from '@/lib/useFeedData';
import { sellerMessage } from '@/lib/errorMessage';
import { isUrgent, sortByPriority } from '@/lib/orderPriority';
import { Page } from '@/components/shell/Page';
import { useShop } from '@/components/shell/ShopProvider';
import { PageSkeleton } from '@/components/ui/PageSkeleton';
import { Alert } from '@/components/ui/Alert';
import { ShareLinks } from '@/components/ShareLinks';
import { FeedSection } from '@/components/feed/FeedSection';
import { OrderCard } from '@/components/feed/OrderCard';
import { HandoffCard } from '@/components/feed/HandoffCard';
import { FinishSetup } from '@/components/home/FinishSetup';
import type { FeedOrder } from '@/lib/types';

// How many orders Home shows before pointing at the full list on the Orders tab.
const HOME_ORDER_LIMIT = 3;

// Orders a seller still has to do something about or keep an eye on; finished and dead ones stay on
// the Orders tab.
function isActive(order: FeedOrder): boolean {
  return order.status === 'PAID' || order.status === 'AWAITING_PAYMENT' || order.status === 'DISPATCHED' || order.fulfillmentRisk === 'STOCK_LOST';
}

export default function HomePage() {
  const router = useRouter();
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
  const activeOrders = sortByPriority(feed.orders).filter(isActive);
  const shownOrders = activeOrders.slice(0, HOME_ORDER_LIMIT);

  return (
    <Page>
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
            <FeedSection title="Needs you" count={feed.handoffs.length} emptyTitle="Nothing waiting on you." emptyBody="Your assistant is handling buyers. It'll ask here when it's unsure.">
              {feed.handoffs.map((handoff) => (
                <HandoffCard key={handoff._id} handoff={handoff} token={token} onAction={feed.refresh} />
              ))}
            </FeedSection>

            <FeedSection
              title="Orders"
              count={activeOrders.length}
              emptyTitle="No orders to handle."
              emptyBody="When a buyer orders through your chat, it shows up here."
            >
              {shownOrders.map((order, index) => (
                <OrderCard key={order._id} order={order} token={token} onPatched={feed.patchOrder} emphasis={index === 0 && isUrgent(order)} />
              ))}
            </FeedSection>
            {feed.orders.length > 0 && (
              <Link href="/orders" className="btn btn--secondary btn--block">
                {activeOrders.length > HOME_ORDER_LIMIT ? `See all ${activeOrders.length} active orders` : 'See all orders'}
              </Link>
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

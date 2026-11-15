'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ApiError } from '@/lib/apiClient';
import { RequireLogin } from '@/components/RequireLogin';
import { AppShell } from '@/components/shell/AppShell';
import { PageSkeleton } from '@/components/ui/PageSkeleton';
import { Alert } from '@/components/ui/Alert';
import { FeedSection } from '@/components/feed/FeedSection';
import { OrderCard } from '@/components/feed/OrderCard';
import { HandoffCard } from '@/components/feed/HandoffCard';
import { sellerMessage } from '@/lib/errorMessage';
import { isUrgent, sortByPriority } from '@/lib/orderPriority';
import { useFeedData } from '@/lib/useFeedData';
import { useFeedToken } from '@/lib/useFeedToken';

export default function FeedPage() {
  const router = useRouter();
  const { token, hydrated } = useFeedToken();
  const { orders, handoffs, loading, error, pendingUpdates, applyPending, refresh, patchOrder } = useFeedData(token);

  // The orders API only serves an open shop and answers 403 to anyone else. That's a seller who
  // hasn't finished setup — send them there rather than showing an error.
  const shopNotOpen = error instanceof ApiError && error.code === 'FORBIDDEN';
  useEffect(() => {
    if (shopNotOpen) router.replace('/welcome');
  }, [shopNotOpen, router]);

  if (!hydrated) {
    return (
      <div className="page">
        <PageSkeleton />
      </div>
    );
  }

  if (!token) {
    return <RequireLogin />;
  }

  const sortedOrders = sortByPriority(orders);

  return (
    <AppShell token={token}>
      <div className="stack">
        <h1>Orders</h1>

        {error != null && (
          <Alert variant="danger" action={<button className="btn btn--secondary btn--sm" onClick={() => refresh()}>Try again</button>}>
            {sellerMessage(error, 'Could not load your orders.')}
          </Alert>
        )}

        {pendingUpdates > 0 && (
          <button type="button" className="btn btn--secondary btn--block" onClick={applyPending}>
            {pendingUpdates} new update{pendingUpdates === 1 ? '' : 's'} — Show
          </button>
        )}

        {loading && orders.length === 0 && handoffs.length === 0 ? (
          <PageSkeleton />
        ) : (
          <>
            <FeedSection title="Needs you" count={handoffs.length} emptyTitle="Nothing waiting on you." emptyBody="Your assistant is handling buyers. It'll ask here when it's unsure.">
              {handoffs.map((handoff) => (
                <HandoffCard key={handoff._id} handoff={handoff} token={token} onAction={refresh} />
              ))}
            </FeedSection>

            <FeedSection title="Orders" emptyTitle="No orders yet." emptyBody="When a buyer orders through your chat, it shows up here.">
              {sortedOrders.map((order, index) => (
                <OrderCard key={order._id} order={order} token={token} onPatched={patchOrder} emphasis={index === 0 && isUrgent(order)} />
              ))}
            </FeedSection>
          </>
        )}
      </div>
    </AppShell>
  );
}

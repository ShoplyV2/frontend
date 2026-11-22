'use client';

import { useEffect, useState } from 'react';
import { getUsage } from '@/lib/apiClient';
import { formatMoney } from '@/lib/format';
import { sellerMessage } from '@/lib/errorMessage';
import { Alert } from '@/components/ui/Alert';
import type { UsageMetric, UsageSummary, UsageTrial } from '@/lib/types';

function monthName(period: string): string {
  return new Date(`${period}-01T00:00:00Z`).toLocaleDateString('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' });
}

/** A bar for one allowance. Turns amber from 80% so it is noticed before the limit, not after. */
function Meter({ label, metric, currency }: { label: string; metric: UsageMetric; currency: string }) {
  const { used, included } = metric;
  const percent = included ? Math.min(100, Math.round((used / included) * 100)) : null;
  const nearing = included != null && used >= Math.ceil(included * 0.8);

  return (
    <div className="meter">
      <div className="meter-head">
        <span className="meter-label">{label}</span>
        <span className="text-secondary">{included == null ? used : `${used} of ${included}`}</span>
      </div>
      {percent != null && (
        <div className="meter-track" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={included ?? undefined} aria-valuenow={Math.min(used, included ?? used)}>
          <div className={`meter-fill${nearing ? ' meter-fill--warning' : ''}`} style={{ width: `${percent}%` }} />
        </div>
      )}
      {metric.over > 0 && (
        <p className="text-sm text-secondary">
          {metric.over} over your plan — {formatMoney(metric.overageMinor, currency)} extra.
        </p>
      )}
    </div>
  );
}

const TRIAL_ENDED_WHY: Record<NonNullable<UsageTrial['endReason']>, string> = {
  ORDERS: 'You’ve reached your trial’s order limit.',
  CHATS: 'You’ve reached your trial’s buyer chat limit.',
  DAYS: 'Your trial’s 45 days are up.',
};

function TrialNotice({ trial }: { trial: UsageTrial }) {
  if (trial.ended) {
    return (
      <Alert variant="danger">
        <strong>Your free trial has ended.</strong> {trial.endReason ? TRIAL_ENDED_WHY[trial.endReason] : ''} New buyers are now passed to you to answer
        yourself. Message the Shoply team to choose a plan and switch your assistant back on.
      </Alert>
    );
  }
  return (
    <p>
      <span className="badge badge--accent">Free trial</span>{' '}
      <span className="text-secondary">
        {trial.startedAt ? `${trial.daysLeft} ${trial.daysLeft === 1 ? 'day' : 'days'} left` : 'Starts with your first buyer message'}
      </span>
    </p>
  );
}

/**
 * This month's orders and buyer chats against what the shop's plan includes. Shown, never enforced:
 * going over switches nothing off, it just costs the extra.
 */
export function UsageSection({ token }: { token: string }) {
  const [usage, setUsage] = useState<UsageSummary | null>(null);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    // Wrapped, as useFeedData's own initial load is, because the lint rule cannot see that state
    // is only set once the request has answered.
    function start() {
      getUsage(token).then(setUsage).catch(setError);
    }
    start();
  }, [token]);

  return (
    <div className="card stack">
      <div className="stack stack--xs">
        <h2>Plan and usage</h2>
        <p className="text-secondary">{usage?.trial ? 'Your free trial' : usage ? monthName(usage.period) : 'This month'}</p>
      </div>

      {error != null && <Alert variant="danger">{sellerMessage(error, 'Could not load your usage.')}</Alert>}
      {usage == null && error == null && <p className="text-muted">Loading…</p>}

      {usage && (
        <>
          {usage.trial && <TrialNotice trial={usage.trial} />}
          {usage.plan && (
            <p>
              <span className="badge badge--accent">{usage.plan.name}</span>{' '}
              <span className="text-secondary">{formatMoney(usage.plan.priceMinor, usage.currency)} a month</span>
            </p>
          )}

          <Meter label="Orders" metric={usage.orders} currency={usage.currency} />
          <Meter label="Buyer chats" metric={usage.chats} currency={usage.currency} />

          {usage.overageTotalMinor > 0 && (
            <p>
              <strong>Extra this month: {formatMoney(usage.overageTotalMinor, usage.currency)}</strong>
            </p>
          )}

          <p className="text-sm text-muted">
            An order is a payment that cleared. A buyer chat is one buyer’s conversation with your shop, counted once a month.{' '}
            {usage.trial
              ? 'Your trial ends at 15 orders, 100 buyer chats or 45 days from your first buyer message, whichever comes first.'
              : 'Going over your plan never stops your shop — extra orders and chats are just priced.'}
          </p>
        </>
      )}
    </div>
  );
}

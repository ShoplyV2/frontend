import { PLAN_NAME } from './labels';
import type { AdminShopRow, AttentionKind } from './types';

// Mirrors TRIAL.days in backend/src/config/plans.ts.
const TRIAL_DAYS = 45;

type Trial = NonNullable<AdminShopRow['trial']>;

/** How far through its trial a shop is, as the one number worth showing: whichever limit is closest. */
export function trialProgress(trial: Trial): { text: string; share: number } {
  const orders = trial.orders.used / trial.orders.limit;
  const chats = trial.chats.used / trial.chats.limit;
  const days = 1 - trial.daysLeft / TRIAL_DAYS;
  if (orders >= chats && orders >= days) return { text: `${trial.orders.used} / ${trial.orders.limit} orders`, share: orders };
  if (chats >= days) return { text: `${trial.chats.used} / ${trial.chats.limit} chats`, share: chats };
  return { text: `${trial.daysLeft} days left`, share: days };
}

export function planLabel(plan: AdminShopRow['plan']): string {
  return plan ? PLAN_NAME[plan] : 'No plan';
}

/** The kinds of attention each shop has, from the overview's list. */
export function attentionByShop(items: Array<{ shopId: string; kind: AttentionKind }> | undefined): Map<string, AttentionKind[]> {
  const byShop = new Map<string, AttentionKind[]>();
  for (const item of items ?? []) byShop.set(item.shopId, [...(byShop.get(item.shopId) ?? []), item.kind]);
  return byShop;
}

export const isAttentionKind = (value: string | null): value is AttentionKind =>
  value === 'WHATSAPP_REQUESTED' || value === 'TRIAL_ENDING' || value === 'STUCK_IN_SETUP' || value === 'OVER_PLAN';

/** Model cost is logged in US dollars. */
export const usd = (amount: number, digits = 2): string => `$${amount.toFixed(digits)}`;

export const percent = (ratio: number | null): string => (ratio === null ? '—' : `${(ratio * 100).toFixed(1)}%`);

/** The last `count` months as 'YYYY-MM', newest first, for the period pickers. */
export function recentPeriods(count = 12, now: Date = new Date()): string[] {
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
  });
}

export function periodLabel(period: string): string {
  const [year, month] = period.split('-').map(Number) as [number, number];
  return new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString('en-GB', { month: 'short', year: 'numeric', timeZone: 'UTC' });
}

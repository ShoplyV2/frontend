import type { ChannelSummary, OnboardingState, SellerProfile } from './types';

// Mirrors backend/src/services/sellerOnboarding.service.ts's own constants — kept here as named
// constants (rather than re-deriving from the blocker sentence) since the backend blockers are
// matched by prefix, not parsed.
export const MIN_SHOP_DESCRIPTION = 20;
export const MIN_ITEM_DESCRIPTION = 15;

export type StepId = 'PROFILE' | 'CHANNEL' | 'CATALOG' | 'PAYOUT';

export interface ChecklistStep {
  id: StepId;
  title: string;
  why: string;
  done: boolean;
  required: boolean;
  actionLabel: string;
  actionTarget: string; // an in-page anchor ("#profile") or a route ("/catalog/new")
}

/**
 * Derives checklist completion from the actual data, NOT from
 * `OnboardingState.completedSteps` — that field is defaulted to `[]` on the backend and no code
 * path ever writes to it, so a checklist built from it would show "0 of 4" forever. It's unioned
 * in below only so this becomes forward-compatible if the backend ever starts writing it.
 */
export function buildChecklist(state: OnboardingState, profile: SellerProfile, channels: ChannelSummary[]): ChecklistStep[] {
  const hint = (id: StepId) => state.completedSteps.includes(id);

  const profileDone =
    hint('PROFILE') || (profile.shopName.trim().length > 0 && profile.shopDescription.trim().length >= MIN_SHOP_DESCRIPTION);

  const channelDone =
    hint('CHANNEL') || channels.some((c) => c.active && !c.ownerBindingUrl);

  const catalogDone =
    hint('CATALOG') || !state.blockers.some((b) => b.startsWith('Add at least one available item'));

  const payoutDone = hint('PAYOUT') || state.payoutConfigured;

  return [
    {
      id: 'PROFILE',
      title: 'Your shop details',
      why: 'Your assistant uses this to describe your shop to buyers.',
      done: profileDone,
      required: true,
      actionLabel: profileDone ? 'Edit' : 'Add details',
      actionTarget: '#profile',
    },
    {
      id: 'CHANNEL',
      title: 'Connect your chat app',
      why: "This is where buyers message you. Nothing works without it.",
      done: channelDone,
      required: true,
      actionLabel: channelDone ? 'Edit' : 'Set up',
      actionTarget: '#channels',
    },
    {
      id: 'CATALOG',
      title: 'Add your first item',
      why: 'Your assistant can only sell what\'s in your catalog.',
      done: catalogDone,
      required: true,
      actionLabel: 'Add an item',
      actionTarget: '/catalog/new',
    },
    {
      id: 'PAYOUT',
      title: 'Get paid to your bank',
      why: 'Optional. You can open your shop first and add this later.',
      done: payoutDone,
      required: false,
      actionLabel: 'Add bank details',
      actionTarget: '#payout',
    },
  ];
}

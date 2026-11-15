import { MIN_SHOP_DESCRIPTION } from './checklist';
import type { ChannelSummary, OnboardingState, SellerProfile } from './types';

// The onboarding wizard's steps, in order. Item comes first on purpose: it needs nothing from
// outside the app and is the step that makes the shop feel real. Connecting a chat app is the
// hardest step, so it comes once the seller has something to sell.
export const WIZARD_STEPS = [
  { id: 'item', title: 'Your first item' },
  { id: 'details', title: 'About your shop' },
  { id: 'chat', title: 'Connect your chat app' },
  { id: 'test', title: 'Test it and share' },
  { id: 'open', title: 'Open your shop' },
] as const;

export const STEP = { item: 0, details: 1, chat: 2, test: 3, open: 4 } as const;

export interface WizardProgress {
  item: boolean;
  details: boolean;
  chat: boolean;
}

/**
 * Completion is derived from the data itself, never stored, so the wizard resumes in the right
 * place after a refresh, a different phone, or a login days later.
 * - item: the backend's own readiness check says there is a sellable item (stock + a photo it can match).
 * - chat: a channel is switched on AND bound to the seller — an unbound channel can't send them alerts yet.
 */
export function wizardProgress(state: OnboardingState, profile: SellerProfile, channels: ChannelSummary[]): WizardProgress {
  return {
    item: !state.blockers.some((b) => b.startsWith('Add at least one available item')),
    details: profile.shopName.trim().length > 0 && profile.shopDescription.trim().length >= MIN_SHOP_DESCRIPTION,
    chat: channels.some((c) => c.active && c.sellerContactId != null),
  };
}

/** The step to open on: the first of item/details/chat not done yet, else the test step. */
export function firstIncompleteStep(done: WizardProgress): number {
  if (!done.item) return STEP.item;
  if (!done.details) return STEP.details;
  if (!done.chat) return STEP.chat;
  return STEP.test;
}

/** Which wizard step fixes a backend activation blocker (they are matched by their opening words, as in lib/checklist.ts). */
export function stepForBlocker(blocker: string): number {
  if (blocker.startsWith('Connect at least one channel')) return STEP.chat;
  if (blocker.startsWith('Add at least one available item')) return STEP.item;
  return STEP.details; // shop name / description
}

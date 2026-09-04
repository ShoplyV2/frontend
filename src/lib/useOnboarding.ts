'use client';

import { useCallback, useEffect, useState } from 'react';
import { getMe, getOnboardingState, listChannels } from './apiClient';
import type { ChannelSummary, OnboardingState, SellerProfile } from './types';

export function useOnboarding(token: string | null) {
  const [profile, setProfile] = useState<SellerProfile | null>(null);
  const [state, setState] = useState<OnboardingState | null>(null);
  const [channels, setChannels] = useState<ChannelSummary[]>([]);
  const [loading, setLoading] = useState(true);
  // The raw error, not a pre-extracted message — sellerMessage() needs the ApiError's `code`.
  const [error, setError] = useState<unknown>(null);

  const refresh = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [profileRes, stateRes, channelsRes] = await Promise.all([getMe(token), getOnboardingState(token), listChannels(token)]);
      setProfile(profileRes);
      setState(stateRes);
      setChannels(channelsRes.channels);
      setError(null);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    function load() {
      refresh();
    }
    load();
  }, [refresh]);

  // Binding a Telegram channel happens OUTSIDE this tab — the seller taps a t.me deep link,
  // often on their phone, then sends /start there. Nothing pushes that completion back to us, so
  // poll while a channel is still waiting on it (and stop the moment none are, including as soon
  // as this effect re-runs after a bind completes).
  const awaitingBinding = channels.some((c) => c.ownerBindingUrl);
  useEffect(() => {
    if (!awaitingBinding) return;
    const interval = setInterval(() => refresh(), 4000);
    // The bot deep link opens in a new tab (target="_blank"), leaving this one backgrounded while
    // the seller taps Start elsewhere — refetch immediately on return instead of waiting out the
    // poll interval.
    function onVisible() {
      if (document.visibilityState === 'visible') refresh();
    }
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [awaitingBinding, refresh]);

  return { profile, state, channels, loading, error, refresh };
}

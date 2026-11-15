'use client';

import { TelegramCard, WhatsAppCard } from '@/components/channels/ChannelCards';
import { StepFooter, StepHeading } from './WizardShell';
import type { ChannelSummary, SellerProfile } from '@/lib/types';

interface Props {
  token: string;
  profile: SellerProfile;
  channels: ChannelSummary[];
  chatDone: boolean;
  refresh: () => Promise<void>;
  onBack: () => void;
  onNext: () => void;
  onLater: () => void;
}

export function ChatStep({ token, profile, channels, chatDone, refresh, onBack, onNext, onLater }: Props) {
  const whatsappWaiting = !channels.some((c) => c.kind === 'whatsapp') && profile.whatsappRequestedAt != null;

  return (
    <div className="step step--820">
      <StepHeading title="Connect your chat app">This is where buyers message your shop, and where you get an alert for every order.</StepHeading>

      <div className="wizard-cards">
        <TelegramCard token={token} channel={channels.find((c) => c.kind === 'telegram')} refresh={refresh} />
        <WhatsAppCard token={token} channel={channels.find((c) => c.kind === 'whatsapp')} requestedAt={profile.whatsappRequestedAt} refresh={refresh} />
      </div>

      <StepFooter onBack={onBack}>
        {!chatDone && <span className="step-footer-aside">Connect Telegram, or wait for WhatsApp, to continue.</span>}
        {!chatDone && whatsappWaiting && (
          <button type="button" className="btn btn--secondary btn--lg" onClick={onLater}>
            Finish later
          </button>
        )}
        <button type="button" className="btn btn--primary btn--lg" onClick={onNext} disabled={!chatDone}>
          Continue
        </button>
      </StepFooter>
    </div>
  );
}

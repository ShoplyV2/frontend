'use client';

import { useRouter } from 'next/navigation';
import { useFeedToken } from '@/lib/useFeedToken';
import { useOnboarding } from '@/lib/useOnboarding';
import { sellerMessage } from '@/lib/errorMessage';
import { SELLER_STATUS } from '@/lib/labels';
import { RequireLogin } from '@/components/RequireLogin';
import { AppShell } from '@/components/shell/AppShell';
import { PageSkeleton } from '@/components/ui/PageSkeleton';
import { Alert } from '@/components/ui/Alert';
import { useToast } from '@/components/ui/ToastProvider';
import { ShareLinks } from '@/components/ShareLinks';
import { ProfileSection } from '@/components/onboarding/ProfileSection';
import { PayoutSection } from '@/components/onboarding/PayoutSection';
import { TelegramCard, WhatsAppCard } from '@/components/channels/ChannelCards';
import { AccountSection } from '@/components/shop/AccountSection';
import { DeleteAccount } from '@/components/shop/DeleteAccount';

export default function ShopPage() {
  const router = useRouter();
  const toast = useToast();
  const { token, setToken, hydrated } = useFeedToken();
  const { profile, state, channels, loading, error, refresh } = useOnboarding(token);

  if (!hydrated) {
    return (
      <div className="page">
        <PageSkeleton />
      </div>
    );
  }
  if (!token) return <RequireLogin />;

  function handleSignOut() {
    setToken(null);
    router.push('/login');
  }

  function handleDeleted() {
    setToken(null);
    toast({ text: 'Your account has been closed.' });
    router.replace('/login');
  }

  const statusInfo = profile ? SELLER_STATUS[profile.status] : null;

  return (
    <AppShell token={token} pageWidth="narrow">
      <div className="stack">
        <div className="split">
          <h1>Shop</h1>
          {statusInfo && <span className={`badge badge--${statusInfo.tone}`}>{statusInfo.label}</span>}
        </div>

        {error != null && (
          <Alert variant="danger" action={<button className="btn btn--secondary btn--sm" onClick={() => refresh()}>Try again</button>}>
            {sellerMessage(error, 'Could not load your shop.')}
          </Alert>
        )}

        {loading && !profile ? (
          <PageSkeleton />
        ) : (
          profile &&
          state && (
            <>
              <section className="section">
                <p className="section-title">Shop details</p>
                <ProfileSection token={token} profile={profile} onSaved={refresh} />
              </section>

              <section className="section">
                <p className="section-title">Chat apps</p>
                <div className="stack">
                  <TelegramCard token={token} channel={channels.find((c) => c.kind === 'telegram')} refresh={refresh} canDisconnect />
                  <WhatsAppCard token={token} channel={channels.find((c) => c.kind === 'whatsapp')} requestedAt={profile.whatsappRequestedAt} refresh={refresh} canDisconnect />
                </div>
              </section>

              <section className="section">
                <p className="section-title">Payments</p>
                <PayoutSection token={token} payoutConfigured={state.payoutConfigured} onChanged={refresh} />
              </section>

              <section className="section">
                <p className="section-title">Your shop link</p>
                <div className="card stack">
                  <p className="text-secondary">Share this anywhere your buyers are: your Instagram bio, WhatsApp status, or a direct message.</p>
                  <ShareLinks shopName={profile.shopName} channels={channels} />
                </div>
              </section>

              <section className="section">
                <p className="section-title">Account</p>
                <div className="stack">
                  <AccountSection token={token} profile={profile} onSaved={refresh} onTokenChanged={setToken} />
                  <button type="button" className="btn btn--secondary btn--block" onClick={handleSignOut}>
                    Sign out
                  </button>
                  <DeleteAccount token={token} onDeleted={handleDeleted} />
                </div>
              </section>
            </>
          )
        )}
      </div>
    </AppShell>
  );
}

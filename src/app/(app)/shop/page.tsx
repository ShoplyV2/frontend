'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useOnboarding } from '@/lib/useOnboarding';
import { useMediaQuery } from '@/lib/useMediaQuery';
import { sellerMessage } from '@/lib/errorMessage';
import { Page } from '@/components/shell/Page';
import { useShop } from '@/components/shell/ShopProvider';
import { PageSkeleton } from '@/components/ui/PageSkeleton';
import { Alert } from '@/components/ui/Alert';
import { useToast } from '@/components/ui/ToastProvider';
import { ShareLinks } from '@/components/ShareLinks';
import { ProfileSection } from '@/components/onboarding/ProfileSection';
import { PayoutSection } from '@/components/onboarding/PayoutSection';
import { ChatAppsCard } from '@/components/channels/ChannelCards';
import { AccountSection } from '@/components/shop/AccountSection';
import { NotificationsSection } from '@/components/shop/NotificationsSection';
import { UsageSection } from '@/components/shop/UsageSection';
import { DeleteAccount } from '@/components/shop/DeleteAccount';
import { ShopMenu } from '@/components/shop/ShopMenu';

const SECTIONS = [
  ['details', 'Shop details'],
  ['chat', 'Chat apps'],
  ['payments', 'Payments'],
  ['usage', 'Plan and usage'],
  ['notifications', 'Notifications'],
  ['link', 'Your shop link'],
  ['account', 'Account'],
] as const;

export default function ShopPage() {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState<string>(SECTIONS[0][0]);
  // On a phone the Shop screen is a list; one section is open at a time. Wide screens show them all.
  const isWide = useMediaQuery('(min-width: 900px)');
  const [phoneSection, setPhoneSection] = useState<string | null>(null);
  const toast = useToast();
  const { token, setToken, refresh: refreshShop } = useShop();
  const { profile, state, channels, loading, error, refresh: refreshSetup } = useOnboarding(token);
  // The sidebar shows the shop name and chat-app status, so a change here has to reach it too.
  const refresh = async () => {
    await Promise.all([refreshSetup(), refreshShop()]);
  };


  // Highlight the sub-nav link for whichever section is nearest the top of the screen.
  const ready = profile != null && state != null;
  useEffect(() => {
    if (!ready) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (visible) setActiveSection(visible.target.id);
      },
      { rootMargin: '-80px 0px -60% 0px' },
    );
    SECTIONS.forEach(([id]) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [ready]);

  const show = (id: string) => isWide || phoneSection === id;

  function handleSignOut() {
    setToken(null);
    router.push('/login');
  }

  function handleDeleted() {
    setToken(null);
    toast({ text: 'Your account has been closed.' });
    router.replace('/login');
  }


  return (
    <Page width="wide">
      <div className="stack">
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
            <div className="shop-layout">
              {(isWide || phoneSection == null) && (
                <div className="shop-side">
                  <h1 className="shop-title">Shop</h1>
                  <nav className="subnav" aria-label="Shop sections">
                    {SECTIONS.map(([id, label]) => (
                      <a key={id} href={`#${id}`} className="subnav-link" aria-current={activeSection === id ? 'true' : undefined} onClick={() => setActiveSection(id)}>
                        {label}
                      </a>
                    ))}
                  </nav>
                </div>
              )}

              {!isWide && phoneSection == null ? (
                <div className="stack">
                  <ShopMenu profile={profile} state={state} channels={channels} onOpen={setPhoneSection} />
                  <button type="button" className="btn btn--secondary btn--lg" onClick={handleSignOut}>
                    Sign out
                  </button>
                  <DeleteAccount token={token} onDeleted={handleDeleted} compact />
                </div>
              ) : (
                <div className="shop-sections stack">
                  {!isWide && (
                    <button type="button" className="btn btn--ghost btn--sm self-start" onClick={() => setPhoneSection(null)}>
                      ‹ Shop
                    </button>
                  )}
                  {show('details') && (
                    <section className="section" id="details">
                      <ProfileSection token={token} profile={profile} onSaved={refresh} showStatus />
                    </section>
                  )}

                  {show('chat') && (
                    <section className="section" id="chat">
                      <ChatAppsCard token={token} channels={channels} whatsappRequestedAt={profile.whatsappRequestedAt} refresh={refresh} />
                    </section>
                  )}

                  {show('payments') && (
                    <section className="section" id="payments">
                      <PayoutSection token={token} payoutConfigured={state.payoutConfigured} onChanged={refresh} />
                    </section>
                  )}

                  {show('usage') && (
                    <section className="section" id="usage">
                      <UsageSection token={token} />
                    </section>
                  )}

                  {show('notifications') && (
                    <section className="section" id="notifications">
                      <NotificationsSection token={token} />
                    </section>
                  )}

                  {show('link') && (
                    <section className="section" id="link">
                      <div className="card stack">
                        <div className="stack stack--xs">
                          <h2>Your shop link</h2>
                          <p className="text-secondary">Share this anywhere your buyers are.</p>
                        </div>
                        <ShareLinks shopName={profile.shopName} channels={channels} />
                      </div>
                    </section>
                  )}

                  {show('account') && (
                    <section className="section" id="account">
                      <div className="stack">
                        <AccountSection token={token} profile={profile} onSaved={refresh} onTokenChanged={setToken} />
                        {isWide && (
                          <>
                            <button type="button" className="btn btn--secondary btn--block" onClick={handleSignOut}>
                              Sign out
                            </button>
                            <DeleteAccount token={token} onDeleted={handleDeleted} />
                          </>
                        )}
                      </div>
                    </section>
                  )}
                </div>
              )}
            </div>
          )
        )}
      </div>
    </Page>
  );
}

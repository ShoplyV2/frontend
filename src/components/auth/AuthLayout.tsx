import type { ReactNode } from 'react';
import { Wordmark } from '@/components/ui/Wordmark';

const SETUP_STEPS = ['Add your first item', 'Connect Telegram or WhatsApp', 'Set up how you get paid', 'Try it and share your link'];

/** A made-up chat, so a seller signing in sees what the product does. Not real data. */
function ChatPreview() {
  return (
    <div className="auth-preview" aria-hidden="true">
      <p className="auth-bubble auth-bubble--buyer">Hi, is the red clutch still available?</p>
      <p className="auth-bubble auth-bubble--shop">Yes, one left. GHS 180. Want me to hold it for you?</p>
      <p className="auth-bubble auth-bubble--buyer">Yes please, I&apos;ll pay now.</p>
      <div className="auth-paid">
        <span className="auth-paid-label">Paid</span>
        <span className="auth-paid-amount">GHS 180.00</span>
        <span className="auth-paid-note">Pack it and send it out.</span>
      </div>
    </div>
  );
}

function SetupPreview() {
  return (
    <ol className="auth-steps" aria-label="What setup involves">
      {SETUP_STEPS.map((step, i) => (
        <li key={step} className="auth-step">
          <span className="auth-step-num" aria-hidden="true">
            {i + 1}
          </span>
          {step}
        </li>
      ))}
    </ol>
  );
}

/**
 * Sign in and sign up share this frame: the form on the left, and on wide screens a soft accent
 * panel on the right showing what the product does. The panel is decoration, so phones skip it.
 */
export function AuthLayout({ variant, title, subtitle, children }: { variant: 'login' | 'signup'; title: string; subtitle: string; children: ReactNode }) {
  return (
    <div className="auth">
      <main className="auth-form-col">
        <div className="auth-form">
          <div className="stack stack--xs">
            <Wordmark size="md" />
            <h1 className="auth-title">{title}</h1>
            <p className="text-secondary">{subtitle}</p>
          </div>
          {children}
        </div>
      </main>
      <aside className="auth-panel">
        <div className="auth-panel-inner">
          <p className="auth-panel-title">{variant === 'login' ? 'Your assistant answers. You get paid.' : 'Four short steps to an open shop'}</p>
          {variant === 'login' ? <ChatPreview /> : <SetupPreview />}
        </div>
      </aside>
    </div>
  );
}

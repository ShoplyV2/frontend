import type { ReactNode } from 'react';
import { Wordmark } from '@/components/ui/Wordmark';

const SETUP_STEPS = ['Add your first item with a photo', 'Tell us about your shop', 'Connect Telegram or WhatsApp', 'Test it, share your link, open'];

function CheckIcon({ size }: { size: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12l5 5 9-10" />
    </svg>
  );
}

/** A made-up chat, so a seller signing in sees what the product does. Not real data. */
function ChatPreview() {
  return (
    <div className="auth-preview" aria-hidden="true">
      <p className="auth-bubble auth-bubble--buyer">Hi! Do you have the tan block heel in size 39?</p>
      <p className="auth-bubble auth-bubble--shop">
        <span className="auth-bubble-who">Your assistant</span>
        Yes! GHS 280. I can hold it for you. Want me to send a payment link?
      </p>
      <div className="auth-paid">
        <span className="auth-paid-mark">
          <CheckIcon size={16} />
        </span>
        <div>
          <p className="auth-paid-title">Abena paid GHS 280.00</p>
          <p className="auth-paid-note">Ready to send</p>
        </div>
      </div>
    </div>
  );
}

function SetupPreview() {
  return (
    <ol className="auth-steps" aria-label="What setup involves">
      {SETUP_STEPS.map((step, i) => (
        <li key={step} className="auth-step">
          <span className={`auth-step-num${i === 0 ? ' auth-step-num--first' : ''}`} aria-hidden="true">
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
 * panel on the right showing what the product does. The panel is decoration, so phones skip it
 * (sign in keeps a small chat sheet along the bottom).
 */
export function AuthLayout({ variant, title, subtitle, children }: { variant: 'login' | 'signup'; title: string; subtitle: string; children: ReactNode }) {
  return (
    <div className="auth">
      <main className="auth-form-col">
        <Wordmark size="md" />
        <div className="auth-form">
          <div className="auth-heading">
            <h1 className="auth-title">{title}</h1>
            <p className="auth-subtitle">{subtitle}</p>
          </div>
          {children}
        </div>
      </main>

      <aside className="auth-panel">
        <div className="auth-panel-inner">
          <div>
            <p className="auth-panel-title">{variant === 'login' ? 'Let your assistant take the orders.' : 'Set up once. Sell all day.'}</p>
            <p className="auth-panel-lead">
              {variant === 'login' ? "It answers buyers in your chats, and asks you only when it's unsure." : 'Add an item, connect your chat app, and your shop is open.'}
            </p>
          </div>
          {variant === 'login' ? <ChatPreview /> : <SetupPreview />}
        </div>
      </aside>

      {variant === 'login' && (
        <div className="auth-sheet" aria-hidden="true">
          <p className="auth-bubble auth-bubble--buyer">Do you have the tan block heel in 39?</p>
          <p className="auth-bubble auth-bubble--shop">Yes! GHS 280. Want a payment link?</p>
        </div>
      )}
    </div>
  );
}

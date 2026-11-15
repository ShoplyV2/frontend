import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono, Outfit } from 'next/font/google';
import './globals.css';
import { ServiceWorkerRegistration } from '@/components/ServiceWorkerRegistration';
import { ToastProvider } from '@/components/ui/ToastProvider';
import { ConfirmProvider } from '@/components/ui/ConfirmProvider';

// Self-hosted by next/font (no runtime request to Google). Geist is the UI text face, Geist Mono is
// for links and codes, and Outfit is used only for the "shoply" wordmark.
const geist = Geist({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
});
const geistMono = Geist_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-mono',
});
const outfit = Outfit({
  subsets: ['latin'],
  weight: ['700'],
  display: 'swap',
  variable: '--font-wordmark',
});

export const metadata: Metadata = {
  title: { default: 'Shoply — your shop', template: '%s · Shoply' },
  description: 'Your catalog, your orders, and anything your assistant needs you for.',
  applicationName: 'Shoply',
  appleWebApp: { capable: true, title: 'Shoply', statusBarStyle: 'default' },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  // Required for env(safe-area-inset-*) to resolve — every current iPhone
  // has a notch/Dynamic Island and a home indicator the fixed nav must clear.
  viewportFit: 'cover',
  // Light mode only for now — see tokens.css. Revisit once a real theme toggle exists.
  colorScheme: 'light',
  themeColor: '#f6f6f7',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" className={`${geist.variable} ${geistMono.variable} ${outfit.variable}`}>
      <body>
        <ServiceWorkerRegistration />
        <ToastProvider>
          <ConfirmProvider>{children}</ConfirmProvider>
        </ToastProvider>
      </body>
    </html>
  );
}

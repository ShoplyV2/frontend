import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: 'Shoply — your shop',
    short_name: 'Shoply',
    description: 'Your catalog, your orders, and anything your assistant needs you for.',
    // Straight to Home, skipping the '/' redirect hop.
    start_url: '/home',
    scope: '/',
    display: 'standalone',
    lang: 'en-GH',
    dir: 'ltr',
    categories: ['business', 'shopping'],
    background_color: '#f6f6f7',
    theme_color: '#2f54a8',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
    ],
    shortcuts: [
      { name: 'Home', short_name: 'Home', url: '/home' },
      { name: 'Orders & handoffs', short_name: 'Orders', url: '/orders' },
      { name: 'Catalog', short_name: 'Catalog', url: '/catalog' },
    ],
  };
}

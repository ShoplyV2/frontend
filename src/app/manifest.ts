import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: 'Shoply — your shop',
    short_name: 'Shoply',
    description: 'Your catalog, your orders, and anything your assistant needs you for.',
    // Not '/' — that's the dev-only seller picker. An installed PWA should
    // never launch onto it.
    start_url: '/catalog',
    scope: '/',
    display: 'standalone',
    lang: 'en-GH',
    dir: 'ltr',
    categories: ['business', 'shopping'],
    background_color: '#f5f7f8',
    theme_color: '#0f766e',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
    ],
    shortcuts: [
      { name: 'Orders & handoffs', short_name: 'Orders', url: '/feed' },
      { name: 'Catalog', short_name: 'Catalog', url: '/catalog' },
    ],
  };
}

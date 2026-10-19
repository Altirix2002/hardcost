import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

/**
 * Basis-Pfad der App. GitHub Pages hostet Projektseiten unter /<repo>/ – der
 * Deploy-Workflow setzt BASE_PATH darauf. Lokal (dev/preview) bleibt es "/".
 * Bewusst ein absoluter Pfad statt "./": Manifest-Scope, start_url und der
 * Service Worker brauchen einen festen Pfad, damit Installation und Offline-Modus greifen.
 */
const base = process.env.BASE_PATH ?? '/';

/** Grosse Bibliotheken in eigene Chunks – bleiben bei App-Updates im Browser-Cache. */
const VENDOR_CHUNKS: Record<string, string[]> = {
  react: ['react', 'react-dom', 'scheduler'],
  motion: ['framer-motion', 'motion-dom', 'motion-utils'],
  dexie: ['dexie', 'dexie-react-hooks'],
};

function vendorChunk(id: string): string | undefined {
  if (!id.includes('node_modules')) return undefined;
  return Object.keys(VENDOR_CHUNKS).find((chunk) =>
    VENDOR_CHUNKS[chunk]?.some((pkg) => id.includes(`/node_modules/${pkg}/`)),
  );
}

export default defineConfig({
  base,
  build: {
    rollupOptions: {
      output: { manualChunks: vendorChunk },
    },
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      // Neue Versionen werden im Hintergrund geladen und beim nächsten Start aktiv.
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg', 'apple-touch-icon-180x180.png'],
      manifest: {
        id: base,
        name: 'SubPulse – Abo- & Kosten-Kontrolle',
        short_name: 'SubPulse',
        description: 'Alle Abonnements und Fixkosten im Blick – lokal, privat und offline nutzbar.',
        lang: 'de-CH',
        dir: 'ltr',
        start_url: base,
        scope: base,
        display: 'standalone',
        orientation: 'any',
        theme_color: '#f4f4f5',
        background_color: '#f4f4f5',
        categories: ['finance', 'productivity', 'utilities'],
        icons: [
          { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          { src: 'icon.svg', sizes: 'any', type: 'image/svg+xml' },
        ],
        shortcuts: [
          {
            name: 'Abo hinzufügen',
            short_name: 'Neues Abo',
            url: `${base}?action=new`,
            icons: [{ src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' }],
          },
          {
            name: 'Statistiken',
            short_name: 'Statistiken',
            url: `${base}?tab=statistics`,
            icons: [{ src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' }],
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,webmanifest}'],
        // SPA: Navigationen offline immer auf die App-Shell lenken.
        navigateFallback: 'index.html',
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\.frankfurter\.dev\/.*/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'currency-rates',
              networkTimeoutSeconds: 5,
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 7 },
            },
          },
        ],
      },
    }),
  ],
});

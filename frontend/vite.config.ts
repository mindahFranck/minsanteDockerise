import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: "auto",
      includeAssets: [
        "favicon.svg",
        "robots.txt",
        "icons/icon-192.png",
        "icons/icon-512.png",
        "icons/icon-maskable-512.png",
        "icons/apple-touch-icon.png",
      ],
      manifest: {
        id: "/",
        name: "MINSANTE - Gestion FOSA",
        short_name: "MINSANTE",
        description:
          "Cartographie et gestion des Formations Sanitaires du Cameroun (Ministère de la Santé Publique)",
        theme_color: "#003758",
        background_color: "#f8f8f8",
        display: "standalone",
        orientation: "any",
        lang: "fr",
        scope: "/",
        start_url: "/",
        categories: ["health", "medical", "government", "productivity"],
        icons: [
          {
            src: "icons/icon-192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "icons/icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "icons/icon-maskable-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,ico,woff2}"],
        navigateFallback: "/index.html",
        navigateFallbackDenylist: [/^\/api/, /^\/storage/],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          // Tuiles OSM — CacheFirst (carte hors ligne)
          {
            urlPattern: ({ url }) =>
              /tile\.openstreetmap\.org/.test(url.host) ||
              /tile\.opentopomap\.org/.test(url.host) ||
              /server\.arcgisonline\.com/.test(url.host) ||
              /[a-c]\.basemaps\.cartocdn\.com/.test(url.host),
            handler: "CacheFirst",
            options: {
              cacheName: "map-tiles",
              expiration: {
                maxEntries: 10000,
                maxAgeSeconds: 60 * 60 * 24 * 60, // 60 jours
                purgeOnQuotaError: true,
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          // Leaflet CDN
          {
            urlPattern: /^https:\/\/unpkg\.com\/leaflet/,
            handler: "CacheFirst",
            options: {
              cacheName: "leaflet-cdn",
              expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          // API GET — NetworkFirst (FOSA, géo, etc.)
          {
            urlPattern: ({ url, request }) =>
              request.method === "GET" &&
              /api-minsante-stg\.it-grafik\.com/.test(url.host) &&
              /\/api\//.test(url.pathname),
            handler: "NetworkFirst",
            options: {
              cacheName: "api-data",
              networkTimeoutSeconds: 8,
              expiration: { maxEntries: 500, maxAgeSeconds: 60 * 60 * 24 * 7 },
              cacheableResponse: { statuses: [0, 200] },
              backgroundSync: {
                name: "minsante-api-queue",
                options: { maxRetentionTime: 60 * 24 },
              },
            },
          },
          // Images stockées
          {
            urlPattern: ({ url, request }) =>
              request.destination === "image" &&
              /api-minsante-stg\.it-grafik\.com/.test(url.host),
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "fosa-images",
              expiration: { maxEntries: 300, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          // Fonts
          {
            urlPattern: /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\//,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts",
              expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
      devOptions: {
        enabled: false,
        type: "module",
      },
    }),
  ],
  build: {
    rollupOptions: {
      onwarn(warning, defaultHandler) {
        if (
          warning.code === "UNRESOLVED_IMPORT" ||
          warning.code === "SOURCEMAP_ERROR" ||
          warning.message.includes("externalize this module")
        ) {
          return;
        }
        defaultHandler(warning);
      },
    },
  },
  server: {
    host: true,
    port: 5173,
    watch: {
      usePolling: true,
    },
  },
});

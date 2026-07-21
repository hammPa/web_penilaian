import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto', // Menyuntikkan script registrasi SW ke index.html

      // Aktifkan PWA saat development (npm run dev), bukan cuma saat build
      // Tanpa ini, beforeinstallprompt TIDAK PERNAH muncul di dev server
      devOptions: {
        enabled: true,
        type: 'module'
      },

      // File-file ini WAJIB ada secara fisik di folder /public
      includeAssets: ['logo.svg', 'pwa-192x192.png', 'pwa-512x512.png'],

      manifest: {
        name: 'Aplikasi Penilaian',
        short_name: 'PenilaianApp',
        description: 'Aplikasi penilaian',
        theme_color: '#17203A',
        background_color: '#F3F4F7',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },
          {
            // Entri terpisah khusus untuk maskable icon
            // (dipisah dari 'any' agar Chrome tidak salah render bentuk icon)
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ]
      },

      workbox: {
        // Pastikan semua asset penting ikut di-precache oleh service worker
        globPatterns: ['**/*.{js,css,html,svg,png,ico}']
      }
    })
  ],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:5000'
    }
  },
  preview: {
    port: 4173,
    allowedHosts: true,
  }
})
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
      injectRegister: 'auto', // Memastikan script SW disuntikkan ke index.html
      includeAssets: ['logo.svg', 'pwa-192x192.png', 'pwa-512x512.png'], // Masukkan file PNG ke cache
      manifest: {
        name: 'Aplikasi Penilaian', 
        short_name: 'PenilaianApp',
        description: 'Aplikasi penilaian',
        theme_color: '#17203A',
        background_color: '#F3F4F7',
        display: 'standalone',
        start_url: '/', // PENTING: Syarat wajib agar tombol install muncul
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable' // Agar icon bisa menyesuaikan bentuk (bulat/kotak) di Android
          }
        ]
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
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
      // includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
      includeAssets: ['logo.svg'],
      manifest: {
        name: 'Aplikasi Penilaian', // Sesuaikan dengan nama web kamu
        short_name: 'PenilaianApp',
        description: 'Aplikasi penilaian',
        theme_color: '#17203A',
        background_color: '#F3F4F7',
        display: 'standalone',
        icons: [
          {
            src: 'logo.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          },
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
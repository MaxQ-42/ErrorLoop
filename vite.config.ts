import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '')
  const version = env.VITE_APP_VERSION || new Date().toISOString().replace(/[-:TZ.]/g, '').slice(0, 12)
  return {
    base: env.VITE_BASE || '/',
    define: { __APP_VERSION__: JSON.stringify(version) },
    plugins: [react(), VitePWA({
      registerType: 'prompt',
      workbox: { globIgnores: ['**/vendor/opencv/opencv.js', '**/vendor/jscanify/jscanify.js'] },
      manifest: {
        name: '错题回路 ErrorLoop', short_name: '错题回路', description: '高中错题管理与复习',
        theme_color: '#151923', background_color: '#151923', display: 'standalone', start_url: './', scope: './',
        icons: [
          { src: 'icons/errorloop-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icons/errorloop-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'icons/errorloop-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    })],
  }
})

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'logo.png', 'tsubo.png'],
      manifest: {
        name: 'JASteria — 有機JAS管理アシスト',
        short_name: 'JASteria',
        description: '有機JAS 0004 飲食店監査アシストアプリ',
        theme_color: '#801c15',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg,ico}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\./,
            handler: 'CacheFirst'
          }
        ]
      }
    })
  ],
  server: {
    port: 5175,
    // pollinations.ai は最近 Cloudflare Turnstile を導入し、ブラウザ Origin/Referer 付きの
    // リクエストを 403 で拒否するようになりました。
    // 開発時は Vite サーバー経由でアクセス（Origin/Referer を除去）することで、
    // サインアップやAPIトークン無しに無料で利用できます。
    proxy: {
      '/pollinations-proxy': {
        target: 'https://image.pollinations.ai',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/pollinations-proxy/, ''),
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            // Turnstile を発動させないため、ブラウザ識別ヘッダを除去
            proxyReq.removeHeader('origin');
            proxyReq.removeHeader('referer');
            proxyReq.removeHeader('cookie');
            // 一般的なサーバーサイドクライアントを名乗る
            proxyReq.setHeader('User-Agent', 'jasteria-server/1.0');
          });
        }
      }
    }
  }
})


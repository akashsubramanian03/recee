import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    /* The API is a separate process on 3001. Proxying it under the dev
       server's own origin means the browser never makes a cross-origin
       request, so there are no preflights and no cookie/SameSite surprises
       later — and the client can just fetch('/api/...') in every environment. */
    proxy: {
      '/api': { target: 'http://localhost:3001', changeOrigin: true },
    },
  },
  resolve: {
    // shadcn's convention — lets components import each other as
    // "@/components/ui/..." regardless of how deep they sit.
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})

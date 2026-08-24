import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  resolve: {
    // shadcn's convention — lets components import each other as
    // "@/components/ui/..." regardless of how deep they sit.
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})

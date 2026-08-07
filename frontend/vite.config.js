import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'https://price-pilot-ltx1.vercel.app/api', // Your Node server port
        changeOrigin: true,
        // Optional: remove /api prefix if backend doesn't expect it
        // rewrite: (path) => path.replace(/^\/api/, ''), 
      },
    },
  },
})

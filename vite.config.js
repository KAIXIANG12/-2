// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Frontend dev server with API proxy to local Spring Boot on :8080
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    proxy: {
      // All requests starting with /api will be proxied to http://localhost:8080
      // and the leading /api prefix will be stripped so:
      //   /api/auth/login  ->  http://localhost:8080/auth/login
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})

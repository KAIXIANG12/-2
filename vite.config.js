// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Dev server proxy
 * - Keep the /api prefix (NO rewrite)
 * - Browser -> http://localhost:5173/api/...
 *   Vite proxy -> http://localhost:8080/api/...
 */
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        // ⚠️ Do NOT rewrite. Backend expects /api/**.
        // rewrite: (path) => path, // (intentionally omitted)
        secure: false,
      },
    },
  },
});

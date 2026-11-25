import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [
    tailwindcss(),
    react()
  ],
  base: './',
  server: {
    port: 5173,
    open: false,
    proxy: {
      '/cinemasystem/api': {
        target: 'http://localhost',
        changeOrigin: true
      },
      '/api': {
        target: 'http://localhost/cinemasystem',
        changeOrigin: true
      }
    }
  }
});

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['expobeton.jpg'],
      manifest: {
        name: 'Expobeton Email',
        short_name: 'Expobeton',
        description: 'Application de gestion des emails Expobeton',
        theme_color: '#3b82f6',
        icons: [
          {
            src: 'expobeton.jpg',
            sizes: '192x192',
            type: 'image/jpeg',
          },
          {
            src: 'expobeton.jpg',
            sizes: '512x512',
            type: 'image/jpeg',
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    open: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
  define: {
    'process.env': {},
  },
});

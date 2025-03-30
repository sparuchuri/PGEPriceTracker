
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import themePlugin from "@replit/vite-plugin-shadcn-theme-json";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

export default defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    themePlugin()
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@shared': path.resolve(__dirname, '../shared'),
    },
  },
  server: {
    port: 5000,
    host: true,
    strictPort: true,
    hmr: {
      clientPort: 443,
      host: process.env.REPL_SLUG + '.' + process.env.REPL_OWNER + '.repl.co'
    }
  },
});

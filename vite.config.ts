import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    // 1. REQUIREMENT FOR OPFS SQLITE: Cross-Origin Isolation
    // Without this, the browser will block the SharedArrayBuffer memory required by SQLite
    server: {
      headers: {
        'Cross-Origin-Opener-Policy': 'same-origin',
        'Cross-Origin-Embedder-Policy': 'require-corp',
      },
    },
    // 2. WASM EXCLUSION: 
    // Prevents Vite from breaking the pre-compiled SQLite binary during dependency pre-bundling
    optimizeDeps: {
      exclude: ['@sqlite.org/sqlite-wasm'],
    },
  };
});

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      // FIX: Map '@' to the project root, not the src folder, 
      // so '@/src/types' resolves correctly.
      '@': path.resolve(__dirname, './'),
    },
  },
  // OPFS SQLITE SECURITY REQUIREMENT
  server: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
  },
  // PREVENT WASM COMPILATION CRASHES
  optimizeDeps: {
    exclude: ['@sqlite.org/sqlite-wasm'],
  },
});

import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  base: '/',                    // важно для Render
  server: {
    port: 3000,
    host: true
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
      }
    },
    outDir: 'dist',               // явно
    emptyOutDir: true
  }
});
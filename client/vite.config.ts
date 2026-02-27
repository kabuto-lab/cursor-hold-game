import { defineConfig } from 'vite';
import { resolve } from 'path';
import { execSync } from 'child_process';
import { writeFileSync } from 'fs';

// Получаем текущий хэш коммита из Git
function getGitCommitHash(): string {
  try {
    const hash = execSync('git rev-parse --short HEAD').toString().trim();
    return hash;
  } catch (error) {
    console.warn('Could not get git commit hash:', error);
    return 'unknown';
  }
}

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
    emptyOutDir: true,
    assetsInlineLimit: 0,
  },
  // Плагин для генерации version.txt
  plugins: [{
    name: 'version-generator',
    closeBundle() {
      const hash = getGitCommitHash();
      const version = `v${hash}`;
      console.log(`[Version Generator] Building version: ${version}`);
      
      // Создаём файл version.txt в папке dist
      const versionPath = resolve(__dirname, 'dist', 'version.txt');
      writeFileSync(versionPath, version);
      console.log(`[Version Generator] Created ${versionPath}`);
    }
  }]
});
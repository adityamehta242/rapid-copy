import { defineConfig } from 'vite';
import { resolve } from 'path';
import { copyFileSync, mkdirSync } from 'fs';

export default defineConfig({
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'src/popup/popup.html'),
        background: resolve(__dirname, 'src/background.ts'),
        content: resolve(__dirname, 'src/content.ts'),
      },
      output: {
        entryFileNames: (chunkInfo) => {
          if (chunkInfo.name === 'background') return 'src/[name].js';
          if (chunkInfo.name === 'content') return 'src/[name].js';
          return 'src/popup/[name].js';
        },
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          if (assetInfo.name?.endsWith('.css')) {
            return 'assets/[name][extname]';
          }
          return 'assets/[name][extname]';
        }
      }
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src')
    }
  },
  plugins: [
    {
      name: 'copy-manifest-and-css',
      writeBundle() {
        // Copy manifest.json
        copyFileSync('manifest.json', 'dist/manifest.json');
        
        // Copy CSS file
        try {
          mkdirSync('dist/assets', { recursive: true });
          copyFileSync('src/styles/canvas-theme.css', 'dist/canvas-theme.css');
        } catch (e) {
          console.warn('Could not copy CSS file:', e.message);
        }
      }
    }
  ]
});
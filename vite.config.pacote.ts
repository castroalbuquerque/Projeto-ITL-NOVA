import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

/**
 * Build do arquivo único distribuível: um HTML que abre com duplo clique, sem
 * servidor e sem internet. Difere do build normal em três pontos — caminhos
 * relativos, um só pedaço de JavaScript e um só de CSS, sem divisão de código —
 * para que `scripts/empacotar.ts` consiga costurar tudo em um arquivo.
 */
export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: './',
  build: {
    outDir: 'dist-pacote',
    cssCodeSplit: false,
    assetsInlineLimit: 100_000_000, // nada de arquivo solto ao lado do HTML
    modulePreload: { polyfill: false },
    rollupOptions: {
      output: {
        // IIFE em vez de módulo: navegador aberto em file:// executa sem CORS.
        format: 'iife',
        inlineDynamicImports: true,
        entryFileNames: 'pacote.js',
        assetFileNames: 'pacote.[ext]',
      },
    },
  },
});

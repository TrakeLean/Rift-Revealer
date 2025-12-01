import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  root: 'src/renderer',
  base: './',
  // Serve static assets (profile icons, logo, etc.) from the top-level public folder
  // so they end up alongside the built renderer files.
  publicDir: path.resolve(__dirname, 'public'),
  build: {
    outDir: '../../dist-renderer',
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src/renderer'),
    },
  },
})

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
const isProxy = process.env.VITE_PROXY === 'true';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: '../wwwroot',
    emptyOutDir: true, // cleans the wwwroot folder before building
  },
  server: {
    port: 5173,
    host: true,
    allowedHosts: true,
    hmr: isProxy ? {
      host: 'chambered.beatnikthedan.synology.me',
      protocol: 'wss',
      clientPort: 443,
    } : true,
    proxy: {
      '/api': {
        target: 'http://localhost:5001',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})

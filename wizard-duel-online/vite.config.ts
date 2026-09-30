import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// The game client talks to the boardgame.io multiplayer server.
// In dev, Vite runs on 5173 and proxies /games, /socket.io and /api to the
// server on 8000, so the browser sees everything as same-origin.
const SERVER_PORT = process.env.SERVER_PORT ?? '8000';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/games': {
        target: `http://localhost:${SERVER_PORT}`,
        changeOrigin: true,
        ws: true,
      },
      '/socket.io': {
        target: `http://localhost:${SERVER_PORT}`,
        changeOrigin: true,
        ws: true,
      },
      '/api': {
        target: `http://localhost:${SERVER_PORT}`,
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    chunkSizeWarningLimit: 1500,
  },
});

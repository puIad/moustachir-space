import { defineConfig } from 'vitest/config';
import { fileURLToPath, URL } from 'node:url';

// Vitest runs the store/KPI layer in a Node environment. Dexie tests inject
// fake-indexeddb via the per-file setup import. Path aliases mirror vite.config.ts.
export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@spec': fileURLToPath(new URL('../spec', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    globals: true,
    include: ['src/**/*.test.ts'],
  },
});

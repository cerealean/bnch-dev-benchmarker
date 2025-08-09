/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    sequence: {
      shuffle: true,
      concurrent: true,
    },
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'dist/', '**/*.d.ts'],
    },
    // Setup file to configure console mocking
    setupFiles: ['./src/__tests__/setup.ts'],
    // Exclude acceptance tests from default test runs
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/*.d.ts',
      '**/acceptance/**',
    ],
  },
});

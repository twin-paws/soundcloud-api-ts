import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'json-summary'],
      include: ['src/**/*.ts'],
      exclude: [
        'src/__tests__/**',
        '**/index.ts',
        'src/cli.ts',
        'src/types/**',
        // Type-only modules (interfaces, no executable statements)
        'src/client/cache.ts',
        'src/auth/token-provider.ts',
      ],
    },
  },
});

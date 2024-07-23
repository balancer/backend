import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        globals: true,
        environment: 'node',
        coverage: { reporter: ['text', 'lcov'] }, // lcov reporter is used by IDE coverage extensions
        // We just run vebal and sor module tests until we define a global testing strategy
        include: ['**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
        testTimeout: 120_000,
        hookTimeout: 120_000,
    },
});

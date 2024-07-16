import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
    test: {
        globals: true,
        environment: 'node',
        coverage: { reporter: ['text', 'lcov'] }, // lcov reporter is used by IDE coverage extensions
        // We just run vebal and sor module tests until we define a global testing strategy
        include: [
            './modules/vebal/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
            './modules/sor/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
        ],
        testTimeout: 120_000,
        hookTimeout: 120_000,
    },
    plugins: [tsconfigPaths()],
});

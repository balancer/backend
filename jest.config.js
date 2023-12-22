/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    setupFiles: ['dotenv/config'],
    watchPlugins: ['jest-watch-typeahead/filename', 'jest-watch-typeahead/testname'],
    setupFilesAfterEnv: ['<rootDir>/modules/tests-helper/globalTestSetup.ts'],
    globals: {
        'ts-jest': {
            isolatedModules: true,
        },
    },
};

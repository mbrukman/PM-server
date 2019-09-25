module.exports = {
    testEnvironment: './api/tests/helpers/custom-test-environment.js',
    globalSetup: './api/tests/helpers/global-setup.js',
    globalTeardown: './api/tests/helpers/global-teardown.js',
    coveragePathIgnorePatterns: ["/node_modules/"], // default
    coverageReporters: ["json", "clover"],
    displayName: {
        name: 'KAHOLO SERVER',
        color: 'blue',
    },
    projects: ["./tests"],
    collectCoverage: true,
    forceExit: true,
    runner: 'jest-runner',
    testRunner: "jest-circus/runner",
    setupFilesAfterEnv: ['./api/tests/helpers/global-test-setup.js'],
    globals: {
        websocketURL: 'http://localhost:3000/'
    }
    // coverageThreshold: https://github.com/facebook/jest/blob/master/docs/Configuration.md
};

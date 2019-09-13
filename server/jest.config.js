module.exports = {
    testEnvironment: 'node',
    coveragePathIgnorePatterns: ["/node_modules/"], // default
    coverageReporters: ["json", "clover"],
    displayName: {
        name: 'KAHOLO SERVER',
        color: 'blue',
    },
    projects: ["./tests"],
    collectCoverage: true,
    runner: 'jest-runner',
    testRunner: 'jasmine2',
    // coverageThreshold: https://github.com/facebook/jest/blob/master/docs/Configuration.md
};

module.exports = {
  testEnvironment: 'node',
  testTimeout: 10000,
  verbose: true,
  testMatch: ['**/test/**/*.test.js'],
  collectCoverageFrom: [
    'controllers/**/*.js',
    'routes/**/*.js',
    'middleware/**/*.js',
    '!**/node_modules/**'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov']
};
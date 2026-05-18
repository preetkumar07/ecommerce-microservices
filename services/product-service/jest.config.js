/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  testTimeout: 30000,
  runInBand: true,
  forceExit: true,
  clearMocks: true,
  globalSetup: './tests/helpers/globalSetup.js',
  globalTeardown: './tests/helpers/globalTeardown.js',
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/server.js',
    '!src/config/logger.js',
  ],
};
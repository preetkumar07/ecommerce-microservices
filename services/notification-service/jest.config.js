/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  testTimeout: 10000,
  runInBand: true,
  forceExit: true,
  clearMocks: true,
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/server.js',
    '!src/config/logger.js',
  ],
};

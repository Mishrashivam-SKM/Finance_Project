/**
 * Jest Configuration for FinanceGuide API Integration Tests
 */

module.exports = {
  // Test environment
  testEnvironment: 'node',

  // Test files pattern
  testMatch: ['**/tests/**/*.test.js'],

  // Setup file after env
  // setupFilesAfterEnv: ['./tests/setup.js'],

  // Timeout for each test (increased for database operations)
  testTimeout: 30000,

  // Verbose output
  verbose: true,

  // Force exit after tests complete
  forceExit: true,

  // Detect open handles
  detectOpenHandles: true,

  // Coverage configuration
  collectCoverageFrom: [
    'controllers/**/*.js',
    'routes/**/*.js',
    'middleware/**/*.js',
    'utils/**/*.js',
    '!**/node_modules/**'
  ],

  // Coverage thresholds (optional)
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 50,
      lines: 50,
      statements: 50
    }
  },

  // Module paths
  moduleDirectories: ['node_modules', '<rootDir>'],

  // Clear mocks between tests
  clearMocks: true,

  // Restore mocks between tests
  restoreMocks: true
};

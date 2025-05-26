module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: '../../',
  roots: ['<rootDir>/src/tests'],
  testMatch: ['**/src/tests/**/*.test.ts'],
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  collectCoverageFrom: [
    '**/src/agents/**/*.ts',
    '**/services/*.ts',
    '**/src/routes/agents/*.ts',
  ],
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/src/agents/implementations/CustomerSupportAgent.ts',
  ],
  verbose: true,
};

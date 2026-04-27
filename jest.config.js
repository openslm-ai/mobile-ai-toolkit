module.exports = {
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  transform: {
    '^.+\\.(ts|tsx)$': [
      'ts-jest',
      {
        tsconfig: {
          types: ['jest', 'node'],
          esModuleInterop: true,
          module: 'commonjs',
          moduleResolution: 'node',
        },
      },
    ],
  },
  transformIgnorePatterns: ['node_modules/(?!(react-native|@react-native)/)'],
  moduleNameMapper: {
    '^react-native$': '<rootDir>/jest.mocks.js',
  },
  testMatch: ['**/__tests__/**/*.(ts|tsx|js)', '**/*.(test|spec).(ts|tsx|js)'],
  collectCoverageFrom: ['src/**/*.{ts,tsx}', '!src/**/*.d.ts'],
  coverageReporters: ['text', 'lcov', 'html'],
  coverageDirectory: 'coverage',
};

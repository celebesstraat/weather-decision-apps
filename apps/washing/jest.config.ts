export default {
  preset: 'ts-jest',
  testEnvironment: 'jsdom', // Changed from 'node' to support DOM APIs
  transform: {
    '^.+\.tsx?$': 'ts-jest',
  },
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '^import-meta-env$': '<rootDir>/__mocks__/import-meta-env.js',
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
};
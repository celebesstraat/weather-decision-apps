// Mock import.meta.env for Jest tests
global.importMeta = {
  env: {
    VITE_GEMINI_API_KEY: process.env.VITE_GEMINI_API_KEY || ''
  }
};

// Mock import.meta
Object.defineProperty(global, 'import', {
  value: {
    meta: global.importMeta
  },
  writable: true,
  enumerable: true,
  configurable: true
});

// Set up global navigator object for Node environment  
if (typeof global.navigator === 'undefined') {
  global.navigator = {};
}

// Import @testing-library/jest-dom for additional matchers
require('@testing-library/jest-dom');

// Mock import.meta.env
Object.defineProperty(global, 'import.meta', {
  value: {
    env: {
      VITE_GEMINI_API_KEY: 'mock-api-key',
    },
  },
  writable: true,
});

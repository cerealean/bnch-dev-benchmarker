import { beforeEach, afterEach, vi } from 'vitest';

// Store original console methods
const originalConsole = { ...console };

// Flag to enable console output for specific tests
const ENABLE_CONSOLE_FOR_ACCEPTANCE_TESTS =
  process.env.VITEST_VERBOSE === 'true';

beforeEach(() => {
  // Only mock console.log if not in verbose mode
  if (!ENABLE_CONSOLE_FOR_ACCEPTANCE_TESTS) {
    vi.spyOn(console, 'log').mockImplementation(() => {});
  }

  // You can also mock other console methods if needed
  // vi.spyOn(console, 'warn').mockImplementation(() => {});
  // vi.spyOn(console, 'error').mockImplementation(() => {});
  // vi.spyOn(console, 'debug').mockImplementation(() => {});
});

afterEach(() => {
  // Restore console methods after each test
  vi.restoreAllMocks();
});

// Export utilities for tests that need console output
export { originalConsole };

// Helper function for conditional console logging
export const testConsole = {
  log: (...args: any[]) => {
    if (ENABLE_CONSOLE_FOR_ACCEPTANCE_TESTS) {
      originalConsole.log(...args);
    }
  },
  warn: (...args: any[]) => {
    if (ENABLE_CONSOLE_FOR_ACCEPTANCE_TESTS) {
      originalConsole.warn(...args);
    }
  },
  error: (...args: any[]) => {
    originalConsole.error(...args); // Always show errors
  },
};

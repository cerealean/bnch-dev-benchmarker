# Test Categories

This project uses a categorized test structure to separate different types of tests:

## Unit Tests (`src/__tests__/*.test.ts`)

Fast-running tests that verify individual components and functions:

- Run with: `npm run test` or `npm run test:unit`
- Include mocking and isolated component testing
- Should complete in under 5 seconds
- Run automatically in CI/CD pipelines

## Acceptance Tests (`src/__tests__/acceptance/*.test.ts`)

Integration tests that verify end-to-end functionality and real-world scenarios:

- Run with: `npm run test:acceptance`
- Include performance benchmarks and real algorithm comparisons
- May take longer to execute (10-30 seconds per test)
- Run separately to avoid slowing down development workflow

## Test Commands

- `npm test` - Run unit tests only (default)
- `npm run test:unit` - Run unit tests only (explicit)
- `npm run test:acceptance` - Run acceptance tests only
- `npm run test:all` - Run both unit and acceptance tests
- `npm run test:watch` - Watch unit tests for changes
- `npm run test:acceptance:watch` - Watch acceptance tests for changes

## Configuration

- `vitest.config.ts` - Unit test configuration (excludes acceptance tests)
- `vitest.acceptance.config.ts` - Acceptance test configuration (includes only acceptance tests)

This structure ensures that:

1. Fast unit tests run quickly during development
2. Slower acceptance tests don't block the development workflow
3. Both test categories can be run independently or together
4. CI/CD pipelines can choose which tests to run at different stages

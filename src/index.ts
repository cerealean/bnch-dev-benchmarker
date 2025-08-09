// Main exports
export { Benchmarker } from './benchmarker.js';
export { TimeDuration } from './time-duration.js';
export * from './types.js';
export * from './utils.js';
export * from './code-validator.js';
export * from './security-error-codes.js';

// Convenience functions
export { createBenchmarkWorker } from './worker.js';

/**
 * Quick benchmark function for simple use cases
 */
export async function benchmark(
  code: string,
  config?: Partial<import('./types.js').BenchmarkConfig>
) {
  const { Benchmarker } = await import('./benchmarker.js');
  const benchmarker = new Benchmarker(config);
  return benchmarker.benchmark(code).finally(() => benchmarker.dispose());
}

/**
 * Quick comparison function for simple use cases
 */
export async function compare(
  baselineCode: string,
  comparisonCode: string,
  config?: Partial<import('./types.js').BenchmarkConfig>
) {
  const { Benchmarker } = await import('./benchmarker.js');
  const benchmarker = new Benchmarker(config);
  return benchmarker.compare(baselineCode, comparisonCode);
}

/**
 * Configuration options for the benchmarker
 */
export interface BenchmarkConfig {
  /** Number of warmup iterations to run before measuring */
  warmupIterations?: number;
  /** Minimum number of samples to collect */
  minSamples?: number;
  /** Maximum number of samples to collect */
  maxSamples?: number;
  /** Maximum time to spend benchmarking in milliseconds */
  maxTime?: number;
  /** Whether to yield between samples for better reliability */
  yieldBetweenSamples?: boolean;
  /** Maximum code size in bytes */
  maxCodeSize?: number;
  /** Timeout for individual executions in milliseconds */
  executionTimeout?: number;
  /** Whether to run in a web worker for isolation */
  useWorker?: boolean;
}

/**
 * Security configuration for code execution
 */
export interface SecurityConfig {
  /** Content Security Policy to apply */
  csp?: string;
  /** List of globals to remove/disable */
  disabledGlobals?: string[];
  /** Whether to disable network access */
  disableNetwork?: boolean;
  /** Maximum execution time per sample */
  maxExecutionTime?: number;
  /** Maximum memory usage (not enforceable in browser, but for reference) */
  maxMemoryMB?: number;
}

/**
 * Result of a single benchmark sample
 */
export interface BenchmarkSample {
  /** Execution time in milliseconds */
  time: number;
  /** Whether the execution completed successfully */
  success: boolean;
  /** Error message if execution failed */
  error?: string;
  /** Memory usage if available */
  memoryUsage?: number;
}

/**
 * Complete benchmark results
 */
export interface BenchmarkResult {
  /** All individual samples */
  samples: BenchmarkSample[];
  /** Statistical summary */
  stats: BenchmarkStats;
  /** Configuration used */
  config: BenchmarkConfig;
  /** Security configuration used */
  security: SecurityConfig;
  /** Total time spent benchmarking */
  totalTime: number;
  /** Whether the benchmark was aborted */
  aborted: boolean;
}

/**
 * Statistical summary of benchmark results
 */
export interface BenchmarkStats {
  /** Mean execution time */
  mean: number;
  /** Median execution time */
  median: number;
  /** Standard deviation */
  standardDeviation: number;
  /** Minimum execution time */
  min: number;
  /** Maximum execution time */
  max: number;
  /** Number of successful samples */
  successfulSamples: number;
  /** Number of failed samples */
  failedSamples: number;
  /** Operations per second (1000 / mean) */
  operationsPerSecond: number;
  /** Coefficient of variation (standardDeviation / mean) */
  coefficientOfVariation: number;
}

/**
 * Comparison result between two benchmarks
 */
export interface BenchmarkComparison {
  /** First benchmark result */
  baseline: BenchmarkResult;
  /** Second benchmark result */
  comparison: BenchmarkResult;
  /** Relative performance difference (positive means comparison is faster) */
  relativeDifference: number;
  /** Statistical significance of the difference */
  significanceLevel: number;
  /** Human-readable summary */
  summary: string;
}

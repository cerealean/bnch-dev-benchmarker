import {
  BenchmarkConfig,
  SecurityConfig,
  BenchmarkResult,
  BenchmarkSample,
  BenchmarkComparison,
} from './types.js';
import {
  calculateStats,
  yieldControl,
  wrapUserCode,
  secondsToMilliseconds as secondsToMilliseconds,
  megabytesToKilobytes,
} from './utils.js';
import { CodeValidator } from './code-validator.js';
import { createBenchmarkWorker, executeInWorker } from './worker.js';

/**
 * Default benchmark configuration
 */
const DEFAULT_CONFIG: Required<BenchmarkConfig> = {
  warmupIterations: 5,
  minSamples: 10,
  maxSamples: 100,
  maxTime: secondsToMilliseconds(10),
  yieldBetweenSamples: true,
  maxCodeSize: megabytesToKilobytes(1),
  executionTimeout: secondsToMilliseconds(1),
  useWorker: true,
};

/**
 * Default security configuration
 */
const DEFAULT_SECURITY: Required<SecurityConfig> = {
  csp: "default-src 'none'; script-src 'unsafe-eval'; worker-src 'self'; connect-src 'none'; object-src 'none'; frame-src 'none'; base-uri 'none'; form-action 'none';",
  disabledGlobals: [],
  disableNetwork: true,
  maxExecutionTime: 1000,
  maxMemoryMB: 100,
};

/**
 * Main benchmarker class
 */
export class Benchmarker {
  private config: Required<BenchmarkConfig>;
  private security: Required<SecurityConfig>;
  private abortController: AbortController | null = null;
  private worker: Worker | null = null;
  private codeValidator: CodeValidator;

  constructor(
    config: Partial<BenchmarkConfig> = {},
    security: Partial<SecurityConfig> = {}
  ) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.security = { ...DEFAULT_SECURITY, ...security };
    this.codeValidator = new CodeValidator();
  }

  /**
   * Run a benchmark on the provided code
   */
  async benchmark(code: string): Promise<BenchmarkResult> {
    // Validate input
    this.codeValidator.validateCode(code, this.config.maxCodeSize);

    // Set up abort controller
    this.abortController = new AbortController();

    // Initialize worker if needed
    if (this.config.useWorker) {
      this.worker = createBenchmarkWorker();
    }

    const samples: BenchmarkSample[] = [];
    const startTime = performance.now();
    let aborted = false;

    try {
      // Warmup phase
      await this.runWarmup(code);

      if (this.abortController.signal.aborted) {
        aborted = true;
        return this.createResult(samples, startTime, aborted);
      }

      // Benchmark phase
      for (let i = 0; i < this.config.maxSamples; i++) {
        if (this.abortController.signal.aborted) {
          aborted = true;
          break;
        }

        const sample = await this.runSingleBenchmark(code);
        samples.push(sample);

        // Check if we have enough samples and time constraints
        if (samples.length >= this.config.minSamples) {
          const elapsedTime = performance.now() - startTime;
          if (elapsedTime >= this.config.maxTime) {
            break;
          }
        }

        // Yield control between samples if configured
        if (this.config.yieldBetweenSamples) {
          await yieldControl();
        }
      }
    } catch (error) {
      // Add error sample
      samples.push({
        time: 0,
        success: false,
        error: error instanceof Error ? error.message : String(error),
      });
    } finally {
      // Clean up worker
      if (this.worker) {
        this.worker.terminate();
        this.worker = null;
      }
    }

    return this.createResult(samples, startTime, aborted);
  }

  /**
   * Compare two code snippets
   */
  async compare(
    baselineCode: string,
    comparisonCode: string
  ): Promise<BenchmarkComparison> {
    const [baseline, comparison] = await Promise.all([
      this.benchmark(baselineCode),
      this.benchmark(comparisonCode),
    ]);

    const relativeDifference =
      comparison.stats.mean > 0 && baseline.stats.mean > 0
        ? (baseline.stats.mean - comparison.stats.mean) / baseline.stats.mean
        : 0;

    // Simple statistical significance test (t-test approximation)
    const significanceLevel = this.calculateSignificance(baseline, comparison);

    const summary = this.generateComparisonSummary(
      relativeDifference,
      significanceLevel
    );

    return {
      baseline,
      comparison,
      relativeDifference,
      significanceLevel,
      summary,
    };
  }

  /**
   * Abort the current benchmark
   */
  abort(): void {
    if (this.abortController) {
      this.abortController.abort();
    }
  }

  dispose(): void {
    this.abort();
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
  }

  /**
   * Run warmup iterations
   */
  private async runWarmup(code: string): Promise<void> {
    for (let i = 0; i < this.config.warmupIterations; i++) {
      if (this.abortController?.signal.aborted) return;

      await this.runSingleBenchmark(code);

      if (this.config.yieldBetweenSamples) {
        await yieldControl();
      }
    }
  }

  /**
   * Run a single benchmark iteration
   */
  private async runSingleBenchmark(code: string): Promise<BenchmarkSample> {
    if (this.config.useWorker && this.worker) {
      return this.runInWorker(code);
    } else {
      return this.runInMainThread(code);
    }
  }

  /**
   * Run benchmark in web worker
   */
  private async runInWorker(code: string): Promise<BenchmarkSample> {
    if (!this.worker) {
      throw new Error('Worker not initialized');
    }

    const wrappedCode = wrapUserCode(code, this.config.executionTimeout);
    const result = await executeInWorker(
      this.worker,
      wrappedCode,
      this.config.executionTimeout,
      this.security.csp
    );

    return {
      time: result.time,
      success: result.success,
      error: result.error,
    };
  }

  /**
   * Run benchmark in main thread (less secure)
   */
  private async runInMainThread(code: string): Promise<BenchmarkSample> {
    const startTime = performance.now();

    try {
      const wrappedCode = wrapUserCode(code, this.config.executionTimeout);
      await eval(wrappedCode);

      const endTime = performance.now();
      return {
        time: endTime - startTime,
        success: true,
      };
    } catch (error) {
      const endTime = performance.now();
      return {
        time: endTime - startTime,
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Create benchmark result object
   */
  private createResult(
    samples: BenchmarkSample[],
    startTime: number,
    aborted: boolean
  ): BenchmarkResult {
    const totalTime = performance.now() - startTime;
    const stats = calculateStats(samples);

    return {
      samples,
      stats,
      config: this.config,
      security: this.security,
      totalTime,
      aborted,
    };
  }

  /**
   * Calculate statistical significance (simplified)
   */
  private calculateSignificance(
    baseline: BenchmarkResult,
    comparison: BenchmarkResult
  ): number {
    // Simplified significance calculation
    // In a real implementation, you'd want a proper t-test
    const baselineCV = baseline.stats.coefficientOfVariation;
    const comparisonCV = comparison.stats.coefficientOfVariation;

    // Higher coefficient of variation means less reliable results
    const reliability = Math.max(0, 1 - Math.max(baselineCV, comparisonCV));

    return reliability;
  }

  /**
   * Generate human-readable comparison summary
   */
  private generateComparisonSummary(
    relativeDifference: number,
    significanceLevel: number
  ): string {
    const percentChange = Math.abs(relativeDifference * 100);
    const direction = relativeDifference > 0 ? 'faster' : 'slower';
    const confidence =
      significanceLevel > 0.7
        ? 'high'
        : significanceLevel > 0.4
        ? 'medium'
        : 'low';

    if (percentChange < 1) {
      return `Performance difference is negligible (${confidence} confidence)`;
    }

    return `Comparison is ${percentChange.toFixed(
      1
    )}% ${direction} (${confidence} confidence)`;
  }
}

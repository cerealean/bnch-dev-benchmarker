import { BenchmarkSample, BenchmarkStats } from './types.js';
import { TimeDuration } from './time-duration.js';

/**
 * Calculate statistical summary from benchmark samples
 */
export function calculateStats(samples: BenchmarkSample[]): BenchmarkStats {
  const successfulSamples = samples.filter((s) => s.success);
  const times = successfulSamples.map((s) => s.time);

  if (times.length === 0) {
    const zeroDuration = TimeDuration.fromMilliseconds(0);
    return {
      mean: zeroDuration,
      median: zeroDuration,
      standardDeviation: zeroDuration,
      min: zeroDuration,
      max: zeroDuration,
      successfulSamples: 0,
      failedSamples: samples.length,
      operationsPerSecond: 0,
      coefficientOfVariation: 0,
    };
  }

  const sorted = [...times].sort((a, b) => a - b);
  const mean = times.reduce((sum, time) => sum + time, 0) / times.length;
  const median =
    sorted.length % 2 === 0
      ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
      : sorted[Math.floor(sorted.length / 2)];

  const variance =
    times.reduce((sum, time) => sum + Math.pow(time - mean, 2), 0) /
    times.length;
  const standardDeviation = Math.sqrt(variance);

  return {
    mean: TimeDuration.fromMilliseconds(mean),
    median: TimeDuration.fromMilliseconds(median),
    standardDeviation: TimeDuration.fromMilliseconds(standardDeviation),
    min: TimeDuration.fromMilliseconds(Math.min(...times)),
    max: TimeDuration.fromMilliseconds(Math.max(...times)),
    successfulSamples: successfulSamples.length,
    failedSamples: samples.length - successfulSamples.length,
    operationsPerSecond: mean > 0 ? 1000 / mean : 0,
    coefficientOfVariation: mean > 0 ? standardDeviation / mean : 0,
  };
}

/**
 * Yield control to allow microtasks and other operations to run
 */
export function yieldControl(): Promise<void> {
  return new Promise((resolve) => {
    if (typeof MessageChannel !== 'undefined') {
      const channel = new MessageChannel();
      channel.port2.onmessage = () => resolve();
      channel.port1.postMessage(null);
    } else {
      setTimeout(resolve, 0);
    }
  });
}

/**
 * Wrap user code with timeout and error handling
 */
export function wrapUserCode(code: string, timeout: number): string {
  return `
    (function() {
      const startTime = performance.now();
      let timeoutId;
      let completed = false;
      
      const result = Promise.race([
        Promise.resolve().then(() => {
          ${code}
        }),
        new Promise((_, reject) => {
          timeoutId = setTimeout(() => {
            if (!completed) {
              reject(new Error('Execution timeout'));
            }
          }, ${timeout});
        })
      ]);
      
      return result.finally(() => {
        completed = true;
        if (timeoutId) clearTimeout(timeoutId);
      });
    })();
  `;
}

/**
 * Convert megabytes to kilobytes
 */
export function megabytesToKilobytes(megabytes: number): number {
  return megabytes * 1024;
}

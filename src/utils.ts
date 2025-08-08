import { BenchmarkSample, BenchmarkStats } from './types.js';

/**
 * Calculate statistical summary from benchmark samples
 */
export function calculateStats(samples: BenchmarkSample[]): BenchmarkStats {
  const successfulSamples = samples.filter(s => s.success);
  const times = successfulSamples.map(s => s.time);
  
  if (times.length === 0) {
    return {
      mean: 0,
      median: 0,
      standardDeviation: 0,
      min: 0,
      max: 0,
      successfulSamples: 0,
      failedSamples: samples.length,
      operationsPerSecond: 0,
      coefficientOfVariation: 0,
    };
  }

  const sorted = [...times].sort((a, b) => a - b);
  const mean = times.reduce((sum, time) => sum + time, 0) / times.length;
  const median = sorted.length % 2 === 0
    ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
    : sorted[Math.floor(sorted.length / 2)];

  const variance = times.reduce((sum, time) => sum + Math.pow(time - mean, 2), 0) / times.length;
  const standardDeviation = Math.sqrt(variance);

  return {
    mean,
    median,
    standardDeviation,
    min: Math.min(...times),
    max: Math.max(...times),
    successfulSamples: successfulSamples.length,
    failedSamples: samples.length - successfulSamples.length,
    operationsPerSecond: mean > 0 ? 1000 / mean : 0,
    coefficientOfVariation: mean > 0 ? standardDeviation / mean : 0,
  };
}

/**
 * Sleep for a specified number of milliseconds
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Yield control to allow microtasks and other operations to run
 */
export function yieldControl(): Promise<void> {
  return new Promise(resolve => {
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
 * Validate and sanitize user code
 */
export function validateCode(code: string, maxSize: number = 1024 * 1024): void {
  if (typeof code !== 'string') {
    throw new Error('Code must be a string');
  }
  
  if (code.length > maxSize) {
    throw new Error(`Code size exceeds maximum allowed size of ${maxSize} bytes`);
  }
  
  // Basic validation for potentially dangerous patterns
  const dangerousPatterns = [
    /while\s*\(\s*true\s*\)/gi,
    /for\s*\(\s*;\s*;\s*\)/gi,
    /eval\s*\(/gi,
    /Function\s*\(/gi,
    /setTimeout\s*\(/gi,
    /setInterval\s*\(/gi,
  ];
  
  for (const pattern of dangerousPatterns) {
    if (pattern.test(code)) {
      throw new Error('Code contains potentially dangerous patterns');
    }
  }
}

/**
 * Create a secure execution context with disabled globals
 */
export function createSecureContext(disabledGlobals: string[] = []): string {
  const defaultDisabled = [
    'fetch',
    'XMLHttpRequest',
    'WebSocket',
    'EventSource',
    'importScripts',
    'Worker',
    'SharedWorker',
    'ServiceWorker',
    'navigator',
    'location',
    'history',
    'localStorage',
    'sessionStorage',
    'indexedDB',
    'crypto',
    'subtle',
  ];
  
  const allDisabled = [...new Set([...defaultDisabled, ...disabledGlobals])];
  
  return allDisabled
    .map(global => `const ${global} = undefined;`)
    .join('\n') + '\n';
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

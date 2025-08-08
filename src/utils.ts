import { BenchmarkSample, BenchmarkStats } from './types.js';

/**
 * Calculate statistical summary from benchmark samples
 */
export function calculateStats(samples: BenchmarkSample[]): BenchmarkStats {
  const successfulSamples = samples.filter((s) => s.success);
  const times = successfulSamples.map((s) => s.time);

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
  const median =
    sorted.length % 2 === 0
      ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
      : sorted[Math.floor(sorted.length / 2)];

  const variance =
    times.reduce((sum, time) => sum + Math.pow(time - mean, 2), 0) /
    times.length;
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
  return new Promise((resolve) => setTimeout(resolve, ms));
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
 * Validate and sanitize user code
 */
export function validateCode(
  code: string,
  maxSize: number = 1024 * 1024
): void {
  if (typeof code !== 'string') {
    throw new Error('Code must be a string');
  }

  if (code.length > maxSize) {
    throw new Error(
      `Code size exceeds maximum allowed size of ${maxSize} bytes`
    );
  }

  // Define dangerous patterns with specific error messages
  const dangerousPatterns = [
    {
      pattern: /while\s*\(\s*true\s*\)/gi,
      message:
        'Infinite while loops (while(true)) are not allowed as they can cause the system to freeze',
      code: 'INFINITE_WHILE_LOOP',
    },
    {
      pattern: /for\s*\(\s*;\s*;\s*\)/gi,
      message:
        'Infinite for loops (for(;;)) are not allowed as they can cause the system to freeze',
      code: 'INFINITE_FOR_LOOP',
    },
    {
      pattern: /eval\s*\(/gi,
      message:
        'The eval() function is not allowed as it can execute arbitrary code and poses security risks',
      code: 'EVAL_USAGE',
    },
    {
      pattern: /Function\s*\(/gi,
      message:
        'The Function constructor is not allowed as it can dynamically create and execute code, posing security risks',
      code: 'FUNCTION_CONSTRUCTOR',
    },
    {
      pattern: /setTimeout\s*\(/gi,
      message:
        'setTimeout() is not allowed as it can interfere with benchmarking timing and create resource leaks',
      code: 'SETTIMEOUT_USAGE',
    },
    {
      pattern: /setInterval\s*\(/gi,
      message:
        'setInterval() is not allowed as it can create persistent timers that interfere with benchmarking',
      code: 'SETINTERVAL_USAGE',
    },
    {
      pattern: /fetch\s*\(/gi,
      message:
        'The fetch() API is not allowed as it can make network requests and cause timing interference',
      code: 'FETCH_USAGE',
    },
    {
      pattern: /XMLHttpRequest\s*\(/gi,
      message:
        'XMLHttpRequest is not allowed as it can make network requests and poses security risks',
      code: 'XMLHTTPREQUEST_USAGE',
    },
    {
      pattern: /new\s+XMLHttpRequest\s*\(/gi,
      message:
        'Creating XMLHttpRequest instances is not allowed as it can make network requests and poses security risks',
      code: 'XMLHTTPREQUEST_CONSTRUCTOR',
    },
    {
      pattern: /WebSocket\s*\(/gi,
      message:
        'WebSocket connections are not allowed as they can establish persistent network connections',
      code: 'WEBSOCKET_USAGE',
    },
    {
      pattern: /new\s+WebSocket\s*\(/gi,
      message:
        'Creating WebSocket instances is not allowed as they can establish persistent network connections',
      code: 'WEBSOCKET_CONSTRUCTOR',
    },
    {
      pattern: /EventSource\s*\(/gi,
      message:
        'EventSource is not allowed as it can establish server-sent event connections',
      code: 'EVENTSOURCE_USAGE',
    },
    {
      pattern: /new\s+EventSource\s*\(/gi,
      message:
        'Creating EventSource instances is not allowed as they can establish server-sent event connections',
      code: 'EVENTSOURCE_CONSTRUCTOR',
    },
    {
      pattern: /Worker\s*\(/gi,
      message:
        'Creating Worker instances is not allowed as it can spawn additional threads and bypass security',
      code: 'WORKER_USAGE',
    },
    {
      pattern: /new\s+Worker\s*\(/gi,
      message:
        'Creating Worker instances is not allowed as it can spawn additional threads and bypass security',
      code: 'WORKER_CONSTRUCTOR',
    },
    {
      pattern: /SharedWorker\s*\(/gi,
      message:
        'SharedWorker is not allowed as it can create shared execution contexts and bypass security',
      code: 'SHAREDWORKER_USAGE',
    },
    {
      pattern: /new\s+SharedWorker\s*\(/gi,
      message:
        'Creating SharedWorker instances is not allowed as they can create shared execution contexts and bypass security',
      code: 'SHAREDWORKER_CONSTRUCTOR',
    },
    {
      pattern: /importScripts\s*\(/gi,
      message:
        'importScripts() is not allowed as it can load and execute external scripts, posing security risks',
      code: 'IMPORTSCRIPTS_USAGE',
    },
    {
      pattern: /document\.createElement\s*\(\s*['"`]script['"`]/gi,
      message:
        'Creating script elements is not allowed as it can inject and execute arbitrary code',
      code: 'SCRIPT_ELEMENT_CREATION',
    },
    {
      pattern: /\.innerHTML\s*=/gi,
      message:
        'Setting innerHTML is not allowed as it can inject and execute scripts, posing XSS risks',
      code: 'INNERHTML_ASSIGNMENT',
    },
    {
      pattern: /\.outerHTML\s*=/gi,
      message:
        'Setting outerHTML is not allowed as it can inject and execute scripts, posing XSS risks',
      code: 'OUTERHTML_ASSIGNMENT',
    },
    {
      pattern: /requestAnimationFrame\s*\(/gi,
      message:
        'requestAnimationFrame() is not allowed as it can interfere with benchmarking timing precision',
      code: 'REQUESTANIMATIONFRAME_USAGE',
    },
    {
      pattern: /setImmediate\s*\(/gi,
      message:
        'setImmediate() is not allowed as it can interfere with benchmarking timing and event loop control',
      code: 'SETIMMEDIATE_USAGE',
    },
    {
      pattern: /process\.nextTick\s*\(/gi,
      message:
        'process.nextTick() is not allowed as it can interfere with benchmarking timing in Node.js environments',
      code: 'PROCESS_NEXTTICK_USAGE',
    },
    {
      pattern: /crypto\.subtle/gi,
      message:
        'The crypto.subtle API is not allowed as it may interfere with timing measurements and poses security considerations',
      code: 'CRYPTO_SUBTLE_USAGE',
    },
    {
      pattern: /localStorage\s*\./gi,
      message:
        'localStorage access is not allowed as it can cause side effects and timing variations',
      code: 'LOCALSTORAGE_USAGE',
    },
    {
      pattern: /sessionStorage\s*\./gi,
      message:
        'sessionStorage access is not allowed as it can cause side effects and timing variations',
      code: 'SESSIONSTORAGE_USAGE',
    },
    {
      pattern: /indexedDB\s*\./gi,
      message:
        'indexedDB access is not allowed as it involves asynchronous database operations that interfere with benchmarking',
      code: 'INDEXEDDB_USAGE',
    },
    {
      pattern: /alert\s*\(/gi,
      message:
        'alert() is not allowed as it blocks execution and interferes with benchmarking timing',
      code: 'ALERT_USAGE',
    },
    {
      pattern: /confirm\s*\(/gi,
      message:
        'confirm() is not allowed as it blocks execution and interferes with benchmarking timing',
      code: 'CONFIRM_USAGE',
    },
    {
      pattern: /prompt\s*\(/gi,
      message:
        'prompt() is not allowed as it blocks execution and interferes with benchmarking timing',
      code: 'PROMPT_USAGE',
    },
  ];

  // Find all matches and report the earliest one
  let earliestMatch = null;
  let earliestPattern = null;

  for (const patternInfo of dangerousPatterns) {
    // Reset the regex to start from the beginning
    patternInfo.pattern.lastIndex = 0;
    const match = patternInfo.pattern.exec(code);
    if (match && (!earliestMatch || match.index < earliestMatch.index)) {
      earliestMatch = match;
      earliestPattern = patternInfo;
    }
  }

  if (earliestMatch && earliestPattern) {
    // Find the line number where the pattern was found
    const lines = code.substring(0, earliestMatch.index).split('\n');
    const lineNumber = lines.length;
    const columnNumber = lines[lines.length - 1].length + 1;

    const error = new Error(
      `Security Error [${earliestPattern.code}]: ${earliestPattern.message}\n` +
        `Found at line ${lineNumber}, column ${columnNumber}: "${earliestMatch[0].trim()}"\n` +
        `Please remove or replace this code to ensure safe execution.`
    );
    (error as any).code = earliestPattern.code;
    throw error;
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

  return (
    allDisabled.map((global) => `const ${global} = undefined;`).join('\n') +
    '\n'
  );
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
 * Convert seconds to milliseconds
 */
export function millisecondsFromSeconds(seconds: number): number {
  return seconds * 1000;
}

/**
 * Convert megabytes to kilobytes
 */
export function kilobytesFromMegabytes(megabytes: number): number {
  return megabytes * 1024;
}

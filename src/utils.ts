import { BenchmarkSample, BenchmarkStats } from './types.js';

/**
 * Security error codes for dangerous patterns
 */
export const enum SecurityErrorCode {
  INFINITE_WHILE_LOOP = 'INFINITE_WHILE_LOOP',
  INFINITE_FOR_LOOP = 'INFINITE_FOR_LOOP',
  EVAL_USAGE = 'EVAL_USAGE',
  FUNCTION_CONSTRUCTOR = 'FUNCTION_CONSTRUCTOR',
  SETTIMEOUT_USAGE = 'SETTIMEOUT_USAGE',
  SETINTERVAL_USAGE = 'SETINTERVAL_USAGE',
  FETCH_USAGE = 'FETCH_USAGE',
  XMLHTTPREQUEST_USAGE = 'XMLHTTPREQUEST_USAGE',
  XMLHTTPREQUEST_CONSTRUCTOR = 'XMLHTTPREQUEST_CONSTRUCTOR',
  WEBSOCKET_USAGE = 'WEBSOCKET_USAGE',
  WEBSOCKET_CONSTRUCTOR = 'WEBSOCKET_CONSTRUCTOR',
  EVENTSOURCE_USAGE = 'EVENTSOURCE_USAGE',
  EVENTSOURCE_CONSTRUCTOR = 'EVENTSOURCE_CONSTRUCTOR',
  WORKER_USAGE = 'WORKER_USAGE',
  WORKER_CONSTRUCTOR = 'WORKER_CONSTRUCTOR',
  SHAREDWORKER_USAGE = 'SHAREDWORKER_USAGE',
  SHAREDWORKER_CONSTRUCTOR = 'SHAREDWORKER_CONSTRUCTOR',
  IMPORTSCRIPTS_USAGE = 'IMPORTSCRIPTS_USAGE',
  SCRIPT_ELEMENT_CREATION = 'SCRIPT_ELEMENT_CREATION',
  INNERHTML_ASSIGNMENT = 'INNERHTML_ASSIGNMENT',
  OUTERHTML_ASSIGNMENT = 'OUTERHTML_ASSIGNMENT',
  REQUESTANIMATIONFRAME_USAGE = 'REQUESTANIMATIONFRAME_USAGE',
  SETIMMEDIATE_USAGE = 'SETIMMEDIATE_USAGE',
  PROCESS_NEXTTICK_USAGE = 'PROCESS_NEXTTICK_USAGE',
  CRYPTO_SUBTLE_USAGE = 'CRYPTO_SUBTLE_USAGE',
  LOCALSTORAGE_USAGE = 'LOCALSTORAGE_USAGE',
  SESSIONSTORAGE_USAGE = 'SESSIONSTORAGE_USAGE',
  INDEXEDDB_USAGE = 'INDEXEDDB_USAGE',
  ALERT_USAGE = 'ALERT_USAGE',
  CONFIRM_USAGE = 'CONFIRM_USAGE',
  PROMPT_USAGE = 'PROMPT_USAGE',
}

/**
 * Security error messages mapped by error code
 */
const securityErrorMessages = new Map<SecurityErrorCode, string>([
  [
    SecurityErrorCode.INFINITE_WHILE_LOOP,
    'Infinite while loops (while(true)) are not allowed as they can cause the system to freeze',
  ],
  [
    SecurityErrorCode.INFINITE_FOR_LOOP,
    'Infinite for loops (for(;;)) are not allowed as they can cause the system to freeze',
  ],
  [
    SecurityErrorCode.EVAL_USAGE,
    'The eval() function is not allowed as it can execute arbitrary code and poses security risks',
  ],
  [
    SecurityErrorCode.FUNCTION_CONSTRUCTOR,
    'The Function constructor is not allowed as it can dynamically create and execute code, posing security risks',
  ],
  [
    SecurityErrorCode.SETTIMEOUT_USAGE,
    'setTimeout() is not allowed as it can interfere with benchmarking timing and create resource leaks',
  ],
  [
    SecurityErrorCode.SETINTERVAL_USAGE,
    'setInterval() is not allowed as it can create persistent timers that interfere with benchmarking',
  ],
  [
    SecurityErrorCode.FETCH_USAGE,
    'The fetch() API is not allowed as it can make network requests and cause timing interference',
  ],
  [
    SecurityErrorCode.XMLHTTPREQUEST_USAGE,
    'XMLHttpRequest is not allowed as it can make network requests and poses security risks',
  ],
  [
    SecurityErrorCode.XMLHTTPREQUEST_CONSTRUCTOR,
    'Creating XMLHttpRequest instances is not allowed as it can make network requests and poses security risks',
  ],
  [
    SecurityErrorCode.WEBSOCKET_USAGE,
    'WebSocket connections are not allowed as they can establish persistent network connections',
  ],
  [
    SecurityErrorCode.WEBSOCKET_CONSTRUCTOR,
    'Creating WebSocket instances is not allowed as they can establish persistent network connections',
  ],
  [
    SecurityErrorCode.EVENTSOURCE_USAGE,
    'EventSource is not allowed as it can establish server-sent event connections',
  ],
  [
    SecurityErrorCode.EVENTSOURCE_CONSTRUCTOR,
    'Creating EventSource instances is not allowed as they can establish server-sent event connections',
  ],
  [
    SecurityErrorCode.WORKER_USAGE,
    'Creating Worker instances is not allowed as it can spawn additional threads and bypass security',
  ],
  [
    SecurityErrorCode.WORKER_CONSTRUCTOR,
    'Creating Worker instances is not allowed as it can spawn additional threads and bypass security',
  ],
  [
    SecurityErrorCode.SHAREDWORKER_USAGE,
    'SharedWorker is not allowed as it can create shared execution contexts and bypass security',
  ],
  [
    SecurityErrorCode.SHAREDWORKER_CONSTRUCTOR,
    'Creating SharedWorker instances is not allowed as they can create shared execution contexts and bypass security',
  ],
  [
    SecurityErrorCode.IMPORTSCRIPTS_USAGE,
    'importScripts() is not allowed as it can load and execute external scripts, posing security risks',
  ],
  [
    SecurityErrorCode.SCRIPT_ELEMENT_CREATION,
    'Creating script elements is not allowed as it can inject and execute arbitrary code',
  ],
  [
    SecurityErrorCode.INNERHTML_ASSIGNMENT,
    'Setting innerHTML is not allowed as it can inject and execute scripts, posing XSS risks',
  ],
  [
    SecurityErrorCode.OUTERHTML_ASSIGNMENT,
    'Setting outerHTML is not allowed as it can inject and execute scripts, posing XSS risks',
  ],
  [
    SecurityErrorCode.REQUESTANIMATIONFRAME_USAGE,
    'requestAnimationFrame() is not allowed as it can interfere with benchmarking timing precision',
  ],
  [
    SecurityErrorCode.SETIMMEDIATE_USAGE,
    'setImmediate() is not allowed as it can interfere with benchmarking timing and event loop control',
  ],
  [
    SecurityErrorCode.PROCESS_NEXTTICK_USAGE,
    'process.nextTick() is not allowed as it can interfere with benchmarking timing in Node.js environments',
  ],
  [
    SecurityErrorCode.CRYPTO_SUBTLE_USAGE,
    'The crypto.subtle API is not allowed as it may interfere with timing measurements and poses security considerations',
  ],
  [
    SecurityErrorCode.LOCALSTORAGE_USAGE,
    'localStorage access is not allowed as it can cause side effects and timing variations',
  ],
  [
    SecurityErrorCode.SESSIONSTORAGE_USAGE,
    'sessionStorage access is not allowed as it can cause side effects and timing variations',
  ],
  [
    SecurityErrorCode.INDEXEDDB_USAGE,
    'indexedDB access is not allowed as it involves asynchronous database operations that interfere with benchmarking',
  ],
  [
    SecurityErrorCode.ALERT_USAGE,
    'alert() is not allowed as it blocks execution and interferes with benchmarking timing',
  ],
  [
    SecurityErrorCode.CONFIRM_USAGE,
    'confirm() is not allowed as it blocks execution and interferes with benchmarking timing',
  ],
  [
    SecurityErrorCode.PROMPT_USAGE,
    'prompt() is not allowed as it blocks execution and interferes with benchmarking timing',
  ],
]);

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

  // Define dangerous patterns with their corresponding error codes
  const dangerousPatterns = [
    {
      pattern: /while\s*\(\s*true\s*\)/gi,
      code: SecurityErrorCode.INFINITE_WHILE_LOOP,
    },
    {
      pattern: /for\s*\(\s*;\s*;\s*\)/gi,
      code: SecurityErrorCode.INFINITE_FOR_LOOP,
    },
    {
      pattern: /eval\s*\(/gi,
      code: SecurityErrorCode.EVAL_USAGE,
    },
    {
      pattern: /Function\s*\(/gi,
      code: SecurityErrorCode.FUNCTION_CONSTRUCTOR,
    },
    {
      pattern: /setTimeout\s*\(/gi,
      code: SecurityErrorCode.SETTIMEOUT_USAGE,
    },
    {
      pattern: /setInterval\s*\(/gi,
      code: SecurityErrorCode.SETINTERVAL_USAGE,
    },
    {
      pattern: /fetch\s*\(/gi,
      code: SecurityErrorCode.FETCH_USAGE,
    },
    {
      pattern: /XMLHttpRequest\s*\(/gi,
      code: SecurityErrorCode.XMLHTTPREQUEST_USAGE,
    },
    {
      pattern: /new\s+XMLHttpRequest\s*\(/gi,
      code: SecurityErrorCode.XMLHTTPREQUEST_CONSTRUCTOR,
    },
    {
      pattern: /WebSocket\s*\(/gi,
      code: SecurityErrorCode.WEBSOCKET_USAGE,
    },
    {
      pattern: /new\s+WebSocket\s*\(/gi,
      code: SecurityErrorCode.WEBSOCKET_CONSTRUCTOR,
    },
    {
      pattern: /EventSource\s*\(/gi,
      code: SecurityErrorCode.EVENTSOURCE_USAGE,
    },
    {
      pattern: /new\s+EventSource\s*\(/gi,
      code: SecurityErrorCode.EVENTSOURCE_CONSTRUCTOR,
    },
    {
      pattern: /Worker\s*\(/gi,
      code: SecurityErrorCode.WORKER_USAGE,
    },
    {
      pattern: /new\s+Worker\s*\(/gi,
      code: SecurityErrorCode.WORKER_CONSTRUCTOR,
    },
    {
      pattern: /SharedWorker\s*\(/gi,
      code: SecurityErrorCode.SHAREDWORKER_USAGE,
    },
    {
      pattern: /new\s+SharedWorker\s*\(/gi,
      code: SecurityErrorCode.SHAREDWORKER_CONSTRUCTOR,
    },
    {
      pattern: /importScripts\s*\(/gi,
      code: SecurityErrorCode.IMPORTSCRIPTS_USAGE,
    },
    {
      pattern: /document\.createElement\s*\(\s*['"`]script['"`]/gi,
      code: SecurityErrorCode.SCRIPT_ELEMENT_CREATION,
    },
    {
      pattern: /\.innerHTML\s*=/gi,
      code: SecurityErrorCode.INNERHTML_ASSIGNMENT,
    },
    {
      pattern: /\.outerHTML\s*=/gi,
      code: SecurityErrorCode.OUTERHTML_ASSIGNMENT,
    },
    {
      pattern: /requestAnimationFrame\s*\(/gi,
      code: SecurityErrorCode.REQUESTANIMATIONFRAME_USAGE,
    },
    {
      pattern: /setImmediate\s*\(/gi,
      code: SecurityErrorCode.SETIMMEDIATE_USAGE,
    },
    {
      pattern: /process\.nextTick\s*\(/gi,
      code: SecurityErrorCode.PROCESS_NEXTTICK_USAGE,
    },
    {
      pattern: /crypto\.subtle/gi,
      code: SecurityErrorCode.CRYPTO_SUBTLE_USAGE,
    },
    {
      pattern: /localStorage\s*\./gi,
      code: SecurityErrorCode.LOCALSTORAGE_USAGE,
    },
    {
      pattern: /sessionStorage\s*\./gi,
      code: SecurityErrorCode.SESSIONSTORAGE_USAGE,
    },
    {
      pattern: /indexedDB\s*\./gi,
      code: SecurityErrorCode.INDEXEDDB_USAGE,
    },
    {
      pattern: /alert\s*\(/gi,
      code: SecurityErrorCode.ALERT_USAGE,
    },
    {
      pattern: /confirm\s*\(/gi,
      code: SecurityErrorCode.CONFIRM_USAGE,
    },
    {
      pattern: /prompt\s*\(/gi,
      code: SecurityErrorCode.PROMPT_USAGE,
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

    const message = securityErrorMessages.get(earliestPattern.code);
    const error = new Error(
      `Security Error [${earliestPattern.code}]: ${message}\n` +
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

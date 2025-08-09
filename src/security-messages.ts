import { SecurityErrorCode } from './security-error-codes';

export const securityMessages = [
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
] as ReadonlyArray<[SecurityErrorCode, string]>;

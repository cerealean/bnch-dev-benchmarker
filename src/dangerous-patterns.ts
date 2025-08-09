import { SecurityErrorCode } from './security-error-codes';

/**
 * Represents a dangerous pattern with its corresponding security error code
 */
export interface DangerousPattern {
  pattern: RegExp;
  code: SecurityErrorCode;
}

/**
 * Collection of dangerous code patterns that should be blocked for security reasons
 */
export const dangerousPatterns: DangerousPattern[] = [
  {
    pattern: /while\s*\(\s*true\s*\)/gi,
    code: SecurityErrorCode.INFINITE_WHILE_LOOP,
  },
  {
    pattern: /while\s*\(\s*(\!{2,})\s*true\s*\)/gi,
    code: SecurityErrorCode.INFINITE_WHILE_LOOP,
  },
  {
    pattern: /while\s*\(\s*(\!{1,})\s*false\s*\)/gi,
    code: SecurityErrorCode.INFINITE_WHILE_LOOP,
  },
  {
    pattern:
      /while\s*\(\s*\"?\s*([a-zA-Z_]\w*|\d+)\s*\"?\s*(={2,3})\s*\"?\s*\1\s*\"?\s*\)/gi,
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
  {
    pattern: /\bhistory\s*\./gi,
    code: SecurityErrorCode.HISTORY_USAGE,
  },
  {
    pattern: /\bnavigator\s*\./gi,
    code: SecurityErrorCode.NAVIGATOR_USAGE,
  },
  {
    pattern: /\bimport\s*\(/gi,
    code: SecurityErrorCode.IMPORT_USAGE,
  },
  {
    pattern: /\brequire\s*\(/gi,
    code: SecurityErrorCode.REQUIRE_USAGE,
  },
  {
    pattern: /\binclude\s*\(/gi,
    code: SecurityErrorCode.INCLUDE_USAGE,
  },
  {
    pattern: /\bglobal\s*\./gi,
    code: SecurityErrorCode.GLOBAL_ACCESS,
  },
  {
    pattern: /\bwindow\s*\./gi,
    code: SecurityErrorCode.WINDOW_ACCESS,
  },
  {
    pattern: /\bdocument\s*\./gi,
    code: SecurityErrorCode.DOCUMENT_ACCESS,
  },
  {
    pattern: /\blocation\s*\./gi,
    code: SecurityErrorCode.LOCATION_ACCESS,
  },
  {
    pattern: /\bconsole\s*\./gi,
    code: SecurityErrorCode.CONSOLE_USAGE,
  },
  {
    pattern: /\bdebugger\b/gi,
    code: SecurityErrorCode.DEBUGGER_USAGE,
  },
  {
    pattern: /\bwith\s*\(/gi,
    code: SecurityErrorCode.WITH_STATEMENT,
  },
  {
    pattern: /delete\s+.*\.(prototype|constructor|__proto__)/gi,
    code: SecurityErrorCode.DELETE_OPERATOR,
  },
  {
    pattern: /__proto__\s*=/gi,
    code: SecurityErrorCode.PROTOTYPE_POLLUTION,
  },
  {
    pattern: /\.(prototype|constructor)\s*=\s*null/gi,
    code: SecurityErrorCode.PROTOTYPE_POLLUTION,
  },
  {
    pattern: /\bBuffer\s*\./gi,
    code: SecurityErrorCode.BUFFER_USAGE,
  },
  {
    pattern: /\bfs\s*\./gi,
    code: SecurityErrorCode.FILESYSTEM_USAGE,
  },
  {
    pattern: /require\s*\(\s*['"`]fs['"`]/gi,
    code: SecurityErrorCode.FILESYSTEM_USAGE,
  },
  {
    pattern: /require\s*\(\s*['"`]path['"`]/gi,
    code: SecurityErrorCode.FILESYSTEM_USAGE,
  },
  {
    pattern: /require\s*\(\s*['"`]child_process['"`]/gi,
    code: SecurityErrorCode.CHILD_PROCESS_USAGE,
  },
  {
    pattern: /\bexec\s*\(/gi,
    code: SecurityErrorCode.CHILD_PROCESS_USAGE,
  },
  {
    pattern: /\bspawn\s*\(/gi,
    code: SecurityErrorCode.CHILD_PROCESS_USAGE,
  },
];

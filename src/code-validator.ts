import { SecurityErrorCode } from './security-error-codes';
import { securityMessages } from './security-messages';

/**
 * Represents a dangerous pattern with its corresponding security error code
 */
interface DangerousPattern {
  pattern: RegExp;
  code: SecurityErrorCode;
}

/**
 * Code validator for ensuring safe execution of user-provided code
 */
export class CodeValidator {
  private readonly securityErrorMessages = new Map<SecurityErrorCode, string>(
    securityMessages
  ) as ReadonlyMap<SecurityErrorCode, string>;

  private readonly dangerousPatterns: DangerousPattern[] = [
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

  /**
   * Validate and sanitize user code
   */
  public validateCode(code: string, maxSize: number = 1024 * 1024): void {
    if (typeof code !== 'string') {
      throw new Error('Code must be a string');
    }

    if (code.length > maxSize) {
      throw new Error(
        `Code size exceeds maximum allowed size of ${maxSize} bytes`
      );
    }

    // Find all matches and report the earliest one
    let earliestMatch = null;
    let earliestPattern = null;

    for (const patternInfo of this.dangerousPatterns) {
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

      const message = this.securityErrorMessages.get(earliestPattern.code);
      const error = new Error(
        `Security Error [${earliestPattern.code}]: ${message}\n` +
          `Found at line ${lineNumber}, column ${columnNumber}: "${earliestMatch[0].trim()}"\n` +
          `Please remove or replace this code to ensure safe execution.`
      );
      (error as any).code = earliestPattern.code;
      throw error;
    }
  }
}

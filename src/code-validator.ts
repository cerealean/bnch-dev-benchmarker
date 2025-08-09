import { SecurityErrorCode } from './security-error-codes';
import { securityMessages } from './security-messages';
import { DangerousPattern, dangerousPatterns } from './dangerous-patterns';

/**
 * Code validator for ensuring safe execution of user-provided code
 */
export class CodeValidator {
  private readonly securityErrorMessages = new Map<SecurityErrorCode, string>(
    securityMessages
  ) as ReadonlyMap<SecurityErrorCode, string>;

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

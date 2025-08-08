import { describe, it, expect } from 'vitest';
import {
  calculateStats,
  validateCode,
  createSecureContext,
  sleep,
  yieldControl,
} from '../utils.js';
import { BenchmarkSample } from '../types.js';

describe('Utils', () => {
  describe('calculateStats', () => {
    it('should calculate basic statistics correctly', () => {
      const samples: BenchmarkSample[] = [
        { time: 10, success: true },
        { time: 20, success: true },
        { time: 30, success: true },
        { time: 40, success: true },
        { time: 50, success: true },
      ];

      const stats = calculateStats(samples);

      expect(stats.mean).toBe(30);
      expect(stats.median).toBe(30);
      expect(stats.min).toBe(10);
      expect(stats.max).toBe(50);
      expect(stats.successfulSamples).toBe(5);
      expect(stats.failedSamples).toBe(0);
    });

    it('should handle failed samples', () => {
      const samples: BenchmarkSample[] = [
        { time: 10, success: true },
        { time: 0, success: false, error: 'Error' },
        { time: 30, success: true },
      ];

      const stats = calculateStats(samples);

      expect(stats.successfulSamples).toBe(2);
      expect(stats.failedSamples).toBe(1);
      expect(stats.mean).toBe(20);
    });

    it('should handle empty samples', () => {
      const stats = calculateStats([]);

      expect(stats.mean).toBe(0);
      expect(stats.successfulSamples).toBe(0);
      expect(stats.operationsPerSecond).toBe(0);
    });
  });

  describe('validateCode', () => {
    it('should accept safe code', () => {
      expect(() => validateCode('const x = 1 + 1;')).not.toThrow();
      expect(() => validateCode('Math.random()')).not.toThrow();
      expect(() => validateCode("console.log('hello')")).not.toThrow();
    });

    it('should reject non-string input', () => {
      expect(() => validateCode(123 as any)).toThrow('Code must be a string');
      expect(() => validateCode(null as any)).toThrow('Code must be a string');
      expect(() => validateCode(undefined as any)).toThrow(
        'Code must be a string'
      );
    });

    it('should reject code that exceeds size limit', () => {
      const longCode = 'a'.repeat(100);
      expect(() => validateCode(longCode, 50)).toThrow(
        'Code size exceeds maximum allowed size of 50 bytes'
      );
    });

    it('should provide detailed error for while(true) loops', () => {
      expect(() =>
        validateCode("while(true) { console.log('test'); }")
      ).toThrow(
        /Security Error \[INFINITE_WHILE_LOOP\].*Infinite while loops.*can cause the system to freeze/
      );
    });

    it('should provide detailed error for for(;;) loops', () => {
      expect(() => validateCode("for(;;) { console.log('test'); }")).toThrow(
        /Security Error \[INFINITE_FOR_LOOP\].*Infinite for loops.*can cause the system to freeze/
      );
    });

    it('should provide detailed error for eval usage', () => {
      expect(() => validateCode("eval('console.log(1)')")).toThrow(
        /Security Error \[EVAL_USAGE\].*eval\(\) function is not allowed.*security risks/
      );
    });

    it('should provide detailed error for Function constructor', () => {
      expect(() => validateCode("new Function('return 1')")).toThrow(
        /Security Error \[FUNCTION_CONSTRUCTOR\].*Function constructor is not allowed.*security risks/
      );
    });

    it('should provide detailed error for setTimeout', () => {
      expect(() => validateCode('setTimeout(() => {}, 100)')).toThrow(
        /Security Error \[SETTIMEOUT_USAGE\].*setTimeout\(\) is not allowed.*interfere with benchmarking/
      );
    });

    it('should provide detailed error for setInterval', () => {
      expect(() => validateCode('setInterval(() => {}, 100)')).toThrow(
        /Security Error \[SETINTERVAL_USAGE\].*setInterval\(\) is not allowed.*persistent timers/
      );
    });

    it('should include line and column numbers in errors', () => {
      const multiLineCode = `
// Comment line
const x = 1;
while(true) { break; }
const y = 2;`;

      try {
        validateCode(multiLineCode);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).toContain('line 4');
        expect(error.message).toContain('while(true)');
      }
    });

    it('should handle case-insensitive patterns', () => {
      expect(() => validateCode('WHILE(TRUE) {}')).toThrow(
        /INFINITE_WHILE_LOOP/
      );
      expect(() => validateCode("EVAL('test')")).toThrow(/EVAL_USAGE/);
      expect(() => validateCode('SETTIMEOUT(() => {}, 100)')).toThrow(
        /SETTIMEOUT_USAGE/
      );
    });

    it('should handle whitespace variations', () => {
      expect(() => validateCode('while ( true ) {}')).toThrow(
        /INFINITE_WHILE_LOOP/
      );
      expect(() => validateCode('for(  ;  ;  ) {}')).toThrow(
        /INFINITE_FOR_LOOP/
      );
      expect(() => validateCode("eval  ( 'test' )")).toThrow(/EVAL_USAGE/);
    });

    it('should include helpful guidance in error messages', () => {
      try {
        validateCode('setTimeout(function() {}, 1000)');
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).toContain('Please remove or replace this code');
        expect(error.message).toContain('to ensure safe execution');
      }
    });

    it('should report the first dangerous pattern found', () => {
      const codeWithMultiplePatterns = `
eval('first');
setTimeout(() => {}, 100);
while(true) {}`;

      try {
        validateCode(codeWithMultiplePatterns);
        expect.fail('Should have thrown an error');
      } catch (error) {
        // Should report eval first since it appears first
        expect(error.message).toContain('EVAL_USAGE');
        expect(error.message).toContain('line 2');
      }
    });

    it('should handle complex nested patterns', () => {
      const nestedCode = `
function outer() {
  function inner() {
    if (condition) {
      while(true) {
        console.log('dangerous');
      }
    }
  }
}`;

      try {
        validateCode(nestedCode);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).toContain('INFINITE_WHILE_LOOP');
        expect(error.message).toContain('line 5');
      }
    });

    it('should handle patterns at the beginning and end of code', () => {
      expect(() => validateCode("eval('start')")).toThrow(/line 1/);

      const endCode = `
const x = 1;
const y = 2;
eval('end')`;

      try {
        validateCode(endCode);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).toContain('line 4');
      }
    });
  });

  describe('createSecureContext', () => {
    it('should disable default globals', () => {
      const context = createSecureContext();

      expect(context).toContain('const fetch = undefined;');
      expect(context).toContain('const XMLHttpRequest = undefined;');
      expect(context).toContain('const WebSocket = undefined;');
    });

    it('should disable custom globals', () => {
      const context = createSecureContext(['myGlobal', 'anotherGlobal']);

      expect(context).toContain('const myGlobal = undefined;');
      expect(context).toContain('const anotherGlobal = undefined;');
    });
  });

  describe('sleep', () => {
    it('should resolve after specified time', async () => {
      const start = performance.now();
      await sleep(50);
      const end = performance.now();

      expect(end - start).toBeGreaterThanOrEqual(45); // Allow some tolerance
    });
  });

  describe('yieldControl', () => {
    it('should yield control', async () => {
      const start = performance.now();
      await yieldControl();
      const end = performance.now();

      // Should complete quickly but yield control
      expect(end - start).toBeLessThan(50);
    });
  });
});

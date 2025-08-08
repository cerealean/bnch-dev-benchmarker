import { describe, it, expect } from 'vitest';
import { calculateStats, validateCode, createSecureContext, sleep, yieldControl } from '../utils.js';
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
    it('should pass valid code', () => {
      expect(() => validateCode('console.log("hello")')).not.toThrow();
    });

    it('should reject code that is too large', () => {
      const largeCode = 'a'.repeat(1000);
      expect(() => validateCode(largeCode, 500)).toThrow('Code size exceeds maximum');
    });

    it('should reject dangerous patterns', () => {
      expect(() => validateCode('while(true) {}')).toThrow('dangerous patterns');
      expect(() => validateCode('eval("malicious code")')).toThrow('dangerous patterns');
      expect(() => validateCode('setTimeout(() => {}, 1000)')).toThrow('dangerous patterns');
    });

    it('should reject non-string input', () => {
      expect(() => validateCode(123 as any)).toThrow('Code must be a string');
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

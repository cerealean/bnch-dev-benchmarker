import { describe, it, expect } from 'vitest';
import {
  calculateStats,
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

      expect(stats.mean.milliseconds).toBe(30);
      expect(stats.median.milliseconds).toBe(30);
      expect(stats.min.milliseconds).toBe(10);
      expect(stats.max.milliseconds).toBe(50);
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
      expect(stats.mean.milliseconds).toBe(20);
    });

    it('should handle empty samples', () => {
      const stats = calculateStats([]);

      expect(stats.mean.milliseconds).toBe(0);
      expect(stats.successfulSamples).toBe(0);
      expect(stats.operationsPerSecond).toBe(0);
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

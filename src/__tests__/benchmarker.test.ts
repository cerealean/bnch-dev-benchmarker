import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Benchmarker } from '../benchmarker.js';

describe('Benchmarker', () => {
  let benchmarker: Benchmarker;

  beforeEach(() => {
    benchmarker = new Benchmarker({
      warmupIterations: 2,
      minSamples: 5,
      maxSamples: 10,
      maxTime: 1000,
      useWorker: false, // Use main thread for tests
    });
  });

  afterEach(() => {
    benchmarker.abort();
  });

  describe('benchmark', () => {
    it('should benchmark simple code', async () => {
      const result = await benchmarker.benchmark('Math.random()');

      expect(result.samples.length).toBeGreaterThanOrEqual(5);
      expect(result.stats.successfulSamples).toBeGreaterThan(0);
      expect(result.stats.mean).toBeGreaterThan(0);
      expect(result.aborted).toBe(false);
    });

    it('should handle code that throws errors', async () => {
      const result = await benchmarker.benchmark('throw new Error("test error")');

      expect(result.samples.length).toBeGreaterThanOrEqual(1);
      expect(result.stats.failedSamples).toBeGreaterThan(0);
      expect(result.samples[0].success).toBe(false);
      expect(result.samples[0].error).toContain('test error');
    });

    it('should respect sample limits', async () => {
      const customBenchmarker = new Benchmarker({
        minSamples: 3,
        maxSamples: 5,
        useWorker: false,
      });

      const result = await customBenchmarker.benchmark('1 + 1');

      expect(result.samples.length).toBeLessThanOrEqual(5);
      expect(result.samples.length).toBeGreaterThanOrEqual(3);
    });

    it('should validate code size', async () => {
      const customBenchmarker = new Benchmarker({
        maxCodeSize: 10,
        useWorker: false,
      });

      await expect(
        customBenchmarker.benchmark('console.log("this is too long")')
      ).rejects.toThrow('Code size exceeds maximum');
    });

    it('should be abortable', async () => {
      const customBenchmarker = new Benchmarker({
        maxSamples: 1000,
        maxTime: 10000,
        useWorker: false,
      });

      // Start benchmark
      const promise = customBenchmarker.benchmark('Math.random()');
      
      // Abort after a short delay
      setTimeout(() => customBenchmarker.abort(), 10);
      
      const result = await promise;
      expect(result.aborted).toBe(true);
    });
  });

  describe('compare', () => {
    it('should compare two code snippets', async () => {
      const comparison = await benchmarker.compare(
        'Math.random()',
        'Math.random() * 2'
      );

      expect(comparison.baseline.samples.length).toBeGreaterThan(0);
      expect(comparison.comparison.samples.length).toBeGreaterThan(0);
      expect(typeof comparison.relativeDifference).toBe('number');
      expect(typeof comparison.significanceLevel).toBe('number');
      expect(typeof comparison.summary).toBe('string');
    });

    it('should detect performance differences', async () => {
      const comparison = await benchmarker.compare(
        '1 + 1', // Simple operation
        'Array(1000).fill(0).reduce((a, b) => a + b, 0)' // More complex operation
      );

      // The complex operation should be slower
      expect(comparison.relativeDifference).toBeLessThan(0);
      expect(comparison.summary).toContain('slower');
    });
  });

  describe('worker execution', () => {
    it('should work with web workers enabled', async () => {
      // Skip test if Web Workers are not available (e.g., in Node.js test environment)
      if (typeof Worker === 'undefined' || typeof URL.createObjectURL === 'undefined') {
        return;
      }

      const workerBenchmarker = new Benchmarker({
        minSamples: 2,
        maxTime: 1000,
        useWorker: true,
      });

      const result = await workerBenchmarker.benchmark('Math.random()');
      
      expect(result.samples.length).toBeGreaterThan(0);
      expect(result.stats.mean).toBeGreaterThan(0);
      expect(result.aborted).toBe(false);
    });
  });
});

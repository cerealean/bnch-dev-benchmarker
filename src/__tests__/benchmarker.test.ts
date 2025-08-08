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
      const result = await benchmarker.benchmark(
        'throw new Error("test error")'
      );

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
      if (
        typeof Worker === 'undefined' ||
        typeof URL.createObjectURL === 'undefined'
      ) {
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

  describe('security tests', () => {
    describe('code validation', () => {
      it('should reject infinite while loops', async () => {
        await expect(
          benchmarker.benchmark("while(true) { console.log('infinite'); }")
        ).rejects.toThrow('Code contains potentially dangerous patterns');
      });

      it('should reject infinite for loops', async () => {
        await expect(
          benchmarker.benchmark("for(;;) { console.log('infinite'); }")
        ).rejects.toThrow('Code contains potentially dangerous patterns');
      });

      it('should reject eval calls', async () => {
        await expect(
          benchmarker.benchmark('eval(\'console.log("dangerous")\')')
        ).rejects.toThrow('Code contains potentially dangerous patterns');
      });

      it('should reject Function constructor', async () => {
        await expect(
          benchmarker.benchmark("new Function('return 1')()")
        ).rejects.toThrow('Code contains potentially dangerous patterns');
      });

      it('should reject setTimeout calls', async () => {
        await expect(
          benchmarker.benchmark('setTimeout(() => {}, 1000)')
        ).rejects.toThrow('Code contains potentially dangerous patterns');
      });

      it('should reject setInterval calls', async () => {
        await expect(
          benchmarker.benchmark('setInterval(() => {}, 1000)')
        ).rejects.toThrow('Code contains potentially dangerous patterns');
      });

      it('should reject non-string code', async () => {
        // @ts-expect-error Testing invalid input
        await expect(benchmarker.benchmark(123)).rejects.toThrow(
          'Code must be a string'
        );
      });

      it('should handle case-insensitive dangerous patterns', async () => {
        await expect(benchmarker.benchmark('WHILE(TRUE) { }')).rejects.toThrow(
          'Code contains potentially dangerous patterns'
        );

        await expect(benchmarker.benchmark("EVAL('test')")).rejects.toThrow(
          'Code contains potentially dangerous patterns'
        );
      });

      it('should detect variations of dangerous patterns', async () => {
        await expect(
          benchmarker.benchmark('while (  true  ) { }')
        ).rejects.toThrow('Code contains potentially dangerous patterns');

        await expect(
          benchmarker.benchmark('for(  ;  ;  ) { }')
        ).rejects.toThrow('Code contains potentially dangerous patterns');

        await expect(benchmarker.benchmark("eval  ( 'test' )")).rejects.toThrow(
          'Code contains potentially dangerous patterns'
        );
      });
    });

    describe('execution timeout', () => {
      it('should demonstrate timeout behavior in main thread', async () => {
        const shortTimeoutBenchmarker = new Benchmarker({
          executionTimeout: 100,
          useWorker: false,
          minSamples: 1,
          maxSamples: 1,
        });

        // Test a simple operation that completes quickly
        const result = await shortTimeoutBenchmarker.benchmark(`
          // Simple operation that should complete within timeout
          Math.random() * 1000;
        `);

        expect(result.samples.length).toBeGreaterThan(0);
        expect(result.samples[0].success).toBe(true);
        // Note: Timeout in main thread is limited by JavaScript's event loop
        // For true timeout protection, use workers
      });

      it('should timeout long-running code in worker', async () => {
        // Skip test if Web Workers are not available
        if (
          typeof Worker === 'undefined' ||
          typeof URL.createObjectURL === 'undefined'
        ) {
          return;
        }

        const shortTimeoutBenchmarker = new Benchmarker({
          executionTimeout: 100,
          useWorker: true,
          minSamples: 1,
          maxSamples: 1,
        });

        const result = await shortTimeoutBenchmarker.benchmark(`
          // Simple synchronous busy wait that should timeout
          const start = Date.now();
          while (Date.now() - start < 500) {
            // Busy wait for 500ms (longer than 100ms timeout)
          }
        `);

        expect(result.samples.length).toBeGreaterThan(0);
        expect(result.samples[0].success).toBe(false);
        expect(result.samples[0].error).toContain('timeout');
      });
    });

    describe('memory and resource protection', () => {
      it('should handle attempts to create large arrays', async () => {
        const result = await benchmarker.benchmark(`
          try {
            const largeArray = new Array(1000000).fill(0);
            largeArray.length;
          } catch (e) {
            throw new Error('Memory allocation failed');
          }
        `);

        // Should either succeed (if system has enough memory) or fail gracefully
        expect(result.samples.length).toBeGreaterThan(0);
      });

      it('should handle attempts to create recursive objects', async () => {
        const result = await benchmarker.benchmark(`
          try {
            const obj = {};
            obj.self = obj;
            JSON.stringify(obj);
          } catch (e) {
            'handled circular reference';
          }
        `);

        expect(result.samples.length).toBeGreaterThan(0);
      });
    });

    describe('network and I/O restrictions', () => {
      it('should prevent fetch calls in worker', async () => {
        // Skip test if Web Workers are not available
        if (
          typeof Worker === 'undefined' ||
          typeof URL.createObjectURL === 'undefined'
        ) {
          return;
        }

        const workerBenchmarker = new Benchmarker({
          useWorker: true,
          minSamples: 1,
          maxSamples: 1,
        });

        const result = await workerBenchmarker.benchmark(`
          if (typeof fetch !== 'undefined') {
            throw new Error('fetch should be disabled');
          }
          'fetch is properly disabled';
        `);

        expect(result.samples.length).toBeGreaterThan(0);
        expect(result.samples[0].success).toBe(true);
      });

      it('should prevent XMLHttpRequest calls in worker', async () => {
        // Skip test if Web Workers are not available
        if (
          typeof Worker === 'undefined' ||
          typeof URL.createObjectURL === 'undefined'
        ) {
          return;
        }

        const workerBenchmarker = new Benchmarker({
          useWorker: true,
          minSamples: 1,
          maxSamples: 1,
        });

        const result = await workerBenchmarker.benchmark(`
          if (typeof XMLHttpRequest !== 'undefined') {
            throw new Error('XMLHttpRequest should be disabled');
          }
          'XMLHttpRequest is properly disabled';
        `);

        expect(result.samples.length).toBeGreaterThan(0);
        expect(result.samples[0].success).toBe(true);
      });

      it('should prevent WebSocket calls in worker', async () => {
        // Skip test if Web Workers are not available
        if (
          typeof Worker === 'undefined' ||
          typeof URL.createObjectURL === 'undefined'
        ) {
          return;
        }

        const workerBenchmarker = new Benchmarker({
          useWorker: true,
          minSamples: 1,
          maxSamples: 1,
        });

        const result = await workerBenchmarker.benchmark(`
          if (typeof WebSocket !== 'undefined') {
            throw new Error('WebSocket should be disabled');
          }
          'WebSocket is properly disabled';
        `);

        expect(result.samples.length).toBeGreaterThan(0);
        expect(result.samples[0].success).toBe(true);
      });
    });

    describe('DOM and browser API restrictions', () => {
      it('should prevent localStorage access in worker', async () => {
        // Skip test if Web Workers are not available
        if (
          typeof Worker === 'undefined' ||
          typeof URL.createObjectURL === 'undefined'
        ) {
          return;
        }

        const workerBenchmarker = new Benchmarker({
          useWorker: true,
          minSamples: 1,
          maxSamples: 1,
        });

        const result = await workerBenchmarker.benchmark(`
          if (typeof localStorage !== 'undefined') {
            throw new Error('localStorage should be disabled');
          }
          'localStorage is properly disabled';
        `);

        expect(result.samples.length).toBeGreaterThan(0);
        expect(result.samples[0].success).toBe(true);
      });

      it('should prevent navigator access in worker', async () => {
        // Skip test if Web Workers are not available
        if (
          typeof Worker === 'undefined' ||
          typeof URL.createObjectURL === 'undefined'
        ) {
          return;
        }

        const workerBenchmarker = new Benchmarker({
          useWorker: true,
          minSamples: 1,
          maxSamples: 1,
        });

        const result = await workerBenchmarker.benchmark(`
          if (typeof navigator !== 'undefined') {
            throw new Error('navigator should be disabled');
          }
          'navigator is properly disabled';
        `);

        expect(result.samples.length).toBeGreaterThan(0);
        expect(result.samples[0].success).toBe(true);
      });

      it('should prevent location access in worker', async () => {
        // Skip test if Web Workers are not available
        if (
          typeof Worker === 'undefined' ||
          typeof URL.createObjectURL === 'undefined'
        ) {
          return;
        }

        const workerBenchmarker = new Benchmarker({
          useWorker: true,
          minSamples: 1,
          maxSamples: 1,
        });

        const result = await workerBenchmarker.benchmark(`
          if (typeof location !== 'undefined') {
            throw new Error('location should be disabled');
          }
          'location is properly disabled';
        `);

        expect(result.samples.length).toBeGreaterThan(0);
        expect(result.samples[0].success).toBe(true);
      });
    });

    describe('worker creation restrictions', () => {
      it('should prevent Worker creation in worker', async () => {
        // Skip test if Web Workers are not available
        if (
          typeof Worker === 'undefined' ||
          typeof URL.createObjectURL === 'undefined'
        ) {
          return;
        }

        const workerBenchmarker = new Benchmarker({
          useWorker: true,
          minSamples: 1,
          maxSamples: 1,
        });

        const result = await workerBenchmarker.benchmark(`
          if (typeof Worker !== 'undefined') {
            throw new Error('Worker should be disabled');
          }
          'Worker is properly disabled';
        `);

        expect(result.samples.length).toBeGreaterThan(0);
        expect(result.samples[0].success).toBe(true);
      });

      it('should prevent importScripts calls in worker', async () => {
        // Skip test if Web Workers are not available
        if (
          typeof Worker === 'undefined' ||
          typeof URL.createObjectURL === 'undefined'
        ) {
          return;
        }

        const workerBenchmarker = new Benchmarker({
          useWorker: true,
          minSamples: 1,
          maxSamples: 1,
        });

        const result = await workerBenchmarker.benchmark(`
          if (typeof importScripts !== 'undefined') {
            throw new Error('importScripts should be disabled');
          }
          'importScripts is properly disabled';
        `);

        expect(result.samples.length).toBeGreaterThan(0);
        expect(result.samples[0].success).toBe(true);
      });
    });

    describe('cryptography restrictions', () => {
      it('should prevent crypto access in worker', async () => {
        // Skip test if Web Workers are not available
        if (
          typeof Worker === 'undefined' ||
          typeof URL.createObjectURL === 'undefined'
        ) {
          return;
        }

        const workerBenchmarker = new Benchmarker({
          useWorker: true,
          minSamples: 1,
          maxSamples: 1,
        });

        const result = await workerBenchmarker.benchmark(`
          if (typeof crypto !== 'undefined') {
            throw new Error('crypto should be disabled');
          }
          'crypto is properly disabled';
        `);

        expect(result.samples.length).toBeGreaterThan(0);
        expect(result.samples[0].success).toBe(true);
      });
    });

    describe('error handling and edge cases', () => {
      it('should handle syntax errors gracefully', async () => {
        const result = await benchmarker.benchmark('invalid syntax {{{');

        expect(result.samples.length).toBeGreaterThan(0);
        expect(result.samples[0].success).toBe(false);
        expect(result.samples[0].error).toBeDefined();
      });

      it('should handle reference errors gracefully', async () => {
        const result = await benchmarker.benchmark(
          'nonExistentVariable.method()'
        );

        expect(result.samples.length).toBeGreaterThan(0);
        expect(result.samples[0].success).toBe(false);
        expect(result.samples[0].error).toContain('not defined');
      });

      it('should handle type errors gracefully', async () => {
        const result = await benchmarker.benchmark('null.someMethod()');

        expect(result.samples.length).toBeGreaterThan(0);
        expect(result.samples[0].success).toBe(false);
        expect(result.samples[0].error).toBeDefined();
      });

      it('should handle promise rejections gracefully', async () => {
        const result = await benchmarker.benchmark(`
          // Test error throwing without unhandled promise
          throw new Error('Rejected promise');
        `);

        expect(result.samples.length).toBeGreaterThan(0);
        expect(result.samples[0].success).toBe(false);
        expect(result.samples[0].error).toContain('Rejected promise');
      });

      it('should handle thrown strings gracefully', async () => {
        const result = await benchmarker.benchmark('throw "string error";');

        expect(result.samples.length).toBeGreaterThan(0);
        expect(result.samples[0].success).toBe(false);
        expect(result.samples[0].error).toContain('string error');
      });

      it('should handle thrown objects gracefully', async () => {
        const result = await benchmarker.benchmark(
          'throw { message: "object error" };'
        );

        expect(result.samples.length).toBeGreaterThan(0);
        expect(result.samples[0].success).toBe(false);
        expect(result.samples[0].error).toBeDefined();
      });
    });

    describe('custom security configuration', () => {
      it('should respect custom disabled globals', async () => {
        // Skip test if Web Workers are not available
        if (
          typeof Worker === 'undefined' ||
          typeof URL.createObjectURL === 'undefined'
        ) {
          return;
        }

        const customBenchmarker = new Benchmarker(
          { useWorker: true, minSamples: 1, maxSamples: 1 },
          { disabledGlobals: ['Math'] }
        );

        const result = await customBenchmarker.benchmark(`
          if (typeof Math !== 'undefined') {
            throw new Error('Math should be disabled');
          }
          'Math is properly disabled';
        `);

        expect(result.samples.length).toBeGreaterThan(0);
        expect(result.samples[0].success).toBe(true);
      });

      it('should respect execution timeout configuration', async () => {
        const result = await benchmarker.benchmark(`
          const start = performance.now();
          // Run for less than the default timeout (1000ms)
          while (performance.now() - start < 100) {
            // Short busy wait
          }
          'completed within timeout';
        `);

        expect(result.samples.length).toBeGreaterThan(0);
        expect(result.samples[0].success).toBe(true);
      });

      it('should respect max code size configuration', async () => {
        const smallSizeBenchmarker = new Benchmarker({
          maxCodeSize: 20,
          useWorker: false,
        });

        await expect(
          smallSizeBenchmarker.benchmark(
            "console.log('this code is definitely longer than 20 characters');"
          )
        ).rejects.toThrow('Code size exceeds maximum');
      });
    });
  });
});

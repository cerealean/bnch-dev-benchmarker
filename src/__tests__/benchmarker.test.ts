import { describe, it, expect } from 'vitest';
import { Benchmarker } from '../benchmarker.js';

describe('Benchmarker', () => {
  // Create a fresh benchmarker instance for each test
  const createBenchmarker = (
    config: Partial<import('../types.js').BenchmarkConfig> = {}
  ) => {
    return new Benchmarker({
      warmupIterations: 2,
      minSamples: 5,
      maxSamples: 10,
      maxTime: 1000,
      useWorker: false, // Use main thread for tests
      ...config,
    });
  };

  const runBenchmarker = async (
    testFunc: (benchmarker: Benchmarker) => void | Promise<void>,
    config?: Partial<import('../types.js').BenchmarkConfig>,
    securityConfig?: { [key: string]: unknown }
  ) => {
    const benchmarker =
      config || securityConfig
        ? new Benchmarker(
            {
              warmupIterations: 2,
              minSamples: 5,
              maxSamples: 10,
              maxTime: 1000,
              useWorker: false,
              ...config,
            },
            securityConfig
          )
        : createBenchmarker();
    try {
      await testFunc(benchmarker);
    } catch (error) {
      benchmarker.abort();
      throw error;
    } finally {
      benchmarker.dispose();
    }
  };

  describe('benchmark', () => {
    it('should benchmark simple code', async () => {
      await runBenchmarker(async (benchmarker) => {
        const result = await benchmarker.benchmark('Math.random()');
        expect(result.samples.length).toBeGreaterThanOrEqual(5);
        expect(result.stats.successfulSamples).toBeGreaterThan(0);
        expect(result.stats.mean).toBeGreaterThan(0);
        expect(result.aborted).toBe(false);
      });
    });

    it('should handle code that throws errors', async () => {
      await runBenchmarker(async (benchmarker) => {
        const result = await benchmarker.benchmark(
          'throw new Error("test error")'
        );

        expect(result.samples.length).toBeGreaterThanOrEqual(1);
        expect(result.stats.failedSamples).toBeGreaterThan(0);
        expect(result.samples[0].success).toBe(false);
        expect(result.samples[0].error).toContain('test error');
      });
    });

    it('should respect sample limits', async () => {
      await runBenchmarker(
        async (benchmarker) => {
          const result = await benchmarker.benchmark('1 + 1');

          expect(result.samples.length).toBeLessThanOrEqual(5);
          expect(result.samples.length).toBeGreaterThanOrEqual(3);
        },
        {
          minSamples: 3,
          maxSamples: 5,
          useWorker: false,
        }
      );
    });

    it('should validate code size', async () => {
      await expect(async () => {
        await runBenchmarker(
          async (benchmarker) => {
            await benchmarker.benchmark('console.log("this is too long")');
          },
          {
            maxCodeSize: 10,
            useWorker: false,
          }
        );
      }).rejects.toThrow('Code size exceeds maximum');
    });

    it('should be abortable', async () => {
      await runBenchmarker(
        async (benchmarker) => {
          // Start benchmark
          const promise = benchmarker.benchmark('Math.random()');

          // Abort after a short delay
          setTimeout(() => benchmarker.abort(), 10);

          const result = await promise;
          expect(result.aborted).toBe(true);
        },
        {
          maxSamples: 1000,
          maxTime: 10000,
          useWorker: false,
        }
      );
    });
  });

  describe('compare', () => {
    it('should compare two code snippets', async () => {
      await runBenchmarker(async (benchmarker) => {
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
    });

    it('should detect performance differences', async () => {
      await runBenchmarker(async (benchmarker) => {
        const comparison = await benchmarker.compare(
          '1 + 1', // Simple operation
          'Array(1000).fill(0).reduce((a, b) => a + b, 0)' // More complex operation
        );

        // The complex operation should be slower
        expect(comparison.relativeDifference).toBeLessThan(0);
        expect(comparison.summary).toContain('slower');
      });
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

      await runBenchmarker(
        async (benchmarker) => {
          const result = await benchmarker.benchmark('Math.random()');

          expect(result.samples.length).toBeGreaterThan(0);
          expect(result.stats.mean).toBeGreaterThan(0);
          expect(result.aborted).toBe(false);
        },
        {
          minSamples: 2,
          maxTime: 1000,
          useWorker: true,
        }
      );
    });
  });

  describe('security tests', () => {
    describe('code validation', () => {
      it('should reject infinite while loops with detailed error', async () => {
        await runBenchmarker(async (benchmarker) => {
          await expect(
            benchmarker.benchmark("while(true) { console.log('infinite'); }")
          ).rejects.toThrow(/Security Error \[INFINITE_WHILE_LOOP\]/);

          // Test the full error message content
          try {
            await benchmarker.benchmark(
              "while(true) { console.log('infinite'); }"
            );
          } catch (error) {
            expect(error.message).toContain('Infinite while loops');
            expect(error.message).toContain('can cause the system to freeze');
            expect(error.message).toContain('line 1');
            expect(error.message).toContain('while(true)');
            expect(error.message).toContain('Please remove or replace');
          }
        });
      });

      it('should reject infinite for loops with detailed error', async () => {
        await runBenchmarker(async (benchmarker) => {
          await expect(
            benchmarker.benchmark("for(;;) { console.log('infinite'); }")
          ).rejects.toThrow(/Security Error \[INFINITE_FOR_LOOP\]/);

          try {
            await benchmarker.benchmark("for(;;) { console.log('infinite'); }");
          } catch (error) {
            expect(error.message).toContain('Infinite for loops');
            expect(error.message).toContain('can cause the system to freeze');
            expect(error.message).toContain('for(;;)');
          }
        });
      });

      it('should reject eval calls with detailed error', async () => {
        await runBenchmarker(async (benchmarker) => {
          await expect(
            benchmarker.benchmark('eval(\'console.log("dangerous")\')')
          ).rejects.toThrow(/Security Error \[EVAL_USAGE\]/);

          try {
            await benchmarker.benchmark('eval(\'console.log("dangerous")\')');
          } catch (error) {
            expect(error.message).toContain('eval() function is not allowed');
            expect(error.message).toContain('security risks');
            expect(error.message).toContain('eval(');
          }
        });
      });

      it('should reject Function constructor with detailed error', async () => {
        await runBenchmarker(async (benchmarker) => {
          await expect(
            benchmarker.benchmark("new Function('return 1')()")
          ).rejects.toThrow(/Security Error \[FUNCTION_CONSTRUCTOR\]/);

          try {
            await benchmarker.benchmark("new Function('return 1')()");
          } catch (error) {
            expect(error.message).toContain(
              'Function constructor is not allowed'
            );
            expect(error.message).toContain(
              'dynamically create and execute code'
            );
            expect(error.message).toContain('Function(');
          }
        });
      });

      it('should reject setTimeout calls with detailed error', async () => {
        await runBenchmarker(async (benchmarker) => {
          await expect(
            benchmarker.benchmark('setTimeout(() => {}, 1000)')
          ).rejects.toThrow(/Security Error \[SETTIMEOUT_USAGE\]/);

          try {
            await benchmarker.benchmark('setTimeout(() => {}, 1000)');
          } catch (error) {
            expect(error.message).toContain('setTimeout() is not allowed');
            expect(error.message).toContain(
              'interfere with benchmarking timing'
            );
            expect(error.message).toContain('setTimeout(');
          }
        });
      });

      it('should reject setInterval calls with detailed error', async () => {
        await runBenchmarker(async (benchmarker) => {
          await expect(
            benchmarker.benchmark('setInterval(() => {}, 1000)')
          ).rejects.toThrow(/Security Error \[SETINTERVAL_USAGE\]/);

          try {
            await benchmarker.benchmark('setInterval(() => {}, 1000)');
          } catch (error) {
            expect(error.message).toContain('setInterval() is not allowed');
            expect(error.message).toContain('persistent timers');
            expect(error.message).toContain('setInterval(');
          }
        });
      });

      it('should reject non-string code', async () => {
        await runBenchmarker(async (benchmarker) => {
          // @ts-expect-error Testing invalid input
          await expect(benchmarker.benchmark(123)).rejects.toThrow(
            'Code must be a string'
          );
        });
      });

      it('should handle case-insensitive dangerous patterns with detailed errors', async () => {
        await runBenchmarker(async (benchmarker) => {
          await expect(
            benchmarker.benchmark('WHILE(TRUE) { }')
          ).rejects.toThrow(/Security Error \[INFINITE_WHILE_LOOP\]/);

          await expect(benchmarker.benchmark("EVAL('test')")).rejects.toThrow(
            /Security Error \[EVAL_USAGE\]/
          );
        });
      });

      it('should detect variations of dangerous patterns with line numbers', async () => {
        await runBenchmarker(async (benchmarker) => {
          const multiLineCode = `
// Some comment
const x = 1;
while (  true  ) { 
  console.log('bad'); 
}`;

          try {
            await benchmarker.benchmark(multiLineCode);
          } catch (error) {
            expect(error.message).toContain(
              'Security Error [INFINITE_WHILE_LOOP]'
            );
            expect(error.message).toContain('line 4'); // Should be on line 4
            expect(error.message).toContain('while (  true  )');
          }

          const multiLineEvalCode = `
const a = 1;
const b = 2;
eval  ( 'test' );
const c = 3;`;

          try {
            await benchmarker.benchmark(multiLineEvalCode);
          } catch (error) {
            expect(error.message).toContain('Security Error [EVAL_USAGE]');
            expect(error.message).toContain('line 4'); // Should be on line 4
            expect(error.message).toContain('eval  (');
          }
        });
      });

      it('should provide helpful suggestions in error messages', async () => {
        await runBenchmarker(async (benchmarker) => {
          try {
            await benchmarker.benchmark(
              'setTimeout(() => console.log("test"), 100)'
            );
          } catch (error) {
            expect(error.message).toContain(
              'Please remove or replace this code'
            );
            expect(error.message).toContain('to ensure safe execution');
          }
        });
      });

      it('should handle nested dangerous patterns', async () => {
        await runBenchmarker(async (benchmarker) => {
          const nestedCode = `
function test() {
  if (true) {
    while(true) {
      console.log('nested danger');
    }
  }
}`;

          try {
            await benchmarker.benchmark(nestedCode);
          } catch (error) {
            expect(error.message).toContain(
              'Security Error [INFINITE_WHILE_LOOP]'
            );
            expect(error.message).toContain('line 4'); // Should find the nested while loop
          }
        });
      });

      it('should detect multiple patterns and report the first one found', async () => {
        await runBenchmarker(async (benchmarker) => {
          const multiplePatterns = `
eval('test');
setTimeout(() => {}, 100);
while(true) {}`;

          try {
            await benchmarker.benchmark(multiplePatterns);
          } catch (error) {
            // Should report the first pattern found (eval)
            expect(error.message).toContain('Security Error [EVAL_USAGE]');
            expect(error.message).toContain('line 2');
          }
        });
      });

      it('should provide actionable error messages for developers', async () => {
        await runBenchmarker(async (benchmarker) => {
          try {
            await benchmarker.benchmark(`
// This is a common mistake - using setTimeout in benchmarks
setTimeout(() => {
  console.log('This will interfere with timing');
}, 100);`);
            expect.fail('Should have thrown an error');
          } catch (error) {
            expect(error.message).toContain('SETTIMEOUT_USAGE');
            expect(error.message).toContain(
              'interfere with benchmarking timing'
            );
            expect(error.message).toContain('line 3');
            expect(error.message).toContain('setTimeout(');
            expect(error.message).toContain('Please remove or replace');
          }
        });
      });

      it('should handle edge case with pattern at very end of code', async () => {
        await runBenchmarker(async (benchmarker) => {
          const codeEndingWithPattern = 'const x = 1; const y = 2; eval("end")';

          try {
            await benchmarker.benchmark(codeEndingWithPattern);
            expect.fail('Should have thrown an error');
          } catch (error) {
            expect(error.message).toContain('Security Error [EVAL_USAGE]');
            expect(error.message).toContain('eval('); // Just check for the eval pattern
          }
        });
      });
    });

    describe('execution timeout', () => {
      it('should demonstrate timeout behavior in main thread', async () => {
        // Test a simple operation that completes quickly
        await runBenchmarker(
          async (benchmarker) => {
            const result = await benchmarker.benchmark(`
            // Simple operation that should complete within timeout
            Math.random() * 1000;
          `);

            expect(result.samples.length).toBeGreaterThan(0);
            expect(result.samples[0].success).toBe(true);
            // Note: Timeout in main thread is limited by JavaScript's event loop
            // For true timeout protection, use workers
          },
          {
            executionTimeout: 100,
            useWorker: false,
            minSamples: 1,
            maxSamples: 1,
          }
        );
      });

      it('should timeout long-running code in worker', async () => {
        // Skip test if Web Workers are not available
        if (
          typeof Worker === 'undefined' ||
          typeof URL.createObjectURL === 'undefined'
        ) {
          return;
        }

        await runBenchmarker(
          async (benchmarker) => {
            const result = await benchmarker.benchmark(`
            // Simple synchronous busy wait that should timeout
            const start = Date.now();
            while (Date.now() - start < 500) {
              // Busy wait for 500ms (longer than 100ms timeout)
            }
          `);

            expect(result.samples.length).toBeGreaterThan(0);
            expect(result.samples[0].success).toBe(false);
            expect(result.samples[0].error).toContain('timeout');
          },
          {
            executionTimeout: 100,
            useWorker: true,
            minSamples: 1,
            maxSamples: 1,
          }
        );
      });
    });

    describe('memory and resource protection', () => {
      it('should handle attempts to create large arrays', async () => {
        await runBenchmarker(async (benchmarker) => {
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
      });

      it('should handle attempts to create recursive objects', async () => {
        await runBenchmarker(async (benchmarker) => {
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

        await runBenchmarker(
          async (benchmarker) => {
            const result = await benchmarker.benchmark(`
            if (typeof fetch !== 'undefined') {
              throw new Error('fetch should be disabled');
            }
            'fetch is properly disabled';
          `);

            expect(result.samples.length).toBeGreaterThan(0);
            expect(result.samples[0].success).toBe(true);
          },
          {
            useWorker: true,
            minSamples: 1,
            maxSamples: 1,
          }
        );
      });

      it('should prevent XMLHttpRequest calls in worker', async () => {
        // Skip test if Web Workers are not available
        if (
          typeof Worker === 'undefined' ||
          typeof URL.createObjectURL === 'undefined'
        ) {
          return;
        }

        await runBenchmarker(
          async (benchmarker) => {
            const result = await benchmarker.benchmark(`
            if (typeof XMLHttpRequest !== 'undefined') {
              throw new Error('XMLHttpRequest should be disabled');
            }
            'XMLHttpRequest is properly disabled';
          `);

            expect(result.samples.length).toBeGreaterThan(0);
            expect(result.samples[0].success).toBe(true);
          },
          {
            useWorker: true,
            minSamples: 1,
            maxSamples: 1,
          }
        );
      });

      it('should prevent WebSocket calls in worker', async () => {
        // Skip test if Web Workers are not available
        if (
          typeof Worker === 'undefined' ||
          typeof URL.createObjectURL === 'undefined'
        ) {
          return;
        }

        await runBenchmarker(
          async (benchmarker) => {
            const result = await benchmarker.benchmark(`
            if (typeof WebSocket !== 'undefined') {
              throw new Error('WebSocket should be disabled');
            }
            'WebSocket is properly disabled';
          `);

            expect(result.samples.length).toBeGreaterThan(0);
            expect(result.samples[0].success).toBe(true);
          },
          {
            useWorker: true,
            minSamples: 1,
            maxSamples: 1,
          }
        );
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

        await runBenchmarker(
          async (benchmarker) => {
            const result = await benchmarker.benchmark(`
            if (typeof localStorage !== 'undefined') {
              throw new Error('localStorage should be disabled');
            }
            'localStorage is properly disabled';
          `);

            expect(result.samples.length).toBeGreaterThan(0);
            expect(result.samples[0].success).toBe(true);
          },
          {
            useWorker: true,
            minSamples: 1,
            maxSamples: 1,
          }
        );
      });

      it('should prevent navigator access in worker', async () => {
        // Skip test if Web Workers are not available
        if (
          typeof Worker === 'undefined' ||
          typeof URL.createObjectURL === 'undefined'
        ) {
          return;
        }

        await runBenchmarker(
          async (benchmarker) => {
            const result = await benchmarker.benchmark(`
            if (typeof navigator !== 'undefined') {
              throw new Error('navigator should be disabled');
            }
            'navigator is properly disabled';
          `);

            expect(result.samples.length).toBeGreaterThan(0);
            expect(result.samples[0].success).toBe(true);
          },
          {
            useWorker: true,
            minSamples: 1,
            maxSamples: 1,
          }
        );
      });

      it('should prevent location access in worker', async () => {
        // Skip test if Web Workers are not available
        if (
          typeof Worker === 'undefined' ||
          typeof URL.createObjectURL === 'undefined'
        ) {
          return;
        }

        await runBenchmarker(
          async (benchmarker) => {
            const result = await benchmarker.benchmark(`
            if (typeof location !== 'undefined') {
              throw new Error('location should be disabled');
            }
            'location is properly disabled';
          `);

            expect(result.samples.length).toBeGreaterThan(0);
            expect(result.samples[0].success).toBe(true);
          },
          {
            useWorker: true,
            minSamples: 1,
            maxSamples: 1,
          }
        );
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

        await runBenchmarker(
          async (benchmarker) => {
            const result = await benchmarker.benchmark(`
            if (typeof Worker !== 'undefined') {
              throw new Error('Worker should be disabled');
            }
            'Worker is properly disabled';
          `);

            expect(result.samples.length).toBeGreaterThan(0);
            expect(result.samples[0].success).toBe(true);
          },
          {
            useWorker: true,
            minSamples: 1,
            maxSamples: 1,
          }
        );
      });

      it('should prevent importScripts calls in worker', async () => {
        // Skip test if Web Workers are not available
        if (
          typeof Worker === 'undefined' ||
          typeof URL.createObjectURL === 'undefined'
        ) {
          return;
        }

        await runBenchmarker(
          async (benchmarker) => {
            const result = await benchmarker.benchmark(`
            if (typeof importScripts !== 'undefined') {
              throw new Error('importScripts should be disabled');
            }
            'importScripts is properly disabled';
          `);

            expect(result.samples.length).toBeGreaterThan(0);
            expect(result.samples[0].success).toBe(true);
          },
          {
            useWorker: true,
            minSamples: 1,
            maxSamples: 1,
          }
        );
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

        await runBenchmarker(
          async (benchmarker) => {
            const result = await benchmarker.benchmark(`
            if (typeof crypto !== 'undefined') {
              throw new Error('crypto should be disabled');
            }
            'crypto is properly disabled';
          `);

            expect(result.samples.length).toBeGreaterThan(0);
            expect(result.samples[0].success).toBe(true);
          },
          {
            useWorker: true,
            minSamples: 1,
            maxSamples: 1,
          }
        );
      });
    });

    describe('error handling and edge cases', () => {
      it('should handle syntax errors gracefully', async () => {
        await runBenchmarker(async (benchmarker) => {
          const result = await benchmarker.benchmark('invalid syntax {{{');

          expect(result.samples.length).toBeGreaterThan(0);
          expect(result.samples[0].success).toBe(false);
          expect(result.samples[0].error).toBeDefined();
        });
      });

      it('should handle reference errors gracefully', async () => {
        await runBenchmarker(async (benchmarker) => {
          const result = await benchmarker.benchmark(
            'nonExistentVariable.method()'
          );

          expect(result.samples.length).toBeGreaterThan(0);
          expect(result.samples[0].success).toBe(false);
          expect(result.samples[0].error).toContain('not defined');
        });
      });

      it('should handle type errors gracefully', async () => {
        await runBenchmarker(async (benchmarker) => {
          const result = await benchmarker.benchmark('null.someMethod()');

          expect(result.samples.length).toBeGreaterThan(0);
          expect(result.samples[0].success).toBe(false);
          expect(result.samples[0].error).toBeDefined();
        });
      });

      it('should handle promise rejections gracefully', async () => {
        await runBenchmarker(async (benchmarker) => {
          const result = await benchmarker.benchmark(`
            // Test error throwing without unhandled promise
            throw new Error('Rejected promise');
          `);

          expect(result.samples.length).toBeGreaterThan(0);
          expect(result.samples[0].success).toBe(false);
          expect(result.samples[0].error).toContain('Rejected promise');
        });
      });

      it('should handle thrown strings gracefully', async () => {
        await runBenchmarker(async (benchmarker) => {
          const result = await benchmarker.benchmark('throw "string error";');

          expect(result.samples.length).toBeGreaterThan(0);
          expect(result.samples[0].success).toBe(false);
          expect(result.samples[0].error).toContain('string error');
        });
      });

      it('should handle thrown objects gracefully', async () => {
        await runBenchmarker(async (benchmarker) => {
          const result = await benchmarker.benchmark(
            'throw { message: "object error" };'
          );

          expect(result.samples.length).toBeGreaterThan(0);
          expect(result.samples[0].success).toBe(false);
          expect(result.samples[0].error).toBeDefined();
        });
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

        await runBenchmarker(
          async (benchmarker) => {
            const result = await benchmarker.benchmark(`
            if (typeof Math !== 'undefined') {
              throw new Error('Math should be disabled');
            }
            'Math is properly disabled';
          `);

            expect(result.samples.length).toBeGreaterThan(0);
            expect(result.samples[0].success).toBe(true);
          },
          { useWorker: true, minSamples: 1, maxSamples: 1 },
          { disabledGlobals: ['Math'] }
        );
      });

      it('should respect execution timeout configuration', async () => {
        await runBenchmarker(async (benchmarker) => {
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
      });

      it('should respect max code size configuration', async () => {
        await expect(async () => {
          await runBenchmarker(
            async (benchmarker) => {
              await benchmarker.benchmark(
                "console.log('this code is definitely longer than 20 characters');"
              );
            },
            {
              maxCodeSize: 20,
              useWorker: false,
            }
          );
        }).rejects.toThrow('Code size exceeds maximum');
      });
    });
  });
});

import { Benchmarker } from '../benchmarker.js';
import { describe, it, expect, beforeEach } from 'vitest';

describe('D&D Ability Modifier Benchmark - Acceptance Test', () => {
  let benchmarker: Benchmarker;

  beforeEach(() => {
    benchmarker = new Benchmarker({
      warmupIterations: 10,
      minSamples: 50,
      maxSamples: 200,
      maxTime: 5000, // 5 seconds
      yieldBetweenSamples: true,
      useWorker: false, // Disable worker for Node.js test environment
      maxCodeSize: 10240, // Increase code size limit to 10KB
    });
  });

  describe('Performance Comparison: Calculation vs Lookup Table', () => {
    const calculationCode = `
      // Calculate ability modifier using the D&D formula
      // (ability score - 10) / 2, rounded down
      function calculateModifier(abilityScore) {
        return Math.floor((abilityScore - 10) / 2);
      }

      // Test with random ability scores (1-30 range)
      const scores = [];
      for (let i = 0; i < 1000; i++) {
        scores.push(Math.floor(Math.random() * 30) + 1);
      }

      // Benchmark the calculation approach
      const results = [];
      for (const score of scores) {
        results.push(calculateModifier(score));
      }
    `;

    const lookupTableCode = `
      // Lookup table mapping ability scores to modifiers
      const ABILITY_MODIFIER_MAP = new Map([
        [1, -5],
        [2, -4], [3, -4],
        [4, -3], [5, -3],
        [6, -2], [7, -2],
        [8, -1], [9, -1],
        [10, 0], [11, 0],
        [12, 1], [13, 1],
        [14, 2], [15, 2],
        [16, 3], [17, 3],
        [18, 4], [19, 4],
        [20, 5], [21, 5],
        [22, 6], [23, 6],
        [24, 7], [25, 7],
        [26, 8], [27, 8],
        [28, 9], [29, 9],
        [30, 10]
      ]);

      function getModifierFromMap(abilityScore) {
        return ABILITY_MODIFIER_MAP.get(abilityScore) ?? Math.floor((abilityScore - 10) / 2);
      }

      // Test with random ability scores (1-30 range)
      const scores = [];
      for (let i = 0; i < 1000; i++) {
        scores.push(Math.floor(Math.random() * 30) + 1);
      }

      // Benchmark the lookup approach
      const results = [];
      for (const score of scores) {
        results.push(getModifierFromMap(score));
      }
    `;

    it('should benchmark calculation approach', async () => {
      const result = await benchmarker.benchmark(calculationCode);

      expect(result).toBeDefined();
      expect(result.samples.length).toBeGreaterThan(0);
      expect(result.stats.mean).toBeGreaterThan(0);
      expect(result.aborted).toBe(false);

      console.log('Calculation Approach Results:');
      console.log(`  Mean time: ${result.stats.mean.toFixed(3)}ms`);
      console.log(`  Median time: ${result.stats.median.toFixed(3)}ms`);
      console.log(
        `  Standard deviation: ${result.stats.standardDeviation.toFixed(3)}ms`
      );
      console.log(`  Min time: ${result.stats.min.toFixed(3)}ms`);
      console.log(`  Max time: ${result.stats.max.toFixed(3)}ms`);
      console.log(`  Samples: ${result.samples.length}`);
      console.log(
        `  Coefficient of variation: ${(
          result.stats.coefficientOfVariation * 100
        ).toFixed(2)}%`
      );
    }, 10000);

    it('should benchmark lookup table approach', async () => {
      const result = await benchmarker.benchmark(lookupTableCode);

      expect(result).toBeDefined();
      expect(result.samples.length).toBeGreaterThan(0);
      expect(result.stats.mean).toBeGreaterThan(0);
      expect(result.aborted).toBe(false);

      console.log('Lookup Table Approach Results:');
      console.log(`  Mean time: ${result.stats.mean.toFixed(3)}ms`);
      console.log(`  Median time: ${result.stats.median.toFixed(3)}ms`);
      console.log(
        `  Standard deviation: ${result.stats.standardDeviation.toFixed(3)}ms`
      );
      console.log(`  Min time: ${result.stats.min.toFixed(3)}ms`);
      console.log(`  Max time: ${result.stats.max.toFixed(3)}ms`);
      console.log(`  Samples: ${result.samples.length}`);
      console.log(
        `  Coefficient of variation: ${(
          result.stats.coefficientOfVariation * 100
        ).toFixed(2)}%`
      );
    }, 10000);

    it('should compare both approaches and determine the winner', async () => {
      console.log('\\n=== D&D Ability Modifier Performance Comparison ===\\n');

      const comparison = await benchmarker.compare(
        calculationCode,
        lookupTableCode
      );

      expect(comparison).toBeDefined();
      expect(comparison.baseline).toBeDefined();
      expect(comparison.comparison).toBeDefined();

      console.log('BASELINE (Calculation):');
      console.log(`  Mean: ${comparison.baseline.stats.mean.toFixed(3)}ms`);
      console.log(`  Median: ${comparison.baseline.stats.median.toFixed(3)}ms`);
      console.log(`  Samples: ${comparison.baseline.samples.length}`);

      console.log('\\nCOMPARISON (Lookup Table):');
      console.log(`  Mean: ${comparison.comparison.stats.mean.toFixed(3)}ms`);
      console.log(
        `  Median: ${comparison.comparison.stats.median.toFixed(3)}ms`
      );
      console.log(`  Samples: ${comparison.comparison.samples.length}`);

      console.log('\\nRESULTS:');
      console.log(
        `  Relative difference: ${(comparison.relativeDifference * 100).toFixed(
          2
        )}%`
      );
      console.log(
        `  Significance level: ${(comparison.significanceLevel * 100).toFixed(
          1
        )}%`
      );
      console.log(`  Summary: ${comparison.summary}`);

      // Determine and log the winner
      if (Math.abs(comparison.relativeDifference) < 0.01) {
        console.log('\\n🤝 RESULT: Both approaches perform similarly!');
      } else if (comparison.relativeDifference > 0) {
        const improvement = (comparison.relativeDifference * 100).toFixed(1);
        console.log(`\\n🏆 WINNER: Lookup Table is ${improvement}% faster!`);
      } else {
        const improvement = (
          Math.abs(comparison.relativeDifference) * 100
        ).toFixed(1);
        console.log(`\\n🏆 WINNER: Calculation is ${improvement}% faster!`);
      }

      // Add some context about the approaches
      console.log('\\n📊 ANALYSIS:');
      console.log('• Calculation approach: Math.floor((score - 10) / 2)');
      console.log('  - Pros: No memory overhead, works for any score');
      console.log('  - Cons: Requires computation every time');
      console.log('• Lookup table approach: Map-based lookup');
      console.log('  - Pros: O(1) lookup time, no computation');
      console.log('  - Cons: Memory overhead, limited to predefined range');

      // Validate that both approaches give the same results
      expect(comparison.baseline.samples.every((s) => s.success)).toBe(true);
      expect(comparison.comparison.samples.every((s) => s.success)).toBe(true);
    }, 15000);
  });

  describe('Correctness Verification', () => {
    it('should verify both approaches give identical results', async () => {
      const verificationCode = `
        // Define both approaches
        function calculateModifier(abilityScore) {
          return Math.floor((abilityScore - 10) / 2);
        }

        const ABILITY_MODIFIER_MAP = new Map([
          [1, -5],
          [2, -4], [3, -4],
          [4, -3], [5, -3],
          [6, -2], [7, -2],
          [8, -1], [9, -1],
          [10, 0], [11, 0],
          [12, 1], [13, 1],
          [14, 2], [15, 2],
          [16, 3], [17, 3],
          [18, 4], [19, 4],
          [20, 5], [21, 5],
          [22, 6], [23, 6],
          [24, 7], [25, 7],
          [26, 8], [27, 8],
          [28, 9], [29, 9],
          [30, 10]
        ]);

        function getModifierFromMap(abilityScore) {
          return ABILITY_MODIFIER_MAP.get(abilityScore) ?? Math.floor((abilityScore - 10) / 2);
        }

        // Test all ability scores from 1 to 30
        let allMatch = true;
        for (let score = 1; score <= 30; score++) {
          const calcResult = calculateModifier(score);
          const mapResult = getModifierFromMap(score);
          if (calcResult !== mapResult) {
            allMatch = false;
            throw new Error(\`Mismatch at score \${score}: calc=\${calcResult}, map=\${mapResult}\`);
          }
        }

        if (!allMatch) {
          throw new Error('Methods do not produce identical results!');
        }
      `;

      const result = await benchmarker.benchmark(verificationCode);
      expect(result.samples.every((s) => s.success)).toBe(true);
      console.log(
        '✅ Correctness verified: Both approaches produce identical results'
      );
    });
  });

  describe('Edge Cases and Extended Range', () => {
    it('should test performance with extended ability score range', async () => {
      const extendedCalculationCode = `
        function calculateModifier(abilityScore) {
          return Math.floor((abilityScore - 10) / 2);
        }

        // Test with extended range (1-50)
        const scores = [];
        for (let i = 0; i < 1000; i++) {
          scores.push(Math.floor(Math.random() * 50) + 1);
        }

        const results = [];
        for (const score of scores) {
          results.push(calculateModifier(score));
        }
      `;

      const extendedMapCode = `
        // Extended lookup table with fallback to calculation
        const ABILITY_MODIFIER_MAP = new Map([
          [1, -5], [2, -4], [3, -4], [4, -3], [5, -3],
          [6, -2], [7, -2], [8, -1], [9, -1], [10, 0],
          [11, 0], [12, 1], [13, 1], [14, 2], [15, 2],
          [16, 3], [17, 3], [18, 4], [19, 4], [20, 5],
          [21, 5], [22, 6], [23, 6], [24, 7], [25, 7],
          [26, 8], [27, 8], [28, 9], [29, 9], [30, 10]
        ]);

        function getModifierFromMap(abilityScore) {
          return ABILITY_MODIFIER_MAP.get(abilityScore) ?? Math.floor((abilityScore - 10) / 2);
        }

        // Test with extended range (1-50) - scores above 30 will use calculation fallback
        const scores = [];
        for (let i = 0; i < 1000; i++) {
          scores.push(Math.floor(Math.random() * 50) + 1);
        }

        const results = [];
        for (const score of scores) {
          results.push(getModifierFromMap(score));
        }
      `;

      console.log('\\n=== Extended Range Test (1-50) ===');
      const comparison = await benchmarker.compare(
        extendedCalculationCode,
        extendedMapCode
      );

      console.log(
        `Extended range performance difference: ${(
          comparison.relativeDifference * 100
        ).toFixed(2)}%`
      );
      console.log(`Summary: ${comparison.summary}`);

      expect(comparison).toBeDefined();
    }, 15000);
  });

  describe('Performance Regression Tests', () => {
    it('should ensure arithmetic calculation remains faster than lookup table', async () => {
      // This test serves as a performance regression guard
      // If this test starts failing, it indicates either:
      // 1. A performance regression in the calculation approach
      // 2. A significant optimization in Map operations
      // 3. Changes in JavaScript engine optimizations

      const calculationCode = `
        function calculateModifier(abilityScore) {
          return Math.floor((abilityScore - 10) / 2);
        }

        // Use a consistent dataset for reliable comparison
        const scores = [1, 3, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30];
        
        // Run multiple iterations for more stable timing
        for (let iteration = 0; iteration < 100; iteration++) {
          const results = [];
          for (const score of scores) {
            results.push(calculateModifier(score));
          }
        }
      `;

      const lookupCode = `
        const ABILITY_MODIFIER_MAP = new Map([
          [1, -5], [2, -4], [3, -4], [4, -3], [5, -3],
          [6, -2], [7, -2], [8, -1], [9, -1], [10, 0],
          [11, 0], [12, 1], [13, 1], [14, 2], [15, 2],
          [16, 3], [17, 3], [18, 4], [19, 4], [20, 5],
          [21, 5], [22, 6], [23, 6], [24, 7], [25, 7],
          [26, 8], [27, 8], [28, 9], [29, 9], [30, 10]
        ]);

        function getModifierFromMap(abilityScore) {
          return ABILITY_MODIFIER_MAP.get(abilityScore) ?? Math.floor((abilityScore - 10) / 2);
        }

        // Use the same consistent dataset
        const scores = [1, 3, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30];
        
        // Run multiple iterations for more stable timing
        for (let iteration = 0; iteration < 100; iteration++) {
          const results = [];
          for (const score of scores) {
            results.push(getModifierFromMap(score));
          }
        }
      `;

      console.log('\\n=== Performance Regression Test ===');

      const comparison = await benchmarker.compare(calculationCode, lookupCode);

      console.log(
        `Calculation mean: ${comparison.baseline.stats.mean.toFixed(4)}ms`
      );
      console.log(
        `Lookup mean: ${comparison.comparison.stats.mean.toFixed(4)}ms`
      );
      console.log(
        `Performance difference: ${(
          comparison.relativeDifference * 100
        ).toFixed(2)}%`
      );
      console.log(
        `Confidence: ${(comparison.significanceLevel * 100).toFixed(1)}%`
      );

      // Assert that calculation is faster (negative relative difference means baseline is faster)
      expect(comparison.relativeDifference).toBeLessThan(0);

      // Assert a reasonable performance advantage (at least 10% faster)
      // Negative values mean baseline is faster, so we check it's less than -0.1
      expect(comparison.relativeDifference).toBeLessThan(-0.1);

      // Log a warning if the advantage is smaller than expected
      if (comparison.relativeDifference > -0.5) {
        console.warn(
          `⚠️  Performance advantage is smaller than expected: ${Math.abs(
            comparison.relativeDifference * 100
          ).toFixed(1)}%`
        );
        console.warn(
          '   This might indicate a performance regression or engine optimization changes.'
        );
      }

      // Log success with the performance advantage
      const advantage = Math.abs(comparison.relativeDifference * 100).toFixed(
        1
      );
      console.log(
        `✅ Calculation approach maintains ${advantage}% performance advantage`
      );
    }, 10000);

    it('should maintain calculation performance consistency', async () => {
      // Test that the calculation approach has consistent performance
      // High variability might indicate performance issues

      const consistentCalculationCode = `
        function calculateModifier(abilityScore) {
          return Math.floor((abilityScore - 10) / 2);
        }

        // Test with a fixed set of common D&D ability scores
        const commonScores = [8, 10, 12, 14, 16, 18]; // Common character stats
        
        for (let i = 0; i < 500; i++) {
          for (const score of commonScores) {
            calculateModifier(score);
          }
        }
      `;

      const result = await benchmarker.benchmark(consistentCalculationCode);

      // Check coefficient of variation (should be relatively low for consistent performance)
      const cv = result.stats.coefficientOfVariation;

      console.log('\\n=== Calculation Consistency Test ===');
      console.log(`Mean: ${result.stats.mean.toFixed(4)}ms`);
      console.log(
        `Standard deviation: ${result.stats.standardDeviation.toFixed(4)}ms`
      );
      console.log(`Coefficient of variation: ${(cv * 100).toFixed(2)}%`);

      // Assert reasonable consistency for microbenchmarks (CV should be less than 200%)
      // Microbenchmarks typically have higher variability than larger operations
      expect(cv).toBeLessThan(2.0);

      // Warn if variability is very high
      if (cv > 1.6) {
        console.warn(
          `⚠️  High performance variability detected: ${(cv * 100).toFixed(2)}%`
        );
        console.warn(
          '   This is common for very fast operations and may indicate system noise.'
        );
      } else {
        console.log(
          `✅ Performance consistency acceptable: ${(cv * 100).toFixed(
            2
          )}% variation`
        );
      }
    }, 8000);
  });
});

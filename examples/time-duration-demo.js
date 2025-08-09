import { Benchmarker, TimeDuration } from '../dist/index.esm.js';

/**
 * Example demonstrating TimeDuration usage with the benchmarker
 */
async function demonstrateTimeDuration() {
  console.log('=== TimeDuration Demo ===\n');

  // Create a benchmarker instance
  const benchmarker = new Benchmarker();

  // Simple benchmark
  console.log('Running benchmark...');
  const result = await benchmarker.benchmark(`
    // Simple array operations
    const arr = Array(1000).fill(0).map((_, i) => i);
    const doubled = arr.map(x => x * 2);
    const sum = doubled.reduce((a, b) => a + b, 0);
  `);

  console.log('\n=== Benchmark Results ===');
  console.log(`Samples collected: ${result.samples.length}`);
  console.log(
    `Mean execution time: ${result.stats.mean.milliseconds.toFixed(3)}ms`
  );
  console.log(
    `Operations per second: ${result.stats.operationsPerSecond.toFixed(0)}`
  );

  // Demonstrate TimeDuration capabilities
  console.log('\n=== TimeDuration Capabilities ===');
  console.log(`Total benchmark time: ${result.totalTime.toString()}`);
  console.log('\nSame duration in different units:');
  console.log(`  Seconds: ${result.totalTime.seconds.toFixed(6)}`);
  console.log(`  Milliseconds: ${result.totalTime.milliseconds.toFixed(3)}`);
  console.log(`  Microseconds: ${result.totalTime.microseconds.toFixed(0)}`);
  console.log(`  Nanoseconds: ${result.totalTime.nanoseconds.toFixed(0)}`);
  console.log(`  Picoseconds: ${result.totalTime.picoseconds.toFixed(0)}`);
  console.log(`  Femtoseconds: ${result.totalTime.femtoseconds.toFixed(0)}`);

  // Create custom durations
  console.log('\n=== Creating Custom Durations ===');
  const oneSecond = TimeDuration.fromSeconds(1);
  const halfSecond = TimeDuration.fromMilliseconds(500);
  const oneMicrosecond = TimeDuration.fromMicroseconds(1);

  console.log(`One second: ${oneSecond.toString()}`);
  console.log(`Half second: ${halfSecond.toString()}`);
  console.log(`One microsecond: ${oneMicrosecond.toString()}`);

  // Arithmetic operations
  console.log('\n=== Duration Arithmetic ===');
  const combined = oneSecond.add(halfSecond);
  const difference = oneSecond.subtract(halfSecond);
  const doubled = halfSecond.multiply(2);

  console.log(`1s + 500ms = ${combined.toString()}`);
  console.log(`1s - 500ms = ${difference.toString()}`);
  console.log(`500ms × 2 = ${doubled.toString()}`);

  // Comparisons
  console.log('\n=== Duration Comparisons ===');
  console.log(`Is 1s > 500ms? ${oneSecond.isGreaterThan(halfSecond)}`);
  console.log(`Is 500ms < 1s? ${halfSecond.isLessThan(oneSecond)}`);
  console.log(`Is 500ms × 2 = 1s? ${doubled.equals(oneSecond)}`);

  // Performance comparison
  console.log('\n=== Performance Context ===');
  if (result.totalTime.isGreaterThan(TimeDuration.fromSeconds(1))) {
    console.log('This benchmark took more than a second to complete');
  } else if (
    result.totalTime.isGreaterThan(TimeDuration.fromMilliseconds(100))
  ) {
    console.log('This benchmark completed in a reasonable time');
  } else {
    console.log('This benchmark completed very quickly');
  }

  // Precision demonstration
  console.log('\n=== Precision Examples ===');
  const veryFast = TimeDuration.fromNanoseconds(1234.567);
  const ultraFast = TimeDuration.fromPicoseconds(987.654);

  console.log(`Nanosecond precision: ${veryFast.toString()}`);
  console.log(`  As nanoseconds: ${veryFast.nanoseconds}`);
  console.log(`  As picoseconds: ${veryFast.picoseconds}`);

  console.log(`Picosecond precision: ${ultraFast.toString()}`);
  console.log(`  As picoseconds: ${ultraFast.picoseconds}`);
  console.log(`  As femtoseconds: ${ultraFast.femtoseconds}`);

  console.log('\n=== Demo Complete ===');
}

// Run the demonstration
demonstrateTimeDuration().catch(console.error);

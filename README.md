# @bnch/benchmarker

[![CI/CD Pipeline](https://github.com/cerealean/bnch-dev-benchmarker/actions/workflows/ci-cd.yml/badge.svg)](https://github.com/cerealean/bnch-dev-benchmarker/actions/workflows/ci-cd.yml)
[![npm version](https://badge.fury.io/js/@bnch%2Fbenchmarker.svg)](https://badge.fury.io/js/@bnch%2Fbenchmarker)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A secure JavaScript benchmarking library with web worker isolation and performance.now() precision. Published as a public npm package.

## Features

- 🔒 **Secure execution** with web worker isolation
- 🎯 **High precision** using `performance.now()` API
- 🔥 **Warmup support** for reliable results
- 🚫 **Network isolation** and CSP enforcement
- ⏱️ **Timeout protection** against infinite loops
- 📊 **Statistical analysis** with comprehensive metrics
- 🛑 **Abortable benchmarks** for user control
- 🔄 **Comparison utilities** for A/B testing

## Installation

```bash
npm install @bnch/benchmarker
```

## Quick Start

````typescript
import { Benchmarker, benchmark, compare } from '@bnch/benchmarker';

// Simple benchmark
const result = await benchmark('Math.random()');
console.log(`Mean execution time: ${result.stats.mean.milliseconds}ms`);

// Compare two code snippets
const comparison = await compare('Math.random()', 'Math.random() * 2');
console.log(comparison.summary);

// Advanced usage with custom configuration
```typescript
import { Benchmarker, TimeDuration } from '@bnch/benchmarker';

const benchmarker = new Benchmarker({
  warmupIterations: 10,
  minSamples: 20,
  maxTime: TimeDuration.fromSeconds(5),
  useWorker: true,
});

const advancedResult = await benchmarker.benchmark(`
  const arr = Array(1000).fill(0);
  arr.reduce((sum, val) => sum + val, 0);
`);
````

````

## Configuration

### Benchmark Configuration

```typescript
interface BenchmarkConfig {
  warmupIterations?: number; // Default: 5
  minSamples?: number; // Default: 10
  maxSamples?: number; // Default: 100
  maxTime?: TimeDuration; // Default: 10 seconds
  yieldBetweenSamples?: boolean; // Default: true
  maxCodeSize?: number; // Default: 1MB
  executionTimeout?: TimeDuration; // Default: 1 second
  useWorker?: boolean; // Default: true
}
````

### Security Configuration

```typescript
interface SecurityConfig {
  csp?: string; // Content Security Policy
  disabledGlobals?: string[]; // Additional globals to disable
  disableNetwork?: boolean; // Default: true
  maxExecutionTime?: TimeDuration; // Default: 1 second
  maxMemoryMB?: number; // Default: 100MB (reference only)
}
```

## Security Features

### Network Isolation

- Disables `fetch`, `XMLHttpRequest`, `WebSocket`, etc.
- Configurable CSP enforcement
- Sandbox execution environment

### Execution Limits

- Per-sample timeout protection
- Code size limits (default 1MB)
- Pattern detection for dangerous code

### Worker Isolation

- Executes code in dedicated web workers
- Isolated from main thread globals
- Automatic cleanup and termination

## API Reference

### Benchmarker Class

```typescript
const benchmarker = new Benchmarker(config?, security?);

// Run benchmark
const result = await benchmarker.benchmark(code);

// Compare two snippets
const comparison = await benchmarker.compare(baseline, comparison);

// Abort running benchmark
benchmarker.abort();
```

### Convenience Functions

```typescript
// Quick benchmark
const result = await benchmark(code, config?);

// Quick comparison
const comparison = await compare(baseline, comparison, config?);
```

### Result Structure

```typescript
interface BenchmarkResult {
  samples: BenchmarkSample[]; // Individual measurements
  stats: BenchmarkStats; // Statistical summary
  config: BenchmarkConfig; // Configuration used
  security: SecurityConfig; // Security settings
  totalTime: TimeDuration; // Total benchmark time with multiple unit access
  aborted: boolean; // Whether aborted
}

interface BenchmarkStats {
  mean: TimeDuration; // Average execution time
  median: TimeDuration; // Median execution time
  standardDeviation: TimeDuration; // Standard deviation
  min: TimeDuration; // Fastest execution
  max: TimeDuration; // Slowest execution
  successfulSamples: number; // Successful runs
  failedSamples: number; // Failed runs
  operationsPerSecond: number; // Ops/sec (1000/mean)
  coefficientOfVariation: number; // Reliability measure
}
```

### TimeDuration Class

The `TimeDuration` class provides precise time measurements with multiple unit conversions:

```typescript
import { TimeDuration } from '@bnch/benchmarker';

// Create from different units
const duration1 = TimeDuration.fromSeconds(1.5);
const duration2 = TimeDuration.fromMilliseconds(1500);
const duration3 = TimeDuration.fromMicroseconds(1_500_000);

// Access in any unit
console.log(duration1.seconds); // 1.5
console.log(duration1.milliseconds); // 1500
console.log(duration1.microseconds); // 1500000
console.log(duration1.nanoseconds); // 1500000000
console.log(duration1.picoseconds); // 1500000000000
console.log(duration1.femtoseconds); // 1500000000000000

// Arithmetic operations
const sum = duration1.add(duration2);
const diff = duration1.subtract(duration2);
const scaled = duration1.multiply(2);

// Comparisons
if (duration1.isGreaterThan(duration2)) {
  console.log('duration1 is longer');
}

// Human-readable formatting
console.log(duration1.toString()); // "1.500s"

// Usage with benchmark results
const result = await benchmark('/* your code */');
console.log(`Total time: ${result.totalTime.toString()}`);
console.log(`In microseconds: ${result.totalTime.microseconds}`);
```

## Examples

### Basic Performance Testing

```typescript
import { benchmark } from '@bnch/benchmarker';

// Test array methods
const mapResult = await benchmark(`
  const arr = Array(1000).fill(0).map((_, i) => i);
  arr.map(x => x * 2);
`);

const forLoopResult = await benchmark(`
  const arr = Array(1000).fill(0).map((_, i) => i);
  const result = [];
  for (let i = 0; i < arr.length; i++) {
    result.push(arr[i] * 2);
  }
`);

console.log('Map:', mapResult.stats.mean.milliseconds, 'ms');
console.log('For loop:', forLoopResult.stats.mean.milliseconds, 'ms');
```

### A/B Testing

```typescript
import { compare } from '@bnch/benchmarker';

const comparison = await compare(
  // Version A: Object property access
  `
    const obj = { value: 42 };
    obj.value;
  `,
  // Version B: Destructuring
  `
    const obj = { value: 42 };
    const { value } = obj;
  `
);

console.log(comparison.summary);
// Output: "Comparison is 15.3% faster (high confidence)"
```

### Advanced Configuration

````typescript
import { Benchmarker } from '@bnch/benchmarker';

```typescript
import { Benchmarker, TimeDuration } from '@bnch/benchmarker';

const benchmarker = new Benchmarker(
  {
    warmupIterations: 20,
    minSamples: 50,
    maxSamples: 200,
    maxTime: TimeDuration.fromSeconds(30),
    executionTimeout: TimeDuration.fromSeconds(2),
    useWorker: true,
  },
  {
    csp: "default-src 'none'; worker-src 'self'; script-src 'unsafe-eval';",
    disabledGlobals: ['localStorage', 'sessionStorage'],
    maxExecutionTime: TimeDuration.fromSeconds(2),
  }
);
````

const result = await benchmarker.benchmark(`  // Your performance-critical code here
  const data = new Array(10000).fill(0).map(Math.random);
  data.sort((a, b) => a - b);`);

````

## Development

```bash
# Install dependencies
npm install

# Build the library
npm run build

# Run unit tests (fast)
npm test

# Run acceptance tests (slower, real-world scenarios)
npm run test:acceptance

# Run all tests
npm run test:all

# Run tests in watch mode
npm run test:watch

# Run linting
npm run lint

# Type checking
npm run typecheck
````

### Worker Script Development

The web worker code is maintained in a separate file for better organization:

- **Source**: `src/worker-script.js` - Contains the actual worker code
- **Generated**: `src/worker-code.ts` - Auto-generated string constant (not committed to git)
- **Build Process**: The `inline-worker.mjs` script reads `worker-script.js` and generates `worker-code.ts` during the build process

When modifying the worker logic:

1. Edit `src/worker-script.js`
2. Run `npm run build` (automatically runs the inline script)
3. The generated `worker-code.ts` will be updated automatically

## License

MIT © bnch.dev

## Contributing

Contributions are welcome! Please read our contributing guidelines and submit pull requests to our repository.

## Security

If you discover a security vulnerability, please email security@bnch.dev instead of opening an issue.

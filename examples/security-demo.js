// Security Demo - Enhanced Error Messages
// This file demonstrates the enhanced error messages for unsafe code

import { Benchmarker } from '../dist/index.esm.js';

const benchmarker = new Benchmarker();

console.log('🔒 Security Demo: Enhanced Error Messages\n');

// Example 1: Infinite while loop
console.log('1️⃣ Testing infinite while loop:');
try {
  await benchmarker.benchmark('while(true) { console.log("bad"); }');
} catch (error) {
  console.log('❌ Error:', error.message);
  console.log('');
}

// Example 2: setTimeout usage
console.log('2️⃣ Testing setTimeout usage:');
try {
  await benchmarker.benchmark(`
// This is a mistake developers might make
setTimeout(() => {
  console.log('This interferes with timing');
}, 100);`);
} catch (error) {
  console.log('❌ Error:', error.message);
  console.log('');
}

// Example 3: eval usage
console.log('3️⃣ Testing eval usage:');
try {
  await benchmarker.benchmark('eval("console.log(\\"dangerous\\")");');
} catch (error) {
  console.log('❌ Error:', error.message);
  console.log('');
}

// Example 4: Multiple patterns (reports first one)
console.log('4️⃣ Testing multiple dangerous patterns:');
try {
  await benchmarker.benchmark(`
const x = 1;
eval('first pattern');
setTimeout(() => {}, 100);
while(true) {}
`);
} catch (error) {
  console.log('❌ Error:', error.message);
  console.log('');
}

// Example 5: Safe code (should work)
console.log('5️⃣ Testing safe code:');
try {
  const result = await benchmarker.benchmark('Math.random() * 1000');
  console.log('✅ Safe code executed successfully!');
  console.log(
    `   Samples: ${
      result.samples.length
    }, Mean: ${result.stats.mean.milliseconds.toFixed(3)}ms`
  );
} catch (error) {
  console.log('❌ Unexpected error:', error.message);
}

console.log('\n🎯 Summary:');
console.log(
  '• Detailed error messages help developers understand what went wrong'
);
console.log(
  '• Line and column numbers pinpoint the exact location of unsafe code'
);
console.log(
  '• Actionable guidance explains why the code is dangerous and what to do'
);
console.log(
  '• Multiple patterns are detected with the earliest one reported first'
);

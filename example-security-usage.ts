// Example of using the SecurityErrorCode enum for type-safe error handling
import { validateCode, SecurityErrorCode } from './src/utils.js';

function demonstrateSecurityValidation() {
  const testCases = [
    'fetch("https://api.example.com")',
    'new XMLHttpRequest()',
    'while(true) { break; }',
    'eval("console.log(1)")',
    'localStorage.setItem("key", "value")',
    'alert("Hello world")',
  ];

  for (const code of testCases) {
    try {
      validateCode(code);
      console.log(`✅ Code passed validation: ${code}`);
    } catch (error: any) {
      console.log(`❌ Security Error: ${error.code}`);

      // Type-safe error handling using the enum
      switch (error.code) {
        case SecurityErrorCode.FETCH_USAGE:
          console.log(
            '   Network request detected - consider using a mock API'
          );
          break;
        case SecurityErrorCode.XMLHTTPREQUEST_USAGE:
        case SecurityErrorCode.XMLHTTPREQUEST_CONSTRUCTOR:
          console.log(
            '   XMLHttpRequest detected - use fetch API alternatives'
          );
          break;
        case SecurityErrorCode.INFINITE_WHILE_LOOP:
        case SecurityErrorCode.INFINITE_FOR_LOOP:
          console.log('   Infinite loop detected - add proper exit conditions');
          break;
        case SecurityErrorCode.EVAL_USAGE:
        case SecurityErrorCode.FUNCTION_CONSTRUCTOR:
          console.log(
            '   Dynamic code execution detected - use safe alternatives'
          );
          break;
        case SecurityErrorCode.LOCALSTORAGE_USAGE:
        case SecurityErrorCode.SESSIONSTORAGE_USAGE:
          console.log('   Storage API detected - remove for clean benchmarks');
          break;
        case SecurityErrorCode.ALERT_USAGE:
        case SecurityErrorCode.CONFIRM_USAGE:
        case SecurityErrorCode.PROMPT_USAGE:
          console.log('   UI blocking call detected - use console.log instead');
          break;
        default:
          console.log('   Security violation detected - check documentation');
      }

      console.log(`   Message: ${error.message.split('\n')[0]}`);
    }
    console.log('');
  }
}

// Run the demonstration
console.log('🔒 Security Validation Demonstration\n');
demonstrateSecurityValidation();

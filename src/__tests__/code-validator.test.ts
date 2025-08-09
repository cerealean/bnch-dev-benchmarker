import { describe, it, expect, beforeEach } from 'vitest';
import { CodeValidator } from '../code-validator.js';
import { SecurityErrorCode } from '../security-error-codes.js';
import { faker } from '@faker-js/faker';

describe('CodeValidator', () => {
  let validator: CodeValidator;

  beforeEach(() => {
    validator = new CodeValidator();
  });

  describe('validateCode', () => {
    it.each([
      'const x = 1 + 1;',
      'const y = 2 * 2;',
      'const z = 3 - 1;',
      'const w = 4 / 2;',
    ])('should accept safe code - arithmetic %s', (code) => {
      expect(() => validator.validateCode(code)).not.toThrow();
    });

    it('should accept safe code - Math functions', () => {
      expect(() => validator.validateCode('Math.random()')).not.toThrow();
    });

    it('should accept safe code - return statements', () => {
      expect(() =>
        validator.validateCode("return 'hello world';")
      ).not.toThrow();
    });

    it.each([123, null, undefined])(
      'should reject non-string input - %s',
      (input) => {
        expect(() => validator.validateCode(input as any)).toThrow(
          'Code must be a string'
        );
      }
    );

    it('should reject code that exceeds size limit', () => {
      const longCode = 'a'.repeat(faker.number.int({ min: 51, max: 100 }));
      expect(() => validator.validateCode(longCode, 50)).toThrow(
        'Code size exceeds maximum allowed size of 50 bytes'
      );
    });

    it('should provide detailed error for while(true) loops', () => {
      expect(() =>
        validator.validateCode("while(true) { console.log('test'); }")
      ).toThrow(
        /Security Error \[INFINITE_WHILE_LOOP\].*Infinite while loops.*can cause the system to freeze/
      );
    });

    describe('obfuscated infinite while loops', () => {
      it.each([
        'true',
        '!false',
        '!!true',
        '!!!false',
        '!!!!true',
        '!!!!!false',
        '!!!!!!true',
      ])('should detect negation-based obfuscation - %s', (code) => {
        expect(() =>
          validator.validateCode(`while(${code}) { console.log("test"); }`)
        ).toThrow(
          /Security Error \[INFINITE_WHILE_LOOP\].*Infinite while loops.*can cause the system to freeze/
        );
      });

      it('should detect equality-based obfuscation with == operator - variable names', () => {
        expect(() =>
          validator.validateCode('while(yes == yes) { console.log("test"); }')
        ).toThrow(
          /Security Error \[INFINITE_WHILE_LOOP\].*Infinite while loops.*can cause the system to freeze/
        );
      });

      it('should detect equality-based obfuscation with == operator - no variable', () => {
        expect(() =>
          validator.validateCode('while(no == no) { console.log("test"); }')
        ).toThrow(
          /Security Error \[INFINITE_WHILE_LOOP\].*Infinite while loops.*can cause the system to freeze/
        );
      });

      it('should detect equality-based obfuscation with == operator - string literals', () => {
        expect(() =>
          validator.validateCode(
            'while("rawr" == "rawr") { console.log("test"); }'
          )
        ).toThrow(
          /Security Error \[INFINITE_WHILE_LOOP\].*Infinite while loops.*can cause the system to freeze/
        );
      });

      it('should detect equality-based obfuscation with == operator - boolean literals', () => {
        expect(() =>
          validator.validateCode('while(true == true) { console.log("test"); }')
        ).toThrow(
          /Security Error \[INFINITE_WHILE_LOOP\].*Infinite while loops.*can cause the system to freeze/
        );
      });

      it('should detect equality-based obfuscation with === operator - variable names', () => {
        expect(() =>
          validator.validateCode('while(yes === yes) { console.log("test"); }')
        ).toThrow(
          /Security Error \[INFINITE_WHILE_LOOP\].*Infinite while loops.*can cause the system to freeze/
        );
      });

      it('should detect equality-based obfuscation with === operator - no variable', () => {
        expect(() =>
          validator.validateCode('while(no === no) { console.log("test"); }')
        ).toThrow(
          /Security Error \[INFINITE_WHILE_LOOP\].*Infinite while loops.*can cause the system to freeze/
        );
      });

      it('should detect equality-based obfuscation with === operator - string literals', () => {
        expect(() =>
          validator.validateCode(
            'while("rawr" === "rawr") { console.log("test"); }'
          )
        ).toThrow(
          /Security Error \[INFINITE_WHILE_LOOP\].*Infinite while loops.*can cause the system to freeze/
        );
      });

      it('should detect equality-based obfuscation with === operator - boolean literals', () => {
        expect(() =>
          validator.validateCode(
            'while(true === true) { console.log("test"); }'
          )
        ).toThrow(
          /Security Error \[INFINITE_WHILE_LOOP\].*Infinite while loops.*can cause the system to freeze/
        );
      });
    });

    it('should provide detailed error for for(;;) loops', () => {
      expect(() =>
        validator.validateCode("for(;;) { console.log('test'); }")
      ).toThrow(
        /Security Error \[INFINITE_FOR_LOOP\].*Infinite for loops.*can cause the system to freeze/
      );
    });

    it('should provide detailed error for eval usage', () => {
      expect(() => validator.validateCode("eval('console.log(1)')")).toThrow(
        /Security Error \[EVAL_USAGE\].*eval\(\) function is not allowed.*security risks/
      );
    });

    it('should provide detailed error for Function constructor', () => {
      expect(() => validator.validateCode("new Function('return 1')")).toThrow(
        /Security Error \[FUNCTION_CONSTRUCTOR\].*Function constructor is not allowed.*security risks/
      );
    });

    it('should provide detailed error for setTimeout', () => {
      expect(() => validator.validateCode('setTimeout(() => {}, 100)')).toThrow(
        /Security Error \[SETTIMEOUT_USAGE\].*setTimeout\(\) is not allowed.*interfere with benchmarking/
      );
    });

    it('should provide detailed error for setInterval', () => {
      expect(() =>
        validator.validateCode('setInterval(() => {}, 100)')
      ).toThrow(
        /Security Error \[SETINTERVAL_USAGE\].*setInterval\(\) is not allowed.*persistent timers/
      );
    });

    it('should include line and column numbers in errors', () => {
      const multiLineCode = `
// Comment line
const x = 1;
while(true) { break; }
const y = 2;`;

      try {
        validator.validateCode(multiLineCode);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).toContain('line 4');
        expect(error.message).toContain('while(true)');
      }
    });

    it('should handle case-insensitive patterns - while loops', () => {
      expect(() => validator.validateCode('WHILE(TRUE) {}')).toThrow(
        /INFINITE_WHILE_LOOP/
      );
    });

    it('should handle case-insensitive patterns - eval', () => {
      expect(() => validator.validateCode("EVAL('test')")).toThrow(
        /EVAL_USAGE/
      );
    });

    it('should handle case-insensitive patterns - setTimeout', () => {
      expect(() => validator.validateCode('SETTIMEOUT(() => {}, 100)')).toThrow(
        /SETTIMEOUT_USAGE/
      );
    });

    it('should handle whitespace variations - while loops', () => {
      expect(() => validator.validateCode('while ( true ) {}')).toThrow(
        /INFINITE_WHILE_LOOP/
      );
    });

    it('should handle whitespace variations - for loops', () => {
      expect(() => validator.validateCode('for(  ;  ;  ) {}')).toThrow(
        /INFINITE_FOR_LOOP/
      );
    });

    it('should handle whitespace variations - eval', () => {
      expect(() => validator.validateCode("eval  ( 'test' )")).toThrow(
        /EVAL_USAGE/
      );
    });

    it('should include helpful guidance in error messages - removal guidance', () => {
      try {
        validator.validateCode('setTimeout(function() {}, 1000)');
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).toContain('Please remove or replace this code');
      }
    });

    it('should include helpful guidance in error messages - safety guidance', () => {
      try {
        validator.validateCode('setTimeout(function() {}, 1000)');
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).toContain('to ensure safe execution');
      }
    });

    it('should report the first dangerous pattern found - error code', () => {
      const codeWithMultiplePatterns = `
eval('first');
setTimeout(() => {}, 100);
while(true) {}`;

      try {
        validator.validateCode(codeWithMultiplePatterns);
        expect.fail('Should have thrown an error');
      } catch (error) {
        // Should report eval first since it appears first
        expect(error.message).toContain('EVAL_USAGE');
      }
    });

    it('should report the first dangerous pattern found - line number', () => {
      const codeWithMultiplePatterns = `
eval('first');
setTimeout(() => {}, 100);
while(true) {}`;

      try {
        validator.validateCode(codeWithMultiplePatterns);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).toContain('line 2');
      }
    });

    it('should handle complex nested patterns - error code', () => {
      const nestedCode = `
function outer() {
  function inner() {
    if (condition) {
      while(true) {
        console.log('dangerous');
      }
    }
  }
}`;

      try {
        validator.validateCode(nestedCode);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).toContain('INFINITE_WHILE_LOOP');
      }
    });

    it('should handle complex nested patterns - line number', () => {
      const nestedCode = `
function outer() {
  function inner() {
    if (condition) {
      while(true) {
        console.log('dangerous');
      }
    }
  }
}`;

      try {
        validator.validateCode(nestedCode);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).toContain('line 5');
      }
    });

    it('should handle patterns at the beginning and end of code', () => {
      expect(() => validator.validateCode("eval('start')")).toThrow(/line 1/);

      const endCode = `
const x = 1;
const y = 2;
eval('end')`;

      try {
        validator.validateCode(endCode);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).toContain('line 4');
      }
    });

    describe.concurrent('network and communication patterns', () => {
      it('should reject fetch calls', () => {
        expect(() =>
          validator.validateCode(`fetch("${faker.internet.url()}")`)
        ).toThrow(
          /Security Error \[FETCH_USAGE\].*fetch\(\) API is not allowed.*network requests/
        );
      });

      it('should reject XMLHttpRequest usage', () => {
        expect(() => validator.validateCode('XMLHttpRequest()')).toThrow(
          /Security Error \[XMLHTTPREQUEST_USAGE\].*XMLHttpRequest is not allowed.*network requests/
        );
      });

      it('should reject XMLHttpRequest constructor', () => {
        expect(() => validator.validateCode('new XMLHttpRequest()')).toThrow(
          /Security Error \[XMLHTTPREQUEST_CONSTRUCTOR\].*XMLHttpRequest instances.*network requests/
        );
      });

      it('should reject WebSocket usage', () => {
        expect(() =>
          validator.validateCode('WebSocket("ws://localhost")')
        ).toThrow(
          /Security Error \[WEBSOCKET_USAGE\].*WebSocket connections.*persistent network connections/
        );
      });

      it('should reject WebSocket constructor', () => {
        expect(() =>
          validator.validateCode('new WebSocket("ws://localhost")')
        ).toThrow(
          /Security Error \[WEBSOCKET_CONSTRUCTOR\].*WebSocket instances.*persistent network connections/
        );
      });

      it('should reject EventSource usage', () => {
        expect(() => validator.validateCode('EventSource("/events")')).toThrow(
          /Security Error \[EVENTSOURCE_USAGE\].*EventSource is not allowed.*server-sent event/
        );
      });

      it('should reject EventSource constructor', () => {
        expect(() =>
          validator.validateCode('new EventSource("/events")')
        ).toThrow(
          /Security Error \[EVENTSOURCE_CONSTRUCTOR\].*EventSource instances.*server-sent event/
        );
      });
    });

    describe('worker and thread patterns', () => {
      it('should reject Worker usage', () => {
        expect(() => validator.validateCode('Worker("worker.js")')).toThrow(
          /Security Error \[WORKER_USAGE\].*Worker instances.*spawn additional threads/
        );
      });

      it('should reject Worker constructor', () => {
        expect(() => validator.validateCode('new Worker("worker.js")')).toThrow(
          /Security Error \[WORKER_CONSTRUCTOR\].*Worker instances.*spawn additional threads/
        );
      });

      it('should reject SharedWorker usage', () => {
        expect(() =>
          validator.validateCode('SharedWorker("shared.js")')
        ).toThrow(
          /Security Error \[SHAREDWORKER_USAGE\].*SharedWorker is not allowed.*shared execution contexts/
        );
      });

      it('should reject SharedWorker constructor', () => {
        expect(() =>
          validator.validateCode('new SharedWorker("shared.js")')
        ).toThrow(
          /Security Error \[SHAREDWORKER_CONSTRUCTOR\].*SharedWorker instances.*shared execution contexts/
        );
      });

      it('should reject importScripts', () => {
        expect(() =>
          validator.validateCode('importScripts("malicious.js")')
        ).toThrow(
          /Security Error \[IMPORTSCRIPTS_USAGE\].*importScripts\(\) is not allowed.*external scripts/
        );
      });
    });

    describe('DOM manipulation patterns', () => {
      it('should reject script element creation', () => {
        expect(() =>
          validator.validateCode('document.createElement("script")')
        ).toThrow(
          /Security Error \[SCRIPT_ELEMENT_CREATION\].*script elements.*inject and execute arbitrary code/
        );
      });

      it('should reject innerHTML assignment', () => {
        expect(() =>
          validator.validateCode(
            'element.innerHTML = "<script>alert(1)</script>"'
          )
        ).toThrow(
          /Security Error \[INNERHTML_ASSIGNMENT\].*innerHTML.*inject and execute scripts/
        );
      });

      it('should reject outerHTML assignment', () => {
        expect(() =>
          validator.validateCode('element.outerHTML = "<div>content</div>"')
        ).toThrow(
          /Security Error \[OUTERHTML_ASSIGNMENT\].*outerHTML.*inject and execute scripts/
        );
      });
    });

    describe('storage and persistence patterns', () => {
      it('should reject localStorage access', () => {
        expect(() =>
          validator.validateCode('localStorage.setItem("key", "value")')
        ).toThrow(
          /Security Error \[LOCALSTORAGE_USAGE\].*localStorage access.*side effects and timing variations/
        );
      });

      it('should reject sessionStorage access', () => {
        expect(() =>
          validator.validateCode('sessionStorage.getItem("key")')
        ).toThrow(
          /Security Error \[SESSIONSTORAGE_USAGE\].*sessionStorage access.*side effects and timing variations/
        );
      });

      it('should reject indexedDB access', () => {
        expect(() =>
          validator.validateCode('indexedDB.open("database")')
        ).toThrow(
          /Security Error \[INDEXEDDB_USAGE\].*indexedDB access.*asynchronous database operations/
        );
      });
    });

    describe('timing and animation patterns', () => {
      it('should reject requestAnimationFrame', () => {
        expect(() =>
          validator.validateCode('requestAnimationFrame(() => {})')
        ).toThrow(
          /Security Error \[REQUESTANIMATIONFRAME_USAGE\].*requestAnimationFrame\(\).*timing precision/
        );
      });

      it('should reject setImmediate', () => {
        expect(() => validator.validateCode('setImmediate(() => {})')).toThrow(
          /Security Error \[SETIMMEDIATE_USAGE\].*setImmediate\(\).*timing and event loop control/
        );
      });

      it('should reject process.nextTick', () => {
        expect(() =>
          validator.validateCode('process.nextTick(() => {})')
        ).toThrow(
          /Security Error \[PROCESS_NEXTTICK_USAGE\].*process\.nextTick\(\).*timing in Node\.js/
        );
      });
    });

    describe('cryptography patterns', () => {
      it('should reject crypto.subtle usage', () => {
        expect(() => validator.validateCode('crypto.subtle.encrypt()')).toThrow(
          /Security Error \[CRYPTO_SUBTLE_USAGE\].*crypto\.subtle.*timing measurements/
        );
      });
    });

    describe('user interface blocking patterns', () => {
      it('should reject alert calls', () => {
        expect(() => validator.validateCode('alert("message")')).toThrow(
          /Security Error \[ALERT_USAGE\].*alert\(\).*blocks execution/
        );
      });

      it('should reject confirm calls', () => {
        expect(() =>
          validator.validateCode('confirm("Are you sure?")')
        ).toThrow(
          /Security Error \[CONFIRM_USAGE\].*confirm\(\).*blocks execution/
        );
      });

      it('should reject prompt calls', () => {
        expect(() => validator.validateCode('prompt("Enter value:")')).toThrow(
          /Security Error \[PROMPT_USAGE\].*prompt\(\).*blocks execution/
        );
      });
    });

    describe('case sensitivity and whitespace handling', () => {
      it('should detect patterns regardless of case - fetch', () => {
        expect(() => validator.validateCode('FETCH("url")')).toThrow(
          /FETCH_USAGE/
        );
      });

      it('should detect patterns regardless of case - WebSocket', () => {
        expect(() => validator.validateCode('WebSocket("url")')).toThrow(
          /WEBSOCKET_USAGE/
        );
      });

      it('should detect patterns regardless of case - alert', () => {
        expect(() => validator.validateCode('ALERT("message")')).toThrow(
          /ALERT_USAGE/
        );
      });

      it('should detect patterns regardless of case - localStorage', () => {
        expect(() =>
          validator.validateCode('LocalStorage.setItem("k", "v")')
        ).toThrow(/LOCALSTORAGE_USAGE/);
      });

      it('should handle whitespace variations in new patterns - fetch', () => {
        expect(() => validator.validateCode('fetch  ("url")')).toThrow(
          /FETCH_USAGE/
        );
      });

      it('should handle whitespace variations in new patterns - XMLHttpRequest constructor', () => {
        expect(() => validator.validateCode('new   XMLHttpRequest()')).toThrow(
          /XMLHTTPREQUEST_CONSTRUCTOR/
        );
      });

      it('should handle whitespace variations in new patterns - localStorage', () => {
        expect(() =>
          validator.validateCode('localStorage  .setItem("k", "v")')
        ).toThrow(/LOCALSTORAGE_USAGE/);
      });

      it('should handle whitespace variations in new patterns - requestAnimationFrame', () => {
        expect(() =>
          validator.validateCode('requestAnimationFrame  (() => {})')
        ).toThrow(/REQUESTANIMATIONFRAME_USAGE/);
      });
    });

    describe('comprehensive pattern detection', () => {
      it('should detect multiple types of dangerous patterns - fetch', () => {
        expect(() => validator.validateCode('fetch("api")')).toThrow(
          /Security Error/
        );
      });

      it('should detect multiple types of dangerous patterns - XMLHttpRequest constructor', () => {
        expect(() => validator.validateCode('new XMLHttpRequest()')).toThrow(
          /Security Error/
        );
      });

      it('should detect multiple types of dangerous patterns - Worker constructor', () => {
        expect(() => validator.validateCode('new Worker("w.js")')).toThrow(
          /Security Error/
        );
      });

      it('should detect multiple types of dangerous patterns - localStorage', () => {
        expect(() =>
          validator.validateCode(
            `localStorage.getItem("${faker.lorem.word()}")`
          )
        ).toThrow(/Security Error/);
      });

      it('should detect multiple types of dangerous patterns - crypto.subtle', () => {
        expect(() => validator.validateCode('crypto.subtle.digest()')).toThrow(
          /Security Error/
        );
      });

      it('should detect multiple types of dangerous patterns - alert', () => {
        expect(() =>
          validator.validateCode(`alert("${faker.lorem.sentence()}")`)
        ).toThrow(/Security Error/);
      });

      it('should detect multiple types of dangerous patterns - requestAnimationFrame', () => {
        expect(() =>
          validator.validateCode('requestAnimationFrame(fn)')
        ).toThrow(/Security Error/);
      });

      it('should detect multiple types of dangerous patterns - importScripts', () => {
        expect(() =>
          validator.validateCode(
            `importScripts("${faker.system.filePath()}.js")`
          )
        ).toThrow(/Security Error/);
      });

      it('should detect multiple types of dangerous patterns - innerHTML', () => {
        expect(() =>
          validator.validateCode('element.innerHTML = html')
        ).toThrow(/Security Error/);
      });

      it('should provide specific error code for infinite while loop', () => {
        try {
          validator.validateCode('while(true) {}');
          expect.fail('Expected while(true) {} to throw');
        } catch (error) {
          expect(error.code).toBe(SecurityErrorCode.INFINITE_WHILE_LOOP);
        }
      });

      it('should provide specific error code for infinite while loop with !false', () => {
        try {
          validator.validateCode('while(!false) {}');
          expect.fail('Expected while(!false) {} to throw');
        } catch (error) {
          expect(error.code).toBe(SecurityErrorCode.INFINITE_WHILE_LOOP);
        }
      });

      it('should provide specific error code for infinite while loop with spaced !false', () => {
        try {
          validator.validateCode('while(!   false) {}');
          expect.fail('Expected while(!   false) {} to throw');
        } catch (error) {
          expect(error.code).toBe(SecurityErrorCode.INFINITE_WHILE_LOOP);
        }
      });

      it('should provide specific error code for infinite while loop with spaced !false variations', () => {
        try {
          validator.validateCode('while(   !false  ) {}');
          expect.fail('Expected while(   !false  ) {} to throw');
        } catch (error) {
          expect(error.code).toBe(SecurityErrorCode.INFINITE_WHILE_LOOP);
        }
      });

      it('should provide specific error code for infinite while loop with !!true', () => {
        try {
          validator.validateCode('while(!!true) {}');
          expect.fail('Expected while(!!true) {} to throw');
        } catch (error) {
          expect(error.code).toBe(SecurityErrorCode.INFINITE_WHILE_LOOP);
        }
      });

      it('should provide specific error code for infinite while loop with !!!false', () => {
        try {
          validator.validateCode('while(!!!false) {}');
          expect.fail('Expected while(!!!false) {} to throw');
        } catch (error) {
          expect(error.code).toBe(SecurityErrorCode.INFINITE_WHILE_LOOP);
        }
      });

      it('should provide specific error code for infinite while loop with !!!!true', () => {
        try {
          validator.validateCode('while(!!!!true) {}');
          expect.fail('Expected while(!!!!true) {} to throw');
        } catch (error) {
          expect(error.code).toBe(SecurityErrorCode.INFINITE_WHILE_LOOP);
        }
      });

      it('should provide specific error code for infinite for loop', () => {
        try {
          validator.validateCode('for(;;) {}');
          expect.fail('Expected for(;;) {} to throw');
        } catch (error) {
          expect(error.code).toBe(SecurityErrorCode.INFINITE_FOR_LOOP);
        }
      });

      it('should provide specific error code for eval usage', () => {
        try {
          validator.validateCode(`eval("${faker.lorem.word()}")`);
          expect.fail(`Expected eval("${faker.lorem.word()}") to throw`);
        } catch (error) {
          expect(error.code).toBe(SecurityErrorCode.EVAL_USAGE);
        }
      });

      it('should provide specific error code for Function constructor', () => {
        try {
          validator.validateCode(`new Function("${faker.lorem.word()}")`);
          expect.fail(
            `Expected new Function("${faker.lorem.word()}") to throw`
          );
        } catch (error) {
          expect(error.code).toBe(SecurityErrorCode.FUNCTION_CONSTRUCTOR);
        }
      });

      it('should provide specific error code for setTimeout usage', () => {
        try {
          validator.validateCode('setTimeout(() => {}, 100)');
          expect.fail('Expected setTimeout(() => {}, 100) to throw');
        } catch (error) {
          expect(error.code).toBe(SecurityErrorCode.SETTIMEOUT_USAGE);
        }
      });

      it('should provide specific error code for setInterval usage', () => {
        try {
          validator.validateCode('setInterval(() => {}, 100)');
          expect.fail('Expected setInterval(() => {}, 100) to throw');
        } catch (error) {
          expect(error.code).toBe(SecurityErrorCode.SETINTERVAL_USAGE);
        }
      });

      it('should provide specific error code for fetch usage', () => {
        try {
          validator.validateCode(
            `fetch("${faker.string.alpha({
              length: { min: 5, max: 10 },
            })}")`
          );
          expect.fail('Expected fetch to throw');
        } catch (error) {
          expect(error.code).toBe(SecurityErrorCode.FETCH_USAGE);
        }
      });

      it('should provide specific error code for XMLHttpRequest usage', () => {
        try {
          validator.validateCode('XMLHttpRequest()');
          expect.fail('Expected XMLHttpRequest() to throw');
        } catch (error) {
          expect(error.code).toBe(SecurityErrorCode.XMLHTTPREQUEST_USAGE);
        }
      });

      it('should provide specific error code for XMLHttpRequest constructor', () => {
        try {
          validator.validateCode('new XMLHttpRequest()');
          expect.fail('Expected new XMLHttpRequest() to throw');
        } catch (error) {
          expect(error.code).toBe(SecurityErrorCode.XMLHTTPREQUEST_CONSTRUCTOR);
        }
      });

      it('should provide specific error code for WebSocket usage', () => {
        try {
          validator.validateCode(
            `WebSocket("ws://${faker.internet.domainName()}")`
          );
          expect.fail('Expected WebSocket to throw');
        } catch (error) {
          expect(error.code).toBe(SecurityErrorCode.WEBSOCKET_USAGE);
        }
      });

      it('should provide specific error code for WebSocket constructor', () => {
        try {
          validator.validateCode(
            `new WebSocket("ws://${faker.internet.domainName()}")`
          );
          expect.fail('Expected new WebSocket to throw');
        } catch (error) {
          expect(error.code).toBe(SecurityErrorCode.WEBSOCKET_CONSTRUCTOR);
        }
      });

      it('should provide specific error code for EventSource usage', () => {
        try {
          validator.validateCode(`EventSource("${faker.internet.url()}")`);
          expect.fail('Expected EventSource to throw');
        } catch (error) {
          expect(error.code).toBe(SecurityErrorCode.EVENTSOURCE_USAGE);
        }
      });

      it('should provide specific error code for EventSource constructor', () => {
        try {
          validator.validateCode(`new EventSource("${faker.internet.url()}")`);
          expect.fail('Expected new EventSource to throw');
        } catch (error) {
          expect(error.code).toBe(SecurityErrorCode.EVENTSOURCE_CONSTRUCTOR);
        }
      });

      it('should provide specific error code for Worker usage', () => {
        try {
          validator.validateCode(`Worker("${faker.system.filePath()}")`);
          expect.fail('Expected Worker to throw');
        } catch (error) {
          expect(error.code).toBe(SecurityErrorCode.WORKER_USAGE);
        }
      });

      it('should provide specific error code for Worker constructor', () => {
        try {
          validator.validateCode(`new Worker("${faker.system.filePath()}")`);
          expect.fail('Expected new Worker to throw');
        } catch (error) {
          expect(error.code).toBe(SecurityErrorCode.WORKER_CONSTRUCTOR);
        }
      });

      it('should provide specific error code for SharedWorker usage', () => {
        try {
          validator.validateCode(`SharedWorker("${faker.system.filePath()}")`);
          expect.fail('Expected SharedWorker to throw');
        } catch (error) {
          expect(error.code).toBe(SecurityErrorCode.SHAREDWORKER_USAGE);
        }
      });

      it('should provide specific error code for SharedWorker constructor', () => {
        try {
          validator.validateCode(
            `new SharedWorker("${faker.system.filePath()}")`
          );
          expect.fail('Expected new SharedWorker to throw');
        } catch (error) {
          expect(error.code).toBe(SecurityErrorCode.SHAREDWORKER_CONSTRUCTOR);
        }
      });

      it('should provide specific error code for script element creation', () => {
        try {
          validator.validateCode('document.createElement("script")');
          expect.fail('Expected document.createElement("script") to throw');
        } catch (error) {
          expect(error.code).toBe(SecurityErrorCode.SCRIPT_ELEMENT_CREATION);
        }
      });

      it('should provide specific error code for innerHTML assignment', () => {
        try {
          validator.validateCode('el.innerHTML = x');
          expect.fail('Expected el.innerHTML = x to throw');
        } catch (error) {
          expect(error.code).toBe(SecurityErrorCode.INNERHTML_ASSIGNMENT);
        }
      });

      it('should provide specific error code for outerHTML assignment', () => {
        try {
          validator.validateCode('el.outerHTML = x');
          expect.fail('Expected el.outerHTML = x to throw');
        } catch (error) {
          expect(error.code).toBe(SecurityErrorCode.OUTERHTML_ASSIGNMENT);
        }
      });

      it('should provide specific error code for setImmediate usage', () => {
        try {
          validator.validateCode('setImmediate(() => {})');
          expect.fail('Expected setImmediate(() => {}) to throw');
        } catch (error) {
          expect(error.code).toBe(SecurityErrorCode.SETIMMEDIATE_USAGE);
        }
      });

      it('should provide specific error code for process.nextTick usage', () => {
        try {
          validator.validateCode('process.nextTick(() => {})');
          expect.fail('Expected process.nextTick(() => {}) to throw');
        } catch (error) {
          expect(error.code).toBe(SecurityErrorCode.PROCESS_NEXTTICK_USAGE);
        }
      });

      it('should provide specific error code for crypto.subtle usage', () => {
        try {
          validator.validateCode('crypto.subtle.encrypt()');
          expect.fail('Expected crypto.subtle.encrypt() to throw');
        } catch (error) {
          expect(error.code).toBe(SecurityErrorCode.CRYPTO_SUBTLE_USAGE);
        }
      });

      it('should provide specific error code for localStorage usage', () => {
        try {
          validator.validateCode('localStorage.test');
          expect.fail('Expected localStorage.test to throw');
        } catch (error) {
          expect(error.code).toBe(SecurityErrorCode.LOCALSTORAGE_USAGE);
        }
      });

      it('should provide specific error code for sessionStorage usage', () => {
        try {
          validator.validateCode(
            `sessionStorage.getItem("${faker.lorem.word()}")`
          );
          expect.fail('Expected sessionStorage.getItem to throw');
        } catch (error) {
          expect(error.code).toBe(SecurityErrorCode.SESSIONSTORAGE_USAGE);
        }
      });

      it('should provide specific error code for indexedDB usage', () => {
        try {
          validator.validateCode('indexedDB.open("db")');
          expect.fail('Expected indexedDB.open("db") to throw');
        } catch (error) {
          expect(error.code).toBe(SecurityErrorCode.INDEXEDDB_USAGE);
        }
      });

      it('should provide specific error code for alert usage', () => {
        try {
          validator.validateCode(`alert("${faker.lorem.sentence()}")`);
          expect.fail('Expected alert to throw');
        } catch (error) {
          expect(error.code).toBe(SecurityErrorCode.ALERT_USAGE);
        }
      });

      it('should provide specific error code for confirm usage', () => {
        try {
          validator.validateCode(`confirm("${faker.lorem.sentence()}")`);
          expect.fail('Expected confirm to throw');
        } catch (error) {
          expect(error.code).toBe(SecurityErrorCode.CONFIRM_USAGE);
        }
      });

      it('should provide specific error code for prompt usage', () => {
        try {
          validator.validateCode(`prompt("${faker.lorem.sentence()}")`);
          expect.fail('Expected prompt to throw');
        } catch (error) {
          expect(error.code).toBe(SecurityErrorCode.PROMPT_USAGE);
        }
      });

      it('should provide specific error code for requestAnimationFrame usage', () => {
        try {
          validator.validateCode(
            `requestAnimationFrame(${faker.lorem.word()})`
          );
          expect.fail('Expected requestAnimationFrame to throw');
        } catch (error) {
          expect(error.code).toBe(
            SecurityErrorCode.REQUESTANIMATIONFRAME_USAGE
          );
        }
      });

      it('should provide specific error code for importScripts usage', () => {
        try {
          validator.validateCode('importScripts("s")');
          expect.fail('Expected importScripts("s") to throw');
        } catch (error) {
          expect(error.code).toBe(SecurityErrorCode.IMPORTSCRIPTS_USAGE);
        }
      });

      it('should provide specific error code for history usage', () => {
        try {
          validator.validateCode('history.pushState()');
          expect.fail('Expected history.pushState() to throw');
        } catch (error) {
          expect(error.code).toBe(SecurityErrorCode.HISTORY_USAGE);
        }
      });

      it('should provide specific error code for navigator usage', () => {
        try {
          validator.validateCode('navigator.userAgent');
          expect.fail('Expected navigator.userAgent to throw');
        } catch (error) {
          expect(error.code).toBe(SecurityErrorCode.NAVIGATOR_USAGE);
        }
      });

      it('should provide specific error code for import usage', () => {
        try {
          validator.validateCode('import("module")');
          expect.fail('Expected import("module") to throw');
        } catch (error) {
          expect(error.code).toBe(SecurityErrorCode.IMPORT_USAGE);
        }
      });

      it('should provide specific error code for require usage', () => {
        try {
          validator.validateCode(`require("${faker.system.filePath()}")`);
          expect.fail('Expected require to throw');
        } catch (error) {
          expect(error.code).toBe(SecurityErrorCode.REQUIRE_USAGE);
        }
      });

      it('should provide specific error code for include usage', () => {
        try {
          validator.validateCode('include("file.js")');
          expect.fail('Expected include("file.js") to throw');
        } catch (error) {
          expect(error.code).toBe(SecurityErrorCode.INCLUDE_USAGE);
        }
      });

      it('should provide specific error code for global access', () => {
        try {
          validator.validateCode('global.test');
          expect.fail('Expected global.test to throw');
        } catch (error) {
          expect(error.code).toBe(SecurityErrorCode.GLOBAL_ACCESS);
        }
      });

      it('should provide specific error code for window access', () => {
        try {
          validator.validateCode('window.location');
          expect.fail('Expected window.location to throw');
        } catch (error) {
          expect(error.code).toBe(SecurityErrorCode.WINDOW_ACCESS);
        }
      });

      it('should provide specific error code for document access', () => {
        try {
          validator.validateCode('document.body');
          expect.fail('Expected document.body to throw');
        } catch (error) {
          expect(error.code).toBe(SecurityErrorCode.DOCUMENT_ACCESS);
        }
      });

      it('should provide specific error code for location access', () => {
        try {
          validator.validateCode('location.href');
          expect.fail('Expected location.href to throw');
        } catch (error) {
          expect(error.code).toBe(SecurityErrorCode.LOCATION_ACCESS);
        }
      });

      it('should provide specific error code for console usage', () => {
        try {
          validator.validateCode(`console.log("${faker.lorem.sentence()}")`);
          expect.fail('Expected console.log to throw');
        } catch (error) {
          expect(error.code).toBe(SecurityErrorCode.CONSOLE_USAGE);
        }
      });

      it('should provide specific error code for debugger usage', () => {
        try {
          validator.validateCode('debugger;');
          expect.fail('Expected debugger; to throw');
        } catch (error) {
          expect(error.code).toBe(SecurityErrorCode.DEBUGGER_USAGE);
        }
      });

      it('should provide specific error code for with statement', () => {
        try {
          validator.validateCode('with(obj) { }');
          expect.fail('Expected with(obj) { } to throw');
        } catch (error) {
          expect(error.code).toBe(SecurityErrorCode.WITH_STATEMENT);
        }
      });

      it('should provide specific error code for delete operator on prototype', () => {
        try {
          validator.validateCode('delete obj.prototype');
          expect.fail('Expected delete obj.prototype to throw');
        } catch (error) {
          expect(error.code).toBe(SecurityErrorCode.DELETE_OPERATOR);
        }
      });

      it('should provide specific error code for delete operator on constructor', () => {
        try {
          validator.validateCode('delete obj.constructor');
          expect.fail('Expected delete obj.constructor to throw');
        } catch (error) {
          expect(error.code).toBe(SecurityErrorCode.DELETE_OPERATOR);
        }
      });

      it('should provide specific error code for delete operator on __proto__', () => {
        try {
          validator.validateCode('delete obj.__proto__');
          expect.fail('Expected delete obj.__proto__ to throw');
        } catch (error) {
          expect(error.code).toBe(SecurityErrorCode.DELETE_OPERATOR);
        }
      });

      it('should provide specific error code for prototype pollution via __proto__', () => {
        try {
          validator.validateCode('obj.__proto__ = null');
          expect.fail('Expected obj.__proto__ = null to throw');
        } catch (error) {
          expect(error.code).toBe(SecurityErrorCode.PROTOTYPE_POLLUTION);
        }
      });

      it('should provide specific error code for prototype pollution via prototype', () => {
        try {
          validator.validateCode('obj.prototype = null');
          expect.fail('Expected obj.prototype = null to throw');
        } catch (error) {
          expect(error.code).toBe(SecurityErrorCode.PROTOTYPE_POLLUTION);
        }
      });

      it('should provide specific error code for prototype pollution via constructor', () => {
        try {
          validator.validateCode('obj.constructor = null');
          expect.fail('Expected obj.constructor = null to throw');
        } catch (error) {
          expect(error.code).toBe(SecurityErrorCode.PROTOTYPE_POLLUTION);
        }
      });

      it('should provide specific error code for Buffer usage', () => {
        try {
          validator.validateCode(`Buffer.from("${faker.lorem.sentence()}")`);
          expect.fail('Expected Buffer.from to throw');
        } catch (error) {
          expect(error.code).toBe(SecurityErrorCode.BUFFER_USAGE);
        }
      });

      it('should provide specific error code for filesystem usage', () => {
        try {
          validator.validateCode(`fs.readFile("${faker.system.filePath()}")`);
          expect.fail('Expected fs.readFile to throw');
        } catch (error) {
          expect(error.code).toBe(SecurityErrorCode.FILESYSTEM_USAGE);
        }
      });

      it('should provide specific error code for require fs usage', () => {
        try {
          validator.validateCode('require("fs")');
          expect.fail('Expected require("fs") to throw');
        } catch (error) {
          expect(error.code).toBe(SecurityErrorCode.REQUIRE_USAGE);
        }
      });

      it('should provide specific error code for require path usage', () => {
        try {
          validator.validateCode('require("path")');
          expect.fail('Expected require("path") to throw');
        } catch (error) {
          expect(error.code).toBe(SecurityErrorCode.REQUIRE_USAGE);
        }
      });

      it('should provide specific error code for require child_process usage', () => {
        try {
          validator.validateCode('require("child_process")');
          expect.fail('Expected require("child_process") to throw');
        } catch (error) {
          expect(error.code).toBe(SecurityErrorCode.REQUIRE_USAGE);
        }
      });

      it('should provide specific error code for exec usage', () => {
        try {
          validator.validateCode(`exec("${faker.lorem.word()}")`);
          expect.fail('Expected exec to throw');
        } catch (error) {
          expect(error.code).toBe(SecurityErrorCode.CHILD_PROCESS_USAGE);
        }
      });

      it('should provide specific error code for spawn usage', () => {
        try {
          validator.validateCode(`spawn("${faker.lorem.word()}")`);
          expect.fail('Expected spawn to throw');
        } catch (error) {
          expect(error.code).toBe(SecurityErrorCode.CHILD_PROCESS_USAGE);
        }
      });
    });
  });
});

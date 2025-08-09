import { describe, it, expect, beforeEach } from 'vitest';
import { CodeValidator } from '../code-validator.js';
import { SecurityErrorCode } from '../security-error-codes.js';

describe('CodeValidator', () => {
  let validator: CodeValidator;

  beforeEach(() => {
    validator = new CodeValidator();
  });

  describe('validateCode', () => {
    it('should accept safe code', () => {
      expect(() => validator.validateCode('const x = 1 + 1;')).not.toThrow();
      expect(() => validator.validateCode('Math.random()')).not.toThrow();
      expect(() =>
        validator.validateCode("return 'hello world';")
      ).not.toThrow();
    });

    it('should reject non-string input', () => {
      expect(() => validator.validateCode(123 as any)).toThrow(
        'Code must be a string'
      );
      expect(() => validator.validateCode(null as any)).toThrow(
        'Code must be a string'
      );
      expect(() => validator.validateCode(undefined as any)).toThrow(
        'Code must be a string'
      );
    });

    it('should reject code that exceeds size limit', () => {
      const longCode = 'a'.repeat(100);
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

    it('should handle case-insensitive patterns', () => {
      expect(() => validator.validateCode('WHILE(TRUE) {}')).toThrow(
        /INFINITE_WHILE_LOOP/
      );
      expect(() => validator.validateCode("EVAL('test')")).toThrow(
        /EVAL_USAGE/
      );
      expect(() => validator.validateCode('SETTIMEOUT(() => {}, 100)')).toThrow(
        /SETTIMEOUT_USAGE/
      );
    });

    it('should handle whitespace variations', () => {
      expect(() => validator.validateCode('while ( true ) {}')).toThrow(
        /INFINITE_WHILE_LOOP/
      );
      expect(() => validator.validateCode('for(  ;  ;  ) {}')).toThrow(
        /INFINITE_FOR_LOOP/
      );
      expect(() => validator.validateCode("eval  ( 'test' )")).toThrow(
        /EVAL_USAGE/
      );
    });

    it('should include helpful guidance in error messages', () => {
      try {
        validator.validateCode('setTimeout(function() {}, 1000)');
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).toContain('Please remove or replace this code');
        expect(error.message).toContain('to ensure safe execution');
      }
    });

    it('should report the first dangerous pattern found', () => {
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
        expect(error.message).toContain('line 2');
      }
    });

    it('should handle complex nested patterns', () => {
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

    describe('network and communication patterns', () => {
      it('should reject fetch calls', () => {
        expect(() =>
          validator.validateCode('fetch("https://api.example.com")')
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
      it('should detect patterns regardless of case', () => {
        expect(() => validator.validateCode('FETCH("url")')).toThrow(
          /FETCH_USAGE/
        );
        expect(() => validator.validateCode('WebSocket("url")')).toThrow(
          /WEBSOCKET_USAGE/
        );
        expect(() => validator.validateCode('ALERT("message")')).toThrow(
          /ALERT_USAGE/
        );
        expect(() =>
          validator.validateCode('LocalStorage.setItem("k", "v")')
        ).toThrow(/LOCALSTORAGE_USAGE/);
      });

      it('should handle whitespace variations in new patterns', () => {
        expect(() => validator.validateCode('fetch  ("url")')).toThrow(
          /FETCH_USAGE/
        );
        expect(() => validator.validateCode('new   XMLHttpRequest()')).toThrow(
          /XMLHTTPREQUEST_CONSTRUCTOR/
        );
        expect(() =>
          validator.validateCode('localStorage  .setItem("k", "v")')
        ).toThrow(/LOCALSTORAGE_USAGE/);
        expect(() =>
          validator.validateCode('requestAnimationFrame  (() => {})')
        ).toThrow(/REQUESTANIMATIONFRAME_USAGE/);
      });
    });

    describe('comprehensive pattern detection', () => {
      it('should detect multiple types of dangerous patterns', () => {
        const dangerousCodes = [
          'fetch("api")',
          'new XMLHttpRequest()',
          'new Worker("w.js")',
          'localStorage.getItem("k")',
          'crypto.subtle.digest()',
          'alert("hi")',
          'requestAnimationFrame(fn)',
          'importScripts("s.js")',
          'element.innerHTML = html',
        ];

        dangerousCodes.forEach((code) => {
          expect(() => validator.validateCode(code)).toThrow(/Security Error/);
        });
      });

      it('should provide specific error codes for each pattern type', () => {
        const patternTests = [
          { code: 'fetch("url")', expectedCode: SecurityErrorCode.FETCH_USAGE },
          {
            code: 'new XMLHttpRequest()',
            expectedCode: SecurityErrorCode.XMLHTTPREQUEST_CONSTRUCTOR,
          },
          {
            code: 'new WebSocket("ws://test")',
            expectedCode: SecurityErrorCode.WEBSOCKET_CONSTRUCTOR,
          },
          {
            code: 'new Worker("w.js")',
            expectedCode: SecurityErrorCode.WORKER_CONSTRUCTOR,
          },
          {
            code: 'localStorage.test',
            expectedCode: SecurityErrorCode.LOCALSTORAGE_USAGE,
          },
          {
            code: 'alert("test")',
            expectedCode: SecurityErrorCode.ALERT_USAGE,
          },
          {
            code: 'requestAnimationFrame(f)',
            expectedCode: SecurityErrorCode.REQUESTANIMATIONFRAME_USAGE,
          },
          {
            code: 'importScripts("s")',
            expectedCode: SecurityErrorCode.IMPORTSCRIPTS_USAGE,
          },
          {
            code: 'el.innerHTML = x',
            expectedCode: SecurityErrorCode.INNERHTML_ASSIGNMENT,
          },
          {
            code: 'history.pushState()',
            expectedCode: SecurityErrorCode.HISTORY_USAGE,
          },
          {
            code: 'navigator.userAgent',
            expectedCode: SecurityErrorCode.NAVIGATOR_USAGE,
          },
          {
            code: 'import("module")',
            expectedCode: SecurityErrorCode.IMPORT_USAGE,
          },
          {
            code: 'require("fs")',
            expectedCode: SecurityErrorCode.REQUIRE_USAGE,
          },
          {
            code: 'global.test',
            expectedCode: SecurityErrorCode.GLOBAL_ACCESS,
          },
          {
            code: 'window.location',
            expectedCode: SecurityErrorCode.WINDOW_ACCESS,
          },
          {
            code: 'document.body',
            expectedCode: SecurityErrorCode.DOCUMENT_ACCESS,
          },
          {
            code: 'location.href',
            expectedCode: SecurityErrorCode.LOCATION_ACCESS,
          },
          {
            code: 'console.log("test")',
            expectedCode: SecurityErrorCode.CONSOLE_USAGE,
          },
          {
            code: 'debugger;',
            expectedCode: SecurityErrorCode.DEBUGGER_USAGE,
          },
          {
            code: 'with(obj) { }',
            expectedCode: SecurityErrorCode.WITH_STATEMENT,
          },
          {
            code: 'delete obj.prototype',
            expectedCode: SecurityErrorCode.DELETE_OPERATOR,
          },
          {
            code: 'obj.__proto__ = null',
            expectedCode: SecurityErrorCode.PROTOTYPE_POLLUTION,
          },
          {
            code: 'Buffer.from("test")',
            expectedCode: SecurityErrorCode.BUFFER_USAGE,
          },
          {
            code: 'fs.readFile("test")',
            expectedCode: SecurityErrorCode.FILESYSTEM_USAGE,
          },
          {
            code: 'exec("ls")',
            expectedCode: SecurityErrorCode.CHILD_PROCESS_USAGE,
          },
        ];

        patternTests.forEach(({ code, expectedCode }) => {
          try {
            validator.validateCode(code);
            expect.fail(`Expected ${code} to throw`);
          } catch (error) {
            expect(error.code).toBe(expectedCode);
          }
        });
      });
    });
  });
});

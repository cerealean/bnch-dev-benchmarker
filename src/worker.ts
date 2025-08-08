import { SecurityConfig } from './types.js';
import { workerCode } from './worker-code.js';

/**
 * Create a new worker for secure code execution
 */
export function createBenchmarkWorker(security: SecurityConfig): Worker {
  const blob = new Blob([workerCode], { type: 'application/javascript' });
  const workerUrl = URL.createObjectURL(blob);
  const worker = new Worker(workerUrl);
  
  // Clean up the blob URL after worker creation
  setTimeout(() => URL.revokeObjectURL(workerUrl), 100);
  
  return worker;
}

/**
 * Execute code in a web worker with security constraints
 */
export function executeInWorker(
  worker: Worker,
  code: string,
  timeout: number,
  csp?: string
): Promise<{ success: boolean; time: number; error?: string }> {
  return new Promise((resolve) => {
    const id = Math.random().toString(36).substr(2, 9);
    
    const handleMessage = (e: MessageEvent) => {
      if (e.data.id === id) {
        worker.removeEventListener('message', handleMessage);
        resolve(e.data);
      }
    };
    
    worker.addEventListener('message', handleMessage);
    worker.postMessage({ code, timeout, csp, id });
  });
}

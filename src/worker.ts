/**
 * Create a new worker for secure code execution
 */
export function createBenchmarkWorker(): Worker {
  // Use the worker script file directly
  const workerUrl = new URL('./worker-script.js', import.meta.url);
  const worker = new Worker(workerUrl);

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

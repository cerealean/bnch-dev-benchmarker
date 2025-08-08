import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read the worker script
const workerScriptPath = join(__dirname, 'src', 'worker-script.js');
const workerScript = readFileSync(workerScriptPath, 'utf-8');

// Create the worker code constant
const workerCodeConstant = `// Auto-generated from worker-script.js
export const workerCode = ${JSON.stringify(workerScript)};
`;

// Write to worker-code.ts
const outputPath = join(__dirname, 'src', 'worker-code.ts');
writeFileSync(outputPath, workerCodeConstant);

console.log('Worker script inlined successfully!');

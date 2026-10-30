/**
 * CareerBridge — Seed Script JavaScript Entrypoint
 * Bridges execution to TypeScript seed data engine using tsx.
 */

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const tsScriptPath = path.resolve(__dirname, 'seedData.ts');

const args = process.argv.slice(2);

// Run through npx tsx so both local node_modules tsx and global tsx resolve seamlessly
const child = spawn('npx', ['tsx', tsScriptPath, ...args], {
  stdio: 'inherit',
  shell: true,
  env: process.env,
});

child.on('exit', (code) => {
  process.exit(code || 0);
});

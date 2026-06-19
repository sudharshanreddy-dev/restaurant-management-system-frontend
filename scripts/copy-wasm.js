import { copyFileSync, mkdirSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');

const wasmSource = join(rootDir, 'node_modules', 'sql.js', 'dist', 'sql-wasm.wasm');
const publicDir = join(rootDir, 'public');
const wasmDest = join(publicDir, 'sql-wasm.wasm');

// Create public directory if it doesn't exist
if (!existsSync(publicDir)) {
  mkdirSync(publicDir, { recursive: true });
}

// Copy the WASM file
try {
  copyFileSync(wasmSource, wasmDest);
  console.log('✓ Copied sql-wasm.wasm to public folder');
} catch (error) {
  console.error('Failed to copy WASM file:', error);
  process.exit(1);
}

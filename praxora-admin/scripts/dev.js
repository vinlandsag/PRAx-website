import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('🚀 Starting Veylith Control full-stack development environment...');

const serverPath = path.join(rootDir, 'server', 'index.js');
const viteBin = path.join(rootDir, 'node_modules', 'vite', 'bin', 'vite.js');

const server = spawn(process.execPath, [serverPath], {
  stdio: 'inherit',
  cwd: rootDir,
});

const client = spawn(process.execPath, [viteBin], {
  stdio: 'inherit',
  cwd: rootDir,
});

function cleanup(code) {
  try {
    server.kill();
  } catch (_) {}
  try {
    client.kill();
  } catch (_) {}
  process.exit(code || 0);
}

server.on('exit', (code) => {
  if (code && code !== 0) {
    console.error(`Backend process exited with code ${code}`);
  }
});

client.on('exit', (code) => {
  if (code && code !== 0) {
    console.error(`Frontend process exited with code ${code}`);
  }
});

process.on('SIGINT', () => cleanup(0));
process.on('SIGTERM', () => cleanup(0));

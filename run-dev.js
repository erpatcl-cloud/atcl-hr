import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const localServerDir = 'C:\\Users\\ekramul haque\\atcl-hr-server';

console.log('[Runner] Syncing project files to local C: drive to bypass Google Drive limitations...');
try {
  // Ensure target folder exists
  fs.mkdirSync(localServerDir, { recursive: true });

  // Sync server folder
  fs.cpSync(path.join(__dirname, 'server'), path.join(localServerDir, 'server'), { recursive: true, force: true });
  // Sync src folder (needed for seeds dynamically imported)
  fs.cpSync(path.join(__dirname, 'src'), path.join(localServerDir, 'src'), { recursive: true, force: true });

  console.log('[Runner] Sync complete.');
} catch (error) {
  console.error('[Runner] Sync failed. Will attempt to run with existing local files.', error.message);
}

console.log('[Runner] Starting Vite Frontend...');
const vite = spawn('npx', ['vite'], { stdio: 'inherit', shell: true });

console.log('[Runner] Starting Express Backend (MySQL integration) from C: drive...');
const server = spawn('node', [`"${path.join(localServerDir, 'server', 'server.js')}"`], { stdio: 'inherit', shell: true });

// Forward termination signals to child processes
const cleanup = () => {
  console.log('[Runner] Shutting down Vite and Express servers...');
  vite.kill('SIGTERM');
  server.kill('SIGTERM');
  process.exit(0);
};

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
process.on('exit', cleanup);

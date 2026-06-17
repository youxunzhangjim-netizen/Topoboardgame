#!/usr/bin/env node
import { spawn } from 'node:child_process';
import { platform } from 'node:os';
import fs from 'node:fs';

const electronBin = platform() === 'win32' ? 'node_modules/.bin/electron.cmd' : 'node_modules/.bin/electron';
if (!fs.existsSync(electronBin)) {
  console.error('Electron is not installed. Run: npm install --save-dev electron electron-builder');
  process.exit(1);
}
const vite = spawn(platform() === 'win32' ? 'node_modules/.bin/vite.cmd' : 'node_modules/.bin/vite', ['--host', '127.0.0.1', '--port', '5172'], { stdio: 'inherit', shell: platform() === 'win32' });
setTimeout(() => {
  const electron = spawn(electronBin, ['local-app/electron/main.cjs'], {
    stdio: 'inherit',
    shell: platform() === 'win32',
    env: { ...process.env, TOPOBOARDGAME_ELECTRON_DEV: '1', TOPOBOARDGAME_DEV_URL: 'http://127.0.0.1:5172' }
  });
  electron.on('exit', (code) => { vite.kill(); process.exit(code ?? 0); });
}, 1400);

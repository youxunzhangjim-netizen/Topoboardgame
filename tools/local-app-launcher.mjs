#!/usr/bin/env node
import fs from 'node:fs';
import { spawn } from 'node:child_process';
import { platform } from 'node:os';

const viteBin = platform() === 'win32'
  ? 'node_modules/.bin/vite.cmd'
  : 'node_modules/.bin/vite';

if (!fs.existsSync(viteBin)) {
  console.error('\nTopoboardgame local app dependencies are not installed.');
  console.error('Run this once first:');
  console.error('  npm install\n');
  process.exit(1);
}

const port = process.env.TOPOBOARDGAME_PORT || '5172';
const host = '127.0.0.1';
console.log(`Starting Topoboardgame local app at http://${host}:${port}`);
console.log('Local / Local Robot modes work offline after dependencies are installed. Online mode still needs internet/Firebase.');

const child = spawn(viteBin, ['--host', host, '--port', port, '--open'], {
  stdio: 'inherit',
  shell: platform() === 'win32',
  env: { ...process.env, TOPBOARDGAME_LOCAL_APP: '1' }
});

child.on('exit', (code) => process.exit(code ?? 0));
process.on('SIGINT', () => child.kill('SIGINT'));
process.on('SIGTERM', () => child.kill('SIGTERM'));

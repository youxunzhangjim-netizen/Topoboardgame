import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const appAsar = process.env.TOPOBOARDGAME_APP_ASAR
  || path.join(root, 'release', 'win-unpacked', 'resources', 'app.asar');

if (!fs.existsSync(appAsar)) {
  console.error(`[verify-steam-package] Missing unpacked app archive: ${appAsar}`);
  console.error('Run npm run desktop:dir first, or set TOPOBOARDGAME_APP_ASAR to the packaged app.asar path.');
  process.exit(1);
}

let asarBin;
try {
  asarBin = require.resolve('@electron/asar/bin/asar.js');
} catch {
  console.error('[verify-steam-package] Could not find @electron/asar. Run npm install first.');
  process.exit(1);
}

const listing = execFileSync(process.execPath, [asarBin, 'list', appAsar], {
  cwd: root,
  encoding: 'utf8'
}).split(/\r?\n/)
  .map((line) => line.trim().replace(/\\/g, '/').replace(/^\/+/, ''))
  .filter(Boolean);

const entries = new Set(listing);

function hasPrefix(prefix) {
  return listing.some((entry) => entry === prefix || entry.startsWith(`${prefix}/`));
}

for (const required of [
  'dist-steam/app/index.html',
  'dist-steam/app/2D',
  'dist-steam/app/3D',
  'dist-steam/app/4D',
  'dist-steam/app/life',
  'dist-steam/app/algebraic',
  'local-app/electron/main.cjs',
  'local-app/electron/preload.cjs',
  'local-app/electron/save-store.cjs'
]) {
  if (required.includes('.')) assert.ok(entries.has(required), `Missing packaged file ${required}`);
  else assert.ok(hasPrefix(required), `Missing packaged folder ${required}`);
}

assert.ok(hasPrefix('dist-steam/app/assets'), 'Missing packaged Vite assets.');

const forbidden = listing.filter((entry) =>
  entry.startsWith('local-data/')
  || entry.startsWith('research-data/')
  || entry.startsWith('training-data/')
  || entry.startsWith('selfplay/')
  || entry.startsWith('steamworks/sdk/')
  || entry.endsWith('.jsonl')
  || /\.steamguard$/i.test(entry)
  || /\.env(?:\.|$)/i.test(path.basename(entry))
);

assert.deepEqual(forbidden, [], `Forbidden Steam package files:\n${forbidden.join('\n')}`);

console.log(`[verify-steam-package] OK: ${appAsar}`);
console.log('[verify-steam-package] Steam package includes local game pages and excludes private/research data.');

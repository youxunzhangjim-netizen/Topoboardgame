#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
const runs = [
  ['2dchess', ['--boundary', 'random', '--games', '1', '--maxPlies', '8', '--depth', '1']],
  ['2dgo', ['--boundary', 'open2d', '--lattice', 'square', '--size', '5', '--games', '1', '--maxPlies', '10', '--depth', '1']],
  ['2dreversi', ['--boundary', 'open2d', '--size', '6', '--games', '1', '--maxPlies', '20', '--depth', '1']],
  ['3dgo', ['--boundary', 'r3', '--lattice', 'sc', '--size', '3', '--games', '1', '--maxPlies', '8', '--depth', '1']],
  ['3dreversi', ['--boundary', 'r3', '--size', '4', '--games', '1', '--maxPlies', '20', '--depth', '1']]
];
fs.mkdirSync('local-data/selfplay/smoke', { recursive: true });
for (const [game, extra] of runs) {
  const out = `local-data/selfplay/smoke/${game}.jsonl`;
  const args = ['research/selfplay.mjs', '--game', game, '--out', out, '--state', 'false', '--record', 'moves', '--seed', `smoke-${game}`, ...extra];
  const result = spawnSync(process.execPath, args, { stdio: 'inherit' });
  if (result.status !== 0) process.exit(result.status || 1);
}
console.log('Research self-play smoke tests passed.');

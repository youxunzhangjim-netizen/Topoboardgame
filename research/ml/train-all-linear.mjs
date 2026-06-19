#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { parseArgs, stringArg, numberArg } from '../lib/cli.mjs';

const args = parseArgs();
if (args.help || args.h) {
  console.log(`Train linear robots for Topoboardgame supported headless games.\n\nUsage:\n  npm run ml:train-all -- --preset quick\n  npm run ml:train-all -- --only 2dchess --preset normal\n\nPresets:\n  quick   tiny smoke run, minutes\n  normal  useful first dataset, hours\n  large   research scale, many hours/days\n\nOptions:\n  --only GAME        restrict to 2dchess | 3dchess | 2dgo | 2dreversi | 3dgo | 3dreversi | 2djump | 3djump | 4djump\n  --preset NAME      quick | normal | large\n  --skipEval true    train only, no linear-vs-builtin tournaments\n`);
  process.exit(0);
}

const preset = stringArg(args, 'preset', 'quick').toLowerCase();
const only = stringArg(args, 'only', '').toLowerCase();
const skipEval = ['1', 'true', 'yes'].includes(String(args.skipEval || '').toLowerCase());
const overwrite = ['1', 'true', 'yes'].includes(String(args.overwrite || '').toLowerCase());
const maxJobs = numberArg(args, 'maxJobs', Infinity, { min: 1, max: 100000 });

const counts = {
  quick: { chess: 4, g3chess: 2, go: 2, reversi: 4, g3go: 1, g3reversi: 2, jump: 2, g3jump: 1, g4jump: 1, eval: 2 },
  normal: { chess: 10000, g3chess: 3000, go: 10000, reversi: 20000, g3go: 5000, g3reversi: 10000, jump: 12000, g3jump: 6000, g4jump: 3000, eval: 500 },
  large: { chess: 50000, g3chess: 15000, go: 50000, reversi: 80000, g3go: 25000, g3reversi: 50000, jump: 60000, g3jump: 30000, g4jump: 15000, eval: 2000 }
}[preset] || null;
if (!counts) throw new Error(`Unknown --preset ${preset}`);

fs.mkdirSync('local-data/selfplay', { recursive: true });
fs.mkdirSync('local-data/summaries', { recursive: true });
fs.mkdirSync('local-models', { recursive: true });

const jobs = [];
for (const boundary of ['standard', 'open', 'periodic', 'reflection', 'random']) {
  jobs.push({ game: '2dchess', boundary, lattice: 'square', games: counts.chess, depthA: 2, depthB: 2, epochs: preset === 'quick' ? 4 : 15, lr: 0.04 });
}

for (const boundary of ['r3', 't3', 'reflection', 'r3_random', 't2', 'sphere', 'klein', 'mobius', 'rp2']) {
  jobs.push({ game: '3dchess', boundary, lattice: 'chess3d', size: 8, games: counts.g3chess, depthA: preset === 'quick' ? 1 : 2, depthB: preset === 'quick' ? 1 : 2, epochs: preset === 'quick' ? 3 : 10, lr: 0.04 });
}

for (const boundary of ['open2d', 'polar', 'cylinder', 'pbc', 'klein', 'random']) {
  const lattices = boundary === 'polar' ? ['square'] : ['square', 'honeycomb', 'triangular'];
  for (const lattice of lattices) {
    jobs.push({ game: '2dgo', boundary, lattice, size: 9, games: counts.go, depthA: 1, depthB: 1, epochs: preset === 'quick' ? 4 : 12, lr: 0.05 });
  }
}
for (const boundary of ['open2d', 'cylinder', 'pbc', 'klein', 'random']) {
  for (const lattice of ['square', 'honeycomb']) {
    jobs.push({ game: '2dreversi', boundary, lattice, games: counts.reversi, depthA: 3, depthB: 3, epochs: preset === 'quick' ? 4 : 15, lr: 0.04 });
  }
}
for (const boundary of ['r3', 't3', 'r3_random', 't2', 'cylinder', 'sphere', 'klein', 'mobius', 'rp2']) {
  for (const lattice of ['sc', 'bcc', 'fcc', 'hcp', 'square', 'honeycomb', 'triangular']) {
    jobs.push({ game: '3dgo', boundary, lattice, size: 5, games: counts.g3go, depthA: 1, depthB: 1, epochs: preset === 'quick' ? 3 : 10, lr: 0.05 });
  }
}
for (const boundary of ['r3', 't3', 'r3_random', 't2', 'cylinder', 'sphere', 'klein', 'mobius', 'rp2']) {
  for (const lattice of ['square', 'hcp']) {
    jobs.push({ game: '3dreversi', boundary, lattice, size: 6, games: counts.g3reversi, depthA: 2, depthB: 2, epochs: preset === 'quick' ? 3 : 12, lr: 0.04 });
  }
}

for (const boundary of ['plane', 'polar', 'cylinder', 'torus', 'mobius', 'klein', 'rp2', 'sphere']) {
  const lattices = boundary === 'polar' ? ['square'] : ['square', 'triangular'];
  for (const lattice of lattices) {
    jobs.push({ game: '2djump', boundary, lattice, size: 8, games: counts.jump, depthA: 1, depthB: 1, epochs: preset === 'quick' ? 3 : 10, lr: 0.04 });
  }
}
for (const boundary of ['cube', 'cylinder', 'torus', 'reflective', 'sphere']) {
  jobs.push({ game: '3djump', boundary, lattice: 'jump3d', size: 6, games: counts.g3jump, depthA: 1, depthB: 1, epochs: preset === 'quick' ? 3 : 10, lr: 0.04 });
}
for (const boundary of ['hypercube', 'cylinder', '4d-torus', 'cube', 'projection']) {
  jobs.push({ game: '4djump', boundary, lattice: 'jump4d', size: 4, games: counts.g4jump, depthA: 1, depthB: 1, epochs: preset === 'quick' ? 3 : 10, lr: 0.04 });
}

let done = 0;
for (const job of jobs) {
  if (only && job.game !== only) continue;
  if (done >= maxJobs) break;
  await runJob(job);
  done += 1;
}
console.log(JSON.stringify({ ok: true, preset, jobsRun: done }, null, 2));

async function runJob(job) {
  const sizePart = job.size ? `-s${job.size}` : '';
  const stem = `${job.game}-${job.boundary}-${job.lattice}${sizePart}`.replace(/[^a-zA-Z0-9_.-]/g, '_');
  const data = `local-data/selfplay/${stem}-${preset}.jsonl`;
  const model = `local-models/${stem}-linear.json`;
  const evalFile = `local-data/selfplay/eval-${stem}-linear-vs-builtin-${preset}.jsonl`;
  const summary = `local-data/summaries/eval-${stem}-linear-vs-builtin-${preset}-summary.json`;
  console.log(`\n=== ${stem} (${preset}) ===`);
  if (overwrite || !fs.existsSync(data)) {
    const selfArgs = ['research/selfplay.mjs', '--game', job.game, '--boundary', job.boundary, '--lattice', job.lattice, '--games', String(job.games), '--depthA', String(job.depthA), '--depthB', String(job.depthB), '--record', 'moves', '--state', 'true', '--out', data];
    if (preset === 'quick') selfArgs.push('--maxPlies', '30');
    if (job.size) selfArgs.push('--size', String(job.size));
    runNode(selfArgs);
  } else console.log(`[skip] existing data ${data}`);
  if (overwrite || !fs.existsSync(model)) {
    runNode(['research/ml/train-linear.mjs', '--in', data, '--out', model, '--epochs', String(job.epochs), '--lr', String(job.lr), '--l2', '0.0005']);
  } else console.log(`[skip] existing model ${model}`);
  if (!skipEval) {
    const evalArgs = ['research/selfplay.mjs', '--game', job.game, '--boundary', job.boundary, '--lattice', job.lattice, '--botA', 'linear', '--modelA', model, '--botB', 'builtin', '--depthB', String(job.depthB), '--games', String(counts.eval), '--out', evalFile];
    if (preset === 'quick') evalArgs.push('--maxPlies', '30');
    if (job.size) evalArgs.push('--size', String(job.size));
    runNode(evalArgs);
    runNode(['research/aggregate-stats.mjs', '--in', evalFile, '--out', summary]);
  }
}

function runNode(args) {
  const result = spawnSync(process.execPath, args, { stdio: 'inherit', shell: false });
  if (result.status !== 0) throw new Error(`Command failed: node ${args.join(' ')}`);
}

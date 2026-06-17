#!/usr/bin/env node
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { parseArgs, numberArg, stringArg } from './lib/cli.mjs';

const args = parseArgs();
if (args.help || args.h) {
  console.log(`Topoboardgame parallel self-play batch runner\n\nUsage:\n  npm run research:batch -- --game 2dchess --boundary random --games 10000 --workers 4 --outDir local-data/selfplay/chess-batch\n\nAll unknown options are forwarded to research/selfplay.mjs. Each worker writes one shard JSONL file.`);
  process.exit(0);
}
const totalGames = numberArg(args, 'games', 100, { min: 1, max: 100_000_000 });
const workers = numberArg(args, 'workers', Math.max(1, Math.min(4, Number(process.env.TOPBOARDGAME_WORKERS) || 2)), { min: 1, max: 128 });
const outDir = stringArg(args, 'outDir', `local-data/selfplay/batch-${Date.now()}`);
const seed = stringArg(args, 'seed', `batch-${Date.now()}`);
fs.mkdirSync(outDir, { recursive: true });

const childArgsBase = process.argv.slice(2).filter((item, idx, arr) => {
  if (item === '--workers' || item === '--outDir') return false;
  if (arr[idx - 1] === '--workers' || arr[idx - 1] === '--outDir') return false;
  if (item.startsWith('--workers=') || item.startsWith('--outDir=')) return false;
  return true;
});

let remaining = totalGames;
const jobs = [];
for (let i = 0; i < workers; i += 1) {
  const gamesForWorker = Math.floor(totalGames / workers) + (i < totalGames % workers ? 1 : 0);
  if (gamesForWorker <= 0) continue;
  remaining -= gamesForWorker;
  const out = path.join(outDir, `shard-${String(i).padStart(3, '0')}.jsonl`);
  const filtered = removeArg(removeArg(removeArg(childArgsBase, 'games'), 'out'), 'seed');
  const childArgs = ['research/selfplay.mjs', ...filtered, '--games', String(gamesForWorker), '--out', out, '--seed', `${seed}:worker:${i}`];
  jobs.push({ index: i, games: gamesForWorker, out, childArgs });
}

console.error(`[batch] starting ${jobs.length} workers for ${totalGames} games in ${outDir}`);
await Promise.all(jobs.map(runJob));
console.log(JSON.stringify({ ok: true, totalGames, workers: jobs.length, outDir: path.resolve(outDir), shards: jobs.map((job) => job.out) }, null, 2));

function runJob(job) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, job.childArgs, { stdio: 'inherit' });
    child.on('exit', (code) => code === 0 ? resolve() : reject(new Error(`worker ${job.index} failed with ${code}`)));
  });
}

function removeArg(argv, key) {
  const out = [];
  for (let i = 0; i < argv.length; i += 1) {
    const item = argv[i];
    if (item === `--${key}`) { i += 1; continue; }
    if (item.startsWith(`--${key}=`)) continue;
    out.push(item);
  }
  return out;
}

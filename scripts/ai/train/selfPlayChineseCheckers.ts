import { spawnSync } from 'node:child_process';

const quick = process.argv.includes('--quick');
const games = process.env.TRAIN_GAMES || (quick ? '5' : '100');
const epochs = process.env.TRAIN_EPOCHS || (quick ? '4' : '10');
const jobs = [
  { boundary: 'diamond', lattice: 'triangular', size: '12', playerCount: '2' },
  { boundary: 'diamond', lattice: 'square', size: '12', playerCount: '2' },
  { boundary: 'diamond', lattice: 'triangular', size: '12', playerCount: '3' }
];

for (const job of jobs) {
  const stem = `2djump-${job.boundary}-${job.lattice}-s${job.size}-p${job.playerCount}-knowledge`;
  const out = `local-data/selfplay/${stem}.jsonl`;
  const model = `local-models/${stem}-linear.json`;
  const selfplay = spawnSync('node', [
    'research/selfplay.mjs',
    '--game', '2djump',
    '--boundary', job.boundary,
    '--lattice', job.lattice,
    '--size', job.size,
    '--playerCount', job.playerCount,
    '--botA', 'builtin',
    '--botB', 'builtin',
    '--games', games,
    '--depthA', '1',
    '--depthB', '1',
    '--record', 'moves',
    '--state', 'true',
    '--out', out
  ], { stdio: 'inherit' });
  if (selfplay.status) process.exit(selfplay.status);
  const train = spawnSync('node', [
    'research/ml/train-linear.mjs',
    '--in', out,
    '--out', model,
    '--epochs', epochs,
    '--lr', '0.04',
    '--l2', '0.0005',
    '--game', '2djump'
  ], { stdio: 'inherit' });
  if (train.status) process.exit(train.status);
}

const promote = spawnSync('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', 'scripts/Promote-TrainedModels.ps1'], { stdio: 'inherit' });
if (promote.status) process.exit(promote.status);

import { spawnSync } from 'node:child_process';

const quick = process.argv.includes('--quick');
const games = process.env.TRAIN_GAMES || (quick ? '5' : '100');
const epochs = process.env.TRAIN_EPOCHS || (quick ? '4' : '12');
for (const boundary of ['open2d', 'pbc', 'cylinder']) {
  const out = `local-data/selfplay/2dreversi-${boundary}-square-ai-knowledge.jsonl`;
  const model = `local-models/2dreversi-${boundary}-square-knowledge-linear.json`;
  const result = spawnSync('node', [
    'research/selfplay.mjs',
    '--game', '2dreversi',
    '--boundary', boundary,
    '--lattice', 'square',
    '--botA', 'builtin',
    '--botB', 'builtin',
    '--games', games,
    '--depthA', '3',
    '--depthB', '3',
    '--record', 'moves',
    '--state', 'true',
    '--out', out
  ], { stdio: 'inherit' });
  if (result.status) process.exit(result.status);
  const train = spawnSync('node', [
    'research/ml/train-linear.mjs',
    '--in', out,
    '--out', model,
    '--epochs', epochs,
    '--lr', '0.04',
    '--l2', '0.0005',
    '--game', '2dreversi'
  ], { stdio: 'inherit' });
  if (train.status) process.exit(train.status);
}

const promote = spawnSync('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', 'scripts/Promote-TrainedModels.ps1'], { stdio: 'inherit' });
if (promote.status) process.exit(promote.status);

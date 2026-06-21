import { spawnSync } from 'node:child_process';

const games = process.env.TRAIN_GAMES || (process.argv.includes('--quick') ? '20' : '100');
for (const boundary of ['open2d', 'pbc', 'cylinder']) {
  const out = `local-data/selfplay/2dreversi-${boundary}-square-ai-knowledge.jsonl`;
  const result = spawnSync('node', ['research/selfplay.mjs', '--game', '2dreversi', '--boundary', boundary, '--lattice', 'square', '--botA', 'builtin', '--botB', 'builtin', '--games', games, '--out', out], { stdio: 'inherit' });
  if (result.status) process.exit(result.status);
}


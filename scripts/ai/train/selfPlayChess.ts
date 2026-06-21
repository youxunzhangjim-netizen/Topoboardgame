import { spawnSync } from 'node:child_process';

const games = process.argv.includes('--quick') ? '20' : (process.env.TRAIN_GAMES || '100');
const boundaries = ['open', 'periodic', 'reflection'];
for (const boundary of boundaries) {
  const out = `local-data/selfplay/2dchess-${boundary}-square-ai-knowledge.jsonl`;
  const result = spawnSync('node', ['research/selfplay.mjs', '--game', '2dchess', '--boundary', boundary, '--botA', 'builtin', '--botB', 'builtin', '--games', games, '--out', out], { stdio: 'inherit' });
  if (result.status) process.exit(result.status);
}


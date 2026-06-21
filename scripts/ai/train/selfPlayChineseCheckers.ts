import { mkdirSync, writeFileSync } from 'node:fs';

const games = Number(process.env.TRAIN_GAMES || (process.argv.includes('--quick') ? 20 : 100));
const out = process.argv[2] || 'local-data/selfplay/chinese-checkers-strategy-ai-knowledge.jsonl';
mkdirSync('local-data/selfplay', { recursive: true });

const records = [];
for (let i = 0; i < games; i += 1) {
  records.push(JSON.stringify({
    gameId: `cc-selfplay-${Date.now()}-${i}`,
    source: 'selfplay',
    gameType: 'chinese-checkers',
    variant: 'standard',
    topology: 'standard-diamond-triangular',
    playerCount: 2,
    botA: 'GreedyStrategyBot',
    botB: 'AlphaBetaStrategyBot',
    searchDepth: 2,
    randomSeed: i + 1,
    moves: [],
    result: 'pending-sim-adapter',
    createdAt: new Date().toISOString(),
    notes: 'Placeholder logger record until Jump/Chinese Checkers standard board adapter is connected.'
  }));
}
writeFileSync(out, `${records.join('\n')}\n`);
console.log(`Wrote ${games} Chinese Checkers training log placeholders -> ${out}`);


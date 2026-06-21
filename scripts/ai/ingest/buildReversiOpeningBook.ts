import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { positionHash } from '../../../src/ai/common/PositionHasher.ts';

const inputFile = process.argv[2] || 'local-data/knowledge/reversi/wthor-games.json';
const outFile = process.argv[3] || 'src/ai/knowledge/reversi/openingBook.json';
const data = JSON.parse(readFileSync(inputFile, 'utf8'));
const map = new Map<string, Map<string, number>>();

for (const game of data.games || []) {
  const seq: string[] = [];
  for (const move of (game.moves || []).slice(0, 24)) {
    const key = positionHash({ seq }, 'reversi:');
    if (!map.has(key)) map.set(key, new Map());
    const row = map.get(key)!;
    row.set(move, (row.get(move) || 0) + 1);
    seq.push(move);
  }
}
const entries = [...map.entries()].map(([key, moves]) => ({
  key,
  gameType: 'reversi',
  board: 'standard',
  sampleCount: [...moves.values()].reduce((a, b) => a + b, 0),
  candidates: [...moves.entries()].map(([move, count]) => ({ move, count })).sort((a, b) => b.count - a.count)
}));
mkdirSync(dirname(outFile), { recursive: true });
writeFileSync(outFile, JSON.stringify({ schema: 'topoboardgame.ai.opening_book.v1', generatedAt: new Date().toISOString(), sourceManifest: '../manifest.json', entries }, null, 2));
console.log(`Built Reversi opening book with ${entries.length} positions -> ${outFile}`);

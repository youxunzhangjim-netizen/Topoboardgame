import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

const inputFile = process.argv[2] || 'local-data/knowledge/chess/pgn-games.json';
const outFile = process.argv[3] || 'src/ai/knowledge/chess/openingBook.json';
const maxPly = Number(process.argv[4] || 20);
const data = JSON.parse(readFileSync(inputFile, 'utf8'));
const map = new Map<string, Map<string, { count: number; wins: number; draws: number; ratingTotal: number; ratingCount: number }>>();

function resultScore(result = '*'): number | null {
  if (result === '1-0') return 1;
  if (result === '0-1') return 0;
  if (result === '1/2-1/2') return 0.5;
  return null;
}

for (const game of data.games || []) {
  const result = resultScore(game.tags?.Result);
  const rating = Number(game.tags?.WhiteElo || game.tags?.BlackElo || 0);
  const seq: string[] = [];
  for (const move of (game.moves || []).slice(0, maxPly)) {
    const key = `san:${seq.join(' ') || 'start'}`;
    if (!map.has(key)) map.set(key, new Map());
    const bucket = map.get(key)!;
    const row = bucket.get(move) || { count: 0, wins: 0, draws: 0, ratingTotal: 0, ratingCount: 0 };
    row.count += 1;
    if (result === 1 || result === 0) row.wins += result;
    if (result === 0.5) row.draws += 1;
    if (rating > 0) { row.ratingTotal += rating; row.ratingCount += 1; }
    bucket.set(move, row);
    seq.push(move);
  }
}

const entries = [...map.entries()].map(([key, moves]) => ({
  key,
  gameType: 'chess',
  board: 'standard',
  sampleCount: [...moves.values()].reduce((sum, row) => sum + row.count, 0),
  candidates: [...moves.entries()].map(([move, row]) => ({
    move,
    count: row.count,
    winRate: row.count ? row.wins / row.count : 0,
    drawRate: row.count ? row.draws / row.count : 0,
    averageRating: row.ratingCount ? row.ratingTotal / row.ratingCount : undefined
  })).sort((a, b) => b.count - a.count)
}));
mkdirSync(dirname(outFile), { recursive: true });
writeFileSync(outFile, JSON.stringify({ schema: 'topoboardgame.ai.opening_book.v1', generatedAt: new Date().toISOString(), sourceManifest: '../manifest.json', entries }, null, 2));
console.log(`Built chess opening book with ${entries.length} positions -> ${outFile}`);

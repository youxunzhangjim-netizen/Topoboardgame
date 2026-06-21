import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { positionHash } from '../../../src/ai/common/PositionHasher.ts';

const inputFile = process.argv[2] || 'local-data/knowledge/go/sgf-games.json';
const outDir = process.argv[3] || 'src/ai/knowledge/go';
const data = JSON.parse(readFileSync(inputFile, 'utf8'));
const fuseki = new Map<string, Map<string, number>>();
const joseki = new Map<string, Map<string, number>>();

function add(map: Map<string, Map<string, number>>, key: string, move: string) {
  if (!map.has(key)) map.set(key, new Map());
  const row = map.get(key)!;
  row.set(move, (row.get(move) || 0) + 1);
}

for (const game of data.games || []) {
  const seq: string[] = [];
  for (const move of (game.moves || []).slice(0, 60)) {
    const key = positionHash({ size: game.size, seq }, 'go:');
    add(fuseki, key, `${move.color}:${move.point}`);
    if (seq.length < 24 && /^[a-s][a-s]$/.test(move.point)) {
      const x = move.point.charCodeAt(0) - 97;
      const y = move.point.charCodeAt(1) - 97;
      const nearCorner = Math.min(x, y, game.size - 1 - x, game.size - 1 - y) <= 5;
      if (nearCorner) add(joseki, positionHash({ corner: true, size: game.size, seq: seq.slice(-8) }, 'joseki:'), `${move.color}:${move.point}`);
    }
    seq.push(`${move.color}:${move.point}`);
  }
}

function book(map: Map<string, Map<string, number>>) {
  return [...map.entries()].map(([key, moves]) => ({
    key,
    gameType: 'go',
    board: 'standard',
    sampleCount: [...moves.values()].reduce((a, b) => a + b, 0),
    candidates: [...moves.entries()].map(([move, count]) => ({ move, count })).sort((a, b) => b.count - a.count)
  }));
}
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, 'fusekiBook.json'), JSON.stringify({ schema: 'topoboardgame.ai.opening_book.v1', generatedAt: new Date().toISOString(), sourceManifest: '../manifest.json', entries: book(fuseki) }, null, 2));
writeFileSync(join(outDir, 'josekiBook.json'), JSON.stringify({ schema: 'topoboardgame.ai.opening_book.v1', generatedAt: new Date().toISOString(), sourceManifest: '../manifest.json', entries: book(joseki) }, null, 2));
console.log(`Built Go fuseki ${fuseki.size} and joseki ${joseki.size} entries.`);


import { readdirSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';

const inputDir = process.argv[2] || 'data/go/sgf';
const outFile = process.argv[3] || 'local-data/knowledge/go/sgf-games.json';
const games = [];

function parseMoves(text: string) {
  return [...text.matchAll(/;([BW])\[([a-z]{0,2})\]/g)].map((m) => ({ color: m[1] === 'B' ? 'black' : 'white', point: m[2] || 'pass' }));
}

for (const file of readdirSync(inputDir, { withFileTypes: true })) {
  if (!file.isFile() || !file.name.toLowerCase().endsWith('.sgf')) continue;
  const text = readFileSync(join(inputDir, file.name), 'utf8');
  const result = text.match(/RE\[([^\]]+)\]/)?.[1] || '';
  const size = Number(text.match(/SZ\[(\d+)\]/)?.[1] || 19);
  const moves = parseMoves(text);
  if (moves.length) games.push({ sourceFile: file.name, size, result, moves });
}
mkdirSync(dirname(outFile), { recursive: true });
writeFileSync(outFile, JSON.stringify({ schema: 'topoboardgame.ai.go_sgf_ingest.v1', createdAt: new Date().toISOString(), games }, null, 2));
console.log(`Ingested ${games.length} SGF games -> ${outFile}`);

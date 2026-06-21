import { readdirSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';

const inputDir = process.argv[2] || 'data/chess/pgn';
const outFile = process.argv[3] || 'local-data/knowledge/chess/pgn-games.json';

function parseTags(text: string): Record<string, string> {
  const tags: Record<string, string> = {};
  for (const match of text.matchAll(/\[([A-Za-z0-9_]+)\s+"([^"]*)"\]/g)) tags[match[1]] = match[2];
  return tags;
}

function cleanMoves(text: string): string[] {
  return text
    .replace(/\[[^\]]+\]/g, ' ')
    .replace(/\{[^}]*\}/g, ' ')
    .replace(/\([^)]*\)/g, ' ')
    .replace(/\d+\.(\.\.)?/g, ' ')
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token && !['1-0', '0-1', '1/2-1/2', '*'].includes(token));
}

const games = [];
for (const file of readdirSync(inputDir, { withFileTypes: true })) {
  if (!file.isFile() || !file.name.toLowerCase().endsWith('.pgn')) continue;
  const text = readFileSync(join(inputDir, file.name), 'utf8');
  for (const chunk of text.split(/\n\s*\n(?=\[Event\s+")/g)) {
    const tags = parseTags(chunk);
    const moves = cleanMoves(chunk);
    if (moves.length) games.push({ sourceFile: file.name, tags, moves });
  }
}
mkdirSync(dirname(outFile), { recursive: true });
writeFileSync(outFile, JSON.stringify({ schema: 'topoboardgame.ai.chess_pgn_ingest.v1', createdAt: new Date().toISOString(), games }, null, 2));
console.log(`Ingested ${games.length} PGN games -> ${outFile}`);

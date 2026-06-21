import { readdirSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';

const inputDir = process.argv[2] || 'data/reversi/wthor';
const outFile = process.argv[3] || 'local-data/knowledge/reversi/wthor-games.json';
const games = [];

for (const file of readdirSync(inputDir, { withFileTypes: true })) {
  if (!file.isFile() || !/\.(wtb|wthor)$/i.test(file.name)) continue;
  const buffer = readFileSync(join(inputDir, file.name));
  for (let offset = 16; offset + 68 <= buffer.length; offset += 68) {
    const moves = [...buffer.subarray(offset + 8, offset + 68)].filter(Boolean).map((v) => {
      const x = Math.max(0, (v % 10) - 1);
      const y = Math.max(0, Math.floor(v / 10) - 1);
      return `${String.fromCharCode(97 + x)}${y + 1}`;
    });
    if (moves.length) games.push({ sourceFile: file.name, moves });
  }
}
mkdirSync(dirname(outFile), { recursive: true });
writeFileSync(outFile, JSON.stringify({ schema: 'topoboardgame.ai.reversi_wthor_ingest.v1', createdAt: new Date().toISOString(), games }, null, 2));
console.log(`Ingested ${games.length} WTHOR-style games -> ${outFile}`);

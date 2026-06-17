#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { parseArgs, stringArg } from './lib/cli.mjs';
import { readJsonl, ensureDirFor } from './lib/jsonl.mjs';

const args = parseArgs();
const input = stringArg(args, 'in', stringArg(args, 'input', ''));
const outJson = stringArg(args, 'out', 'local-data/summaries/summary.json');
const outCsv = stringArg(args, 'csv', outJson.replace(/\.json$/i, '.csv'));
if (!input) {
  console.error('Usage: npm run research:aggregate -- --in local-data/selfplay/file.jsonl --out local-data/summaries/file-summary.json');
  process.exit(2);
}

const stats = {
  source: path.resolve(input),
  records: 0,
  games: 0,
  moves: 0,
  winners: {},
  byGame: {},
  byMode: {},
  plies: { count: 0, sum: 0, min: Infinity, max: 0 },
  moveScores: { count: 0, sum: 0, min: Infinity, max: -Infinity },
  legalCounts: { count: 0, sum: 0, min: Infinity, max: 0 }
};

for await (const rec of readJsonl(input)) {
  stats.records += 1;
  const game = rec.game || 'unknown';
  const mode = modeKey(rec);
  touch(stats.byGame, game);
  touch(stats.byMode, mode);
  if (rec.type === 'move') {
    stats.moves += 1;
    stats.byGame[game].moves += 1;
    stats.byMode[mode].moves += 1;
    addNestedMove(stats.byGame[game], rec);
    addNestedMove(stats.byMode[mode], rec);
    addNumber(stats.moveScores, rec.score);
    addNumber(stats.legalCounts, rec.legalCount);
  } else if (rec.type === 'game') {
    stats.games += 1;
    stats.byGame[game].games += 1;
    stats.byMode[mode].games += 1;
    const winner = rec.winner || 'unknown';
    stats.winners[winner] = (stats.winners[winner] || 0) + 1;
    stats.byGame[game].winners[winner] = (stats.byGame[game].winners[winner] || 0) + 1;
    stats.byMode[mode].winners[winner] = (stats.byMode[mode].winners[winner] || 0) + 1;
    addNumber(stats.plies, rec.plies);
  }
}

finalize(stats.plies);
finalize(stats.moveScores);
finalize(stats.legalCounts);
for (const item of Object.values(stats.byGame)) finalizeNested(item);
for (const item of Object.values(stats.byMode)) finalizeNested(item);

ensureDirFor(outJson);
fs.writeFileSync(outJson, `${JSON.stringify(stats, null, 2)}\n`);
ensureDirFor(outCsv);
fs.writeFileSync(outCsv, makeCsv(stats));
console.log(JSON.stringify({ ok: true, input: path.resolve(input), outJson: path.resolve(outJson), outCsv: path.resolve(outCsv), games: stats.games, moves: stats.moves }, null, 2));

function touch(root, key) {
  root[key] ||= { games: 0, moves: 0, winners: {}, scoreSum: 0, scoreCount: 0, legalSum: 0, legalCount: 0 };
}
function addNumber(slot, value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return;
  slot.count += 1;
  slot.sum += n;
  slot.min = Math.min(slot.min, n);
  slot.max = Math.max(slot.max, n);
}
function finalize(slot) {
  slot.mean = slot.count ? Number((slot.sum / slot.count).toFixed(4)) : null;
  if (slot.min === Infinity) slot.min = null;
  if (slot.max === -Infinity) slot.max = null;
}

function addNestedMove(item, rec) {
  const score = Number(rec.score);
  if (Number.isFinite(score)) { item.scoreSum += score; item.scoreCount += 1; }
  const legal = Number(rec.legalCount);
  if (Number.isFinite(legal)) { item.legalSum += legal; item.legalCount += 1; }
}

function finalizeNested(item) {
  item.avgScore = item.scoreCount ? item.scoreSum / item.scoreCount : null;
  item.avgLegalCount = item.legalCount ? item.legalSum / item.legalCount : null;
}
function modeKey(rec) {
  const opt = rec.options || {};
  return [rec.game || 'unknown', opt.boundary || opt.topology || 'default', opt.lattice || 'none', opt.dimension || ''].join('/');
}
function makeCsv(stats) {
  const rows = [['kind', 'key', 'games', 'moves', 'winners']];
  for (const [key, value] of Object.entries(stats.byGame)) rows.push(['game', key, value.games, value.moves, JSON.stringify(value.winners)]);
  for (const [key, value] of Object.entries(stats.byMode)) rows.push(['mode', key, value.games, value.moves, JSON.stringify(value.winners)]);
  return rows.map((row) => row.map(csvCell).join(',')).join('\n') + '\n';
}
function csvCell(value) {
  const text = String(value ?? '');
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

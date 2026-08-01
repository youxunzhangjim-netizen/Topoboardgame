#!/usr/bin/env node
import { spawn } from 'node:child_process';
import readline from 'node:readline';
import { existsSync } from 'node:fs';
import { dirname } from 'node:path';
import { parseArgs, numberArg, stringArg } from '../lib/cli.mjs';

const args = parseArgs();
const enginePath = stringArg(args, 'engine', process.env.EDAX_PATH || process.env.EDAX || 'edax');
const depth = numberArg(args, 'depth', Number(process.env.EDAX_DEPTH) || 6, { min: 1, max: 30 });
const extraArgs = parseExtraArgs(stringArg(args, 'engineArgs', process.env.EDAX_ARGS || '-gtp'));

if (!enginePath || (!existsSync(enginePath) && enginePath.includes('\\'))) {
  throw new Error(`Edax executable not found: ${enginePath}`);
}

const engine = spawn(enginePath, extraArgs, {
  cwd: existsSync(enginePath) ? dirname(enginePath) : process.cwd(),
  stdio: ['pipe', 'pipe', 'inherit']
});
engine.stdin.setDefaultEncoding('utf8');

let buffer = '';
let waiters = [];
let commandId = 1;
const reversiPosition = {
  initialized: false,
  historyKeys: []
};
engine.stdout.setEncoding('utf8');
engine.stdout.on('data', (chunk) => {
  buffer += chunk;
  flushResponses();
});

engine.on('exit', (code) => {
  for (const waiter of waiters) waiter.reject(new Error(`Edax exited with code ${code}`));
  waiters = [];
  process.exitCode = code || 1;
});

await gtp('protocol_version', { timeoutMs: 10000 }).catch(() => null);

let queue = Promise.resolve();
const input = readline.createInterface({ input: process.stdin, crlfDelay: Infinity });
input.on('line', (line) => {
  const text = line.trim();
  if (!text) return;
  queue = queue.then(() => handleRequest(text)).catch((error) => {
    process.stderr.write(`[edax-gtp-jsonl-wrapper] ${error?.stack || error}\n`);
  });
});

process.on('SIGTERM', closeEngine);
process.on('SIGINT', closeEngine);

async function handleRequest(line) {
  let msg;
  try { msg = JSON.parse(line); }
  catch { return; }
  if (msg.type !== 'move') return;

  const legalMoves = Array.isArray(msg.legalMoves) ? msg.legalMoves : [];
  const size = Number(msg.state?.size || msg.options?.size || 8);
  const topology = String(msg.options?.topology || msg.options?.boundary || msg.state?.topology || '').toLowerCase();
  const lattice = String(msg.options?.lattice || msg.state?.lattice || 'square').toLowerCase();
  const supported = msg.game === '2dreversi'
    && legalMoves.length
    && size === 8
    && ['open2d', 'open', 'standard', ''].includes(topology)
    && lattice === 'square';

  if (!supported) {
    write({
      requestId: msg.requestId,
      moveId: legalMoves[0]?.id || null,
      score: 0,
      nodes: legalMoves.length,
      warning: 'edax-wrapper-only-supports-standard-8x8-reversi'
    });
    return;
  }

  await setupReversiPosition(msg);
  await gtp(`level ${depth}`).catch(() => null);
  const color = String(msg.player || msg.state?.player || 'black').toLowerCase() === 'white' ? 'white' : 'black';
  const best = await gtp(`genmove ${color}`, { timeoutMs: 30000 });
  const moveId = matchReversiMoveId(best, legalMoves);
  write({
    requestId: msg.requestId,
    moveId: moveId || legalMoves[0]?.id || null,
    score: 0,
    nodes: legalMoves.length,
    info: { engine: enginePath, depth, gtpMove: best }
  });
}

async function setupReversiPosition(msg) {
  await gtp('boardsize 8');
  await gtp('clear_board');
  await gtp('set_game Othello').catch(() => null);
  const history = normalizeReversiHistory(msg);
  for (const event of history) {
    if (event?.type !== 'move' || !Array.isArray(event.coord)) continue;
    await gtp(`play ${event.color || 'black'} ${coordToGtp(event.coord)}`).catch(() => null);
  }
}

function normalizeReversiHistory(msg) {
  return Array.isArray(msg.state?.moveHistory) ? [...msg.state.moveHistory].reverse() : [];
}

function reversiEventKey(event) {
  if (!event || typeof event !== 'object') return 'null';
  if (event.type === 'move') return `move:${event.color || ''}:${Array.isArray(event.coord) ? event.coord.join(',') : ''}:${event.number ?? ''}`;
  return `${event.type || 'event'}:${event.number ?? ''}`;
}

function matchReversiMoveId(gtpMove, legalMoves) {
  const text = String(gtpMove || '').trim().toLowerCase();
  if (text === 'pass') return null;
  const coord = gtpToCoord(text);
  if (!coord) return null;
  const id = coord.join(',');
  return legalMoves.find((move) => move.id === id || Array.isArray(move.coord) && move.coord.join(',') === id)?.id || null;
}

function coordToGtp(coord) {
  const x = Number(coord[0]);
  const y = Number(coord[1]);
  const letters = 'ABCDEFGH';
  return `${letters[x] || 'A'}${y + 1}`;
}

function gtpToCoord(text) {
  const match = String(text || '').trim().toUpperCase().match(/^([A-H])([1-8])$/);
  if (!match) return null;
  const x = 'ABCDEFGH'.indexOf(match[1]);
  const y = Number(match[2]) - 1;
  if (x < 0 || y < 0 || y >= 8) return null;
  return [x, y];
}

function gtp(command, { timeoutMs = 10000 } = {}) {
  const id = commandId++;
  engine.stdin.write(`${id} ${command}\n`);
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      waiters = waiters.filter((waiter) => waiter.id !== id);
      reject(new Error(`Timed out waiting for Edax GTP response to: ${command}`));
    }, timeoutMs);
    waiters.push({ id, command, resolve: (value) => { clearTimeout(timer); resolve(value); }, reject: (error) => { clearTimeout(timer); reject(error); } });
    flushResponses();
  });
}

function flushResponses() {
  let boundary;
  while ((boundary = buffer.search(/\r?\n\r?\n/)) >= 0) {
    const raw = buffer.slice(0, boundary).trim();
    buffer = buffer.slice(boundary + (buffer[boundary] === '\r' ? 4 : 2));
    const match = raw.match(/^([=?])\s*(\d+)?\s*([\s\S]*)$/);
    if (!match) continue;
    const ok = match[1] === '=';
    const id = Number(match[2]);
    const payload = String(match[3] || '').trim();
    const waiterIndex = Number.isFinite(id)
      ? waiters.findIndex((waiter) => waiter.id === id)
      : 0;
    if (waiterIndex < 0) continue;
    const [waiter] = waiters.splice(waiterIndex, 1);
    if (ok) waiter.resolve(payload);
    else waiter.reject(new Error(payload || `GTP command failed: ${waiter.command}`));
  }
}

function parseExtraArgs(text) {
  return String(text || '')
    .split(/\s+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function write(obj) {
  process.stdout.write(`${JSON.stringify(obj)}\n`);
}

function closeEngine() {
  try { engine.stdin.write('quit\n'); } catch {}
  try { engine.kill(); } catch {}
}

#!/usr/bin/env node
import { spawn } from 'node:child_process';
import readline from 'node:readline';
import { parseArgs, numberArg, stringArg } from '../lib/cli.mjs';

const args = parseArgs();
const enginePath = stringArg(args, 'engine', process.env.STOCKFISH || 'stockfish');
const depth = numberArg(args, 'depth', 10, { min: 1, max: 40 });
const movetime = numberArg(args, 'movetime', 0, { min: 0, max: 600000 });

const engine = spawn(enginePath, [], { stdio: ['pipe', 'pipe', 'inherit'] });
engine.stdin.setDefaultEncoding('utf8');

let engineBuffer = [];
let waiters = [];
engine.stdout.setEncoding('utf8');
engine.stdout.on('data', (chunk) => {
  for (const line of chunk.split(/\r?\n/).map((entry) => entry.trim()).filter(Boolean)) {
    engineBuffer.push(line);
    waiters = waiters.filter((waiter) => {
      if (!waiter.test(line)) return true;
      waiter.resolve(line);
      return false;
    });
  }
});

engine.on('exit', (code) => {
  for (const waiter of waiters) waiter.reject(new Error(`Stockfish exited with code ${code}`));
  waiters = [];
  process.exitCode = code || 1;
});

await initEngine();

let queue = Promise.resolve();
const input = readline.createInterface({ input: process.stdin, crlfDelay: Infinity });
input.on('line', (line) => {
  const text = line.trim();
  if (!text) return;
  queue = queue.then(() => handleRequest(text)).catch((error) => {
    process.stderr.write(`[stockfish-jsonl-wrapper] ${error?.stack || error}\n`);
  });
});

process.on('SIGTERM', closeEngine);
process.on('SIGINT', closeEngine);

async function initEngine() {
  command('uci');
  await waitFor((line) => line === 'uciok', 5000);
  command('isready');
  await waitFor((line) => line === 'readyok', 5000);
}

async function handleRequest(line) {
  let msg;
  try { msg = JSON.parse(line); }
  catch { return; }
  if (msg.type !== 'move') return;

  const legalMoves = Array.isArray(msg.legalMoves) ? msg.legalMoves : [];
  if (msg.game !== '2dchess' || !legalMoves.length) {
    write({ requestId: msg.requestId, moveId: legalMoves[0]?.id || null, score: 0, nodes: 0, warning: 'unsupported-game-or-no-legal-moves' });
    return;
  }

  const boundary = String(msg.options?.boundary || msg.options?.topology || msg.state?.boundary || '').toLowerCase();
  if (!['', 'forbidden', 'standard'].includes(boundary)) {
    write({ requestId: msg.requestId, moveId: legalMoves[0]?.id || null, score: 0, nodes: legalMoves.length, warning: 'stockfish-only-normal-2d-chess' });
    return;
  }

  const fen = fenFromState(msg.state, msg.player);
  const legalByUci = new Map(legalMoves.map((move) => [uciFromMove(move), move]).filter(([uci]) => uci));
  command('ucinewgame');
  command(`position fen ${fen}`);
  command(movetime > 0 ? `go movetime ${movetime}` : `go depth ${depth}`);
  const bestLine = await waitFor((entry) => entry.startsWith('bestmove '), Math.max(5000, movetime + 2000));
  const bestUci = bestLine.split(/\s+/)[1] || '';
  const selected = legalByUci.get(bestUci) || legalByUci.get(bestUci.slice(0, 4)) || legalMoves[0];
  write({
    requestId: msg.requestId,
    moveId: selected.id,
    score: 0,
    nodes: legalMoves.length,
    info: { engine: enginePath, depth, movetime, bestUci, fen }
  });
}

function fenFromState(state = {}, player = 'white') {
  const board = Array.isArray(state.board) ? state.board : [];
  const rows = [];
  for (let r = 0; r < 8; r += 1) {
    let row = '';
    let empty = 0;
    for (let c = 0; c < 8; c += 1) {
      const piece = fenPiece(board[r]?.[c]);
      if (!piece) {
        empty += 1;
        continue;
      }
      if (empty) {
        row += String(empty);
        empty = 0;
      }
      row += piece;
    }
    if (empty) row += String(empty);
    rows.push(row || '8');
  }
  const active = String(state.player || player).toLowerCase() === 'black' ? 'b' : 'w';
  return `${rows.join('/')} ${active} - - 0 1`;
}

function fenPiece(token) {
  const text = String(token || '.');
  if (text === '.') return '';
  const color = text[0];
  const type = text[1];
  const map = { P: 'p', N: 'n', B: 'b', R: 'r', Q: 'q', K: 'k' };
  const piece = map[type] || '';
  return color === 'w' ? piece.toUpperCase() : piece;
}

function uciFromMove(move = {}) {
  const from = coordToSquare(move.from);
  const to = coordToSquare(move.to);
  if (!from || !to) return '';
  const promotion = move.promotion ? String(move.promotion).toLowerCase()[0] : '';
  return `${from}${to}${promotion}`;
}

function coordToSquare(coord = {}) {
  const r = Number(coord.r);
  const c = Number(coord.c);
  if (!Number.isInteger(r) || !Number.isInteger(c) || r < 0 || r > 7 || c < 0 || c > 7) return '';
  return `${'abcdefgh'[c]}${8 - r}`;
}

function command(text) {
  engine.stdin.write(`${text}\n`);
}

function waitFor(test, timeoutMs) {
  const existingIndex = engineBuffer.findIndex(test);
  if (existingIndex >= 0) {
    const [line] = engineBuffer.splice(existingIndex, 1);
    return Promise.resolve(line);
  }
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      waiters = waiters.filter((waiter) => waiter.resolve !== resolve);
      reject(new Error(`Timed out waiting for Stockfish response after ${timeoutMs} ms`));
    }, timeoutMs);
    waiters.push({
      test,
      resolve: (line) => {
        clearTimeout(timer);
        resolve(line);
      },
      reject: (error) => {
        clearTimeout(timer);
        reject(error);
      }
    });
  });
}

function write(obj) {
  process.stdout.write(`${JSON.stringify(obj)}\n`);
}

function closeEngine() {
  try { command('quit'); } catch {}
  try { engine.kill(); } catch {}
}

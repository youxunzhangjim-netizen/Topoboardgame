#!/usr/bin/env node
import { spawn } from 'node:child_process';
import readline from 'node:readline';
import { existsSync } from 'node:fs';
import { boolArg, parseArgs, numberArg, stringArg } from '../lib/cli.mjs';

const args = parseArgs();
const enginePath = stringArg(args, 'engine', process.env.KATAGO_PATH || process.env.KATAGO || 'katago');
const modelPath = stringArg(args, 'model', process.env.KATAGO_MODEL || '');
const configPath = stringArg(args, 'config', process.env.KATAGO_CONFIG || '');
const visits = numberArg(args, 'visits', Number(process.env.KATAGO_VISITS) || 32, { min: 1, max: 100000 });
const timeLimit = Number(args.timeLimit || process.env.KATAGO_TIME_LIMIT || 0);
const policyOnly = boolArg(args, 'policyOnly', false);

if (!enginePath || (!existsSync(enginePath) && enginePath.includes('\\'))) {
  throw new Error(`KataGo executable not found: ${enginePath}`);
}
if (!modelPath) {
  throw new Error('KataGo wrapper requires --model or KATAGO_MODEL pointing to a .bin.gz network.');
}

const engineArgs = ['gtp', '-model', modelPath];
if (configPath) engineArgs.push('-config', configPath);
const engine = spawn(enginePath, engineArgs, { stdio: ['pipe', 'pipe', 'inherit'] });
engine.stdin.setDefaultEncoding('utf8');

let buffer = '';
let waiters = [];
let commandId = 1;
const goPosition = {
  size: null,
  komi: null,
  historyKeys: []
};
engine.stdout.setEncoding('utf8');
engine.stdout.on('data', (chunk) => {
  buffer += chunk;
  flushResponses();
});

engine.on('exit', (code) => {
  for (const waiter of waiters) waiter.reject(new Error(`KataGo exited with code ${code}`));
  waiters = [];
  process.exitCode = code || 1;
});

await gtp('protocol_version', { timeoutMs: 30000 }).catch(() => null);

let queue = Promise.resolve();
const input = readline.createInterface({ input: process.stdin, crlfDelay: Infinity });
input.on('line', (line) => {
  const text = line.trim();
  if (!text) return;
  queue = queue.then(() => handleRequest(text)).catch((error) => {
    process.stderr.write(`[katago-gtp-jsonl-wrapper] ${error?.stack || error}\n`);
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
  const size = Number(msg.state?.size || msg.options?.size || 9);
  const topology = String(msg.options?.topology || msg.options?.boundary || msg.state?.topology || '').toLowerCase();
  const lattice = String(msg.options?.lattice || msg.state?.lattice || 'square').toLowerCase();
  const supported = msg.game === '2dgo'
    && legalMoves.length
    && size >= 5
    && size <= 19
    && ['open2d', 'open', 'standard', ''].includes(topology)
    && lattice === 'square';

  if (!supported) {
    write({
      requestId: msg.requestId,
      moveId: legalMoves[0]?.id || null,
      score: 0,
      nodes: legalMoves.length,
      warning: 'katago-wrapper-only-supports-standard-2d-go-square'
    });
    return;
  }

  await setupGoPosition(msg, size);
  const color = String(msg.player || msg.state?.player || 'black').toLowerCase() === 'white' ? 'white' : 'black';
  let moveId = null;
  let gtpMove = '';
  let policyInfo = null;

  if (policyOnly) {
    const raw = await gtp(`kata-raw-nn ${color} 0`, { timeoutMs: 30000 });
    policyInfo = choosePolicyMove(raw, legalMoves, size);
    moveId = policyInfo.moveId;
    gtpMove = policyInfo.gtpMove || '';
  } else {
    await applySearchLimits();
    const best = await gtp(`genmove ${color}`, { timeoutMs: Math.max(30000, Math.ceil(timeLimit * 1000) + 5000) });
    moveId = matchGoMoveId(best, legalMoves, size);
    gtpMove = best;
  }

  write({
    requestId: msg.requestId,
    moveId: moveId || legalMoves[0]?.id || null,
    score: 0,
    nodes: policyOnly ? 1 : visits,
    info: { engine: enginePath, model: modelPath, config: configPath, visits, policyOnly, gtpMove, policyInfo }
  });
}

async function applySearchLimits() {
  if (timeLimit > 0) {
    await gtp(`kata-set-param maxTime ${Math.max(0.05, timeLimit)}`).catch(() => null);
  }
  await gtp(`kata-set-param maxVisits ${visits}`).catch(() => null);
  await gtp(`kata-set-param maxPlayouts ${visits}`).catch(() => null);
}

async function setupGoPosition(msg, size) {
  const komi = Number.isFinite(Number(msg.options?.komi)) ? Number(msg.options.komi) : 7.5;
  const history = normalizeGoHistory(msg);
  const historyKeys = history.map(goEventKey);
  const resetNeeded = goPosition.size !== size
    || goPosition.komi !== komi
    || historyKeys.length < goPosition.historyKeys.length
    || !goPosition.historyKeys.every((key, index) => historyKeys[index] === key);

  if (resetNeeded) {
    await gtp(`boardsize ${size}`);
    await gtp('clear_board');
    await gtp(`komi ${komi}`).catch(() => null);
    goPosition.size = size;
    goPosition.komi = komi;
    goPosition.historyKeys = [];
  }

  for (const event of history.slice(goPosition.historyKeys.length)) {
    if (event?.type === 'pass') {
      await gtp(`play ${event.color || 'black'} pass`).catch(() => null);
      continue;
    }
    if (event?.type !== 'play' || !Array.isArray(event.coord)) continue;
    await gtp(`play ${event.color || 'black'} ${coordToGtp(event.coord, size)}`).catch(() => null);
  }

  goPosition.historyKeys = historyKeys;
}

function normalizeGoHistory(msg) {
  return Array.isArray(msg.state?.moveHistory) ? [...msg.state.moveHistory].reverse() : [];
}

function goEventKey(event) {
  if (!event || typeof event !== 'object') return 'null';
  if (event.type === 'pass') return `pass:${event.color || ''}:${event.number ?? ''}`;
  if (event.type === 'play') return `play:${event.color || ''}:${Array.isArray(event.coord) ? event.coord.join(',') : ''}:${event.number ?? ''}`;
  return `${event.type || 'event'}:${event.number ?? ''}`;
}

function matchGoMoveId(gtpMove, legalMoves, size) {
  const text = String(gtpMove || '').trim().toLowerCase();
  if (text === 'pass' || text === 'resign') return legalMoves.find((move) => move.type === 'pass' || move.id === 'pass')?.id || null;
  const coord = gtpToCoord(text, size);
  if (!coord) return null;
  const id = coord.join(',');
  return legalMoves.find((move) => move.id === id || Array.isArray(move.coord) && move.coord.join(',') === id)?.id || null;
}

function choosePolicyMove(rawOutput, legalMoves, size) {
  const policy = parseRawPolicy(rawOutput, size);
  if (!policy.values.length) return { moveId: null, probability: 0, gtpMove: '' };

  let best = null;
  for (const move of legalMoves) {
    const id = move?.id || (Array.isArray(move?.coord) ? move.coord.join(',') : '');
    const score = move?.type === 'pass' || id === 'pass'
      ? policy.pass
      : policy.values[policyIndexForMove(move, size)] ?? -Infinity;
    if (!best || score > best.score) {
      best = { move, score };
    }
  }
  const move = best?.move || legalMoves[0] || null;
  const moveId = move?.id || (Array.isArray(move?.coord) ? move.coord.join(',') : null);
  return {
    moveId,
    probability: Number(best?.score || 0),
    gtpMove: Array.isArray(move?.coord) ? coordToGtp(move.coord, size) : 'pass'
  };
}

function parseRawPolicy(rawOutput, size) {
  const text = String(rawOutput || '');
  const match = text.match(/\bpolicy\b\s+([\s\S]*?)\bpolicyPass\b\s+([+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?)/i);
  if (!match) return { values: [], pass: -Infinity };
  const values = (match[1].match(/[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?/gi) || [])
    .slice(0, size * size)
    .map(Number)
    .filter((value) => Number.isFinite(value));
  const pass = Number(match[2]);
  return { values, pass: Number.isFinite(pass) ? pass : -Infinity };
}

function policyIndexForMove(move = {}, size) {
  const coord = Array.isArray(move.coord)
    ? move.coord
    : typeof move.id === 'string'
      ? move.id.split(',').map(Number)
      : [];
  const x = Number(coord[0]);
  const y = Number(coord[1]);
  if (!Number.isInteger(x) || !Number.isInteger(y) || x < 0 || x >= size || y < 0 || y >= size) return -1;
  return y * size + x;
}

function coordToGtp(coord, size) {
  const x = Number(coord[0]);
  const y = Number(coord[1]);
  const letters = 'ABCDEFGHJKLMNOPQRSTUVWXYZ';
  return `${letters[x] || 'A'}${size - y}`;
}

function gtpToCoord(text, size) {
  const match = String(text || '').trim().toUpperCase().match(/^([A-Z])(\d+)$/);
  if (!match) return null;
  const letters = 'ABCDEFGHJKLMNOPQRSTUVWXYZ';
  const x = letters.indexOf(match[1]);
  const y = size - Number(match[2]);
  if (x < 0 || y < 0 || y >= size) return null;
  return [x, y];
}

function gtp(command, { timeoutMs = 30000 } = {}) {
  const id = commandId++;
  engine.stdin.write(`${id} ${command}\n`);
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      waiters = waiters.filter((waiter) => waiter.id !== id);
      reject(new Error(`Timed out waiting for KataGo GTP response to: ${command}`));
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

function write(obj) {
  process.stdout.write(`${JSON.stringify(obj)}\n`);
}

function closeEngine() {
  try { engine.stdin.write('quit\n'); } catch {}
  try { engine.kill(); } catch {}
}

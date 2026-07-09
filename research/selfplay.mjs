#!/usr/bin/env node
import path from 'node:path';
import { performance } from 'node:perf_hooks';
import { parseArgs, numberArg, stringArg, boolArg } from './lib/cli.mjs';
import { ResearchRng, withSeededMathRandom } from './lib/rng.mjs';
import { JsonlWriter } from './lib/jsonl.mjs';
import { ExternalRobotProcess } from './lib/externalRobot.mjs';
import { createResearchAdapter, SUPPORTED_RESEARCH_GAMES } from './adapters.mjs';
import { chooseLinearRobotMove, loadModel } from './ml/linearModel.mjs';

const args = parseArgs();
if (args.help || args.h) {
  printHelp();
  process.exit(0);
}

const game = stringArg(args, 'game', '2dchess').toLowerCase();
const games = numberArg(args, 'games', 10, { min: 1, max: 10_000_000 });
const maxPlies = numberArg(args, 'maxPlies', defaultMaxPlies(game), { min: 1, max: 50_000 });
const depthA = numberArg(args, 'depthA', numberArg(args, 'depth', defaultDepth(game), { min: 1, max: 5 }), { min: 1, max: 5 });
const depthB = numberArg(args, 'depthB', depthA, { min: 1, max: 5 });
const depthC = numberArg(args, 'depthC', depthB, { min: 1, max: 5 });
const botA = stringArg(args, 'botA', 'builtin');
const botB = stringArg(args, 'botB', 'builtin');
const botC = stringArg(args, 'botC', botB);
const seed = stringArg(args, 'seed', `research-${Date.now()}`);
const out = stringArg(args, 'out', defaultOutput(game));
const record = stringArg(args, 'record', 'moves'); // moves | games
const includeState = boolArg(args, 'state', true);
const includeLegalMoves = boolArg(args, 'legalMoves', false);
const externalACommand = stringArg(args, 'externalA', '');
const externalBCommand = stringArg(args, 'externalB', '');
const externalCCommand = stringArg(args, 'externalC', '');
const modelAPath = stringArg(args, 'modelA', stringArg(args, 'model', ''));
const modelBPath = stringArg(args, 'modelB', modelAPath);
const modelCPath = stringArg(args, 'modelC', modelBPath);
const linearA = modelAPath && ['linear', 'linearA'].includes(botA) ? loadModel(modelAPath) : null;
const linearB = modelBPath && ['linear', 'linearB'].includes(botB) ? loadModel(modelBPath) : null;
const linearC = modelCPath && ['linear', 'linearC'].includes(botC) ? loadModel(modelCPath) : null;
const timeoutMs = numberArg(args, 'externalTimeoutMs', 5000, { min: 100, max: 120000 });
const progressEvery = numberArg(args, 'progressEvery', Math.max(1, Math.floor(games / 20)), { min: 1, max: 1_000_000 });

if (!SUPPORTED_RESEARCH_GAMES.includes(game)) {
  console.error(`Unsupported --game ${game}. Supported: ${SUPPORTED_RESEARCH_GAMES.join(', ')}`);
  process.exit(2);
}

const rng = new ResearchRng(seed);
const writer = new JsonlWriter(out);
const externalA = externalACommand ? new ExternalRobotProcess(externalACommand, { name: 'externalA' }) : null;
const externalB = externalBCommand ? new ExternalRobotProcess(externalBCommand, { name: 'externalB' }) : null;
const externalC = externalCCommand ? new ExternalRobotProcess(externalCCommand, { name: 'externalC' }) : null;
const started = performance.now();
const summary = new Map();

try {
  for (let gameIndex = 0; gameIndex < games; gameIndex += 1) {
    const gameSeed = `${seed}:game:${gameIndex}:${rng.nextUInt32()}`;
    const adapter = createResearchAdapter(game, {
      boundary: stringArg(args, 'boundary', stringArg(args, 'topology', defaultBoundary(game))),
      topology: stringArg(args, 'topology', stringArg(args, 'boundary', defaultBoundary(game))),
      lattice: stringArg(args, 'lattice', defaultLattice(game)),
      size: numberArg(args, 'size', defaultSize(game), { min: 3, max: 30 }),
      playerCount: numberArg(args, 'playerCount', defaultPlayerCount(game), { min: 2, max: 3 }),
      komi: Number(args.komi),
      seed: gameSeed
    });
    const gameRecord = await runOneGame({ adapter, gameIndex, gameSeed });
    addSummary(summary, gameRecord.winner);
    if (record === 'games') writer.write(gameRecord);
    if ((gameIndex + 1) % progressEvery === 0 || gameIndex + 1 === games) {
      const elapsed = ((performance.now() - started) / 1000).toFixed(1);
      console.error(`[selfplay] ${gameIndex + 1}/${games} games, ${writer.count} records, ${elapsed}s`);
    }
  }
} finally {
  externalA?.close();
  externalB?.close();
  externalC?.close();
  await writer.close();
}

const elapsedSec = (performance.now() - started) / 1000;
const counts = Object.fromEntries(summary.entries());
console.log(JSON.stringify({ ok: true, game, games, records: writer.count, out: path.resolve(out), elapsedSec: Number(elapsedSec.toFixed(3)), winners: counts }, null, 2));

async function runOneGame({ adapter, gameIndex, gameSeed }) {
  const gameStarted = performance.now();
  const moves = [];
  let ply = 0;
  let lastScore = 0;
  while (!adapter.isTerminal() && ply < maxPlies) {
    const player = adapter.currentPlayer();
    const side = sideIndex(player);
    const depth = side === 0 ? depthA : side === 2 ? depthC : depthB;
    const botKind = side === 0 ? botA : side === 2 ? botC : botB;
    const legalMoves = adapter.legalMoves();
    if (!legalMoves.length) break;
    const before = includeState ? adapter.serializeState() : null;
    const chosen = await chooseMove(adapter, { botKind, player, depth, legalMoves, gameIndex, ply, gameSeed });
    const apply = adapter.applyMove(chosen.move || chosen.moveId || chosen);
    if (!apply.ok) {
      const fallback = legalMoves[0];
      const fallbackApply = adapter.applyMove(fallback);
      if (!fallbackApply.ok) throw new Error(`No legal fallback move at game ${gameIndex}, ply ${ply}`);
      chosen.move = fallback;
      chosen.warning = `bot returned illegal move; fallback used (${apply.error})`;
    }
    lastScore = Number(chosen.score || adapter.evaluate(player) || 0);
    const recordLine = {
      type: 'move',
      schema: 'topoboardgame.selfplay.v1',
      game,
      gameIndex,
      seed: gameSeed,
      ply,
      player,
      bot: botKind,
      depth,
      options: adapter.options,
      legalCount: legalMoves.length,
      legalMoves: includeLegalMoves ? legalMoves.map(serializeMove) : undefined,
      chosenMove: serializeMove(chosen.move || chosen),
      score: lastScore,
      nodes: chosen.nodes || chosen.searched || chosen.simulations || 0,
      warning: chosen.warning || undefined,
      state: before
    };
    moves.push(recordLine);
    if (record === 'moves') writer.write(recordLine);
    ply += 1;
  }
  const winner = adapter.winner() || winnerFromScore(lastScore);
  const result = {
    type: 'game',
    schema: 'topoboardgame.selfplay.v1',
    game,
    gameIndex,
    seed: gameSeed,
    options: adapter.options,
    winner,
    plies: ply,
    maxPliesReached: ply >= maxPlies,
    finalScore: lastScore,
    durationMs: Number((performance.now() - gameStarted).toFixed(1)),
    finalState: includeState ? adapter.serializeState() : null
  };
  if (record === 'moves') writer.write(result);
  return result;
}

async function chooseMove(adapter, context) {
  const { botKind, player, depth, legalMoves, gameIndex, ply, gameSeed } = context;
  if (botKind === 'random') {
    const move = rng.pick(legalMoves);
    return { move, score: 0, nodes: 0 };
  }
  if (botKind === 'linear' || botKind === 'linearA' || botKind === 'linearB' || botKind === 'linearC') {
    const side = sideIndex(player);
    const model = side === 0 ? linearA : side === 2 ? linearC : linearB;
    if (!model) throw new Error(`Bot ${botKind} requires --model/--modelA/--modelB/--modelC.`);
    const result = chooseLinearRobotMove(model, {
      game,
      options: adapter.options,
      player,
      state: adapter.serializeState(),
      legalMoves: legalMoves.map(serializeMove)
    });
    const move = legalMoves.find((candidate) => serializeMove(candidate).id === result.moveId || candidate.id === result.moveId) || legalMoves[0];
    return { move, score: result.score, nodes: legalMoves.length, modelProbability: result.probability };
  }
  if (botKind === 'externalA' && externalA || botKind === 'externalB' && externalB || botKind === 'externalC' && externalC) {
    const proc = botKind === 'externalA' ? externalA : botKind === 'externalC' ? externalC : externalB;
    const response = await proc.requestMove({
      game,
      player,
      gameIndex,
      ply,
      depth,
      options: adapter.options,
      legalMoves: legalMoves.map(serializeMove),
      state: adapter.serializeState()
    }, timeoutMs);
    const moveId = response.moveId || response.id || response.move?.id;
    const move = legalMoves.find((candidate) => candidate.id === moveId || serializeMove(candidate).id === moveId) || response.move;
    return { move, moveId, score: Number(response.score) || 0, nodes: Number(response.nodes) || 0 };
  }
  return withSeededMathRandom(`${gameSeed}:${ply}:${player}`, async () => {
    const result = await adapter.chooseBuiltin(depth);
    return { ...result, move: result.move || result.best?.move || null };
  });
}

function serializeMove(move) {
  if (!move) return null;
  if (typeof move === 'string') return { id: move, label: move };
  if (move.id || move.label) return { ...move, flips: Array.isArray(move.flips) ? move.flips.length : move.flips };
  if (move.coord) return { id: move.coord.join(','), coord: move.coord, label: `(${move.coord.join(',')})`, type: move.type || 'play' };
  if (move.from && move.to) return { id: move.id || `${JSON.stringify(move.from)}>${JSON.stringify(move.to)}`, from: move.from, to: move.to, label: move.label };
  return move;
}

function sideIndex(player) {
  const value = String(player || '').toLowerCase();
  if (value === 'white' || value === 'a') return 0;
  if (value === 'c') return 2;
  return 1;
}

function winnerFromScore(score) {
  if (score > 0) return 'sideA';
  if (score < 0) return 'sideB';
  return 'draw';
}

function addSummary(map, winner) {
  map.set(winner || 'unknown', (map.get(winner || 'unknown') || 0) + 1);
}

function defaultMaxPlies(game) {
  if (game.includes('go')) return 220;
  if (game.includes('reversi')) return 500;
  if (game.includes('hex')) return game.startsWith('4d') ? 900 : game.startsWith('3d') ? 600 : 260;
  if (game.includes('jump')) return game.startsWith('4d') ? 500 : 360;
  return 240;
}
function defaultDepth(game) {
  if (game.includes('go')) return 1;
  if (game.includes('hex')) return 3;
  return 2;
}
function defaultSize(game) {
  if (game === '2dgo') return 9;
  if (game === '3dgo') return 5;
  if (game === '3dreversi') return 6;
  if (game === '3dchess') return 8;
  if (game === '2djump') return 12;
  if (game === '3djump') return 6;
  if (game === '4djump') return 4;
  if (game === '2dhex') return 9;
  if (game === '3dhex') return 5;
  if (game === '4dhex') return 4;
  return 8;
}
function defaultBoundary(game) {
  if (game === '2dchess') return 'forbidden';
  if (game === '3dchess') return 'r3';
  if (game === '2djump') return 'diamond';
  if (game === '3djump') return 'cube';
  if (game === '4djump') return 'hypercube';
  if (game === '2dgo' || game === '2dreversi') return 'open2d';
  if (game === '3dgo' || game === '3dreversi') return 'r3';
  if (game === '2dhex') return 'open';
  if (game === '3dhex') return 'r3';
  if (game === '4dhex') return 'open';
  return 'open2d';
}
function defaultLattice(game) {
  if (game === '3dgo') return 'sc';
  if (game === '3dchess') return 'chess3d';
  if (game === '2dhex') return 'hexagonal';
  if (game === '3dhex' || game === '4dhex') return 'axis';
  return 'square';
}
function defaultPlayerCount(game) { return game === '2djump' ? 2 : 2; }
function defaultOutput(game) {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  return `local-data/selfplay/${game}-${stamp}.jsonl`;
}
function printHelp() {
  console.log(`Topoboardgame research self-play runner

Usage:
  npm run research:selfplay -- --game 2dchess --boundary random --games 1000 --out local-data/selfplay/chess-rbc.jsonl

Supported games:
  ${SUPPORTED_RESEARCH_GAMES.join(', ')}

Common options:
  --game GAME              2dchess | 3dchess | 2dgo | 2dreversi | 3dgo | 3dreversi | 2djump | 3djump | 4djump | 2dhex | 3dhex | 4dhex
  --boundary MODE          boundary/topology mode
  --lattice LATTICE        square/honeycomb/triangular/sc/bcc/fcc/hcp/hexagonal/axis where supported
  --size N                 board size
  --games N                number of games
  --maxPlies N             maximum plies per game
  --depthA N --depthB N    robot strengths
  --botA builtin|random|externalA|linear
  --botB builtin|random|externalB|linear
  --externalA "cmd ..."    persistent JSONL robot process
  --externalB "cmd ..."
  --record moves|games     moves writes one line per move plus game footer; games writes one line per game
  --state true|false       include compact state snapshots
  --seed TEXT              reproducible seed
  --out FILE.jsonl         JSONL output
`);
}

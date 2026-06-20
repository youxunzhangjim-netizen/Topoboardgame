import readline from 'node:readline';
import { JumpGameState, activePlayers, coordKey } from '../../js/shared/JumpRules.js';
import { parseArgs, numberArg } from '../lib/cli.mjs';

export function runJsonlJumpRobot(handler) {
  const rl = readline.createInterface({ input: process.stdin, crlfDelay: Infinity });
  rl.on('line', async (line) => {
    if (!line.trim()) return;
    let request;
    try { request = JSON.parse(line); }
    catch { return; }
    try {
      const response = await handler(request);
      process.stdout.write(JSON.stringify({ requestId: request.requestId, ...response }) + '\n');
    } catch (error) {
      const fallback = request.legalMoves?.[0] || null;
      process.stdout.write(JSON.stringify({
        requestId: request.requestId,
        moveId: fallback?.id || null,
        score: -999999,
        nodes: 0,
        error: String(error?.message || error)
      }) + '\n');
    }
  });
}

export function jumpBotOptions() {
  const args = parseArgs();
  return {
    depth: numberArg(args, 'depth', 2, { min: 1, max: 5 }),
    beam: numberArg(args, 'beam', 16, { min: 1, max: 256 }),
    rollouts: numberArg(args, 'rollouts', 96, { min: 1, max: 5000 })
  };
}

export function gameFromRequest(request = {}) {
  const state = request.state || {};
  const options = request.options || {};
  const game = new JumpGameState({
    dimension: state.dimension || options.dimension || 2,
    size: state.size || options.size || 12,
    topology: state.topology || options.topology || 'diamond',
    lattice: state.lattice || options.lattice || 'triangular',
    playerCount: state.playerCount || options.playerCount || 2,
    targetAxis: state.targetAxis || options.targetAxis || 'x',
    labMode: state.labMode || options.labMode || '',
    labTargetMode: state.labTargetMode || options.labTargetMode || 'opponentHome'
  });
  if (state && Array.isArray(state.pieces)) game.import(state);
  if (request.player) game.currentPlayer = request.player;
  return game;
}

export function cloneJumpGame(game) {
  const next = new JumpGameState(game.serialize());
  next.import(game.serialize());
  return next;
}

export function applyResearchJumpMove(game, move) {
  const legal = game.allLegalMoves(game.currentPlayer);
  const chosen = legal.find((candidate) => sameMove(candidate, move)) || legal[0] || null;
  if (!chosen) return { ok: false, move: null };
  const result = game.applyMove(chosen);
  if (result?.continueJump) game.endTurn();
  return { ok: Boolean(result?.ok), move: chosen, result };
}

export function matchLegalMove(game, requestMove) {
  return game.allLegalMoves(game.currentPlayer).find((candidate) => sameMove(candidate, requestMove)) || null;
}

export function legalMovesSorted(game, beam = 64) {
  const player = game.currentPlayer;
  return game.allLegalMoves(player)
    .map((move) => ({ move, score: evaluateJumpMove(game, move, player) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, beam)
    .map((entry) => entry.move);
}

export function sameMove(a, b) {
  if (!a || !b) return false;
  if (a.id && b.id && a.id === b.id) return true;
  return String(a.type || '') === String(b.type || '')
    && coordKey(a.from || []) === coordKey(b.from || [])
    && coordKey(a.to || []) === coordKey(b.to || []);
}

export function moveId(move) {
  return move?.id || coordKey(move?.from || []) + '>' + coordKey(move?.to || []) + ':' + (move?.type || 'move');
}

export function evaluateJumpPosition(game, player = game.currentPlayer) {
  const players = activePlayers(game.playerCount);
  const own = playerScoreTerms(game, player);
  const others = players.filter((p) => p !== player).map((p) => playerScoreTerms(game, p));
  const opponent = others.reduce((sum, entry) => sum + entry.total, 0) / Math.max(1, others.length);
  return own.total - opponent * 0.82;
}

export function evaluateMaxN(game, player = game.currentPlayer) {
  const scores = {};
  for (const p of activePlayers(game.playerCount)) scores[p] = playerScoreTerms(game, p).total;
  return scores[player] - Object.entries(scores)
    .filter(([p]) => p !== player)
    .reduce((sum, [, value]) => sum + value, 0) / Math.max(1, game.playerCount - 1);
}

export function evaluateJumpMove(game, move, player = game.currentPlayer) {
  const before = playerScoreTerms(game, player);
  const next = cloneJumpGame(game);
  applyResearchJumpMove(next, move);
  const after = playerScoreTerms(next, player);
  const jumpBonus = move.type === 'jump' ? 8 : 0;
  const chainBonus = move.type === 'jump' ? continuationCount(next, player) * 1.5 : 0;
  return (after.total - before.total) + jumpBonus + chainBonus;
}

function playerScoreTerms(game, player) {
  const target = game.targetZone(player);
  const home = game.homeZone(player);
  let progress = 0;
  let targetCount = 0;
  let homeCount = 0;
  let pieces = 0;
  for (const [key, owner] of game.pieces.entries()) {
    if (owner !== player) continue;
    pieces += 1;
    if (target.has(key)) targetCount += 1;
    if (home.has(key)) homeCount += 1;
    const coord = key.split(',').map(Number);
    progress -= distanceToZone(game, coord, target);
  }
  const fill = target.size ? targetCount / target.size : 0;
  const clear = pieces ? 1 - homeCount / pieces : 0;
  return {
    targetCount,
    homeCount,
    fill,
    clear,
    total: progress * 3 + fill * 120 + clear * 42 - homeCount * 6
  };
}

function distanceToZone(game, coord, zone) {
  let best = Infinity;
  for (const key of zone || []) best = Math.min(best, latticeDistance(game, coord, key.split(',').map(Number)));
  return Number.isFinite(best) ? best : 0;
}

function latticeDistance(game, a, b) {
  if (game.lattice === 'triangular' && game.dimension === 2) {
    const dq = (a[0] || 0) - (b[0] || 0);
    const dr = (a[1] || 0) - (b[1] || 0);
    return Math.max(Math.abs(dq), Math.abs(dr), Math.abs(dq + dr));
  }
  return Math.max(...a.map((v, i) => Math.abs(v - (b[i] || 0))));
}

function continuationCount(game, player) {
  const saved = game.currentPlayer;
  game.currentPlayer = player;
  const count = game.allLegalMoves(player).filter((move) => move.type === 'jump').length;
  game.currentPlayer = saved;
  return count;
}

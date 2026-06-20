#!/usr/bin/env node
import readline from 'node:readline';
import {
  applyResearchJumpMove,
  cloneJumpGame,
  evaluateJumpPosition,
  evaluateMaxN,
  gameFromRequest,
  legalMovesSorted,
  matchLegalMove,
  moveId
} from './jump-reference-utils.mjs';

const strategyArg = argValue('strategy', 'random').toLowerCase();
const depthArg = numberArg('depth', 2, 1, 5);
const beamArg = numberArg('beam', 16, 1, 256);
const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: false });
for await (const line of rl) {
  const text = line.trim();
  if (!text) continue;
  let msg;
  try { msg = JSON.parse(text); }
  catch { continue; }
  console.log(JSON.stringify({ requestId: msg.requestId, ...chooseResponse(msg) }));
}

function chooseResponse(msg) {
  const legal = Array.isArray(msg.legalMoves) ? msg.legalMoves : [];
  if (String(msg.game || '').includes('jump') && strategyArg !== 'random') {
    const game = gameFromRequest(msg);
    const player = String(msg.player || game.currentPlayer || 'A');
    const multi = strategyArg.includes('petting') || strategyArg.includes('multi');
    const search = multi
      ? chooseMaxNMove(game, player, depthArg, beamArg)
      : chooseMinimaxMove(game, player, depthArg, beamArg);
    const matched = search.move
      ? legal.find((candidate) => moveId(search.move) === candidate.id)
        || legal.find((candidate) => matchLegalMove(game, candidate)?.id === search.move.id)
      : null;
    return {
      moveId: matched?.id || search.move?.id || legal[0]?.id || null,
      score: search.score,
      nodes: search.nodes,
      teacher: multi ? 'jump-pettingzoo-multiagent-reference' : 'jump-zedrichu-minimax-reference'
    };
  }
  const move = legal.length ? legal[Math.floor(Math.random() * legal.length)] : null;
  return { moveId: move?.id || move?.moveId || null, score: 0, nodes: legal.length };
}

function chooseMinimaxMove(game, rootPlayer, depth, beam) {
  const moves = legalMovesSorted(game, beam);
  let best = null;
  let nodes = 0;
  for (const move of moves) {
    const next = cloneJumpGame(game);
    applyResearchJumpMove(next, move);
    const result = minimax(next, rootPlayer, depth - 1, -Infinity, Infinity, beam);
    nodes += result.nodes + 1;
    if (!best || result.score > best.score) best = { move, score: result.score };
  }
  return { move: best?.move || moves[0] || null, score: best?.score || 0, nodes };
}

function minimax(game, rootPlayer, depth, alpha, beta, beam) {
  if (depth <= 0 || game.winner) return { score: evaluateJumpPosition(game, rootPlayer), nodes: 1 };
  const maximizing = game.currentPlayer === rootPlayer;
  const moves = legalMovesSorted(game, beam);
  if (!moves.length) return { score: evaluateJumpPosition(game, rootPlayer), nodes: 1 };
  let best = maximizing ? -Infinity : Infinity;
  let nodes = 1;
  for (const move of moves) {
    const next = cloneJumpGame(game);
    applyResearchJumpMove(next, move);
    const child = minimax(next, rootPlayer, depth - 1, alpha, beta, beam);
    nodes += child.nodes;
    if (maximizing) {
      best = Math.max(best, child.score);
      alpha = Math.max(alpha, best);
    } else {
      best = Math.min(best, child.score);
      beta = Math.min(beta, best);
    }
    if (beta <= alpha) break;
  }
  return { score: best, nodes };
}

function chooseMaxNMove(game, rootPlayer, depth, beam) {
  const moves = legalMovesSorted(game, beam);
  let best = null;
  let nodes = 0;
  for (const move of moves) {
    const next = cloneJumpGame(game);
    applyResearchJumpMove(next, move);
    const result = maxN(next, rootPlayer, depth - 1, beam);
    nodes += result.nodes + 1;
    if (!best || result.score > best.score) best = { move, score: result.score };
  }
  return { move: best?.move || moves[0] || null, score: best?.score || 0, nodes };
}

function maxN(game, rootPlayer, depth, beam) {
  if (depth <= 0 || game.winner) return { score: evaluateMaxN(game, rootPlayer), nodes: 1 };
  const current = game.currentPlayer;
  const moves = legalMovesSorted(game, beam);
  if (!moves.length) return { score: evaluateMaxN(game, rootPlayer), nodes: 1 };
  let best = null;
  let nodes = 1;
  for (const move of moves) {
    const next = cloneJumpGame(game);
    applyResearchJumpMove(next, move);
    const child = maxN(next, rootPlayer, depth - 1, beam);
    nodes += child.nodes;
    const currentScore = current === rootPlayer ? child.score : evaluateMaxN(next, current);
    if (!best || currentScore > best.currentScore) best = { score: child.score, currentScore };
  }
  return { score: best?.score || evaluateMaxN(game, rootPlayer), nodes };
}

function argValue(name, fallback) {
  const flag = '--' + name;
  const eq = process.argv.find((entry) => entry.startsWith(flag + '='));
  if (eq) return eq.slice(flag.length + 1);
  const index = process.argv.indexOf(flag);
  return index >= 0 && process.argv[index + 1] ? process.argv[index + 1] : fallback;
}

function numberArg(name, fallback, min, max) {
  const value = Number(argValue(name, fallback));
  return Math.max(min, Math.min(max, Number.isFinite(value) ? Math.floor(value) : fallback));
}

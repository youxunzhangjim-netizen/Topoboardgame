import { BoardSetup } from '../2D/2dchess/js/BoardSetup.js';
import { createRandomChessBoundaryState } from '../2D/2dchess/js/PieceMovement.js';
import {
  applyMoveToState,
  getAllLegalMoves,
  normalizeState,
  opponentOf
} from '../2D/2dchess/js/robot/ChessRobotAdapter.js';
import { chooseRobotMoveFromState, analyzePositionFromState } from '../2D/2dchess/js/robot/ChessSearch.js';
import { evaluateState as evaluateChess2D } from '../2D/2dchess/js/robot/ChessEvaluator.js';

import { GoGameLogic as Go2DLogic, otherColor as otherGo2DColor } from '../2D/2dgo/js/GoGame.js';
import { chooseGoRobotMove, analyzeGoPosition } from '../2D/2dgo/js/robot/GoRobot.js';

import { GoGameLogic as Go3DLogic, otherColor as otherGo3DColor } from '../3D/3dgo/js/GoGame.js';
import { chooseGo3DRobotMove, analyzeGo3DPosition } from '../3D/3dgo/js/robot/Go3DRobot.js';

import { ReversiGame, otherReversiColor } from '../js/reversi/ReversiGame.js';
import { chooseReversiRobotMove, analyzeReversiPosition } from '../2D/2dreversi/js/robot/ReversiRobot.js';
import { chooseReversi3DRobotMove, analyzeReversi3DPosition } from '../3D/3dreversi/js/robot/Reversi3DRobot.js';

export const SUPPORTED_RESEARCH_GAMES = Object.freeze([
  '2dchess',
  '2dgo',
  '2dreversi',
  '3dgo',
  '3dreversi'
]);

export function createResearchAdapter(gameKey, options = {}) {
  const game = String(gameKey || '').toLowerCase();
  if (game === '2dchess') return create2DChessAdapter(options);
  if (game === '2dgo') return create2DGoAdapter(options);
  if (game === '2dreversi') return createReversiAdapter({ ...options, dimension: 2 });
  if (game === '3dgo') return create3DGoAdapter(options);
  if (game === '3dreversi') return createReversiAdapter({ ...options, dimension: 3 });
  throw new Error(`Unsupported headless research game "${gameKey}". Supported: ${SUPPORTED_RESEARCH_GAMES.join(', ')}. 3dchess still needs core extraction because its current classes construct DOM/WebGL renderers.`);
}

function create2DChessAdapter(options = {}) {
  const boundary = normalizeChessBoundary(options.boundary || options.topology || 'forbidden');
  const randomState = boundary === 'random' ? createRandomChessBoundaryState(options.seed || 'research-2dchess-rbc-left-right') : { seed: '', entries: [] };
  let state = normalizeState({
    board: BoardSetup.createInitialBoard(),
    currentPlayer: 'white',
    boundaryCondition: boundary,
    randomBoundarySeed: randomState.seed,
    randomBoundaryEntries: randomState.entries,
    enPassantTarget: null,
    halfMoveClock: 0,
    positionHistory: [],
    gameOver: false,
    winner: null,
    draw: false
  });
  return {
    kind: '2dchess',
    options: { boundary, randomBoundarySeed: randomState.seed, rbc: boundary === 'random' ? 'left-right' : null },
    currentPlayer: () => state.currentPlayer,
    isTerminal: () => Boolean(state.gameOver),
    winner: () => state.draw ? 'draw' : (state.winner || ''),
    legalMoves: () => getAllLegalMoves(state, state.currentPlayer),
    serializeState: () => compactChessState(state),
    evaluate: (player = state.currentPlayer) => evaluateChess2D(state, player),
    chooseBuiltin: (depth = 2) => chooseRobotMoveFromState(state, depth),
    analyze: (depth = 2) => analyzePositionFromState(state, depth),
    applyMove(move) {
      const legal = getAllLegalMoves(state, state.currentPlayer);
      const chosen = matchMove(legal, move);
      if (!chosen) return { ok: false, error: 'illegal-move' };
      state = applyMoveToState(state, chosen);
      return { ok: true, move: chosen };
    },
    forceMove(move) {
      state = applyMoveToState(state, move);
      return { ok: true, move };
    },
    opponent: opponentOf
  };
}

function create2DGoAdapter(options = {}) {
  const logic = new Go2DLogic({
    size: clamp(Number(options.size) || 9, 5, 19),
    topology: options.boundary || options.topology || 'open2d',
    lattice: options.lattice || 'square',
    komi: Number.isFinite(Number(options.komi)) ? Number(options.komi) : 7.5,
    randomBoundarySeed: options.seed || ''
  });
  return makeGoAdapter({ kind: '2dgo', logic, otherColor: otherGo2DColor, choose: chooseGoRobotMove, analyze: analyzeGoPosition });
}

function create3DGoAdapter(options = {}) {
  const logic = new Go3DLogic({
    size: clamp(Number(options.size) || 5, 3, 9),
    topology: options.boundary || options.topology || 'r3',
    lattice: options.lattice || 'sc',
    komi: Number.isFinite(Number(options.komi)) ? Number(options.komi) : 7.5,
    randomBoundarySeed: options.seed || ''
  });
  return makeGoAdapter({ kind: '3dgo', logic, otherColor: otherGo3DColor, choose: chooseGo3DRobotMove, analyze: analyzeGo3DPosition });
}

function makeGoAdapter({ kind, logic, otherColor, choose, analyze }) {
  return {
    kind,
    options: { topology: logic.topology, lattice: logic.lattice, size: logic.size, dimension: logic.dimension, komi: logic.komi },
    currentPlayer: () => logic.currentPlayer,
    isTerminal: () => Boolean(logic.gameOver || logic.scoringPending),
    winner: () => {
      if (!logic.gameOver && logic.scoringPending) finishGoScoring(logic);
      return logic.winner || '';
    },
    legalMoves: () => goLegalMoves(logic, logic.currentPlayer),
    serializeState: () => compactGoState(logic),
    evaluate: () => analyze(logic, 1).currentScore,
    chooseBuiltin: (level = 1) => choose(logic, level),
    analyze: (level = 1) => analyze(logic, level),
    applyMove(move) {
      const legal = goLegalMoves(logic, logic.currentPlayer);
      const chosen = matchGoMove(legal, move);
      if (!chosen) return { ok: false, error: 'illegal-move' };
      const result = chosen.type === 'pass' ? logic.pass(logic.currentPlayer) : logic.tryPlay(chosen.coord, logic.currentPlayer);
      if (logic.scoringPending && !logic.gameOver) finishGoScoring(logic);
      return { ok: Boolean(result?.ok), move: chosen, result };
    },
    opponent: otherColor
  };
}

function createReversiAdapter(options = {}) {
  const is3D = Number(options.dimension) === 3;
  const topology = options.boundary || options.topology || (is3D ? 'r3' : 'open2d');
  const logic = new ReversiGame({
    topology,
    lattice: options.lattice || (is3D ? 'square' : 'square'),
    size: clamp(Number(options.size) || (is3D ? 6 : 8), 4, is3D ? 10 : 24),
    maxSize: is3D ? 10 : 30,
    randomBoundarySeed: options.seed || ''
  });
  const choose = is3D ? chooseReversi3DRobotMove : chooseReversiRobotMove;
  const analyze = is3D ? analyzeReversi3DPosition : analyzeReversiPosition;
  return {
    kind: is3D ? '3dreversi' : '2dreversi',
    options: { topology: logic.topology.topology, lattice: logic.topology.lattice, size: logic.topology.size, dimension: logic.topology.dimension },
    currentPlayer: () => logic.currentPlayer,
    isTerminal: () => Boolean(logic.gameOver),
    winner: () => logic.winner || '',
    legalMoves: () => logic.legalMoves(logic.currentPlayer).map((move) => ({ ...move, id: logic.key(move.coord), label: `(${move.coord.join(',')})` })),
    serializeState: () => compactReversiState(logic),
    evaluate: () => analyze(logic, 1).currentScore,
    chooseBuiltin: (depth = 2) => choose(logic, depth),
    analyze: (depth = 2) => analyze(logic, depth),
    applyMove(move) {
      const legal = logic.legalMoves(logic.currentPlayer).map((m) => ({ ...m, id: logic.key(m.coord) }));
      const chosen = matchReversiMove(legal, move);
      if (!chosen) return { ok: false, error: 'illegal-move' };
      const result = logic.play(chosen.coord, logic.currentPlayer);
      return { ok: Boolean(result?.ok), move: chosen, result };
    },
    opponent: otherReversiColor
  };
}

function normalizeChessBoundary(value) {
  const text = String(value || '').toLowerCase();
  if (['open', 'suicide'].includes(text)) return 'open';
  if (['pbc', 'periodic', 'torus'].includes(text)) return 'periodic';
  if (['reflection', 'mirror'].includes(text)) return 'reflection';
  if (['random', 'rbc', 'random-left-right'].includes(text)) return 'random';
  return 'forbidden';
}

function compactChessState(state) {
  return {
    player: state.currentPlayer,
    boundary: state.boundaryCondition,
    gameOver: state.gameOver,
    winner: state.winner,
    draw: state.draw,
    board: state.board.map((row) => row.map((piece) => piece ? `${piece.color[0]}${piece.type}${piece.hasMoved ? 'm' : ''}` : '.'))
  };
}

function compactGoState(logic) {
  return {
    player: logic.currentPlayer,
    topology: logic.topology,
    lattice: logic.lattice,
    size: logic.size,
    dimension: logic.dimension,
    captures: { ...logic.captures },
    passCount: logic.passCount,
    gameOver: logic.gameOver,
    scoringPending: logic.scoringPending,
    board: Array.from(logic.board)
  };
}

function compactReversiState(logic) {
  return {
    player: logic.currentPlayer,
    topology: logic.topology.topology,
    lattice: logic.topology.lattice,
    dimension: logic.topology.dimension,
    size: logic.topology.size,
    counts: logic.counts(),
    gameOver: logic.gameOver,
    winner: logic.winner,
    board: [...logic.board.entries()]
  };
}


function playableCoords(logic) {
  if (typeof logic.playableCoords === 'function') return logic.playableCoords();
  if (typeof logic.allCoords === 'function') return logic.allCoords();
  return [];
}

function goLegalMoves(logic, player) {
  const moves = [];
  for (const coord of playableCoords(logic)) {
    const clone = new logic.constructor();
    clone.importState(logic.exportState());
    const result = clone.tryPlay(coord, player);
    if (result.ok) moves.push({ type: 'play', coord, id: coord.join(','), label: `(${coord.join(',')})`, captured: result.captured || 0 });
  }
  if (!moves.length || logic.passCount > 0) moves.push({ type: 'pass', id: 'pass', label: 'Pass' });
  return moves;
}

function finishGoScoring(logic) {
  try {
    logic.score = logic.computeAreaScore();
    logic.winner = logic.score.black > logic.score.white ? 'black' : logic.score.white > logic.score.black ? 'white' : 'draw';
    logic.gameOver = true;
  } catch {
    logic.winner = 'draw';
    logic.gameOver = true;
  }
}

function matchMove(legal, move) {
  if (!move) return null;
  if (typeof move === 'string') return legal.find((candidate) => candidate.id === move || candidate.label === move) || null;
  const id = move.id || move.moveId;
  if (id) return legal.find((candidate) => candidate.id === id) || null;
  return legal.find((candidate) => samePoint(candidate.from, move.from) && samePoint(candidate.to, move.to)) || null;
}

function matchGoMove(legal, move) {
  if (!move) return null;
  if (typeof move === 'string') return legal.find((candidate) => candidate.id === move || candidate.label === move) || null;
  if (move.type === 'pass' || move.id === 'pass' || move.moveId === 'pass') return legal.find((candidate) => candidate.type === 'pass') || null;
  const id = move.id || move.moveId || (Array.isArray(move.coord) ? move.coord.join(',') : null);
  return legal.find((candidate) => candidate.id === id) || null;
}

function matchReversiMove(legal, move) {
  if (!move) return null;
  if (typeof move === 'string') return legal.find((candidate) => candidate.id === move || candidate.label === move) || null;
  const id = move.id || move.moveId || (Array.isArray(move.coord) ? move.coord.join(',') : null);
  return legal.find((candidate) => candidate.id === id || candidate.coord?.join(',') === id) || null;
}

function samePoint(a, b) {
  if (!a || !b) return false;
  return ['r', 'c', 'x', 'y', 'z', 'sheet'].every((key) => a[key] === undefined || b[key] === undefined || Number(a[key]) === Number(b[key]));
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, Math.floor(value)));
}

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

import { createHeadless3DChessGame, normalize3DChessMode } from '../3D/3dchess/js/headless/Headless3DChess.js';
import { choose3DChessRobotMove, analyze3DChessPosition } from '../3D/3dchess/js/robot/Chess3DRobot.js';

import { GoGameLogic as Go2DLogic, otherColor as otherGo2DColor } from '../2D/2dgo/js/GoGame.js';
import { chooseGoRobotMove, analyzeGoPosition } from '../2D/2dgo/js/robot/GoRobot.js';

import { GoGameLogic as Go3DLogic, otherColor as otherGo3DColor } from '../3D/3dgo/js/GoGame.js';
import { chooseGo3DRobotMove, analyzeGo3DPosition } from '../3D/3dgo/js/robot/Go3DRobot.js';

import { ReversiGame, otherReversiColor } from '../js/reversi/ReversiGame.js';
import { JumpGameState, chooseJumpRobotMove, otherPlayer as otherJumpPlayer } from '../js/shared/JumpRules.js';
import { chooseReversiRobotMove, analyzeReversiPosition } from '../2D/2dreversi/js/robot/ReversiRobot.js';
import { chooseReversi3DRobotMove, analyzeReversi3DPosition } from '../3D/3dreversi/js/robot/Reversi3DRobot.js';
import { HexGame, otherHexColor } from '../js/hex/HexGame.js';
import { chooseHexRobotMove, analyzeHexRobotPosition } from '../js/hex/HexRobot.js';

export const SUPPORTED_RESEARCH_GAMES = Object.freeze([
  '2dchess',
  '3dchess',
  '2dgo',
  '2dreversi',
  '3dgo',
  '3dreversi',
  '2djump',
  '3djump',
  '4djump',
  '2dhex',
  '3dhex',
  '4dhex'
]);

export function createResearchAdapter(gameKey, options = {}) {
  const game = String(gameKey || '').toLowerCase();
  if (game === '2dchess') return create2DChessAdapter(options);
  if (game === '3dchess') return create3DChessAdapter(options);
  if (game === '2dgo') return create2DGoAdapter(options);
  if (game === '2dreversi') return createReversiAdapter({ ...options, dimension: 2 });
  if (game === '3dgo') return create3DGoAdapter(options);
  if (game === '3dreversi') return createReversiAdapter({ ...options, dimension: 3 });
  if (game === '2djump') return createJumpAdapter({ ...options, dimension: 2 });
  if (game === '3djump') return createJumpAdapter({ ...options, dimension: 3 });
  if (game === '4djump') return createJumpAdapter({ ...options, dimension: 4 });
  if (game === '2dhex') return createHexAdapter({ ...options, dimension: 2 });
  if (game === '3dhex') return createHexAdapter({ ...options, dimension: 3 });
  if (game === '4dhex') return createHexAdapter({ ...options, dimension: 4 });
  throw new Error(`Unsupported headless research game "${gameKey}". Supported: ${SUPPORTED_RESEARCH_GAMES.join(', ')}.`);
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

function create3DChessAdapter(options = {}) {
  const mode = normalize3DChessMode(options);
  const logic = createHeadless3DChessGame({
    boundary: options.boundary || options.topology || options.variant || 'r3',
    topology: options.topology || options.boundary || options.variant || 'r3',
    geometry: options.geometry || '',
    lattice: options.lattice || 'chess3d',
    seed: options.seed || ''
  });
  return {
    kind: '3dchess',
    options: {
      variant: logic.variant,
      topology: logic.variant,
      boundary: logic.boundaryCondition,
      lattice: options.lattice || 'chess3d',
      dimension: logic.dimension,
      size: logic.variant === 'cube' ? 8 : logic.boardWidth(),
      randomBoundarySeed: logic.randomBoundarySeed || ''
    },
    currentPlayer: () => logic.currentPlayer,
    isTerminal: () => Boolean(logic.gameOver),
    winner: () => logic.draw ? 'draw' : (logic.winner || ''),
    legalMoves: () => chess3DLegalMoves(logic, logic.currentPlayer),
    serializeState: () => compactChess3DState(logic),
    evaluate: (player = logic.currentPlayer) => evaluateChess3DMaterial(logic, player),
    // Headless research uses a fast deterministic one-ply heuristic so thousands of self-play games finish on laptops.
    // The UI can still use the deeper asynchronous 3D chess robot search.
    chooseBuiltin: (depth = 2) => chooseFast3DChessMove(logic, depth),
    analyze: (depth = 2) => analyze3DChessPosition(logic, depth),
    applyMove(move) {
      const legal = chess3DLegalMoves(logic, logic.currentPlayer);
      const chosen = match3DChessMove(legal, move);
      if (!chosen) return { ok: false, error: 'illegal-move' };
      return logic.applyMove(chosen);
    },
    forceMove(move) { return logic.applyMove(move); },
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
  const topology = options.boundary || options.topology || 'r3';
  const isVolume = ['r3', 't3', 'r3_random'].includes(String(topology).toLowerCase());
  const logic = new Go3DLogic({
    size: clamp(Number(options.size) || 5, 3, 9),
    topology,
    dimension: isVolume ? 3 : 2,
    lattice: options.lattice || (isVolume ? 'sc' : 'square'),
    komi: Number.isFinite(Number(options.komi)) ? Number(options.komi) : 7.5,
    randomBoundarySeed: options.seed || ''
  });
  return makeGoAdapter({ kind: '3dgo', logic, otherColor: otherGo3DColor, choose: chooseGo3DRobotMove, analyze: analyzeGo3DPosition, sampledLegalMoves: true });
}

function makeGoAdapter({ kind, logic, otherColor, choose, analyze, sampledLegalMoves = false }) {
  return {
    kind,
    options: { topology: logic.topology, lattice: logic.lattice, size: logic.size, dimension: logic.dimension, komi: logic.komi },
    currentPlayer: () => logic.currentPlayer,
    isTerminal: () => Boolean(logic.gameOver || logic.scoringPending),
    winner: () => {
      if (!logic.gameOver && logic.scoringPending) finishGoScoring(logic);
      return logic.winner || '';
    },
    legalMoves: () => sampledLegalMoves ? sampledGoLegalMoves(logic, logic.currentPlayer) : goLegalMoves(logic, logic.currentPlayer),
    serializeState: () => compactGoState(logic),
    evaluate: () => analyze(logic, 1).currentScore,
    chooseBuiltin: (level = 1) => choose(logic, level),
    analyze: (level = 1) => analyze(logic, level),
    applyMove(move) {
      const legal = sampledLegalMoves ? sampledGoLegalMoves(logic, logic.currentPlayer) : goLegalMoves(logic, logic.currentPlayer);
      const chosen = matchGoMove(legal, move);
      if (!chosen) return { ok: false, error: 'illegal-move' };
      if (sampledLegalMoves) {
        if (chosen.type === 'pass') return { ok: Boolean(logic.pass(logic.currentPlayer)?.ok), move: chosen, result: { ok: true, passed: true } };
        const result = logic.tryPlay(chosen.coord, logic.currentPlayer);
        if (logic.scoringPending && !logic.gameOver) finishGoScoring(logic);
        if (result?.ok) return { ok: true, move: chosen, result };
        for (const fallback of legal) {
          if (fallback.type === 'pass' || fallback.id === chosen.id) continue;
          const fallbackResult = logic.tryPlay(fallback.coord, logic.currentPlayer);
          if (logic.scoringPending && !logic.gameOver) finishGoScoring(logic);
          if (fallbackResult?.ok) return { ok: true, move: fallback, result: fallbackResult, warning: result?.reason || result?.error || 'sampled-go-fallback' };
        }
        const passResult = logic.pass(logic.currentPlayer);
        return { ok: Boolean(passResult?.ok), move: { type: 'pass', id: 'pass', label: 'Pass' }, result: passResult, warning: result?.reason || result?.error || 'sampled-go-pass-fallback' };
      }
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
  const sampledLegalMoves = is3D;
  return {
    kind: is3D ? '3dreversi' : '2dreversi',
    options: { topology: logic.topology.topology, lattice: logic.topology.lattice, size: logic.topology.size, dimension: logic.topology.dimension },
    currentPlayer: () => logic.currentPlayer,
    isTerminal: () => Boolean(logic.gameOver),
    winner: () => logic.winner || '',
    legalMoves: () => (sampledLegalMoves ? sampledReversiLegalMoves(logic, logic.currentPlayer) : logic.legalMoves(logic.currentPlayer).map((move) => ({ ...move, id: logic.key(move.coord), label: `(${move.coord.join(',')})` }))),
    serializeState: () => compactReversiState(logic),
    evaluate: () => analyze(logic, 1).currentScore,
    chooseBuiltin: (depth = 2) => choose(logic, depth),
    analyze: (depth = 2) => analyze(logic, depth),
    applyMove(move) {
      const legal = sampledLegalMoves ? sampledReversiLegalMoves(logic, logic.currentPlayer) : logic.legalMoves(logic.currentPlayer).map((m) => ({ ...m, id: logic.key(m.coord) }));
      const chosen = matchReversiMove(legal, move);
      if (!chosen) return { ok: false, error: 'illegal-move' };
      if (sampledLegalMoves) {
        const result = applySampledReversiMove(logic, chosen.coord, logic.currentPlayer);
        if (result.ok) return { ok: true, move: chosen, result };
        for (const fallback of legal) {
          if (fallback.id === chosen.id) continue;
          const fallbackResult = applySampledReversiMove(logic, fallback.coord, logic.currentPlayer);
          if (fallbackResult.ok) return { ok: true, move: fallback, result: fallbackResult, warning: result.reason || 'sampled-reversi-fallback' };
        }
        return { ok: false, error: result.reason || 'illegal-move' };
      }
      const result = logic.play(chosen.coord, logic.currentPlayer);
      return { ok: Boolean(result?.ok), move: chosen, result };
    },
    opponent: otherReversiColor
  };
}

function createJumpAdapter(options = {}) {
  const dimension = Number(options.dimension) || (String(options.game || '').startsWith('4') ? 4 : String(options.game || '').startsWith('3') ? 3 : 2);
  const logic = new JumpGameState({
    dimension,
    size: clamp(Number(options.size) || (dimension === 4 ? 4 : dimension === 3 ? 6 : 8), 4, dimension === 2 ? 16 : 8),
    topology: options.boundary || options.topology || (dimension === 4 ? 'hypercube' : dimension === 3 ? 'cube' : 'plane'),
    lattice: options.lattice || 'square',
    playerCount: Number(options.playerCount) || 2,
    targetAxis: options.targetAxis || 'x',
    labMode: options.labMode || '',
    labTargetMode: options.labTargetMode || 'opponentHome'
  });
  return {
    kind: `${dimension}djump`,
    options: { topology: logic.topologyName, lattice: logic.lattice, size: logic.size, dimension: logic.dimension, playerCount: logic.playerCount, targetAxis: logic.targetAxis, labMode: logic.labMode },
    currentPlayer: () => logic.currentPlayer,
    isTerminal: () => Boolean(logic.winner),
    winner: () => logic.winner || '',
    legalMoves: () => logic.allLegalMoves(logic.currentPlayer),
    serializeState: () => logic.serialize(),
    evaluate: (player = logic.currentPlayer) => logic.score(player),
    chooseBuiltin: () => ({ move: chooseJumpRobotMove(logic, logic.currentPlayer), score: logic.score(logic.currentPlayer), nodes: logic.allLegalMoves().length }),
    analyze: () => ({ currentScore: logic.score(logic.currentPlayer), legalCount: logic.allLegalMoves().length }),
    applyMove(move) {
      const chosen = logic.allLegalMoves(logic.currentPlayer).find((candidate) => candidate.id === move?.id) || move;
      const result = logic.applyMove(chosen);
      if (result.continueJump) logic.endTurn();
      return { ok: Boolean(result?.ok), move: chosen, result };
    },
    opponent: otherJumpPlayer
  };
}

function createHexAdapter(options = {}) {
  const dimension = Number(options.dimension) || 2;
  const topology = options.boundary || options.topology || (dimension === 2 ? 'open' : dimension === 3 ? 'r3' : 'open');
  const game = new HexGame({
    dimension,
    size: clamp(Number(options.size) || (dimension === 4 ? 4 : dimension === 3 ? 5 : 9), 3, dimension === 4 ? 8 : dimension === 3 ? 10 : 19),
    topology,
    lattice: options.lattice || (dimension === 3 ? 'axis' : 'hexagonal'),
    randomBoundarySeed: options.seed || ''
  });
  return {
    kind: `${dimension}dhex`,
    options: { topology: game.topology.topology, lattice: game.topology.lattice, size: game.size[0], dimension: game.dimension },
    currentPlayer: () => game.currentColor,
    isTerminal: () => Boolean(game.winner),
    winner: () => game.winner || '',
    legalMoves: () => hexLegalMoves(game),
    serializeState: () => compactHexState(game),
    evaluate: () => analyzeHexRobotPosition(game, { level: 2 })?.currentScore || 0,
    chooseBuiltin: (level = 2) => {
      const choice = chooseHexRobotMove(game, { level });
      return { move: choice ? { type: 'play', coord: choice.coordinate, id: choice.coordinate.join(','), label: `(${choice.coordinate.join(',')})` } : null, score: choice?.score || 0, nodes: choice?.nodes || 0 };
    },
    analyze: (level = 2) => analyzeHexRobotPosition(game, { level }),
    applyMove(move) {
      const legal = hexLegalMoves(game);
      const chosen = matchHexMove(legal, move);
      if (!chosen) return { ok: false, error: 'illegal-move' };
      const result = game.play(chosen.coord, game.currentColor);
      return { ok: Boolean(result?.ok), move: chosen, result };
    },
    opponent: otherHexColor
  };
}

const CHESS3D_VALUES = { K: 20000, Q: 900, R: 500, B: 330, N: 320, P: 100 };

function chess3DLegalMoves(logic, color) {
  const saved = logic.currentPlayer;
  logic.currentPlayer = color;
  try {
    const moves = [];
    for (const coord of logic.validCells()) {
      const layer = coord.z ?? coord.sheet ?? 0;
      const piece = logic.getPiece(coord.x, coord.y, layer);
      if (!piece || piece.color !== color) continue;
      for (const target of logic.getLegalMoves(coord.x, coord.y, layer)) {
        const toLayer = target.z ?? target.sheet ?? 0;
        const capturedPiece = logic.getPiece(target.x, target.y, toLayer);
        const move = {
          id: `${coord.x},${coord.y},${layer}->${target.x},${target.y},${toLayer}`,
          label: `${piece.type} (${coord.x},${coord.y},${layer}) → (${target.x},${target.y},${toLayer})`,
          from: { x: coord.x, y: coord.y, ...(coord.z !== undefined ? { z: layer } : { sheet: layer }) },
          to: { x: target.x, y: target.y, ...(target.z !== undefined ? { z: toLayer } : { sheet: toLayer }) },
          piece: { ...piece },
          capturedPiece: capturedPiece ? { ...capturedPiece } : null,
          promotion: piece.type === 'P' && logic.isPromotionSquare(piece.color, target.x, target.y, toLayer) ? 'Q' : null,
          capture: Boolean(capturedPiece)
        };
        moves.push(move);
      }
    }
    return moves;
  } finally {
    logic.currentPlayer = saved;
  }
}


function chooseFast3DChessMove(logic, depth = 1) {
  const player = logic.currentPlayer;
  const legal = chess3DLegalMoves(logic, player);
  let best = null;
  let nodes = 0;
  for (const move of legal) {
    nodes += 1;
    const score = score3DChessMoveFast(logic, move, player, depth);
    if (!best || score > best.score) best = { move, score };
  }
  return { move: best?.move || legal[0] || null, score: best?.score || evaluateChess3DMaterial(logic, player), nodes, searched: nodes };
}

function score3DChessMoveFast(logic, move, player, depth = 1) {
  const values = CHESS3D_VALUES;
  let score = evaluateChess3DMaterial(logic, player) * 0.02;
  if (move.capturedPiece) score += (values[move.capturedPiece.type] || 0) - 0.08 * (values[move.piece?.type] || 0);
  if (move.promotion) score += 850;
  const size = logic.variant === 'cube' ? 8 : logic.boardWidth();
  const layerSize = logic.variant === 'cube' ? 8 : Math.max(1, logic.depth());
  const tx = Number(move.to?.x) || 0;
  const ty = Number(move.to?.y) || 0;
  const tz = Number(move.to?.z ?? move.to?.sheet ?? 0) || 0;
  const cx = (size - 1) / 2;
  const cy = ((logic.variant === 'cube' ? 8 : logic.boardHeight()) - 1) / 2;
  const cz = (layerSize - 1) / 2;
  const centerDist = Math.abs(tx - cx) + Math.abs(ty - cy) + Math.abs(tz - cz);
  score += Math.max(0, 80 - 8 * centerDist);
  const piece = move.piece?.type || 'P';
  if (logic.boundaryCondition.includes('periodic') || logic.variant === 'torus') {
    if (piece === 'R' || piece === 'Q') score += 40;
    if (piece === 'B') score += 22;
  }
  if (logic.boundaryCondition.includes('reflection')) {
    if (piece === 'R') score -= 45;
    if (piece === 'B' || piece === 'Q') score += 15;
  }
  if (['sphere', 'rp2', 'mobius', 'klein'].includes(logic.variant)) {
    score += 4 * (logic.getLegalMoves(move.to.x, move.to.y, move.to.z ?? move.to.sheet ?? 0)?.length || 0);
  }
  // Tiny seeded-random tie-breaker supplied by research/selfplay via withSeededMathRandom.
  score += Math.random() * 0.01;
  return score;
}

function match3DChessMove(legal, move) {
  if (!move) return null;
  if (typeof move === 'string') return legal.find((candidate) => candidate.id === move || candidate.label === move) || null;
  const id = move.id || move.moveId || (move.from && move.to ? `${move.from.x},${move.from.y},${move.from.z ?? move.from.sheet ?? 0}->${move.to.x},${move.to.y},${move.to.z ?? move.to.sheet ?? 0}` : '');
  return legal.find((candidate) => candidate.id === id) || legal.find((candidate) => samePoint(candidate.from, move.from) && samePoint(candidate.to, move.to)) || null;
}

function evaluateChess3DMaterial(logic, player) {
  let score = 0;
  for (const coord of logic.validCells()) {
    const piece = logic.getPiece(coord.x, coord.y, coord.z ?? coord.sheet ?? 0);
    if (!piece) continue;
    const value = CHESS3D_VALUES[piece.type] || 0;
    score += piece.color === player ? value : -value;
  }
  return score;
}

function compactChess3DState(logic) {
  return {
    player: logic.currentPlayer,
    variant: logic.variant,
    topology: logic.variant,
    boundary: logic.boundaryCondition,
    dimension: logic.dimension,
    size: logic.variant === 'cube' ? 8 : logic.boardWidth(),
    gameOver: logic.gameOver,
    winner: logic.winner,
    draw: logic.draw,
    board: logic.board.map((layer) => layer.map((row) => row.map((piece) => piece ? `${piece.color[0]}${piece.type}${piece.hasMoved ? 'm' : ''}` : '.')))
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

function compactHexState(game) {
  return {
    player: game.currentColor,
    topology: game.topology.topology,
    lattice: game.topology.lattice,
    dimension: game.dimension,
    size: game.size[0],
    winner: game.winner,
    moveNumber: game.moveNumber,
    board: [...game.board.entries()]
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
  moves.push({ type: 'pass', id: 'pass', label: 'Pass' });
  return moves;
}

function sampledGoLegalMoves(logic, player, limit = 24) {
  const coords = playableCoords(logic);
  const moves = [];
  if (!coords.length) return [{ type: 'pass', id: 'pass', label: 'Pass' }];
  const stride = firstCoprimeStride(coords.length, 17 + (logic.moveNumber || 0) * 2);
  const start = Math.abs(hashText(`${player}:${logic.moveNumber || 0}:${logic.positionHistory?.[logic.positionHistory.length - 1] || ''}`)) % coords.length;
  const maxAttempts = Math.min(coords.length, Math.max(limit * 8, 48));
  for (let attempt = 0; attempt < maxAttempts && moves.length < limit; attempt += 1) {
    const coord = coords[(start + attempt * stride) % coords.length];
    const index = logic.indexFromCoord(coord);
    if (index < 0 || logic.board[index] !== 0) continue;
    const hasEmptyNeighbor = logic.neighborsFromCoord(coord)
      .some((neighbor) => logic.board[logic.indexFromCoord(neighbor)] === 0);
    if (!hasEmptyNeighbor && moves.length > Math.floor(limit / 2)) continue;
    moves.push({ type: 'play', coord, id: coord.join(','), label: `(${coord.join(',')})`, captured: 0 });
  }
  moves.push({ type: 'pass', id: 'pass', label: 'Pass' });
  return moves;
}

function sampledReversiLegalMoves(logic, player, limit = 24) {
  const coords = logic.topology.allCoords();
  const moves = [];
  if (!coords.length) return moves;
  const stride = firstCoprimeStride(coords.length, 19 + (logic.moveHistory?.length || 0) * 2);
  const start = Math.abs(hashText(`${player}:${logic.moveHistory?.length || 0}:${logic.board?.size || 0}`)) % coords.length;
  const maxAttempts = Math.min(coords.length, Math.max(limit * 10, 64));
  for (let attempt = 0; attempt < maxAttempts && moves.length < limit; attempt += 1) {
    const coord = coords[(start + attempt * stride) % coords.length];
    if (logic.get(coord)) continue;
    const flips = logic.previewMove(coord, player);
    if (flips.length) moves.push({ coord, flips, id: logic.key(coord), label: `(${coord.join(',')})` });
  }
  if (!moves.length) {
    for (const coord of coords) {
      if (logic.get(coord)) continue;
      const flips = logic.previewMove(coord, player);
      if (flips.length) moves.push({ coord, flips, id: logic.key(coord), label: `(${coord.join(',')})` });
      if (moves.length >= Math.min(limit, 8)) break;
    }
  }
  return moves;
}

function applySampledReversiMove(logic, coord, color) {
  if (logic.gameOver || color !== logic.currentPlayer) return { ok: false, reason: 'turn' };
  const normalized = logic.topology.normalize(coord);
  const flips = logic.previewMove(normalized, color);
  if (!flips.length) return { ok: false, reason: 'illegal' };
  logic.set(normalized, { color });
  for (const flip of flips) logic.set(flip, { color });
  logic.lastFlipped = flips.map((flip) => logic.key(flip));
  logic.moveHistory.unshift({
    type: 'move',
    number: logic.moveHistory.filter((entry) => entry.type === 'move').length + 1,
    color,
    coord: normalized,
    flipped: flips.length,
    trainingFastPath: true
  });
  logic.currentPlayer = otherReversiColor(color);
  return { ok: true, coord: normalized, flipped: flips.length };
}

function firstCoprimeStride(length, preferred) {
  if (length <= 1) return 1;
  let stride = Math.max(1, Math.floor(preferred) % length);
  while (greatestCommonDivisor(stride, length) !== 1) stride = (stride + 1) % length || 1;
  return stride;
}

function greatestCommonDivisor(a, b) {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y) {
    const next = x % y;
    x = y;
    y = next;
  }
  return x || 1;
}

function hashText(text) {
  let hash = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash | 0;
}

function hexLegalMoves(game) {
  return game.topology.coordinates()
    .filter((coord) => game.isLegalPlacement(coord, game.currentColor))
    .map((coord) => ({ type: 'play', coord, id: coord.join(','), label: `(${coord.join(',')})` }));
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

function matchHexMove(legal, move) {
  if (!move) return null;
  if (typeof move === 'string') return legal.find((candidate) => candidate.id === move || candidate.label === move) || null;
  const id = move.id || move.moveId || (Array.isArray(move.coord) ? move.coord.join(',') : null);
  return legal.find((candidate) => candidate.id === id) || null;
}

function samePoint(a, b) {
  if (!a || !b) return false;
  return ['r', 'c', 'x', 'y', 'z', 'sheet'].every((key) => a[key] === undefined || b[key] === undefined || Number(a[key]) === Number(b[key]));
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, Math.floor(value)));
}

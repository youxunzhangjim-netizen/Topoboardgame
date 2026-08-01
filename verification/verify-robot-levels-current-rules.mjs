import assert from 'node:assert/strict';

import { BoardSetup } from '../2D/2dchess/js/BoardSetup.js';
import {
  applyMoveToState,
  getAllLegalMoves,
  normalizeState
} from '../2D/2dchess/js/robot/ChessRobotAdapter.js';
import {
  analyzePositionFromState,
  chooseRobotMoveFromState
} from '../2D/2dchess/js/robot/ChessSearch.js';
import { GoGameLogic as Go2D } from '../2D/2dgo/js/GoGame.js';
import { analyzeGoPosition, chooseGoRobotMove } from '../2D/2dgo/js/robot/GoRobot.js';
import { analyzeReversiPosition, chooseReversiRobotMove } from '../2D/2dreversi/js/robot/ReversiRobot.js';
import { createHeadless3DChessGame } from '../3D/3dchess/js/headless/Headless3DChess.js';
import { analyze3DChessPosition, choose3DChessRobotMove } from '../3D/3dchess/js/robot/Chess3DRobot.js';
import { GoGameLogic as Go3D } from '../3D/3dgo/js/GoGame.js';
import { analyzeGo3DPosition, chooseGo3DRobotMove } from '../3D/3dgo/js/robot/Go3DRobot.js';
import { analyzeReversi3DPosition, chooseReversi3DRobotMove } from '../3D/3dreversi/js/robot/Reversi3DRobot.js';
import { HexGame } from '../js/hex/HexGame.js';
import { analyzeHexRobotPosition, chooseHexRobotMove } from '../js/hex/HexRobot.js';
import { ReversiGame } from '../js/reversi/ReversiGame.js';
import { JumpGameState, chooseJumpRobotMove } from '../js/shared/JumpRules.js';
import {
  chooseChessOpeningBookMove,
  chooseGoOpeningBookMove,
  chooseJumpOpeningBookMove,
  chooseReversiOpeningBookMove
} from '../js/shared/RobotOpeningBook.js';

const LEVELS = Object.freeze([1, 2, 3, 4]);

function coordKey(coord) {
  return Array.isArray(coord) ? coord.join(',') : String(coord);
}

function moveKey2DChess(move) {
  return move?.id || `${coordKey([move?.from?.r, move?.from?.c])}->${coordKey([move?.to?.r, move?.to?.c])}`;
}

function moveKey3DChess(move) {
  const from = move?.from || {};
  const to = move?.to || {};
  return `${from.x},${from.y},${from.z ?? from.sheet ?? 0}->${to.x},${to.y},${to.z ?? to.sheet ?? 0}${move?.promotion ? '=' + move.promotion : ''}`;
}

function sameCoord(a, b) {
  return Array.isArray(a) && Array.isArray(b) && a.length === b.length && a.every((value, index) => value === b[index]);
}

function assertMoveFromSet(move, legalMoves, keyFn, label) {
  const legalKeys = new Set(legalMoves.map(keyFn));
  assert.ok(legalKeys.has(keyFn(move)), `${label} chose a move outside the current legal move generator`);
}

function cloneGo(GameClass, source, options) {
  const clone = new GameClass(options);
  clone.importState(source.exportState());
  return clone;
}

function playableCoords(logic) {
  if (typeof logic.playableCoords === 'function') return logic.playableCoords();
  const coords = [];
  for (let index = 0; index < logic.board.length; index += 1) {
    coords.push(logic.coordFromIndex(index));
  }
  return coords;
}

function goLegalCandidates(GameClass, logic, options, player = logic.currentPlayer) {
  const moves = [];
  for (const coord of playableCoords(logic)) {
    if (!Array.isArray(coord)) continue;
    const clone = cloneGo(GameClass, logic, options);
    const result = clone.tryPlay(coord, player);
    if (result?.ok) {
      const index = clone.indexFromCoord(coord);
      const group = Number.isInteger(index) && index >= 0
        ? clone.getGroupAndLiberties?.(clone.board, index)
        : null;
      moves.push({
        type: 'play',
        coord: [...coord],
        captured: Number(result.captured || 0),
        liberties: Number(group?.liberties?.size || 0)
      });
    }
  }
  moves.push({ type: 'pass', coord: null, captured: 0, liberties: 0 });
  return moves;
}

function assertGoMoveApplies(GameClass, logic, options, move, label) {
  assert.ok(move, `${label} did not return a move`);
  const clone = cloneGo(GameClass, logic, options);
  const result = move.type === 'pass'
    ? clone.pass(logic.currentPlayer)
    : clone.tryPlay(move.coord, logic.currentPlayer);
  assert.equal(result?.ok, true, `${label} returned a move that current Go rules reject`);
}

function assertGoAnalysis(GameClass, logic, options, analysis, label) {
  assert.ok(analysis?.topMoves?.length, `${label} analysis returned no top moves`);
  for (const row of analysis.topMoves) {
    assertGoMoveApplies(GameClass, logic, options, row.move, `${label} analysis top move ${coordKey(row.move?.coord)}`);
  }
}

function assertGoBook(GameClass, logic, options, label) {
  const candidates = goLegalCandidates(GameClass, logic, options);
  const book = chooseGoOpeningBookMove(logic, candidates, logic.currentPlayer);
  if (!book) return;
  assert.ok(
    candidates.some((move) => move.type === book.move.type && (move.type === 'pass' || sameCoord(move.coord, book.move.coord))),
    `${label} opening book returned a non-candidate move`
  );
  assertGoMoveApplies(GameClass, logic, options, book.move, `${label} opening book`);
}

function assertReversiMoveApplies(logic, move, label) {
  assert.ok(move?.coord, `${label} did not return a coordinate`);
  const legal = logic.legalMoves(logic.currentPlayer);
  assertMoveFromSet(move, legal, (candidate) => coordKey(candidate.coord), label);
  const clone = new ReversiGame();
  clone.importState(logic.exportState());
  assert.equal(clone.play(move.coord, logic.currentPlayer).ok, true, `${label} returned a move rejected by Reversi rules`);
}

function assertReversiAnalysis(logic, analysis, label) {
  assert.ok(analysis?.topMoves?.length, `${label} analysis returned no top moves`);
  const legal = logic.legalMoves(logic.currentPlayer);
  for (const row of analysis.topMoves) {
    assertMoveFromSet(row.move, legal, (candidate) => coordKey(candidate.coord), `${label} analysis top move`);
  }
}

function assertReversiBook(logic, label) {
  const legal = logic.legalMoves(logic.currentPlayer);
  const book = chooseReversiOpeningBookMove(logic, legal, logic.currentPlayer);
  if (!book) return;
  assertMoveFromSet(book.move, legal, (candidate) => coordKey(candidate.coord), `${label} opening book`);
}

function assertHexMoveApplies(game, result, label) {
  assert.ok(result?.coordinate, `${label} did not return a coordinate`);
  assert.equal(game.isLegalPlacement(result.coordinate), true, `${label} returned an illegal Hex placement`);
  const clone = HexGame.fromState(game.exportState());
  assert.equal(clone.play(result.coordinate).ok, true, `${label} move failed to apply`);
}

function assertHexAnalysis(game, analysis, label) {
  assert.ok(analysis?.topMoves?.length, `${label} analysis returned no top moves`);
  for (const row of analysis.topMoves) {
    assert.equal(game.isLegalPlacement(row.coordinate), true, `${label} analysis top move is illegal`);
  }
}

function assertJumpMoveApplies(game, move, label) {
  assert.ok(move, `${label} did not return a move`);
  const legal = game.allLegalMoves(game.currentPlayer);
  assert.ok(legal.some((candidate) => candidate.id === move.id), `${label} chose a move outside Jump legal moves`);
  const clone = new JumpGameState({
    dimension: game.dimension,
    size: game.size,
    topology: game.topologyName,
    lattice: game.lattice,
    playerCount: game.playerCount,
    targetAxis: game.targetAxis,
    zoneMode: game.zoneMode,
    labMode: game.labMode,
    labTargetMode: game.labTargetMode
  });
  clone.import(game.serialize());
  assert.equal(clone.applyMove(move).ok, true, `${label} move failed to apply`);
}

function verify2DChess() {
  console.log('Checking 2D Chess robot levels/books...');
  const boundaries = ['forbidden', 'open', 'periodic', 'reflection', 'random'];
  for (const boundaryCondition of boundaries) {
    const state = normalizeState({
      board: BoardSetup.createInitialBoard(),
      currentPlayer: 'white',
      boundaryCondition,
      randomBoundarySeed: 'robot-rule-check'
    });
    const legal = getAllLegalMoves(state, state.currentPlayer);
    assert.ok(legal.length, `2D Chess ${boundaryCondition} has no legal moves`);
    const book = chooseChessOpeningBookMove(state, legal, state.currentPlayer);
    if (book) assertMoveFromSet(book.move, legal, moveKey2DChess, `2D Chess ${boundaryCondition} opening book`);

    for (const level of LEVELS) {
      const result = chooseRobotMoveFromState(state, level);
      assert.ok(result.move, `2D Chess ${boundaryCondition} level ${level} did not choose a move`);
      assertMoveFromSet(result.move, legal, moveKey2DChess, `2D Chess ${boundaryCondition} level ${level}`);
      const next = applyMoveToState(state, result.move);
      assert.notEqual(next.currentPlayer, state.currentPlayer, `2D Chess ${boundaryCondition} level ${level} did not advance turn in simulation`);
    }

    const analysis = analyzePositionFromState(state, 2);
    assert.ok(analysis?.topMoves?.length, `2D Chess ${boundaryCondition} analysis returned no top moves`);
    for (const row of analysis.topMoves) {
      assertMoveFromSet(row.move, legal, moveKey2DChess, `2D Chess ${boundaryCondition} analysis top move`);
    }
  }
}

async function verify3DChess() {
  console.log('Checking 3D Chess robot levels/books...');
  const allLevelVariants = ['cube'];
  const broadVariants = ['torus', 'rp2', 'mobius', 'sphere', 'klein'];

  for (const variant of allLevelVariants) {
    for (const level of LEVELS) {
      const game = createHeadless3DChessGame({ variant });
      const result = await choose3DChessRobotMove(game, level);
      assert.ok(result.move, `3D Chess ${variant} level ${level} did not choose a move`);
      assert.equal(game.applyMove(result.move).ok, true, `3D Chess ${variant} level ${level} move failed to apply`);
    }
    const analysisGame = createHeadless3DChessGame({ variant });
    const analysis = await analyze3DChessPosition(analysisGame, 1);
    assert.ok(analysis?.topMoves?.length, `3D Chess ${variant} analysis returned no top moves`);
    const testGame = createHeadless3DChessGame({ variant });
    assert.equal(testGame.applyMove(analysis.topMoves[0].move).ok, true, `3D Chess ${variant} analysis top move failed to apply`);
  }

  for (const variant of broadVariants) {
    const game = createHeadless3DChessGame({ variant });
    const result = await choose3DChessRobotMove(game, 1);
    assert.ok(result.move, `3D Chess ${variant} level 1 did not choose a move`);
    assert.equal(game.applyMove(result.move).ok, true, `3D Chess ${variant} level 1 move failed to apply`);
  }
}

function verify2DGo() {
  console.log('Checking 2D Go robot levels/books...');
  const allLevelCases = [
    { size: 5, topology: 'open2d', lattice: 'square' },
    { size: 5, topology: 'pbc', lattice: 'triangular' },
    { size: 5, topology: 'cylinder', lattice: 'honeycomb' }
  ];
  const broadCases = [
    { size: 7, topology: 'pbc', lattice: 'honeycomb' },
    { size: 7, topology: 'klein', lattice: 'square' },
    { size: 7, topology: 'random', lattice: 'triangular', randomBoundarySeed: 'robot-random-go' }
  ];

  for (const options of allLevelCases) {
    const game = new Go2D(options);
    assertGoBook(Go2D, game, options, `2D Go ${options.topology}/${options.lattice}`);
    for (const level of LEVELS) {
      const logic = new Go2D(options);
      const result = chooseGoRobotMove(logic, level);
      assertGoMoveApplies(Go2D, logic, options, result.move, `2D Go ${options.topology}/${options.lattice} level ${level}`);
    }
    const analysisGame = new Go2D(options);
    assertGoAnalysis(Go2D, analysisGame, options, analyzeGoPosition(analysisGame, 2), `2D Go ${options.topology}/${options.lattice}`);
  }

  for (const options of broadCases) {
    const game = new Go2D(options);
    const result = chooseGoRobotMove(game, 1);
    assertGoMoveApplies(Go2D, game, options, result.move, `2D Go ${options.topology}/${options.lattice} broad check`);
  }
}

function verify3DGo() {
  console.log('Checking 3D Go robot levels/books...');
  const allLevelCases = [
    { dimension: 3, size: 3, topology: 'r3', lattice: 'sc' }
  ];
  const broadCases = [
    { dimension: 3, size: 4, topology: 'r3', lattice: 'bcc' },
    { dimension: 2, width: 4, height: 3, size: 4, topology: 't2', lattice: 'honeycomb' },
    { dimension: 3, size: 4, topology: 't3', lattice: 'fcc' },
    { dimension: 3, size: 4, topology: 'r3_random', lattice: 'sc', randomBoundarySeed: 'robot-r3-rbc' },
    { dimension: 2, width: 4, height: 4, size: 4, topology: 'cylinder', lattice: 'honeycomb' },
    { dimension: 2, width: 5, height: 4, size: 5, topology: 'mobius', lattice: 'square' },
    { dimension: 2, width: 5, height: 4, size: 5, topology: 'sphere', lattice: 'sphere_coordinate' },
    { dimension: 2, width: 5, height: 4, size: 5, topology: 'sphere', lattice: 'buckyball' },
    { dimension: 2, width: 5, height: 5, size: 5, topology: 'klein', lattice: 'square' }
  ];

  for (const options of allLevelCases) {
    const game = new Go3D(options);
    assertGoBook(Go3D, game, options, `3D Go ${options.topology}/${options.lattice}`);
    for (const level of LEVELS) {
      const logic = new Go3D(options);
      const result = chooseGo3DRobotMove(logic, level);
      assertGoMoveApplies(Go3D, logic, options, result.move, `3D Go ${options.topology}/${options.lattice} level ${level}`);
    }
    const analysisGame = new Go3D(options);
    assertGoAnalysis(Go3D, analysisGame, options, analyzeGo3DPosition(analysisGame, 1), `3D Go ${options.topology}/${options.lattice}`);
  }

  for (const options of broadCases) {
    const game = new Go3D(options);
    const result = chooseGo3DRobotMove(game, 1);
    assertGoMoveApplies(Go3D, game, options, result.move, `3D Go ${options.topology}/${options.lattice} broad check`);
  }
}

function verify2DReversi() {
  console.log('Checking 2D Reversi robot levels/books...');
  const allLevelCases = [
    { topology: 'open2d', lattice: 'square', size: 8 },
    { topology: 'pbc', lattice: 'honeycomb', size: 8 },
    { topology: 'cylinder', lattice: 'honeycomb', size: 8 },
    { topology: 'klein', lattice: 'square', size: 8 }
  ];
  const broadCases = [
    { topology: 'random', lattice: 'square', size: 8, randomBoundarySeed: 'robot-random-reversi' },
    { topology: 'polar', lattice: 'square', size: 8 }
  ];

  for (const options of allLevelCases) {
    const game = new ReversiGame(options);
    assertReversiBook(game, `2D Reversi ${options.topology}/${options.lattice}`);
    for (const level of LEVELS) {
      const logic = new ReversiGame(options);
      const result = chooseReversiRobotMove(logic, level);
      assertReversiMoveApplies(logic, result.move, `2D Reversi ${options.topology}/${options.lattice} level ${level}`);
    }
    const analysisGame = new ReversiGame(options);
    assertReversiAnalysis(analysisGame, analyzeReversiPosition(analysisGame, 2), `2D Reversi ${options.topology}/${options.lattice}`);
  }

  for (const options of broadCases) {
    const game = new ReversiGame(options);
    const result = chooseReversiRobotMove(game, 1);
    assertReversiMoveApplies(game, result.move, `2D Reversi ${options.topology}/${options.lattice} broad check`);
  }
}

function verify3DReversi() {
  console.log('Checking 3D Reversi robot levels/books...');
  const allLevelCases = [
    { topology: 'r3', lattice: 'square', size: 6 },
    { topology: 't2', lattice: 'honeycomb', size: 6 }
  ];
  const broadCases = [
    { topology: 'r3', lattice: 'bcc', size: 6 },
    { topology: 'r3', lattice: 'fcc', size: 6 },
    { topology: 'cylinder', lattice: 'honeycomb', size: 8 },
    { topology: 't3', lattice: 'square', size: 6 },
    { topology: 'r3_random', lattice: 'square', size: 6, randomBoundarySeed: 'robot-r3-reversi-rbc' },
    { topology: 'rp3', lattice: 'square', size: 6 },
    { topology: 'sphere', lattice: 'square', size: 8 },
    { topology: 'mobius', lattice: 'square', size: 8 },
    { topology: 'klein', lattice: 'square', size: 8 }
  ];

  for (const options of allLevelCases) {
    const game = new ReversiGame(options);
    assertReversiBook(game, `3D Reversi ${options.topology}/${options.lattice}`);
    for (const level of LEVELS) {
      const logic = new ReversiGame(options);
      const result = chooseReversi3DRobotMove(logic, level);
      assertReversiMoveApplies(logic, result.move, `3D Reversi ${options.topology}/${options.lattice} level ${level}`);
    }
    const analysisGame = new ReversiGame(options);
    assertReversiAnalysis(analysisGame, analyzeReversi3DPosition(analysisGame, 2), `3D Reversi ${options.topology}/${options.lattice}`);
  }

  for (const options of broadCases) {
    const game = new ReversiGame(options);
    const result = chooseReversi3DRobotMove(game, 1);
    assertReversiMoveApplies(game, result.move, `3D Reversi ${options.topology}/${options.lattice} broad check`);
  }
}

function verifyHex() {
  console.log('Checking Hex robot levels/search...');
  const allLevelCases = [
    { dimension: 2, size: 5, topology: 'open', lattice: 'hexagonal' },
    { dimension: 3, size: 4, topology: 'cube', lattice: 'cubic' }
  ];
  const broadCases = [
    { dimension: 2, size: 5, topology: 'torus', lattice: 'triangular' },
    { dimension: 2, size: 7, topology: 'cylinder', lattice: 'square' },
    { dimension: 2, size: 7, topology: 'mobius', lattice: 'hexagonal' },
    { dimension: 3, size: 4, topology: 'sphere', lattice: 'geodesic' },
    { dimension: 3, size: 5, topology: 'sphere', lattice: 'buckyball' },
    { dimension: 3, size: 6, topology: 'trefoil_tube', lattice: 'honeycomb' },
    { dimension: 4, size: 4, topology: 'hypercube', lattice: 'cubic' }
  ];

  for (const options of allLevelCases) {
    for (const level of LEVELS) {
      const game = new HexGame(options);
      const result = chooseHexRobotMove(game, { level });
      assertHexMoveApplies(game, result, `Hex ${options.dimension}D ${options.topology}/${options.lattice} level ${level}`);
    }
    const analysisGame = new HexGame(options);
    assertHexAnalysis(analysisGame, analyzeHexRobotPosition(analysisGame, { level: 2, limit: 5 }), `Hex ${options.dimension}D ${options.topology}/${options.lattice}`);
  }

  for (const options of broadCases) {
    const game = new HexGame(options);
    const result = chooseHexRobotMove(game, { level: 1 });
    assertHexMoveApplies(game, result, `Hex ${options.dimension}D ${options.topology}/${options.lattice} broad check`);
  }
}

function verifyJump() {
  console.log('Checking Jump robot/book decisions...');
  const cases = [
    { dimension: 2, size: 8, topology: 'plane', lattice: 'square' },
    { dimension: 2, size: 8, topology: 'torus', lattice: 'triangular' },
    { dimension: 2, size: 8, topology: 'cylinder', lattice: 'square' },
    { dimension: 2, size: 8, topology: 'mobius', lattice: 'triangular' },
    { dimension: 2, size: 8, topology: 'klein', lattice: 'square' },
    { dimension: 2, size: 8, topology: 'rp2', lattice: 'triangular' },
    { dimension: 3, size: 4, topology: 'cube', lattice: 'square' },
    { dimension: 3, size: 8, topology: 'cylinder', lattice: 'square' },
    { dimension: 3, size: 8, topology: 'torus', lattice: 'triangular' },
    { dimension: 4, size: 3, topology: 'hypercube', lattice: 'square' }
  ];

  for (const options of cases) {
    const bookGame = new JumpGameState(options);
    const legal = bookGame.allLegalMoves(bookGame.currentPlayer);
    const book = chooseJumpOpeningBookMove(bookGame, legal, bookGame.currentPlayer);
    if (book) assertJumpMoveApplies(bookGame, book.move, `Jump ${options.dimension}D ${options.topology}/${options.lattice} opening book`);

    const game = new JumpGameState(options);
    const move = chooseJumpRobotMove(game, game.currentPlayer, null, { remember: false });
    assertJumpMoveApplies(game, move, `Jump ${options.dimension}D ${options.topology}/${options.lattice}`);
  }
}

verify2DChess();
await verify3DChess();
verify2DGo();
verify3DGo();
verify2DReversi();
verify3DReversi();
verifyHex();
verifyJump();

console.log('Robot level/current-rule verification passed for opening books, searches, analyses, and chosen legal moves.');

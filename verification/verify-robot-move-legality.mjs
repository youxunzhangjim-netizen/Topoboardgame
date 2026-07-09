import assert from 'node:assert/strict';
import { BoardSetup } from '../2D/2dchess/js/BoardSetup.js';
import { getAllLegalMoves, normalizeState } from '../2D/2dchess/js/robot/ChessRobotAdapter.js';
import { chooseRobotMoveFromState } from '../2D/2dchess/js/robot/ChessSearch.js';
import { GoGameLogic as Go2D } from '../2D/2dgo/js/GoGame.js';
import { chooseGoRobotMove } from '../2D/2dgo/js/robot/GoRobot.js';
import { chooseReversiRobotMove } from '../2D/2dreversi/js/robot/ReversiRobot.js';
import { createHeadless3DChessGame } from '../3D/3dchess/js/headless/Headless3DChess.js';
import { choose3DChessRobotMove } from '../3D/3dchess/js/robot/Chess3DRobot.js';
import { GoGameLogic as Go3D } from '../3D/3dgo/js/GoGame.js';
import { chooseGo3DRobotMove } from '../3D/3dgo/js/robot/Go3DRobot.js';
import { chooseReversi3DRobotMove } from '../3D/3dreversi/js/robot/Reversi3DRobot.js';
import { HexGame } from '../js/hex/HexGame.js';
import { chooseHexRobotMove } from '../js/hex/HexRobot.js';
import { ReversiGame } from '../js/reversi/ReversiGame.js';
import { JumpGameState, chooseJumpRobotMove } from '../js/shared/JumpRules.js';

function coordKey(coord) {
  return Array.isArray(coord) ? coord.join(',') : String(coord);
}

for (const boundaryCondition of ['forbidden', 'open', 'periodic', 'reflection']) {
  const state = normalizeState({
    board: BoardSetup.createInitialBoard(),
    currentPlayer: 'white',
    boundaryCondition
  });
  const legal = getAllLegalMoves(state, state.currentPlayer);
  const result = chooseRobotMoveFromState(state, 1);
  assert.ok(result.move, `2D Chess ${boundaryCondition} robot must choose a move`);
  assert.ok(legal.some((move) => move.id === result.move.id), `2D Chess ${boundaryCondition} robot move must be legal`);
}

for (const options of [
  { size: 9, topology: 'open2d', lattice: 'square' },
  { size: 9, topology: 'pbc', lattice: 'triangular' },
  { size: 9, topology: 'cylinder', lattice: 'honeycomb' }
]) {
  const game = new Go2D(options);
  const result = chooseGoRobotMove(game, 1);
  assert.ok(result.move, `2D Go ${options.topology}/${options.lattice} robot must choose a move`);
  const applied = result.move.type === 'pass'
    ? game.pass(game.currentPlayer)
    : game.tryPlay(result.move.coord, game.currentPlayer);
  assert.equal(applied.ok, true, `2D Go ${options.topology}/${options.lattice} robot move must apply`);
}

for (const options of [
  { topology: 'open2d', lattice: 'square', size: 8 },
  { topology: 'pbc', lattice: 'honeycomb', size: 8 },
  { topology: 'r3', lattice: 'square', size: 6 },
  { topology: 'r3', lattice: 'bcc', size: 6 },
  { topology: 'r3', lattice: 'fcc', size: 6 }
]) {
  const game = new ReversiGame(options);
  const robot = game.topology.dimension === 3
    ? chooseReversi3DRobotMove(game, 1)
    : chooseReversiRobotMove(game, 1);
  assert.ok(robot.move, `Reversi ${options.topology}/${options.lattice} robot must choose a move`);
  const legalKeys = new Set(game.legalMoves().map((move) => coordKey(move.coord)));
  assert.ok(legalKeys.has(coordKey(robot.move.coord)), `Reversi ${options.topology}/${options.lattice} robot move must be legal`);
  assert.equal(game.play(robot.move.coord).ok, true, `Reversi ${options.topology}/${options.lattice} robot move must apply`);
}

for (const options of [
  { dimension: 3, size: 5, topology: 'r3', lattice: 'sc' },
  { dimension: 2, width: 6, height: 4, topology: 't2', lattice: 'honeycomb' },
  { dimension: 2, width: 6, height: 4, topology: 'cylinder', lattice: 'honeycomb' }
]) {
  const game = new Go3D(options);
  const result = chooseGo3DRobotMove(game, 1);
  assert.ok(result.move, `3D Go ${options.topology}/${options.lattice} robot must choose a move`);
  const applied = result.move.type === 'pass'
    ? game.pass(game.currentPlayer)
    : game.tryPlay(result.move.coord, game.currentPlayer);
  assert.equal(applied.ok, true, `3D Go ${options.topology}/${options.lattice} robot move must apply`);
}

for (const options of [
  { variant: 'cube' },
  { variant: 'torus' }
]) {
  const game = createHeadless3DChessGame(options);
  const result = await choose3DChessRobotMove(game, 1);
  assert.ok(result.move, `3D Chess ${options.variant} robot must choose a move`);
  assert.equal(game.applyMove(result.move).ok, true, `3D Chess ${options.variant} robot move must apply`);
}

for (const options of [
  { dimension: 2, size: 7, topology: 'open', lattice: 'hexagonal' },
  { dimension: 3, size: 4, topology: 'cube', lattice: 'cubic' },
  { dimension: 3, size: 5, topology: 'sphere', lattice: 'geodesic' }
]) {
  const game = new HexGame(options);
  const result = chooseHexRobotMove(game, { level: 1 });
  assert.ok(result?.coordinate, `Hex ${options.dimension}D ${options.topology} robot must choose a move`);
  assert.equal(game.isLegalPlacement(result.coordinate), true, `Hex ${options.dimension}D ${options.topology} robot move must be legal`);
  assert.equal(game.play(result.coordinate).ok, true, `Hex ${options.dimension}D ${options.topology} robot move must apply`);
}

for (const options of [
  { dimension: 2, size: 8, topology: 'torus', lattice: 'triangular' },
  { dimension: 2, size: 8, topology: 'cylinder', lattice: 'square' },
  { dimension: 3, size: 4, topology: 'cube', lattice: 'square' }
]) {
  const game = new JumpGameState(options);
  const move = chooseJumpRobotMove(game, game.currentPlayer, null, { remember: false });
  assert.ok(move, `Jump ${options.topology}/${options.lattice} robot must choose a move`);
  assert.ok(game.allLegalMoves().some((candidate) => candidate.id === move.id), `Jump ${options.topology}/${options.lattice} robot move must be legal`);
  assert.equal(game.applyMove(move).ok, true, `Jump ${options.topology}/${options.lattice} robot move must apply`);
}

console.log('Robot move legality verification passed for every robot-enabled game family.');

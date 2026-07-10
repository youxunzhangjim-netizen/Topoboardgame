import assert from 'node:assert/strict';
import { GoGameLogic as Go2D, COLORS as COLORS_2D, otherColor as other2D, valueToColor as valueToColor2D } from '../2D/2dgo/js/GoGame.js';
import { chooseGoRobotMove } from '../2D/2dgo/js/robot/GoRobot.js';
import { GoGameLogic as Go3D, COLORS as COLORS_3D, otherColor as other3D, valueToColor as valueToColor3D } from '../3D/3dgo/js/GoGame.js';
import { chooseGo3DRobotMove } from '../3D/3dgo/js/robot/Go3DRobot.js';
import { scoreGoStrategicMove } from '../js/shared/GoStrategyHeuristics.js';

function key(coord) {
  return Array.isArray(coord) ? coord.join(',') : '';
}

function setStone(game, coord, value) {
  game.board[game.indexFromCoord(coord)] = value;
}

function verifyAtariCapturePriority2D() {
  const game = new Go2D({ size: 5, topology: 'open2d', lattice: 'square' });
  setStone(game, [2, 2], COLORS_2D.white);
  setStone(game, [1, 2], COLORS_2D.black);
  setStone(game, [2, 1], COLORS_2D.black);
  setStone(game, [3, 2], COLORS_2D.black);
  game.currentPlayer = 'black';

  const capture = { type: 'play', coord: [2, 3], captured: 1, liberties: 3 };
  const loose = { type: 'play', coord: [0, 0], captured: 0, liberties: 2 };
  const captureScore = scoreGoStrategicMove(game, capture, 'black', { COLORS: COLORS_2D, valueToColor: valueToColor2D, otherColor: other2D });
  const looseScore = scoreGoStrategicMove(game, loose, 'black', { COLORS: COLORS_2D, valueToColor: valueToColor2D, otherColor: other2D });
  assert.ok(captureScore > looseScore + 40, `capture score ${captureScore} should dominate loose score ${looseScore}`);

  const robot = chooseGoRobotMove(game, 1);
  assert.ok(robot.move, '2D Go robot should return a move in tactical atari position');
  assert.equal(game.tryPlay(robot.move.coord, game.currentPlayer).ok, true, '2D Go robot move remains legal');
}

function verifyAtariSavePriority2D() {
  const game = new Go2D({ size: 5, topology: 'open2d', lattice: 'square' });
  setStone(game, [2, 2], COLORS_2D.black);
  setStone(game, [1, 2], COLORS_2D.white);
  setStone(game, [2, 1], COLORS_2D.white);
  setStone(game, [3, 2], COLORS_2D.white);
  game.currentPlayer = 'black';

  const save = { type: 'play', coord: [2, 3], captured: 0, liberties: 3 };
  const unrelated = { type: 'play', coord: [0, 0], captured: 0, liberties: 2 };
  const saveScore = scoreGoStrategicMove(game, save, 'black', { COLORS: COLORS_2D, valueToColor: valueToColor2D, otherColor: other2D });
  const unrelatedScore = scoreGoStrategicMove(game, unrelated, 'black', { COLORS: COLORS_2D, valueToColor: valueToColor2D, otherColor: other2D });
  assert.ok(saveScore > unrelatedScore + 35, `save score ${saveScore} should dominate unrelated score ${unrelatedScore}`);
}

function verifyGraphTopologyMoveIsLegal3D() {
  for (const options of [
    { dimension: 3, size: 4, topology: 'r3', lattice: 'sc' },
    { dimension: 2, width: 6, height: 4, topology: 't2', lattice: 'honeycomb' },
    { dimension: 2, width: 6, height: 4, topology: 'cylinder', lattice: 'honeycomb' }
  ]) {
    const game = new Go3D(options);
    const robot = chooseGo3DRobotMove(game, 1);
    assert.ok(robot.move, `3D/topology Go robot should move for ${options.topology}/${options.lattice}`);
    const applied = robot.move.type === 'pass'
      ? game.pass(game.currentPlayer)
      : game.tryPlay(robot.move.coord, game.currentPlayer);
    assert.equal(applied.ok, true, `robot move should apply for ${options.topology}/${options.lattice}`);
  }
}

function verifyStrategicLayerDoesNotUseVisualDistanceAsLegality() {
  const game = new Go3D({ dimension: 2, width: 5, height: 4, topology: 't2', lattice: 'honeycomb' });
  const move = { type: 'play', coord: game.playableCoords()[0], captured: 0, liberties: 3 };
  const score = scoreGoStrategicMove(game, move, 'black', { COLORS: COLORS_3D, valueToColor: valueToColor3D, otherColor: other3D });
  assert.equal(Number.isFinite(score), true, `graph strategy score must be finite for ${key(move.coord)}`);
}

verifyAtariCapturePriority2D();
verifyAtariSavePriority2D();
verifyGraphTopologyMoveIsLegal3D();
verifyStrategicLayerDoesNotUseVisualDistanceAsLegality();

console.log('Go robot strategy verification passed.');

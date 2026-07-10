import assert from 'node:assert/strict';
import { HexGame, HEX_COLORS } from '../js/hex/HexGame.js';
import { analyzeHexRobotPosition, chooseHexRobotMove } from '../js/hex/HexRobot.js';

function key(coord) {
  return coord.join(',');
}

function distance(a, b) {
  return Math.hypot(...a.map((value, index) => value - b[index]));
}

{
  const game = new HexGame({ dimension: 2, size: 7, topology: 'open', lattice: 'hexagonal' });
  const result = chooseHexRobotMove(game, { level: 2 });
  assert.ok(result?.coordinate, 'Hex opening robot must choose a move');
  assert.equal(game.isLegalPlacement(result.coordinate), true, 'Hex opening robot move must be legal');
  assert.ok(distance(result.coordinate, [3, 3]) <= 2.25, `Hex opening should prefer central connection pressure, got ${key(result.coordinate)}`);

  const analysis = analyzeHexRobotPosition(game, { level: 2, limit: 4 });
  assert.ok(analysis?.topMoves?.length, 'Hex analysis must return top moves');
  assert.equal(analysis.topMoves.every((move) => game.isLegalPlacement(move.coordinate)), true, 'Hex analysis top moves must be legal');
}

{
  const game = new HexGame({ dimension: 2, size: 3, topology: 'open', lattice: 'hexagonal' });
  game.setCell([0, 1], HEX_COLORS.BLACK);
  game.setCell([1, 1], HEX_COLORS.BLACK);
  game.currentColor = HEX_COLORS.BLACK;

  const result = chooseHexRobotMove(game, { level: 4 });
  assert.deepEqual(result?.coordinate, [2, 1], 'Hex robot must complete immediate black connection');
  assert.equal(result.reason, 'win', 'Immediate connection should be reported as a win');
  assert.equal(game.play(result.coordinate).winner, HEX_COLORS.BLACK, 'Immediate robot win must apply');
}

{
  const game = new HexGame({ dimension: 2, size: 3, topology: 'open', lattice: 'hexagonal' });
  game.setCell([1, 0], HEX_COLORS.WHITE);
  game.setCell([1, 1], HEX_COLORS.WHITE);
  game.currentColor = HEX_COLORS.BLACK;

  const result = chooseHexRobotMove(game, { level: 4 });
  const acceptedBlocks = new Set(['1,2', '2,2']);
  assert.ok(acceptedBlocks.has(key(result?.coordinate || [])), `Hex robot must block immediate white connection, got ${key(result?.coordinate || [])}`);
  assert.equal(result.reason, 'block', 'Immediate opponent connection should be reported as a block');
  assert.equal(game.isLegalPlacement(result.coordinate), true, 'Immediate block must be legal');
}

for (const options of [
  { dimension: 2, size: 8, topology: 'torus', lattice: 'triangular' },
  { dimension: 3, size: 4, topology: 'cube', lattice: 'cubic' },
  { dimension: 3, size: 5, topology: 'sphere', lattice: 'geodesic' },
  { dimension: 3, size: 6, topology: 'trefoil_tube', lattice: 'honeycomb' }
]) {
  const game = new HexGame(options);
  const result = chooseHexRobotMove(game, { level: 3 });
  assert.ok(result?.coordinate, `Hex robot must choose a move for ${JSON.stringify(options)}`);
  assert.equal(game.isLegalPlacement(result.coordinate), true, `Hex robot move must be legal for ${JSON.stringify(options)}`);
  assert.equal(game.play(result.coordinate).ok, true, `Hex robot move must apply for ${JSON.stringify(options)}`);
}

console.log('Hex robot strategy verification passed.');

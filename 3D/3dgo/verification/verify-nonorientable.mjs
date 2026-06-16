import assert from 'node:assert/strict';
import { GoGameLogic } from '../js/GoGame.js';
import {
  MOBIUS_GO_TOPOLOGY,
  RP2_GO_TOPOLOGY,
  mobiusNeighbors,
  normalizeMobius,
  normalizeRP2,
  rp2Neighbors
} from '../js/NonOrientableGoTopology.js';

assert.deepEqual(normalizeMobius(-1, 0, 5, 4), [4, 3], 'Mobius horizontal wrap must flip y.');
assert.equal(normalizeMobius(0, -1, 5, 4), null, 'Mobius vertical edge is open.');
assert.deepEqual(normalizeRP2(-1, 0, 5, 4), [4, 3], 'RP2 left crossing must antipodally flip y.');
assert.deepEqual(normalizeRP2(0, -1, 5, 4), [4, 3], 'RP2 bottom crossing must antipodally flip x.');

for (const topology of [MOBIUS_GO_TOPOLOGY, RP2_GO_TOPOLOGY]) {
  const game = new GoGameLogic({ size: 5, width: 5, height: 4, dimension: 2, topology });
  assert.equal(game.playableCoords().length, 20, `${topology} should expose width*height playable nodes.`);
  assert.equal(game.tryPlay([0, 0], 'black').ok, true, `${topology} should accept first legal move.`);
  assert.equal(game.tryPlay([1, 0], 'white').ok, true, `${topology} should accept adjacent response.`);
  assert.ok(game.neighborsFromCoord([0, 0]).length >= 3, `${topology} should expose nontrivial graph neighbors.`);
}

assert.equal(mobiusNeighbors([0,0], 5, 4).some(([x,y]) => x === 4 && y === 3), true, 'Mobius neighbor should cross twisted seam.');
assert.equal(rp2Neighbors([0,0], 5, 4).some(([x,y]) => x === 4 && y === 3), true, 'RP2 neighbor should cross antipodal seam.');
console.log('Mobius/RP2 3D Go topology verification passed.');

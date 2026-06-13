import assert from 'node:assert/strict';
import { CliffordReversiGame } from '../../js/localgames/CliffordReversi.js';
import { AnyonJumpGame } from '../../js/localgames/AnyonJump.js';
import { createGraphTopology } from '../../js/topology/GraphTopologies.js';
import { nextRequiredUnbraidGenerator } from '../../js/anyon/BraidMemory.js';

const klein = createGraphTopology({ topology: 'klein_bottle', width: 6, height: 6 });
assert.deepEqual(klein.normalize([2, 6]), [3, 0], 'Klein vertical crossing flips x.');
const seamStep = klein.step([2, 5], [0, 1]);
assert.equal(seamStep.edge.transport, 'H', 'Klein seam carries Clifford H.');
assert.equal(klein.seamTransform(seamStep.edge), 'twist', 'Klein seam carries anyon twist automorphism.');

const reversi = new CliffordReversiGame({ topology: { topology: 'torus', width: 8, height: 8 } });
const preview = reversi.previewMove([2, 3], 'black', 'H');
assert.equal(preview.legal, true, 'Black has a standard bracket move.');
assert.equal(preview.flips.length, 1, 'One opponent stone is bracketed.');
assert.equal(preview.flips[0].after.pauliLabel, 'Z', 'H maps flipped X to Z.');
const placed = reversi.place([2, 3], { player: 'black', pauliLabel: 'Y', transform: 'H' });
assert.equal(placed.ok, true, 'Clifford Reversi move succeeds.');
assert.equal(reversi.getStone([3, 3]).color, 'black', 'Bracketed stone flips color.');

const signedReversi = new CliffordReversiGame({
    topology: { topology: 'torus', width: 8, height: 8 },
    trackPhaseSigns: true
});
const signedPreview = signedReversi.previewMove([5, 3], 'white', 'S');
assert.equal(signedPreview.legal, true, 'White can bracket the initial black Y stone.');
assert.equal(signedPreview.flips[0].after.pauliLabel, 'X', 'S maps Y to X in binary Pauli labels.');
assert.equal(signedPreview.flips[0].after.pauliSign, -1, 'Phase-sign mode records S:Y -> -X.');

const jump = new AnyonJumpGame({ topology: { topology: 'torus', width: 4, height: 4 } });
jump.tokens.clear();
jump.worldlines.clear();
jump.addToken({ id: 'b1', owner: 'black', coord: [0, 0], anyonType: 'e' });
jump.addToken({ id: 'w1', owner: 'white', coord: [1, 0], anyonType: 'm' });
const jumpResult = jump.move('b1', [2, 0]);
assert.equal(jumpResult.ok, true, 'Anyon jump over adjacent token succeeds.');
assert.equal(jump.braidTokens.black, 1, 'Jumping e over m adds one braid token.');
assert.equal(jump.exportState().history[0].winding.x, 0, 'Local non-wrapping jump has zero x winding.');

const exact = new AnyonJumpGame({
    topology: { topology: 'torus', width: 4, height: 4 },
    config: { braidMemoryMode: 'word_exact' }
});
exact.tokens.clear();
exact.worldlines.clear();
exact.addToken({ id: 'b1', owner: 'black', coord: [0, 0], anyonType: 'e' });
exact.addToken({ id: 'w1', owner: 'white', coord: [1, 0], anyonType: 'm' });
const exactJump = exact.move('b1', [2, 0]);
assert.equal(exactJump.ok, true, 'Word-exact jump succeeds.');
const nextInverse = nextRequiredUnbraidGenerator(exact.tokens.get('b1').braidWord);
exact.currentPlayer = 'black';
const unbraid = exact.attemptUnbraid('b1', 'w1', {
    player: 'black',
    sign: nextInverse.sign,
    index: nextInverse.index
});
assert.equal(unbraid.ok, true, 'Explicit inverse unbraid action succeeds.');
assert.equal(unbraid.event.unbraid.successfulPartialUnbraid, true, 'Word-exact inverse cancels the latest braid generator.');
assert.equal(exact.tokens.get('b1').braidWord.length, 0, 'Full unbraid leaves the braid word trivial.');

const twist = new AnyonJumpGame({ topology: { topology: 'klein_bottle', width: 4, height: 4 } });
twist.tokens.clear();
twist.worldlines.clear();
twist.addToken({ id: 'k1', owner: 'black', coord: [1, 3], anyonType: 'e' });
const twistMove = twist.move('k1', [2, 0]);
assert.equal(twistMove.ok, true, 'Klein seam hop succeeds.');
assert.equal(twist.tokens.get('k1').anyonType, 'm', 'Klein twist seam maps e to m.');

console.log('Algebraic local game verification passed.');

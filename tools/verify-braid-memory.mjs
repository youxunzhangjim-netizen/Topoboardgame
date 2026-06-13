import assert from 'node:assert/strict';
import {
    appendBraidGenerator,
    attemptUnbraid,
    attachBraidMemory,
    braidGeneratorIndex,
    fullInverseBraidWord,
    generatorsAreInverse,
    inverseGenerator,
    nextRequiredUnbraidGenerator,
    simplifyBraidWord
} from '../js/anyon/BraidMemory.js';
import { detectTopologyBraidEvents } from '../js/anyon/BraidPathDetector.js';
import { createRectTorusTopology } from '../js/anyon/AnyonTopology.js';
import { createToricAnyonLoopsGame } from '../js/anyon/AnyonEngine.js';
import { AnyonJumpGame } from '../js/localgames/AnyonJump.js';
import { createGraphTopology } from '../js/topology/GraphTopologies.js';

const generator = { generator: 'sigma', index: 2, sign: 1, targetId: 'm1', tick: 7 };
const inverse = inverseGenerator(generator);
assert.deepEqual(inverse, { ...generator, sign: -1 });
assert.equal(generatorsAreInverse(generator, inverse), true);
assert.equal(generatorsAreInverse(generator, { ...inverse, targetId: 'other' }), false);
assert.deepEqual(simplifyBraidWord([generator, inverse]), []);
assert.deepEqual(simplifyBraidWord([inverse, generator]), []);
assert.deepEqual(simplifyBraidWord([
    generator,
    { generator: 'sigma', index: 3, sign: 1, targetId: 'm1', tick: 8 },
    inverse
]).map((entry) => entry.index), [2, 3, 2], 'Non-adjacent inverse pairs do not cancel.');

const word = [
    { generator: 'sigma', index: 1, sign: 1, targetId: 'a', tick: 1 },
    { generator: 'sigma', index: 2, sign: 1, targetId: 'b', tick: 2 },
    { generator: 'sigma', index: 1, sign: 1, targetId: 'a', tick: 3 }
];
assert.deepEqual(fullInverseBraidWord(word), [
    { generator: 'sigma', index: 1, sign: -1, targetId: 'a', tick: 3 },
    { generator: 'sigma', index: 2, sign: -1, targetId: 'b', tick: 2 },
    { generator: 'sigma', index: 1, sign: -1, targetId: 'a', tick: 1 }
]);
assert.deepEqual(nextRequiredUnbraidGenerator(word), { generator: 'sigma', index: 1, sign: -1, targetId: 'a', tick: 3 });

const token = attachBraidMemory({ id: 'e1', owner: 'black', anyonType: 'e', vertex: [0, 0] });
assert.equal(token.isBraided, false);
appendBraidGenerator(token, generator);
assert.equal(token.isBraided, true);
assert.equal(token.braidWord.length, 1);
assert.deepEqual(token.braidedWith, ['m1']);
appendBraidGenerator(token, inverse);
assert.equal(token.isBraided, false);
assert.equal(token.braidWord.length, 0);
assert.equal(token.braidHistory.length, 2, 'History preserves both events after word cancellation.');

const orderedToken = attachBraidMemory({ id: 'ordered', owner: 'black', anyonType: 'e', vertex: [0, 0] });
for (const entry of word) appendBraidGenerator(orderedToken, entry);
const wrong = attemptUnbraid(orderedToken, { generator: 'sigma', index: 2, sign: -1, targetId: 'b', tick: 4 });
assert.equal(wrong.successfulPartialUnbraid, false);
assert.equal(wrong.wrongOrder, true);
assert.equal(orderedToken.braidWord.length, 4, 'Wrong unbraid order appends instead of clearing.');
const wrongInverse = inverseGenerator(wrong.attempted);
const wrongRepair = attemptUnbraid(orderedToken, wrongInverse);
assert.equal(wrongRepair.successfulPartialUnbraid, true, 'The wrong attempt can itself be unbraided by its inverse.');
for (const entry of fullInverseBraidWord(word)) {
    const result = attemptUnbraid(orderedToken, entry);
    assert.equal(result.successfulPartialUnbraid, true);
}
assert.equal(orderedToken.isBraided, false, 'Full reverse inverse sequence empties the braid word.');

const parityToken = attachBraidMemory({ id: 'p1', owner: 'black', anyonType: 'e', vertex: [0, 0] });
const parityFirst = appendBraidGenerator(parityToken, generator, { braidMemoryMode: 'abelian_parity' });
assert.equal(parityFirst.braidParity, 1);
assert.equal(parityToken.isBraided, true);
const paritySecond = appendBraidGenerator(parityToken, inverse, { braidMemoryMode: 'abelian_parity' });
assert.equal(paritySecond.braidParity, 0);
assert.equal(parityToken.braidWord.length, 0, 'Abelian parity mode toggles matching generators.');
assert.equal(parityToken.braidHistory.length, 2, 'Abelian mode keeps a braid event log.');
assert.equal(parityToken.isBraided, false);

assert.equal(braidGeneratorIndex(['c', 'a', 'b'], 'c', 'b'), 1);

const detectorTorus = createRectTorusTopology({ width: 4, height: 4 });
assert.equal(detectTopologyBraidEvents({
    movingToken: { id: 'plain' },
    topology: detectorTorus,
    path: [[0, 0], [1, 0]],
    tokenIds: ['plain']
}).length, 0, 'Ordinary non-wrapping movement does not braid.');
const torusEvents = detectTopologyBraidEvents({
    movingToken: { id: 'wrap' },
    topology: detectorTorus,
    path: [[3, 0], [0, 0]],
    tokenIds: ['wrap']
});
assert.equal(torusEvents.length, 1);
assert.equal(torusEvents[0].targetId, 'cycle:x');
assert.equal(torusEvents[0].sign, -1);

const klein = createGraphTopology({ topology: 'klein_bottle', width: 4, height: 4 });
const kleinStep = klein.step([1, 3], [0, 1]);
const kleinEvents = detectTopologyBraidEvents({
    movingToken: { id: 'k' },
    topology: klein,
    path: [[1, 3], kleinStep.coord],
    edges: [kleinStep.edge],
    directions: [[0, 1]],
    tokenIds: ['k']
});
assert.equal(kleinEvents.length, 1);
assert.equal(kleinEvents[0].reason, 'twisted_seam');
assert.equal(kleinEvents[0].targetId, 'branch_cut:y');

const hookEvents = detectTopologyBraidEvents({
    movingToken: { id: 'mover' },
    topology: {
        normalize: (vertex) => vertex,
        detectLocalEncirclement: () => true
    },
    path: [[0, 0], [2, 0], [2, 2], [0, 0]],
    targets: [{ id: 'defect-1', vertex: [1, 1], defect: true }],
    tokenIds: ['mover', 'defect-1']
});
assert.equal(hookEvents.length, 1);
assert.equal(hookEvents[0].reason, 'defect_encirclement');

const jump = new AnyonJumpGame({ topology: { topology: 'torus', width: 4, height: 4 } });
jump.tokens.clear();
jump.worldlines.clear();
jump.addToken({ id: 'b1', owner: 'black', coord: [0, 0], anyonType: 'e' });
jump.addToken({ id: 'w1', owner: 'white', coord: [1, 0], anyonType: 'm' });
const jumpResult = jump.move('b1', [2, 0]);
assert.equal(jumpResult.ok, true);
assert.equal(jump.config.braidMemoryMode, 'abelian_parity');
assert.equal(jump.tokens.get('b1').braidParity, 1);
assert.equal(jump.tokens.get('b1').braidWord.length, 1);
assert.equal(jump.tokens.get('b1').braidedWith[0], 'w1');
assert.equal(jump.exportState().tokens.find((entry) => entry.id === 'b1').isBraided, true);
const jumpUnbraid = jump.attemptUnbraid('b1', 'w1', { player: 'black', sign: -1 });
assert.equal(jumpUnbraid.ok, true);
assert.equal(jumpUnbraid.event.kind, 'attempt_unbraid');
assert.equal(jumpUnbraid.event.unbraid.successfulPartialUnbraid, true);
assert.equal(jump.tokens.get('b1').braidParity, 0);
assert.equal(jump.tokens.get('b1').isBraided, false);

const trivialJump = new AnyonJumpGame({ topology: { topology: 'torus', width: 4, height: 4 } });
trivialJump.tokens.clear();
trivialJump.worldlines.clear();
trivialJump.addToken({ id: 'e1', owner: 'black', coord: [0, 0], anyonType: 'e' });
trivialJump.addToken({ id: 'e2', owner: 'white', coord: [1, 0], anyonType: 'e' });
const trivialResult = trivialJump.move('e1', [2, 0]);
assert.equal(trivialResult.ok, true);
assert.equal(trivialJump.tokens.get('e1').braidParity, 0, 'e around e is trivial in abelian parity mode.');
assert.equal(trivialJump.tokens.get('e1').isBraided, false);
assert.equal(trivialResult.event.braid.skipped, 'abelian_trivial_mutual_braid');

const loopGame = createToricAnyonLoopsGame({ width: 4, height: 4 });
loopGame.addToken({ id: 'e1', owner: 'black', vertex: [3, 0], anyonType: 'e' });
loopGame.addToken({ id: 'm1', owner: 'white', vertex: [1, 0], anyonType: 'm' });
const loopMove = loopGame.moveToken('e1', [0, 0], { player: 'black' });
assert.equal(loopMove.ok, true);
assert.equal(loopGame.tokens.get('e1').braidWord.length, 1);
assert.equal(loopGame.tokens.get('e1').braidWord[0].targetId, 'cycle:x');
assert.equal(loopGame.exportState().tokens.find((entry) => entry.id === 'e1').isBraided, true);
const loopUnbraid = loopGame.attemptUnbraid('e1', 'cycle:x', { player: 'black', sign: 1 });
assert.equal(loopUnbraid.ok, true);
assert.equal(loopUnbraid.event.unbraid.fullyUnbraided, true);

console.log('Braid memory verification passed.');

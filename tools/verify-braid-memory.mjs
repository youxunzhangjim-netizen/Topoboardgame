import assert from 'node:assert/strict';
import {
    appendBraidGenerator,
    attemptUnbraid,
    attachBraidMemory,
    braidGeneratorToText,
    braidGeneratorIndex,
    braidWordToText,
    fullInverseBraidWord,
    generatorsAreInverse,
    inverseGenerator,
    nextRequiredUnbraidGenerator,
    requiredInverseBraidWordText,
    simplifyBraidWord
} from '../js/anyon/BraidMemory.js';
import {
    braidedChessCaptureStatus,
    canCaptureBraidedEntity,
    grantCaptureUnlock,
    movementPenaltyActive
} from '../js/anyon/BraidedCapture.js';
import { detectTopologyBraidEvents } from '../js/anyon/BraidPathDetector.js';
import { createRectTorusTopology } from '../js/anyon/AnyonTopology.js';
import { createToricAnyonLoopsGame } from '../js/anyon/AnyonEngine.js';
import {
    fusionChannelDisplay,
    nonabelianFusionChannels
} from '../js/anyon/NonabelianFusionMemory.js';
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
assert.equal(braidGeneratorToText({ generator: 'sigma', index: 0, sign: 1 }), 'σ1');
assert.equal(braidGeneratorToText({ generator: 'sigma', index: 0, sign: -1 }), 'σ1^-1');
assert.equal(braidWordToText(word), 'σ2 σ3 σ2');
assert.equal(requiredInverseBraidWordText(word), 'σ2^-1 σ3^-1 σ2^-1');

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

const exactToken = attachBraidMemory({ id: 'exact', owner: 'black', anyonType: 'e', vertex: [0, 0] });
appendBraidGenerator(exactToken, { generator: 'sigma', index: 0, sign: 1, targetId: 'a' }, { braidMemoryMode: 'word_exact' });
appendBraidGenerator(exactToken, { generator: 'sigma', index: 1, sign: 1, targetId: 'b' }, { braidMemoryMode: 'word_exact' });
appendBraidGenerator(exactToken, { generator: 'sigma', index: 0, sign: 1, targetId: 'a' }, { braidMemoryMode: 'word_exact' });
assert.equal(braidWordToText(exactToken.braidWord), 'σ1 σ2 σ1');
assert.equal(requiredInverseBraidWordText(exactToken.braidWord), 'σ1^-1 σ2^-1 σ1^-1');
const wrongExact = attemptUnbraid(exactToken, { generator: 'sigma', index: 1, sign: -1, targetId: 'b' }, { braidMemoryMode: 'word_exact' });
assert.equal(wrongExact.successfulPartialUnbraid, false);
assert.equal(wrongExact.wrongOrder, true);
assert.equal(exactToken.braidWord.length, 4, 'Wrong exact-word inverse attempts append.');

assert.deepEqual(nonabelianFusionChannels('sigma', 'sigma', 'ising'), ['1', 'psi']);
assert.deepEqual(nonabelianFusionChannels('tau', 'tau', 'fibonacci'), ['1', 'tau']);
const nonabelianConfig = { braidMemoryMode: 'nonabelian_fusion_channel', anyonModel: 'ising' };
const sigmaToken = attachBraidMemory(
    { id: 's1', owner: 'black', anyonType: 'sigma', vertex: [0, 0] },
    {},
    nonabelianConfig
);
const sigmaTarget = { id: 's2', owner: 'white', anyonType: 'sigma', vertex: [1, 0] };
const sigmaBraid = appendBraidGenerator(
    sigmaToken,
    { generator: 'sigma', index: 0, sign: 1, targetId: 's2' },
    nonabelianConfig,
    { target: sigmaTarget }
);
assert.equal(sigmaBraid.fusionChannelUpdate.beforeChannel, '1');
assert.equal(sigmaBraid.fusionChannelUpdate.afterChannel, 'psi');
assert.equal(fusionChannelDisplay(sigmaToken), '?', 'Non-Abelian fusion channel stays hidden until measured.');
const sigmaWrong = attemptUnbraid(
    sigmaToken,
    { generator: 'sigma', index: 0, sign: 1, targetId: 's2' },
    nonabelianConfig,
    { target: sigmaTarget }
);
assert.equal(sigmaWrong.successfulPartialUnbraid, false);
assert.equal(sigmaWrong.fusionChannelUpdate.afterChannel, '1', 'Wrong non-Abelian unbraid changes the hidden state further.');
const sigmaRepairWrong = attemptUnbraid(
    sigmaToken,
    { generator: 'sigma', index: 0, sign: -1, targetId: 's2' },
    nonabelianConfig,
    { target: sigmaTarget }
);
assert.equal(sigmaRepairWrong.successfulPartialUnbraid, true);
assert.equal(sigmaRepairWrong.fusionChannelUpdate.currentChannel, 'psi', 'Inverse of the wrong step restores the previous hidden channel.');
const sigmaFullInverse = attemptUnbraid(
    sigmaToken,
    { generator: 'sigma', index: 0, sign: -1, targetId: 's2' },
    nonabelianConfig,
    { target: sigmaTarget }
);
assert.equal(sigmaFullInverse.fullyUnbraided, true);
assert.equal(sigmaFullInverse.fusionChannelUpdate.currentChannel, '1', 'Full inverse sequence restores the original fusion channel.');

const fibonacciToken = attachBraidMemory(
    { id: 't1', owner: 'black', anyonType: 'tau', vertex: [0, 0] },
    {},
    { braidMemoryMode: 'nonabelian_fusion_channel', anyonModel: 'fibonacci' }
);
const fibonacciBraid = appendBraidGenerator(
    fibonacciToken,
    { generator: 'sigma', index: 0, sign: 1, targetId: 't2' },
    { braidMemoryMode: 'nonabelian_fusion_channel', anyonModel: 'fibonacci' },
    { target: { id: 't2', anyonType: 'tau' } }
);
assert.equal(fibonacciBraid.fusionChannelUpdate.afterChannel, 'tau');

const shieldedDefender = attachBraidMemory({ id: 'shielded', anyonType: 'e' }, {}, { braidMemoryMode: 'word_exact' });
appendBraidGenerator(shieldedDefender, { generator: 'sigma', index: 0, sign: 1, targetId: 'a' }, { braidMemoryMode: 'word_exact' });
assert.equal(canCaptureBraidedEntity({ id: 'attacker' }, shieldedDefender, { braidedPieceShield: true }).legal, false);
assert.equal(canCaptureBraidedEntity({ id: 'attacker' }, shieldedDefender, { captureRequiresUnbraid: true }).reason, 'capture_requires_unbraid');
const unlockedAttacker = { id: 'attacker' };
grantCaptureUnlock(unlockedAttacker, 'shielded');
assert.equal(canCaptureBraidedEntity(unlockedAttacker, shieldedDefender, { captureRequiresUnbraid: true }).legal, true);
assert.equal(movementPenaltyActive(shieldedDefender, { braidedPiecePenalty: true }), true);
assert.equal(braidedChessCaptureStatus(unlockedAttacker, shieldedDefender, { captureRequiresUnbraid: true }).legal, true);

const relationWord = simplifyBraidWord([
    { generator: 'sigma', index: 3, sign: 1, targetId: 'far' },
    { generator: 'sigma', index: 0, sign: 1, targetId: 'near' }
], { braidCancellationMode: 'braid_group_relations' });
assert.deepEqual(relationWord.map((entry) => entry.index), [0, 3], 'Far-apart generators commute in relation mode.');
const braidRelationWord = simplifyBraidWord([
    { generator: 'sigma', index: 1, sign: 1, targetId: 'b' },
    { generator: 'sigma', index: 0, sign: 1, targetId: 'a' },
    { generator: 'sigma', index: 1, sign: 1, targetId: 'b' }
], { braidCancellationMode: 'braid_group_relations' });
assert.deepEqual(braidRelationWord.map((entry) => entry.index), [0, 1, 0], 'Adjacent braid relation normalizes to the stable representative.');

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

const phaseJump = new AnyonJumpGame({
    topology: { topology: 'torus', width: 4, height: 4 },
    config: {
        phaseModel: 'zn_phase',
        generalAnyonGrade: 5,
        braidMemoryMode: 'word_exact'
    }
});
phaseJump.tokens.clear();
phaseJump.worldlines.clear();
phaseJump.addToken({ id: 'p1', owner: 'black', coord: [0, 0], anyonType: 'e' });
phaseJump.addToken({ id: 'q1', owner: 'white', coord: [1, 0], anyonType: 'm' });
const phaseMove = phaseJump.move('p1', [2, 0]);
assert.equal(phaseMove.ok, true);
assert.equal(phaseJump.tokens.get('p1').anyonPhaseDenominator, 5);
assert.equal(phaseJump.tokens.get('p1').anyonPhaseNumerator, 1, 'A positive braid adds +1/n phase.');
assert.equal(phaseMove.event.braid.anyonPhase.after.text, '+1/5');
const phaseUnbraid = phaseJump.attemptUnbraid('p1', 'q1', { player: 'black', sign: -1 });
assert.equal(phaseUnbraid.ok, true);
assert.equal(phaseJump.tokens.get('p1').anyonPhaseNumerator, 0, 'Inverse unbraid subtracts the Z_n phase.');
assert.equal(phaseUnbraid.event.anyonPhase.after.text, '0');

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

const exactJump = new AnyonJumpGame({
    topology: { topology: 'torus', width: 4, height: 4 },
    config: { braidMemoryMode: 'word_exact' }
});
exactJump.tokens.clear();
exactJump.worldlines.clear();
exactJump.addToken({ id: 'x1', owner: 'black', coord: [0, 0], anyonType: 'e' });
exactJump.addToken({ id: 'x2', owner: 'white', coord: [1, 0], anyonType: 'm' });
const exactJumpResult = exactJump.move('x1', [2, 0]);
assert.equal(exactJumpResult.ok, true);
assert.equal(exactJump.tokens.get('x1').braidWord.length, 1);
assert.equal(exactJump.tokens.get('x1').braidParity, 0, 'Word-exact mode does not use Z2 parity.');
const exactWrong = exactJump.attemptUnbraid('x1', 'x2', { player: 'black', sign: 1 });
assert.equal(exactWrong.ok, true);
assert.equal(exactWrong.event.unbraid.successfulPartialUnbraid, false);
assert.equal(exactJump.tokens.get('x1').braidWord.length, 2);
assert.equal(exactJump.exportState().statistics.failedInverseAttempts, 1);
assert.equal(exactJump.exportState().unbraidAttempts.length, 1);
const exactRepair = exactJump.attemptUnbraid('x1', 'x2', { player: 'white', sign: -1 });
assert.equal(exactRepair.ok, false, 'Only the moving token owner can unbraid.');

const chainJump = new AnyonJumpGame({
    topology: { topology: 'flat', width: 6, height: 3 },
    config: { braidMemoryMode: 'word_exact' }
});
chainJump.tokens.clear();
chainJump.worldlines.clear();
chainJump.addToken({ id: 'c1', owner: 'black', coord: [0, 1], anyonType: 'e' });
chainJump.addToken({ id: 'c2', owner: 'white', coord: [1, 1], anyonType: 'm' });
chainJump.addToken({ id: 'c3', owner: 'white', coord: [3, 1], anyonType: 'm' });
const chainResult = chainJump.chainJump('c1', [[2, 1], [4, 1]]);
assert.equal(chainResult.ok, true);
assert.equal(chainResult.events.length, 2);
assert.deepEqual(chainJump.tokens.get('c1').braidWord.map((entry) => entry.targetId), ['c2', 'c3']);
assert.equal(chainJump.currentPlayer, 'white');

const inverseJump = new AnyonJumpGame({
    topology: { topology: 'flat', width: 4, height: 3 },
    config: { braidMemoryMode: 'word_exact', captureRequiresUnbraid: true }
});
inverseJump.tokens.clear();
inverseJump.worldlines.clear();
inverseJump.addToken({ id: 'i1', owner: 'black', coord: [0, 1], anyonType: 'e' });
inverseJump.addToken({ id: 'i2', owner: 'white', coord: [1, 1], anyonType: 'm' });
assert.equal(inverseJump.move('i1', [2, 1]).ok, true);
inverseJump.currentPlayer = 'black';
const inverseResult = inverseJump.move('i1', [0, 1]);
assert.equal(inverseResult.ok, true);
assert.equal(inverseJump.tokens.get('i1').braidWord.length, 0);
assert.equal(inverseResult.event.braid.unbraid.successfulPartialUnbraid, true);
assert.equal(inverseJump.tokens.get('i1').captureUnlocks.includes('i2'), true);
const inverseExport = inverseJump.exportState();
assert.ok(inverseExport.initialState, 'Research export includes initial state.');
assert.ok(inverseExport.finalState, 'Research export includes final state.');
assert.ok(inverseExport.braidEventLog.length >= 2, 'Research export includes braid/unbraid event log.');
assert.equal(inverseExport.braidEventLog.at(-1).movingTokenId, 'i1');
assert.equal(inverseExport.braidEventLog.at(-1).targetId, 'i2');
assert.deepEqual(inverseExport.braidEventLog.at(-1).braidWordAfter, []);
assert.equal(inverseExport.braidEventLog.at(-1).cancellationOccurred, true);
assert.equal(inverseExport.statistics.totalBraids, 1);
assert.equal(inverseExport.statistics.successfulUnbraids >= 1, true);
assert.equal(inverseExport.statistics.finalNumberOfBraidedPieces, 0);
assert.ok(Array.isArray(inverseExport.windingNumbers), 'Research export includes winding numbers.');

const shieldJump = new AnyonJumpGame({
    topology: { topology: 'flat', width: 4, height: 3 },
    config: { braidMemoryMode: 'word_exact', braidedPieceShield: true }
});
shieldJump.tokens.clear();
shieldJump.worldlines.clear();
shieldJump.fusionSites.add('2,1');
shieldJump.addToken({ id: 'sA', owner: 'black', coord: [0, 1], anyonType: 'e' });
shieldJump.addToken({ id: 'sOver', owner: 'white', coord: [1, 1], anyonType: 'm' });
shieldJump.addToken({ id: 'sD', owner: 'white', coord: [2, 1], anyonType: 'm' });
appendBraidGenerator(shieldJump.tokens.get('sD'), { generator: 'sigma', index: 0, sign: 1, targetId: 'x' }, shieldJump.config);
assert.equal(shieldJump.legalActionsForToken('sA').some((action) => action.to[0] === 2 && action.to[1] === 1), false);

const unlockJump = new AnyonJumpGame({
    topology: { topology: 'flat', width: 4, height: 3 },
    config: { braidMemoryMode: 'word_exact', captureRequiresUnbraid: true }
});
unlockJump.tokens.clear();
unlockJump.worldlines.clear();
unlockJump.fusionSites.add('2,1');
unlockJump.addToken({ id: 'uA', owner: 'black', coord: [0, 1], anyonType: 'e' });
unlockJump.addToken({ id: 'uOver', owner: 'white', coord: [1, 1], anyonType: 'm' });
unlockJump.addToken({ id: 'uD', owner: 'white', coord: [2, 1], anyonType: 'm' });
appendBraidGenerator(unlockJump.tokens.get('uD'), { generator: 'sigma', index: 0, sign: 1, targetId: 'x' }, unlockJump.config);
appendBraidGenerator(unlockJump.tokens.get('uA'), { generator: 'sigma', index: 0, sign: 1, targetId: 'uD' }, unlockJump.config, { target: unlockJump.tokens.get('uD') });
const unlockResult = unlockJump.attemptUnbraid('uA', 'uD', { player: 'black', sign: -1, index: 0 });
assert.equal(unlockResult.ok, true);
assert.equal(unlockResult.event.captureUnlockGranted, true);
unlockJump.currentPlayer = 'black';
assert.equal(unlockJump.legalActionsForToken('uA').some((action) => action.to[0] === 2 && action.to[1] === 1), true);

const penaltyJump = new AnyonJumpGame({
    topology: { topology: 'flat', width: 4, height: 3 },
    config: { braidMemoryMode: 'word_exact', braidedPiecePenalty: true }
});
penaltyJump.tokens.clear();
penaltyJump.worldlines.clear();
penaltyJump.addToken({ id: 'pA', owner: 'black', coord: [0, 1], anyonType: 'e' });
penaltyJump.addToken({ id: 'pOver', owner: 'white', coord: [1, 1], anyonType: 'm' });
appendBraidGenerator(penaltyJump.tokens.get('pA'), { generator: 'sigma', index: 0, sign: 1, targetId: 'pOver' }, penaltyJump.config);
const penaltyActions = penaltyJump.legalActionsForToken('pA');
assert.equal(penaltyActions.some((action) => action.kind === 'jump'), false, 'Braided penalty removes jump movement.');
assert.equal(penaltyActions.some((action) => action.kind === 'move'), true, 'Braided penalty still allows simple hops.');

const nonabelianJump = new AnyonJumpGame({
    topology: { topology: 'torus', width: 4, height: 4 },
    config: { braidMemoryMode: 'nonabelian_fusion_channel', anyonModel: 'ising' },
    probability: { measurementErrorRate: 0 }
});
nonabelianJump.tokens.clear();
nonabelianJump.worldlines.clear();
nonabelianJump.addToken({ id: 'n1', owner: 'black', coord: [0, 0], anyonType: 'sigma' });
nonabelianJump.addToken({ id: 'n2', owner: 'white', coord: [1, 0], anyonType: 'sigma' });
const nonabelianJumpResult = nonabelianJump.move('n1', [2, 0]);
assert.equal(nonabelianJumpResult.ok, true);
assert.equal(nonabelianJump.tokens.get('n1').braidWord.length, 1);
assert.equal(nonabelianJump.tokens.get('n1').hiddenFusionState.currentChannel, 'psi');
assert.equal(nonabelianJump.tokens.get('n1').fusionChannel, '?');
const nonabelianMeasurement = nonabelianJump.measureAnyonCharge(['n1'], 'black');
assert.equal(nonabelianMeasurement.ok, true);
assert.equal(nonabelianMeasurement.measurement.reported, 'psi');
assert.equal(nonabelianJump.tokens.get('n1').fusionChannel, 'psi');

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

const shieldEngine = createToricAnyonLoopsGame({
    width: 4,
    height: 4,
    config: { braidMemoryMode: 'word_exact', braidedPieceShield: true }
});
shieldEngine.addToken({ id: 'se1', owner: 'black', vertex: [0, 0], anyonType: 'e' });
shieldEngine.addToken({ id: 'se2', owner: 'white', vertex: [1, 0], anyonType: 'm' });
appendBraidGenerator(shieldEngine.tokens.get('se2'), { generator: 'sigma', index: 0, sign: 1, targetId: 'shield' }, shieldEngine.config);
const shieldMove = shieldEngine.moveToken('se1', [1, 0], { player: 'black' });
assert.equal(shieldMove.ok, false);
assert.equal(shieldMove.error, 'braided_piece_shield');

console.log('Braid memory verification passed.');

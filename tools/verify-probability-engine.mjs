import assert from 'node:assert/strict';
import { ProbabilityEngine } from '../js/probability/ProbabilityEngine.js';
import { SeededRandom } from '../js/probability/SeededRandom.js';
import { CliffordReversiGame } from '../js/localgames/CliffordReversi.js';
import { AnyonJumpGame } from '../js/localgames/AnyonJump.js';

const first = new SeededRandom('same-seed');
const second = new SeededRandom('same-seed');
assert.equal(first.next(), second.next(), 'Seeded RNG must replay the same first draw.');
assert.equal(first.integer(99), second.integer(99), 'Seeded RNG integer draws must replay.');

const reversi = new CliffordReversiGame({
    topology: { topology: 'flat', width: 8, height: 8 },
    probability: {
        enabled: true,
        seed: 'pauli-noise',
        noiseMode: 'pauli',
        noiseRate: 1,
        measurementErrorRate: 0,
        pauliNoiseType: 'bitFlipNoise',
        applyNoise: 'after_floquet_cycle'
    }
});
const before = reversi.exportState().board.map((stone) => stone.pauliLabel).join('');
const pauliEvents = reversi.applyNoiseCycle({ player: 'black', trigger: 'manual' });
const after = reversi.exportState().board.map((stone) => stone.pauliLabel).join('');
assert.equal(pauliEvents.length, 4, 'Pauli noise should roll once for each opening stone.');
assert.notEqual(before, after, 'Bit-flip noise should change at least one Pauli label at p=1.');

const measured = reversi.measurePauliParity([3, 3], 'black');
assert.equal(measured.ok, true);
assert.equal(reversi.probability.measurements.length, 1);
assert.equal(reversi.probability.randomEvents.at(-1).type, 'measurement_error:pauli_parity');

const replayA = new CliffordReversiGame({
    topology: { topology: 'flat', width: 8, height: 8 },
    probability: { enabled: true, seed: 'replay', noiseMode: 'pauli', noiseRate: 0.5, pauliNoiseType: 'depolarizingNoise' }
});
const replayB = new CliffordReversiGame({
    topology: { topology: 'flat', width: 8, height: 8 },
    probability: { enabled: true, seed: 'replay', noiseMode: 'pauli', noiseRate: 0.5, pauliNoiseType: 'depolarizingNoise' }
});
replayA.applyNoiseCycle({ player: 'black' });
replayB.applyNoiseCycle({ player: 'black' });
assert.deepEqual(replayA.probability.randomEvents, replayB.probability.randomEvents, 'Same seed and same state must replay noise logs.');

const anyon = new AnyonJumpGame({
    topology: { topology: 'torus', width: 8, height: 8 },
    probability: {
        enabled: true,
        seed: 'anyon-pair',
        noiseMode: 'anyon_pair_creation',
        noiseRate: 1,
        measurementErrorRate: 0,
        applyNoise: 'after_floquet_cycle'
    }
});
const tokenCount = anyon.tokens.size;
const pairEvents = anyon.applyNoiseCycle({ player: 'black', trigger: 'manual' });
assert.equal(pairEvents.length, 1, 'Anyon pair noise should log one pair-creation roll.');
assert.equal(pairEvents[0].outcome.applied, true, 'Pair creation should apply at p=1 when empty neighbor pairs exist.');
assert.equal(anyon.tokens.size, tokenCount + 2, 'Pair creation should add two anyons.');

const selected = pairEvents[0].affectedTokens.slice(0, 2);
const charge = anyon.measureAnyonCharge(selected, 'black');
assert.equal(charge.ok, true);
assert.equal(anyon.probability.measurements.at(-1).type, 'anyon_total_charge');

const exported = anyon.exportState();
assert.equal(exported.probability.config.seed, 'anyon-pair');
assert.equal(exported.probability.summaryStatistics.numberOfMeasurements, 1);

const engine = new ProbabilityEngine({ seed: 'standalone', noiseMode: 'measurement_error', measurementErrorRate: 1 });
const defect = engine.detectDefect({ vertices: [[0, 0]], player: 'black' });
assert.equal(defect.error, true, 'Defect measurement should log deterministic error at q=1.');

console.log('Probability/noise/measurement engine verification passed.');

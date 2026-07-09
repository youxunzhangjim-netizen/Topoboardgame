import assert from 'node:assert/strict';
import { createBoardSpec } from '../js/shared/BoardSpec.js';
import {
    checkLabBoardCompatibility,
    explainLabBoardMismatch,
    registerLabCompatibility
} from '../js/labs/LabBoardCompatibility.js';
import {
    cancelLab,
    getLabPerformanceStats,
    initializeLabSafely,
    resetLabPerformanceStats,
    resumeLab,
    runLabStepSafely,
    runManyStepsSafely
} from '../js/labs/SafeLabRunner.js';

function graphBoard() {
    return createBoardSpec({
        id: 'verify.safe-lab.graph',
        nameEn: 'Safe Lab Graph',
        nameZh: '安全 Lab 圖',
        dimension: 2,
        playableKind: 'vertex',
        space: { id: 'r2', nameEn: 'Euclidean Plane R2', nameZh: '歐氏平面 R2' },
        lattice: { id: 'square', nameEn: 'Square Lattice', nameZh: '方格晶格' },
        boundary: { id: 'hard', nameEn: 'Hard Boundary', nameZh: '硬邊界' },
        sites: [
            { id: 'a', coord: { x: 0 } },
            { id: 'b', coord: { x: 1 } }
        ],
        edges: [{ source: 'a', target: 'b' }],
        directions: ['x']
    });
}

function emptyBoard() {
    return createBoardSpec({
        ...graphBoard(),
        id: 'verify.safe-lab.empty',
        edges: []
    });
}

resetLabPerformanceStats();
resumeLab();

let stepCount = 0;
const initialized = await initializeLabSafely(() => ({
    boardSpec: graphBoard(),
    state: { value: 0 },
    step() {
        stepCount += 1;
        this.state.value += 1;
        return this.state.value;
    }
}), { labId: 'verify.small-lab' });
assert.equal(initialized.ok, true, initialized.messages?.map((item) => item.messageEn).join('\n'));

const oneStep = await runLabStepSafely(initialized.lab, null, { labId: 'verify.small-lab' });
assert.equal(oneStep.ok, true);
assert.equal(oneStep.value, 1);
assert.equal(stepCount, 1);

const slowStep = await runLabStepSafely({
    step() {
        const start = Date.now();
        while (Date.now() - start < 8) {
            // Intentional short busy wait for deterministic slow-step verification.
        }
        return 'slow';
    }
}, null, { labId: 'verify.slow-lab', maxStepMs: 1 });
assert.equal(slowStep.ok, false);
assert.equal(slowStep.paused, true);
assert.ok(slowStep.messages.some((item) => item.key === 'slowStep'));

const cancelStats = cancelLab();
assert.equal(cancelStats.cancelled, true);

resetLabPerformanceStats();
resumeLab();
const cancelledRun = await runManyStepsSafely(initialized.lab, 3, {
    labId: 'verify.cancelled',
    chunkSize: 1,
    actionFactory(index) {
        if (index === 0) cancelLab();
        return null;
    }
});
assert.equal(cancelledRun.cancelled, true);

resetLabPerformanceStats();
registerLabCompatibility({
    labId: 'verify.compatibility-lab',
    allowedDimensions: [2],
    requiredBoardFeatures: ['graphNeighbors'],
    fallbackBoardId: 'board.r2-square-standard'
});
assert.equal(checkLabBoardCompatibility('verify.compatibility-lab', graphBoard()).ok, true);
const incompatible = checkLabBoardCompatibility('verify.compatibility-lab', emptyBoard());
assert.equal(incompatible.ok, false);
const explanation = explainLabBoardMismatch('verify.compatibility-lab', emptyBoard(), 'en');
assert.equal(explanation.ok, false);
assert.match(explanation.messageEn, /valid graph neighbors/i);
assert.equal(explanation.fallbackBoardId, 'board.r2-square-standard');

resetLabPerformanceStats();
resumeLab();
const failingStep = await runLabStepSafely({
    step() {
        throw new Error('expected test failure');
    }
}, null, { labId: 'verify.failing-lab' });
assert.equal(failingStep.ok, false);
assert.equal(failingStep.failed, true);
assert.equal(getLabPerformanceStats().running, false);

console.log('Safe Labs infrastructure verification passed.');

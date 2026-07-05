import assert from 'node:assert/strict';
import {
    cancelRunningLab,
    getLabPerformanceStats,
    initializeLabSafely,
    resetLabPerformanceStats,
    resumeLab,
    runLabStepSafely,
    runManyStepsSafely
} from '../js/labs/SafeLabRunner.js';

function boardSpec(size = 4) {
    const sites = Array.from({ length: size }, (_, index) => ({
        id: `s:${index}`,
        coord: { x: index },
        draw: { x: index, y: 0 }
    }));
    return {
        schema: 'topoboard.board.v0',
        id: 'lab-test-board',
        nameEn: 'Lab Test Board',
        nameZh: 'Lab 測試棋盤',
        dimension: 1,
        playableKind: 'vertex',
        space: { id: 'interval', nameEn: 'Interval', nameZh: '區間' },
        lattice: { id: 'chain', nameEn: 'Chain', nameZh: '鏈晶格' },
        boundary: { id: 'hard', nameEn: 'Hard Boundary', nameZh: '硬邊界' },
        sites,
        edges: sites.slice(1).map((site, index) => ({ source: sites[index].id, target: site.id }))
    };
}

resetLabPerformanceStats();
const initialized = await initializeLabSafely(() => ({
    boardSpec: boardSpec(),
    state: { values: [0, 1, 0, 1] },
    value: 0,
    step() {
        this.value += 1;
        return this.value;
    }
}), { labId: 'safe-lab-test' });
assert.equal(initialized.ok, true, initialized.resources?.errors?.join('\n'));

const oneStep = await runLabStepSafely(initialized.lab, null);
assert.equal(oneStep.ok, true);
assert.equal(oneStep.value, 1);

const many = await runManyStepsSafely(initialized.lab, 7, { chunkSize: 2, yieldToUI: true });
assert.equal(many.ok, true);
assert.equal(many.completed, 7);
assert.equal(initialized.lab.value, 8);

const failed = await runLabStepSafely(initialized.lab, () => {
    throw new Error('expected test failure');
});
assert.equal(failed.ok, false);
assert.equal(failed.failed, true);
assert.equal(getLabPerformanceStats().running, false);

const oversized = await initializeLabSafely(() => ({
    boardSpec: boardSpec(6),
    state: {}
}), { labId: 'oversized-test' }, { maxSites: 4 });
assert.equal(oversized.ok, false);
assert.ok(oversized.resources.errors.some((error) => error.includes('limit')));

resumeLab();
const pending = runManyStepsSafely(initialized.lab, 100, {
    chunkSize: 1,
    yieldToUI: true,
    action: null
});
cancelRunningLab();
const cancelled = await pending;
assert.equal(cancelled.ok, false);
assert.equal(cancelled.cancelled, true);
assert.equal(getLabPerformanceStats().running, false);

console.log('Safe Lab runner verification passed.');

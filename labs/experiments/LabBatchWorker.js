import { runSingleLabExperiment } from './LabBatchRunner.js';

let paused = false;
let cancelled = false;

function waitForResume() {
    if (!paused) return Promise.resolve();
    return new Promise((resolve) => {
        const interval = setInterval(() => {
            if (!paused || cancelled) {
                clearInterval(interval);
                resolve();
            }
        }, 120);
    });
}

self.addEventListener('message', async (event) => {
    const message = event.data || {};
    if (message.type === 'pause') {
        paused = true;
        self.postMessage({ type: 'paused' });
        return;
    }
    if (message.type === 'resume') {
        paused = false;
        self.postMessage({ type: 'resumed' });
        return;
    }
    if (message.type === 'cancel') {
        cancelled = true;
        paused = false;
        self.postMessage({ type: 'cancelled' });
        return;
    }
    if (message.type !== 'start') return;

    paused = false;
    cancelled = false;
    const batchConfig = message.batchConfig;
    const runResults = [];
    const failedRuns = [];
    self.postMessage({ type: 'started', totalRuns: batchConfig.runMatrix.length });

    for (let index = 0; index < batchConfig.runMatrix.length; index += 1) {
        if (cancelled) break;
        await waitForResume();
        if (cancelled) break;
        const run = batchConfig.runMatrix[index];
        self.postMessage({ type: 'progress', index, totalRuns: batchConfig.runMatrix.length, run });
        try {
            const result = await runSingleLabExperiment(run);
            runResults.push(result);
            self.postMessage({ type: 'runComplete', index, runId: run.runId, result });
        } catch (error) {
            const failed = {
                runId: run.runId,
                experimentConfig: run.experimentConfig,
                error: error?.message || String(error),
                warnings: [],
                failedAt: new Date().toISOString(),
                metadata: { stack: error?.stack || '' }
            };
            failedRuns.push(failed);
            self.postMessage({ type: 'runFailed', index, runId: run.runId, failed });
        }
    }

    self.postMessage({
        type: 'complete',
        cancelled,
        runResults,
        failedRuns
    });
});

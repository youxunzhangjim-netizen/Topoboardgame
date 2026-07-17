import assert from "node:assert/strict";
import { submitComputeTask } from "../js/shared/ComputeTaskScheduler.js";
import { assertFirestorePayloadSafe } from "../js/shared/FirestorePayloadGuard.js";

const syncResult = await submitComputeTask({
  id: "verify:sync",
  type: "export_compute",
  allowGenericWorker: false,
  estimate: { operations: 1 },
  runSync: () => ({ ok: true })
});
assert.equal(syncResult.ok, true);
assert.equal(syncResult.mode, "sync");

const chunkedResult = await submitComputeTask({
  id: "verify:chunked",
  type: "life_step",
  allowGenericWorker: false,
  estimate: { operations: 20000, siteCount: 2000 },
  runChunked: async (ctx) => {
    await ctx.yieldToUI();
    ctx.progress({ completed: 1, total: 1 });
    return { ok: true };
  }
});
assert.equal(chunkedResult.ok, true);
assert.equal(chunkedResult.mode, "chunked");

const rejectedResult = await submitComputeTask({
  id: "verify:oversized",
  type: "board_generate",
  estimate: { siteCount: 999999, edgeCount: 20 },
  runSync: () => ({ ok: false })
});
assert.equal(rejectedResult.ok, false);
assert.equal(rejectedResult.mode, "rejected");

const sites4d = [];
for (let w = 0; w < 3; w += 1) {
  for (let z = 0; z < 2; z += 1) {
    for (let y = 0; y < 2; y += 1) {
      for (let x = 0; x < 2; x += 1) {
        sites4d.push({ id: `${x},${y},${z},${w}`, coord: { x, y, z, w } });
      }
    }
  }
}
const projectionResult = await submitComputeTask({
  id: "verify:4d-projection",
  type: "4d_projection",
  payload: { sites: sites4d, slice: { axis: "w", value: 1 } },
  estimate: { siteCount: sites4d.length }
});
assert.equal(projectionResult.ok, true);
assert.equal(projectionResult.value.visibleSites.length, 8);
assert.ok(projectionResult.value.visibleSites.every((site) => site.coord.w === 1));

const cancelledController = new AbortController();
cancelledController.abort();
const cancelledTask = await submitComputeTask({
  id: "verify:cancelled-task",
  type: "lab_step",
  signal: cancelledController.signal,
  runChunked: async () => ({ ok: false })
});
assert.equal(cancelledTask.ok, false);
assert.equal(cancelledTask.cancelled, true);

const disabledScan = await submitComputeTask({
  id: "verify:disabled-scan",
  type: "lab_scan",
  runChunked: async () => ({ ok: false })
});
assert.equal(disabledScan.ok, false);
assert.equal(disabledScan.mode, "rejected");

assert.throws(
  () => assertFirestorePayloadSafe({ payload: "x".repeat(1024 * 1024 + 1) }, { context: "verify" }),
  /Large research data|1 MiB|500 KiB/
);

assert.equal(typeof globalThis.topoboardCompute, "undefined");
console.log("verify-heavy-mode-safety: ok");

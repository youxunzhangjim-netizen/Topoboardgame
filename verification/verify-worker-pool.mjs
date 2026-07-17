import assert from "node:assert/strict";
import { WorkerPool } from "../js/shared/worker/WorkerPool.js";

const sites = [
  { id: "a" },
  { id: "b" },
  { id: "c" },
  { id: "d" }
];
const edges = [
  { source: "a", target: "b" },
  { source: "b", target: "c" },
  { source: "c", target: "d" }
];

const pool = new WorkerPool({ maxWorkers: 0 });
const result = await pool.runJob("computeConnectedComponents", { sites, edges });
assert.equal(result.stats.componentCount, 1);
assert.equal(result.stats.largestComponent, 4);

const controller = new AbortController();
controller.abort();
await assert.rejects(
  () => pool.runJob("computeShortestPaths", {
    sites,
    edges,
    sourceIds: ["a"],
    targetIds: ["d"]
  }, { signal: controller.signal }),
  /cancelled|aborted/i
);

pool.destroy();
console.log("verify-worker-pool: ok");

import assert from "node:assert/strict";
import {
  COMPUTE_POLICIES,
  getComputePolicy,
  getMaxWorkerCount,
  shouldRejectOversizedBoard,
  shouldRunInChunks,
  shouldUseWorker
} from "../js/shared/ComputePolicy.js";

assert.equal(COMPUTE_POLICIES["web-lite"].maxWorkers, 2);
assert.equal(COMPUTE_POLICIES["web-lite"].maxSites, 3000);
assert.equal(COMPUTE_POLICIES["web-lite"].allowLongResearchJobs, false);

assert.equal(COMPUTE_POLICIES["steam-stable"].maxWorkers, 4);
assert.equal(COMPUTE_POLICIES["steam-stable"].maxSites, 10000);
assert.equal(COMPUTE_POLICIES["steam-stable"].allowNodeWorkers, true);

assert.equal(COMPUTE_POLICIES["research-dev"].maxSites, 50000);
assert.equal(COMPUTE_POLICIES["research-dev"].maxEdges, 250000);
assert.equal(COMPUTE_POLICIES["research-dev"].allowLongResearchJobs, true);

const defaultPolicy = getComputePolicy();
assert.equal(defaultPolicy.edition, "web-lite");
assert.ok(getMaxWorkerCount() >= 0);

assert.equal(shouldRejectOversizedBoard({ siteCount: 20, edgeCount: 30 }).reject, false);
assert.equal(shouldRejectOversizedBoard({ siteCount: 999999, edgeCount: 30 }).reject, true);
assert.equal(shouldUseWorker("pathfinding", { operations: 100000 }), true);
assert.equal(shouldRunInChunks("life_step", { operations: 20000 }), true);

console.log("verify-compute-policy: ok");

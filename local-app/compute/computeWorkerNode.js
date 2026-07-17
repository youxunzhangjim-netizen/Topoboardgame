import { parentPort } from 'node:worker_threads';
import { runComputeJob } from '../../js/shared/worker/ComputeJobHandlers.js';

const cancelledJobs = new Set();

function throwIfCancelled(jobId) {
  if (!cancelledJobs.has(jobId)) return;
  const error = new Error('Task cancelled.');
  error.name = 'AbortError';
  throw error;
}

parentPort?.on('message', async (message = {}) => {
  if (message.type === 'cancel' && message.jobId) {
    cancelledJobs.add(String(message.jobId));
    return;
  }

  const { jobId, jobType, payload, options } = message;
  if (!jobId || !jobType) return;

  try {
    const id = String(jobId);
    cancelledJobs.delete(id);
    const result = await runComputeJob(jobType, payload, options, {
      onProgress: (progress) => parentPort.postMessage({ jobId: id, ok: true, progress }),
      throwIfCancelled: () => throwIfCancelled(id)
    });
    if (cancelledJobs.has(id)) throwIfCancelled(id);
    parentPort.postMessage({ jobId: id, ok: true, result });
  } catch (error) {
    parentPort.postMessage({
      jobId: String(jobId),
      ok: false,
      error: {
        name: error?.name || 'Error',
        message: error?.message || String(error),
        stack: error?.stack || ''
      }
    });
  } finally {
    cancelledJobs.delete(String(jobId));
  }
});


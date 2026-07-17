import { runComputeJob } from './ComputeJobHandlers.js';

const cancelledJobs = new Set();

function postProgress(jobId, progress) {
  self.postMessage({
    jobId,
    ok: true,
    progress
  });
}

function throwIfCancelled(jobId) {
  if (!cancelledJobs.has(jobId)) return;
  const error = new Error('Task cancelled.');
  error.name = 'AbortError';
  throw error;
}

self.addEventListener('message', async (event) => {
  const message = event.data || {};
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
      onProgress: (progress) => postProgress(id, progress),
      throwIfCancelled: () => throwIfCancelled(id)
    });
    if (cancelledJobs.has(id)) throwIfCancelled(id);
    self.postMessage({
      jobId: id,
      ok: true,
      result
    });
  } catch (error) {
    self.postMessage({
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


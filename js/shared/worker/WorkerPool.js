import { getMaxWorkerCount } from '../ComputePolicy.js';
import { runComputeJob } from './ComputeJobHandlers.js';

function makeJobId() {
  return `job:${Date.now()}:${Math.random().toString(36).slice(2)}`;
}

function isAbortError(error) {
  return error?.name === 'AbortError';
}

function abortError(message = 'Task cancelled.') {
  const error = new Error(message);
  error.name = 'AbortError';
  return error;
}

function nextTick() {
  return new Promise((resolve) => {
    if (typeof requestAnimationFrame === 'function') requestAnimationFrame(() => resolve());
    else setTimeout(resolve, 0);
  });
}

async function runMainThreadFallback(job, signal) {
  await nextTick();
  if (signal?.aborted) throw abortError();
  const result = await runComputeJob(job.jobType, job.payload, job.options, {
    onProgress: job.onProgress,
    throwIfCancelled: () => {
      if (signal?.aborted) throw abortError();
    }
  });
  if (signal?.aborted) throw abortError();
  return result;
}

export class WorkerPool {
  constructor({ maxWorkers } = {}) {
    this.maxWorkers = Math.max(0, Math.floor(Number(maxWorkers ?? getMaxWorkerCount()) || 0));
    this.workers = [];
    this.idleWorkers = [];
    this.queue = [];
    this.runningJobs = new Map();
    this.destroyed = false;
    this.workerSupported = typeof Worker !== 'undefined' && this.maxWorkers > 0;
  }

  runJob(jobType, payload = {}, options = {}) {
    if (this.destroyed) return Promise.reject(new Error('WorkerPool has been destroyed.'));
    const jobId = String(options.jobId || makeJobId());
    const controller = options.signal ? null : new AbortController();
    const signal = options.signal || controller.signal;
    const job = {
      jobId,
      jobType,
      payload,
      options: stripRuntimeOptions(options),
      onProgress: typeof options.onProgress === 'function' ? options.onProgress : null,
      controller,
      signal
    };

    if (!this.workerSupported) {
      const promise = runMainThreadFallback(job, signal);
      this.runningJobs.set(jobId, { job, promise, mode: 'fallback' });
      return promise.finally(() => this.runningJobs.delete(jobId));
    }

    const promise = new Promise((resolve, reject) => {
      job.resolve = resolve;
      job.reject = reject;
      if (signal?.aborted) {
        reject(abortError());
        return;
      }
      const abortListener = () => this.cancelJob(jobId);
      signal?.addEventListener?.('abort', abortListener, { once: true });
      job.abortListener = abortListener;
      this.queue.push(job);
      this.pump();
    });
    return promise;
  }

  cancelJob(jobId) {
    const id = String(jobId);
    const queuedIndex = this.queue.findIndex((job) => job.jobId === id);
    if (queuedIndex >= 0) {
      const [job] = this.queue.splice(queuedIndex, 1);
      job.reject?.(abortError());
      return true;
    }

    const running = this.runningJobs.get(id);
    if (!running) return false;
    if (running.mode === 'fallback') {
      running.job.controller?.abort();
      return true;
    }

    try {
      running.worker.postMessage({ type: 'cancel', jobId: id });
    } catch {}
    running.job.reject?.(abortError());
    this.replaceWorker(running.worker);
    this.runningJobs.delete(id);
    this.pump();
    return true;
  }

  destroy() {
    this.destroyed = true;
    for (const job of this.queue.splice(0)) job.reject?.(abortError());
    for (const { worker, job } of this.runningJobs.values()) {
      job?.reject?.(abortError());
      try { worker?.terminate?.(); } catch {}
    }
    this.runningJobs.clear();
    for (const worker of this.workers) {
      try { worker.terminate(); } catch {}
    }
    this.workers = [];
    this.idleWorkers = [];
  }

  pump() {
    if (!this.workerSupported || this.destroyed) return;
    while (this.queue.length && this.activeWorkerCount() < this.maxWorkers) {
      const worker = this.idleWorkers.pop() || this.createWorker();
      this.startWorkerJob(worker, this.queue.shift());
    }
  }

  activeWorkerCount() {
    return this.runningJobs.size;
  }

  createWorker() {
    const worker = new Worker(new URL('./computeWorker.js', import.meta.url), { type: 'module' });
    this.workers.push(worker);
    worker.addEventListener('message', (event) => this.handleWorkerMessage(worker, event.data || {}));
    worker.addEventListener('error', (event) => this.handleWorkerError(worker, event.error || event.message || event));
    return worker;
  }

  replaceWorker(worker) {
    try { worker.terminate(); } catch {}
    this.workers = this.workers.filter((item) => item !== worker);
    this.idleWorkers = this.idleWorkers.filter((item) => item !== worker);
  }

  startWorkerJob(worker, job) {
    this.runningJobs.set(job.jobId, { worker, job, mode: 'worker' });
    worker.postMessage({
      jobId: job.jobId,
      jobType: job.jobType,
      payload: job.payload,
      options: job.options
    });
  }

  finishWorkerJob(worker, jobId, callback) {
    const running = this.runningJobs.get(String(jobId));
    if (!running || running.worker !== worker) return;
    const { job } = running;
    this.runningJobs.delete(String(jobId));
    if (job.abortListener) job.signal?.removeEventListener?.('abort', job.abortListener);
    callback(job);
    if (!this.destroyed) this.idleWorkers.push(worker);
    this.pump();
  }

  handleWorkerMessage(worker, message) {
    const jobId = String(message.jobId || '');
    const running = this.runningJobs.get(jobId);
    if (!running || running.worker !== worker) return;
    if (message.progress) {
      running.job.onProgress?.(message.progress);
      return;
    }
    this.finishWorkerJob(worker, jobId, (job) => {
      if (message.ok) job.resolve(message.result);
      else {
        const error = new Error(message.error?.message || 'Worker job failed.');
        error.name = message.error?.name || 'Error';
        error.stack = message.error?.stack || error.stack;
        if (isAbortError(error)) job.reject(abortError(error.message));
        else job.reject(error);
      }
    });
  }

  handleWorkerError(worker, error) {
    const running = [...this.runningJobs.values()].find((entry) => entry.worker === worker);
    if (running) {
      this.runningJobs.delete(running.job.jobId);
      running.job.reject?.(error instanceof Error ? error : new Error(String(error)));
    }
    this.replaceWorker(worker);
    this.pump();
  }
}

function stripRuntimeOptions(options = {}) {
  const clean = {};
  for (const [key, value] of Object.entries(options)) {
    if (typeof value === 'function') continue;
    if (key === 'signal' || key === 'jobId') continue;
    clean[key] = value;
  }
  return clean;
}

let sharedPool = null;

export function getSharedWorkerPool() {
  if (!sharedPool) sharedPool = new WorkerPool();
  return sharedPool;
}

export function destroySharedWorkerPool() {
  sharedPool?.destroy();
  sharedPool = null;
}


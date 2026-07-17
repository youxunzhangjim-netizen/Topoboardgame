import os from 'node:os';
import { Worker } from 'node:worker_threads';
import { fileURLToPath } from 'node:url';
import { COMPUTE_WORKER_JOB_TYPES } from '../../js/shared/worker/ComputeJobHandlers.js';

const MAX_PAYLOAD_BYTES = 8 * 1024 * 1024;

function makeJobId() {
  return `steam-job:${Date.now()}:${Math.random().toString(36).slice(2)}`;
}

function payloadSize(value) {
  try {
    return Buffer.byteLength(JSON.stringify(value ?? null), 'utf8');
  } catch {
    return Infinity;
  }
}

function assertSafeJob(job = {}) {
  const jobType = String(job.jobType || '');
  if (!COMPUTE_WORKER_JOB_TYPES.includes(jobType)) {
    throw new Error(`Unsupported compute job type: ${jobType}`);
  }
  const bytes = payloadSize(job.payload);
  if (bytes > MAX_PAYLOAD_BYTES) {
    throw new Error(`Compute payload is too large: ${bytes} bytes.`);
  }
  return { jobType, bytes };
}

function abortError(message = 'Task cancelled.') {
  const error = new Error(message);
  error.name = 'AbortError';
  return error;
}

export class SteamComputeService {
  constructor(options = {}) {
    const cpuCount = Math.max(1, os.cpus()?.length || 1);
    this.maxWorkers = Math.max(1, Math.min(Number(options.maxWorkers || 3), Math.max(1, cpuCount - 1)));
    this.workerUrl = new URL('./computeWorkerNode.js', import.meta.url);
    this.workers = [];
    this.idleWorkers = [];
    this.queue = [];
    this.runningJobs = new Map();
    this.completedJobs = 0;
    this.failedJobs = 0;
    this.destroyed = false;
  }

  runJob(rawJob = {}) {
    if (this.destroyed) return Promise.resolve({ ok: false, error: 'compute-service-destroyed' });
    let safe;
    try {
      safe = assertSafeJob(rawJob);
    } catch (error) {
      return Promise.resolve({ ok: false, error: error.message });
    }

    const job = {
      jobId: String(rawJob.jobId || makeJobId()),
      jobType: safe.jobType,
      payload: rawJob.payload ?? {},
      options: rawJob.options ?? {}
    };

    return new Promise((resolve) => {
      job.resolve = resolve;
      this.queue.push(job);
      this.pump();
    });
  }

  cancelJob(jobId) {
    const id = String(jobId);
    const queuedIndex = this.queue.findIndex((job) => job.jobId === id);
    if (queuedIndex >= 0) {
      const [job] = this.queue.splice(queuedIndex, 1);
      job.resolve?.({ ok: false, cancelled: true, error: 'Task cancelled.' });
      return { ok: true, cancelled: true };
    }
    const running = this.runningJobs.get(id);
    if (!running) return { ok: false, error: 'job-not-found' };
    try {
      running.worker.postMessage({ type: 'cancel', jobId: id });
    } catch {}
    running.job.resolve?.({ ok: false, cancelled: true, error: 'Task cancelled.' });
    this.replaceWorker(running.worker);
    this.runningJobs.delete(id);
    this.pump();
    return { ok: true, cancelled: true };
  }

  getStatus() {
    return {
      ok: true,
      backend: 'worker_threads',
      available: true,
      maxWorkers: this.maxWorkers,
      activeJobs: this.runningJobs.size,
      queuedJobs: this.queue.length,
      completedJobs: this.completedJobs,
      failedJobs: this.failedJobs
    };
  }

  destroy() {
    this.destroyed = true;
    for (const job of this.queue.splice(0)) job.resolve?.({ ok: false, cancelled: true, error: 'Task cancelled.' });
    for (const { worker, job } of this.runningJobs.values()) {
      job.resolve?.({ ok: false, cancelled: true, error: 'Task cancelled.' });
      try { worker.terminate(); } catch {}
    }
    this.runningJobs.clear();
    for (const worker of this.workers) {
      try { worker.terminate(); } catch {}
    }
    this.workers = [];
    this.idleWorkers = [];
  }

  pump() {
    while (!this.destroyed && this.queue.length && this.runningJobs.size < this.maxWorkers) {
      const worker = this.idleWorkers.pop() || this.createWorker();
      const job = this.queue.shift();
      this.runningJobs.set(job.jobId, { worker, job });
      worker.postMessage({
        jobId: job.jobId,
        jobType: job.jobType,
        payload: job.payload,
        options: job.options
      });
    }
  }

  createWorker() {
    const worker = new Worker(this.workerUrl, { type: 'module' });
    this.workers.push(worker);
    worker.on('message', (message) => this.handleWorkerMessage(worker, message || {}));
    worker.on('error', (error) => this.handleWorkerError(worker, error));
    worker.on('exit', (code) => {
      if (code !== 0) this.handleWorkerError(worker, new Error(`Compute worker exited with code ${code}.`));
    });
    return worker;
  }

  replaceWorker(worker) {
    try { worker.terminate(); } catch {}
    this.workers = this.workers.filter((item) => item !== worker);
    this.idleWorkers = this.idleWorkers.filter((item) => item !== worker);
  }

  finishWorkerJob(worker, jobId, callback) {
    const running = this.runningJobs.get(String(jobId));
    if (!running || running.worker !== worker) return;
    this.runningJobs.delete(String(jobId));
    callback(running.job);
    if (!this.destroyed) this.idleWorkers.push(worker);
    this.pump();
  }

  handleWorkerMessage(worker, message) {
    const jobId = String(message.jobId || '');
    const running = this.runningJobs.get(jobId);
    if (!running || running.worker !== worker) return;
    if (message.progress) return;
    this.finishWorkerJob(worker, jobId, (job) => {
      if (message.ok) {
        this.completedJobs += 1;
        job.resolve({ ok: true, jobId, result: message.result });
      } else {
        this.failedJobs += 1;
        job.resolve({
          ok: false,
          jobId,
          error: message.error?.message || 'Compute worker failed.',
          errorName: message.error?.name || 'Error'
        });
      }
    });
  }

  handleWorkerError(worker, error) {
    const running = [...this.runningJobs.values()].find((entry) => entry.worker === worker);
    if (running) {
      this.runningJobs.delete(running.job.jobId);
      this.failedJobs += 1;
      running.job.resolve({
        ok: false,
        jobId: running.job.jobId,
        error: error?.message || String(error)
      });
    }
    this.replaceWorker(worker);
    this.pump();
  }
}

export function createSteamComputeService(options = {}) {
  return new SteamComputeService(options);
}

export function computeWorkerPath() {
  return fileURLToPath(new URL('./computeWorkerNode.js', import.meta.url));
}


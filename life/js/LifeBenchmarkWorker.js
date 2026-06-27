import { runBenchmark } from './LifeWorkerTasks.js';

self.addEventListener('message', (event) => {
  if (event.data?.type !== 'benchmark') return;
  try {
    const payload = runBenchmark(event.data.config || {}, {
      onProgress: (progress) => self.postMessage({ type: 'progress', ...progress })
    });
    self.postMessage({ type: 'complete', payload });
  } catch (error) {
    self.postMessage({ type: 'error', message: error?.message || String(error) });
  }
});

const { contextBridge, ipcRenderer } = require('electron');

const SYNC_INTERVAL_MS = 500;
let lastLocalStorageSnapshot = '';
let syncTimer = null;

function captureLocalStorage() {
  const snapshot = {};
  try {
    for (let index = 0; index < localStorage.length; index += 1) {
      const key = localStorage.key(index);
      if (key !== null) snapshot[key] = localStorage.getItem(key) ?? '';
    }
  } catch {
    // Some browser security contexts can block storage. Explicit game slots still work.
  }
  return snapshot;
}

function snapshotSignature(snapshot) {
  return JSON.stringify(Object.entries(snapshot).sort(([left], [right]) => left.localeCompare(right)));
}

function restoreLocalStorage(snapshot) {
  if (!snapshot || typeof snapshot !== 'object' || Array.isArray(snapshot)) return;
  try {
    localStorage.clear();
    for (const [key, value] of Object.entries(snapshot)) {
      if (typeof value === 'string') localStorage.setItem(key, value);
    }
  } catch {
    // Keep startup alive if storage is unavailable.
  }
}

function syncLocalStorage({ immediate = false } = {}) {
  const snapshot = captureLocalStorage();
  const signature = snapshotSignature(snapshot);
  if (!immediate && signature === lastLocalStorageSnapshot) return;
  lastLocalStorageSnapshot = signature;
  if (immediate) {
    ipcRenderer.sendSync('desktop-save:flush-local-storage', snapshot);
  } else {
    ipcRenderer.invoke('desktop-save:sync-local-storage', snapshot).catch(() => {});
  }
}

function initializeDesktopStorage() {
  const bootstrap = ipcRenderer.sendSync('desktop-save:bootstrap');
  if (bootstrap?.ok && bootstrap.exists) restoreLocalStorage(bootstrap.data?.localStorage);
  const initialSnapshot = captureLocalStorage();
  lastLocalStorageSnapshot = snapshotSignature(initialSnapshot);
  if (bootstrap?.ok && !bootstrap.exists) {
    ipcRenderer.sendSync('desktop-save:flush-local-storage', initialSnapshot);
  }

  syncTimer = setInterval(() => syncLocalStorage(), SYNC_INTERVAL_MS);
  window.addEventListener('storage', () => syncLocalStorage());
  window.addEventListener('pagehide', () => {
    if (syncTimer) clearInterval(syncTimer);
    syncLocalStorage({ immediate: true });
  });
}

initializeDesktopStorage();

contextBridge.exposeInMainWorld('TopoboardgameLocalApp', {
  platform: process.platform,
  version: process.versions.electron || 'unknown',
  isDesktop: true,
  engineStatus: () => ipcRenderer.invoke('engine:status'),
  chooseStockfishMove: (request) => ipcRenderer.invoke('engine:stockfish-move', request),
  saveGame: (slotId, data, metadata = {}) => ipcRenderer.invoke('desktop-save:save-slot', slotId, data, metadata),
  loadGame: (slotId) => ipcRenderer.invoke('desktop-save:load-slot', slotId),
  listSaves: () => ipcRenderer.invoke('desktop-save:list-slots'),
  deleteSave: (slotId) => ipcRenderer.invoke('desktop-save:remove-slot', slotId),
  flushSave: () => ipcRenderer.invoke('desktop-save:sync-local-storage', captureLocalStorage()),
  getSavePath: () => ipcRenderer.invoke('desktop-save:path')
});

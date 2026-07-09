const WEB_FALLBACK_KEY = 'topoboardgame:web-save-slots:v1';

function desktopBridge() {
  const bridge = globalThis.TopoboardgameLocalApp;
  return bridge?.isDesktop && typeof bridge.saveGame === 'function' ? bridge : null;
}

function readWebSlots() {
  try {
    const parsed = JSON.parse(localStorage.getItem(WEB_FALLBACK_KEY) || '{}');
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function writeWebSlots(slots) {
  localStorage.setItem(WEB_FALLBACK_KEY, JSON.stringify(slots));
}

function normalizeSlotId(slotId) {
  const normalized = String(slotId || 'autosave');
  if (!/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,63}$/.test(normalized)) {
    throw new Error('Save slot id must contain 1-64 letters, numbers, dots, underscores, or hyphens.');
  }
  return normalized;
}

export function isDesktopSaveAvailable() {
  return Boolean(desktopBridge());
}

export async function saveGameState(state, {
  slotId = 'autosave',
  metadata = {}
} = {}) {
  const id = normalizeSlotId(slotId);
  const bridge = desktopBridge();
  if (bridge) return bridge.saveGame(id, state, metadata);

  const slots = readWebSlots();
  slots[id] = {
    updatedAt: new Date().toISOString(),
    metadata,
    data: state
  };
  writeWebSlots(slots);
  return { ok: true, storage: 'localStorage', slotId: id, updatedAt: slots[id].updatedAt };
}

export async function loadGameState(slotId = 'autosave') {
  const id = normalizeSlotId(slotId);
  const bridge = desktopBridge();
  if (bridge) {
    const result = await bridge.loadGame(id);
    return result?.ok && result.found ? result.record?.data ?? null : null;
  }
  return readWebSlots()[id]?.data ?? null;
}

export async function listGameSaves() {
  const bridge = desktopBridge();
  if (bridge) return bridge.listSaves();
  const slots = Object.entries(readWebSlots())
    .map(([slotId, record]) => ({
      slotId,
      updatedAt: record.updatedAt,
      metadata: record.metadata || {}
    }))
    .sort((left, right) => String(right.updatedAt).localeCompare(String(left.updatedAt)));
  return { ok: true, storage: 'localStorage', slots };
}

export async function deleteGameSave(slotId = 'autosave') {
  const id = normalizeSlotId(slotId);
  const bridge = desktopBridge();
  if (bridge) return bridge.deleteSave(id);
  const slots = readWebSlots();
  const removed = Object.hasOwn(slots, id);
  delete slots[id];
  writeWebSlots(slots);
  return { ok: true, storage: 'localStorage', slotId: id, removed };
}

export async function getGameSavePath() {
  const bridge = desktopBridge();
  if (!bridge) return { ok: true, storage: 'localStorage', directory: null, path: null };
  return bridge.getSavePath();
}

export async function flushGameSave() {
  const bridge = desktopBridge();
  return bridge ? bridge.flushSave() : { ok: true, storage: 'localStorage' };
}

export function createGameSaveController({
  app,
  slotId = 'autosave',
  metadata = {}
} = {}) {
  if (!app || typeof app.exportState !== 'function' || typeof app.importState !== 'function') {
    throw new Error('A save controller requires app.exportState() and app.importState(state).');
  }
  const id = normalizeSlotId(slotId);
  return {
    save: () => saveGameState(app.exportState(), { slotId: id, metadata }),
    load: async () => {
      const state = await loadGameState(id);
      if (state !== null) app.importState(state);
      return state;
    },
    remove: () => deleteGameSave(id)
  };
}

const publicApi = Object.freeze({
  createGameSaveController,
  deleteGameSave,
  flushGameSave,
  getGameSavePath,
  isDesktopSaveAvailable,
  listGameSaves,
  loadGameState,
  saveGameState
});

if (typeof window !== 'undefined') window.TopoboardgameSave = publicApi;

export default publicApi;

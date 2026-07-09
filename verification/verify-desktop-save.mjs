import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const {
  DesktopSaveStore,
  SAVE_DIRECTORY_NAME,
  SAVE_FILE_NAME,
  SAVE_SCHEMA
} = require('../local-app/electron/save-store.cjs');

const temporaryDocuments = fs.mkdtempSync(path.join(os.tmpdir(), 'topoboardgame-save-test-'));

try {
  const store = new DesktopSaveStore(temporaryDocuments);
  assert.equal(store.directoryPath, path.join(temporaryDocuments, SAVE_DIRECTORY_NAME));
  assert.equal(store.filePath, path.join(temporaryDocuments, SAVE_DIRECTORY_NAME, SAVE_FILE_NAME));

  const initial = store.read();
  assert.equal(initial.ok, true);
  assert.equal(initial.exists, false);
  assert.equal(initial.data.schema, SAVE_SCHEMA);

  store.replaceLocalStorage({
    'topological-boardgame:language': 'zh-Hant',
    'topoboard-life-world-control-view': 'research',
    invalidNonStringValue: 42
  });
  assert.equal(fs.existsSync(store.filePath), true);

  store.saveSlot('2d-go-autosave', {
    moveNumber: 12,
    board: { '4,4': 'black' }
  }, {
    family: 'go',
    dimension: 2
  });

  const reloadedStore = new DesktopSaveStore(temporaryDocuments);
  const reloaded = reloadedStore.read();
  assert.equal(reloaded.ok, true);
  assert.equal(reloaded.data.localStorage['topological-boardgame:language'], 'zh-Hant');
  assert.equal(Object.hasOwn(reloaded.data.localStorage, 'invalidNonStringValue'), false);

  const loadedSlot = reloadedStore.loadSlot('2d-go-autosave');
  assert.equal(loadedSlot.ok, true);
  assert.equal(loadedSlot.found, true);
  assert.equal(loadedSlot.record.data.moveNumber, 12);
  assert.equal(loadedSlot.record.metadata.family, 'go');

  const slots = reloadedStore.listSlots();
  assert.deepEqual(slots.slots.map((entry) => entry.slotId), ['2d-go-autosave']);

  const removed = reloadedStore.removeSlot('2d-go-autosave');
  assert.equal(removed.removed, true);
  assert.equal(reloadedStore.loadSlot('2d-go-autosave').found, false);

  assert.throws(() => reloadedStore.saveSlot('../outside', {}), /Save slot id/);
  assert.equal(path.dirname(reloadedStore.filePath), reloadedStore.directoryPath);

  const webStorage = new Map();
  globalThis.localStorage = {
    getItem: (key) => webStorage.get(key) ?? null,
    setItem: (key, value) => webStorage.set(key, String(value)),
    removeItem: (key) => webStorage.delete(key)
  };
  const webSave = await import('../js/shared/DesktopSaveManager.js');
  const webWrite = await webSave.saveGameState({ moveNumber: 3 }, {
    slotId: 'web-smoke',
    metadata: { family: 'hex' }
  });
  assert.equal(webWrite.storage, 'localStorage');
  assert.deepEqual(await webSave.loadGameState('web-smoke'), { moveNumber: 3 });
  assert.deepEqual((await webSave.listGameSaves()).slots.map((entry) => entry.slotId), ['web-smoke']);
  assert.equal((await webSave.deleteGameSave('web-smoke')).removed, true);
  delete globalThis.localStorage;

  console.log('Desktop save verification passed.');
  console.log(`Verified path shape: <Documents>\\${SAVE_DIRECTORY_NAME}\\${SAVE_FILE_NAME}`);
} finally {
  fs.rmSync(temporaryDocuments, { recursive: true, force: true });
}

const fs = require('node:fs');
const path = require('node:path');

const SAVE_SCHEMA = 'topoboardgame.desktop-save.v1';
const SAVE_DIRECTORY_NAME = 'TopologicalBoardGame';
const SAVE_FILE_NAME = 'save.json';
const MAX_SAVE_BYTES = 16 * 1024 * 1024;
const SLOT_ID_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9._-]{0,63}$/;

function emptySaveDocument() {
  return {
    schema: SAVE_SCHEMA,
    version: 1,
    updatedAt: new Date(0).toISOString(),
    localStorage: {},
    gameStates: {}
  };
}

function normalizeStringMap(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const result = {};
  for (const [key, entry] of Object.entries(value)) {
    if (typeof key === 'string' && typeof entry === 'string') result[key] = entry;
  }
  return result;
}

function normalizeSaveDocument(value) {
  const document = emptySaveDocument();
  if (!value || typeof value !== 'object' || Array.isArray(value)) return document;
  document.updatedAt = typeof value.updatedAt === 'string' ? value.updatedAt : document.updatedAt;
  document.localStorage = normalizeStringMap(value.localStorage);
  if (value.gameStates && typeof value.gameStates === 'object' && !Array.isArray(value.gameStates)) {
    for (const [slotId, record] of Object.entries(value.gameStates)) {
      if (!SLOT_ID_PATTERN.test(slotId) || !record || typeof record !== 'object' || Array.isArray(record)) continue;
      document.gameStates[slotId] = {
        updatedAt: typeof record.updatedAt === 'string' ? record.updatedAt : document.updatedAt,
        metadata: record.metadata && typeof record.metadata === 'object' && !Array.isArray(record.metadata)
          ? record.metadata
          : {},
        data: record.data ?? null
      };
    }
  }
  return document;
}

function assertSlotId(slotId) {
  const normalized = String(slotId || '');
  if (!SLOT_ID_PATTERN.test(normalized)) {
    throw new Error('Save slot id must contain 1-64 letters, numbers, dots, underscores, or hyphens.');
  }
  return normalized;
}

function serializeDocument(document) {
  const json = JSON.stringify(document, null, 2);
  if (Buffer.byteLength(json, 'utf8') > MAX_SAVE_BYTES) {
    throw new Error(`Desktop save exceeds the ${MAX_SAVE_BYTES / 1024 / 1024} MB safety limit.`);
  }
  return `${json}\n`;
}

class DesktopSaveStore {
  constructor(documentsPath) {
    if (!documentsPath) throw new Error('A Documents directory is required.');
    this.directoryPath = path.join(documentsPath, SAVE_DIRECTORY_NAME);
    this.filePath = path.join(this.directoryPath, SAVE_FILE_NAME);
    this.backupPath = `${this.filePath}.bak`;
    this.temporaryPath = `${this.filePath}.tmp`;
  }

  readCandidate(candidatePath) {
    const source = fs.readFileSync(candidatePath, 'utf8');
    return normalizeSaveDocument(JSON.parse(source));
  }

  read() {
    try {
      const document = this.readCandidate(this.filePath);
      return { ok: true, exists: true, path: this.filePath, data: document };
    } catch (error) {
      if (error?.code === 'ENOENT') {
        try {
          const recovered = this.readCandidate(this.backupPath);
          this.write(recovered);
          return {
            ok: true,
            exists: true,
            recovered: true,
            path: this.filePath,
            data: recovered
          };
        } catch (backupError) {
          if (backupError?.code !== 'ENOENT') {
            return {
              ok: false,
              exists: false,
              path: this.filePath,
              error: `Could not read save backup: ${backupError.message}`,
              data: emptySaveDocument()
            };
          }
          return { ok: true, exists: false, path: this.filePath, data: emptySaveDocument() };
        }
      }
      return {
        ok: false,
        exists: true,
        path: this.filePath,
        error: `Could not read save file: ${error.message}`,
        data: emptySaveDocument()
      };
    }
  }

  write(value) {
    const document = normalizeSaveDocument(value);
    document.updatedAt = new Date().toISOString();
    const serialized = serializeDocument(document);
    fs.mkdirSync(this.directoryPath, { recursive: true });
    fs.writeFileSync(this.temporaryPath, serialized, { encoding: 'utf8', mode: 0o600 });

    try {
      if (fs.existsSync(this.backupPath)) fs.unlinkSync(this.backupPath);
      if (fs.existsSync(this.filePath)) fs.renameSync(this.filePath, this.backupPath);
      fs.renameSync(this.temporaryPath, this.filePath);
      if (fs.existsSync(this.backupPath)) fs.unlinkSync(this.backupPath);
    } catch (error) {
      if (!fs.existsSync(this.filePath) && fs.existsSync(this.backupPath)) {
        fs.renameSync(this.backupPath, this.filePath);
      }
      if (fs.existsSync(this.temporaryPath)) fs.unlinkSync(this.temporaryPath);
      throw error;
    }

    return { ok: true, path: this.filePath, updatedAt: document.updatedAt };
  }

  update(mutator) {
    const readResult = this.read();
    if (!readResult.ok) throw new Error(readResult.error);
    const document = readResult.data;
    mutator(document);
    const writeResult = this.write(document);
    return { ...writeResult, data: document };
  }

  replaceLocalStorage(snapshot) {
    const localStorage = normalizeStringMap(snapshot);
    return this.update((document) => {
      document.localStorage = localStorage;
    });
  }

  saveSlot(slotId, data, metadata = {}) {
    const id = assertSlotId(slotId);
    const safeMetadata = metadata && typeof metadata === 'object' && !Array.isArray(metadata) ? metadata : {};
    return this.update((document) => {
      document.gameStates[id] = {
        updatedAt: new Date().toISOString(),
        metadata: safeMetadata,
        data: data ?? null
      };
    });
  }

  loadSlot(slotId) {
    const id = assertSlotId(slotId);
    const readResult = this.read();
    if (!readResult.ok) return readResult;
    const record = readResult.data.gameStates[id];
    return {
      ok: true,
      found: Boolean(record),
      path: this.filePath,
      slotId: id,
      record: record || null
    };
  }

  listSlots() {
    const readResult = this.read();
    if (!readResult.ok) return readResult;
    const slots = Object.entries(readResult.data.gameStates)
      .map(([slotId, record]) => ({
        slotId,
        updatedAt: record.updatedAt,
        metadata: record.metadata
      }))
      .sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)));
    return { ok: true, path: this.filePath, slots };
  }

  removeSlot(slotId) {
    const id = assertSlotId(slotId);
    let removed = false;
    const result = this.update((document) => {
      removed = Object.hasOwn(document.gameStates, id);
      delete document.gameStates[id];
    });
    return { ...result, removed, slotId: id };
  }
}

module.exports = {
  DesktopSaveStore,
  MAX_SAVE_BYTES,
  SAVE_DIRECTORY_NAME,
  SAVE_FILE_NAME,
  SAVE_SCHEMA,
  assertSlotId,
  emptySaveDocument,
  normalizeSaveDocument
};

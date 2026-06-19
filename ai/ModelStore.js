export const MODEL_METADATA_SCHEMA_VERSION = 'topoboardgame.modelMetadata.v1';

export const MODEL_METADATA_FIELDS = Object.freeze([
    'modelId',
    'gameType',
    'variant',
    'topology',
    'baseModelId',
    'rulesVersion',
    'trainingSource',
    'trainingDate',
    'ratingEstimate',
    'evaluationNotes'
]);

export const DEFAULT_MODEL_DIRECTORIES = Object.freeze({
    'chess/base': 'models/chess/base/',
    'chess/cube': 'models/chess/cube/',
    'chess/torus': 'models/chess/torus/',
    'go/base': 'models/go/base/',
    'go/torus': 'models/go/torus/',
    'reversi/base': 'models/reversi/base/',
    'reversi/klein': 'models/reversi/klein/',
    'jump/base': 'models/jump/base/',
    'jump/4d': 'models/jump/4d/',
    'anyon/base': 'models/anyon/base/',
    'anyon/fusion': 'models/anyon/fusion/',
    'life/base': 'models/life/base/'
});

function nowIso() {
    return new Date().toISOString();
}

function clone(value) {
    return value == null ? value : JSON.parse(JSON.stringify(value));
}

function normalizeSegment(value, fallback = 'base') {
    return String(value || fallback).trim().toLowerCase().replace(/[^a-z0-9._-]+/g, '-');
}

export function defaultModelDirectory(gameType, variant = 'base') {
    const key = `${normalizeSegment(gameType, 'unknown')}/${normalizeSegment(variant, 'base')}`;
    return DEFAULT_MODEL_DIRECTORIES[key] || `models/${normalizeSegment(gameType, 'unknown')}/${normalizeSegment(variant, 'base')}/`;
}

export function createModelMetadata({
    modelId,
    gameType,
    variant = 'base',
    topology = 'normal',
    baseModelId = '',
    rulesVersion = 'local-current',
    trainingSource = 'local',
    trainingDate = nowIso(),
    ratingEstimate = null,
    evaluationNotes = '',
    ...extra
} = {}) {
    const directory = defaultModelDirectory(gameType, variant);
    return {
        schemaVersion: MODEL_METADATA_SCHEMA_VERSION,
        modelId: modelId || `${directory}${normalizeSegment(topology, 'normal')}-${Date.now()}`,
        gameType: gameType || 'unknown',
        variant,
        topology,
        baseModelId,
        rulesVersion,
        trainingSource,
        trainingDate,
        ratingEstimate,
        evaluationNotes,
        modelDirectory: directory,
        ...extra
    };
}

export function validateModelMetadata(metadata) {
    const missing = MODEL_METADATA_FIELDS.filter((field) => metadata?.[field] === undefined);
    if (missing.length) {
        throw new Error(`Model metadata is missing required field(s): ${missing.join(', ')}`);
    }
    return metadata;
}

async function ensureNodeFs() {
    if (typeof process === 'undefined' || !process.versions?.node) return null;
    const [fs, path] = await Promise.all([import('node:fs/promises'), import('node:path')]);
    return { fs, path };
}

export class ModelStore {
    constructor({ root = '.', namespace = 'topoboardgame.models', storage = null } = {}) {
        this.root = root;
        this.namespace = namespace;
        this.storage = storage || (typeof localStorage !== 'undefined' ? localStorage : null);
        this.memory = new Map();
    }

    storageKey(modelId) {
        return `${this.namespace}:${modelId}`;
    }

    async saveMetadata(metadata, { modelData = null, directory = '' } = {}) {
        const normalized = validateModelMetadata(createModelMetadata(metadata));
        const payload = {
            metadata: normalized,
            modelData: modelData == null ? null : clone(modelData)
        };
        this.memory.set(normalized.modelId, payload);

        if (this.storage) {
            this.storage.setItem(this.storageKey(normalized.modelId), JSON.stringify(payload));
        }

        const node = await ensureNodeFs();
        if (node) {
            const targetDir = directory || normalized.modelDirectory || defaultModelDirectory(normalized.gameType, normalized.variant);
            const absoluteDir = node.path.resolve(this.root, targetDir);
            await node.fs.mkdir(absoluteDir, { recursive: true });
            const metadataPath = node.path.join(absoluteDir, 'metadata.json');
            await node.fs.writeFile(metadataPath, JSON.stringify(normalized, null, 2), 'utf8');
            if (modelData != null) {
                await node.fs.writeFile(
                    node.path.join(absoluteDir, 'model.json'),
                    JSON.stringify(modelData, null, 2),
                    'utf8'
                );
            }
        }
        return normalized;
    }

    async loadMetadata(modelId) {
        if (this.memory.has(modelId)) return clone(this.memory.get(modelId).metadata);
        if (this.storage) {
            const text = this.storage.getItem(this.storageKey(modelId));
            if (text) return JSON.parse(text).metadata;
        }
        const node = await ensureNodeFs();
        if (!node) return null;
        const candidates = Object.values(DEFAULT_MODEL_DIRECTORIES).map((dir) =>
            node.path.resolve(this.root, dir, 'metadata.json'));
        for (const filePath of candidates) {
            try {
                const metadata = JSON.parse(await node.fs.readFile(filePath, 'utf8'));
                if (metadata.modelId === modelId) return metadata;
            } catch {
                // Keep looking through local model folders.
            }
        }
        return null;
    }

    async listMetadata({ gameType = '', variant = '' } = {}) {
        const output = [...this.memory.values()].map((entry) => clone(entry.metadata));
        if (this.storage) {
            for (let index = 0; index < this.storage.length; index += 1) {
                const key = this.storage.key(index);
                if (!key?.startsWith(`${this.namespace}:`)) continue;
                const entry = JSON.parse(this.storage.getItem(key));
                output.push(entry.metadata);
            }
        }
        const node = await ensureNodeFs();
        if (node) {
            for (const dir of Object.values(DEFAULT_MODEL_DIRECTORIES)) {
                try {
                    const metadata = JSON.parse(await node.fs.readFile(node.path.resolve(this.root, dir, 'metadata.json'), 'utf8'));
                    output.push(metadata);
                } catch {
                    // Missing model folders are normal during early training.
                }
            }
        }
        const unique = new Map(output.map((entry) => [entry.modelId, entry]));
        return [...unique.values()].filter((entry) =>
            (!gameType || entry.gameType === gameType)
            && (!variant || entry.variant === variant));
    }

    async exportModel(modelId, { outputPath = '' } = {}) {
        const metadata = await this.loadMetadata(modelId);
        if (!metadata) throw new Error(`Model metadata not found: ${modelId}`);
        const bundle = {
            schemaVersion: 'topoboardgame.modelBundle.v1',
            metadata,
            exportedAt: nowIso(),
            note: 'Browser and Steam builds load finished model files. Training remains a local Node/Python task.'
        };
        if (outputPath) {
            const node = await ensureNodeFs();
            if (!node) throw new Error('File export is only available in Node.js.');
            await node.fs.mkdir(node.path.dirname(node.path.resolve(outputPath)), { recursive: true });
            await node.fs.writeFile(node.path.resolve(outputPath), JSON.stringify(bundle, null, 2), 'utf8');
        }
        return bundle;
    }
}

export const defaultModelStore = new ModelStore();

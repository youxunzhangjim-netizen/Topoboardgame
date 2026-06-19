import { createSharedGameAPI } from './RobotPlayer.js';

export const SELF_PLAY_RECORD_SCHEMA = 'topoboardgame.selfplay.trainingRecord.v1';
export const MODEL_EXAMPLE_SCHEMA = 'topoboardgame.modelExample.v1';

export const SELF_PLAY_RECORD_FIELDS = Object.freeze([
    'gameId',
    'source',
    'gameType',
    'variant',
    'topology',
    'dimension',
    'boardSize',
    'rulesVersion',
    'robotA',
    'robotB',
    'initialState',
    'moves',
    'legalMovesPerTurn',
    'evaluationsPerTurn',
    'result',
    'winner',
    'reason',
    'turnCount',
    'createdAt'
]);

export const MODEL_EXAMPLE_FIELDS = Object.freeze([
    'stateEncoding',
    'graphEncoding',
    'legalActionMask',
    'actionPlayed',
    'policyTarget',
    'valueTarget',
    'reward',
    'nextStateEncoding',
    'terminal',
    'topologyFeatures',
    'rulesVersion'
]);

function createdAt() {
    return new Date().toISOString();
}

function clone(value) {
    return value == null ? value : JSON.parse(JSON.stringify(value));
}

function normalizeMoveId(move) {
    if (move == null) return '';
    if (typeof move === 'string') return move;
    return move.id || move.moveId || move.label || JSON.stringify(move);
}

function valueTargetForWinner(winner, player) {
    if (!winner || winner === 'draw') return 0;
    if (!player) return 0;
    return winner === player ? 1 : -1;
}

function oneHotPolicyTarget(legalMoves, actionPlayed) {
    const actionId = normalizeMoveId(actionPlayed);
    const ids = legalMoves.map(normalizeMoveId);
    const target = ids.map((id) => (id === actionId ? 1 : 0));
    if (!target.some(Boolean) && target.length) target[0] = 1;
    return target;
}

function topologyFeaturesFromInfo(info = {}) {
    return {
        topology: info.topology || info.name || 'normal',
        variant: info.variant || '',
        dimension: Number(info.dimension || info.dimensions || 2),
        sizes: clone(info.sizes || []),
        lattice: info.lattice || '',
        periodic: /torus|periodic|cylinder|klein|mobius/i.test(`${info.topology || info.name || ''}`)
    };
}

export function createSelfPlayRecord({
    gameId = `selfplay-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    source = 'selfplay',
    gameType,
    variant = 'base',
    topology = 'normal',
    dimension = 2,
    boardSize = null,
    rulesVersion = 'local-current',
    robotA,
    robotB,
    initialState = null,
    moves = [],
    legalMovesPerTurn = [],
    evaluationsPerTurn = [],
    result = null,
    winner = '',
    reason = '',
    turnCount = moves.length,
    createdAt: created = createdAt(),
    ...extra
} = {}) {
    return {
        schema: SELF_PLAY_RECORD_SCHEMA,
        gameId,
        source,
        gameType,
        variant,
        topology,
        dimension,
        boardSize,
        rulesVersion,
        robotA,
        robotB,
        initialState: clone(initialState),
        moves: clone(moves),
        legalMovesPerTurn: clone(legalMovesPerTurn),
        evaluationsPerTurn: clone(evaluationsPerTurn),
        result: clone(result),
        winner,
        reason,
        turnCount,
        createdAt: created,
        ...extra
    };
}

export function validateSelfPlayRecord(record) {
    const missing = SELF_PLAY_RECORD_FIELDS.filter((field) => record?.[field] === undefined);
    if (missing.length) throw new Error(`Training record is missing required field(s): ${missing.join(', ')}`);
    return record;
}

export function encodeGraphFromGame(gameOrApi, fallback = {}) {
    const api = typeof gameOrApi?.getTopologyInfo === 'function'
        ? gameOrApi
        : createSharedGameAPI(gameOrApi, fallback);
    const source = api.source || gameOrApi;
    const info = api.getTopologyInfo();
    const topology = source?.topology;
    const nodes = typeof topology?.vertices === 'function' ? topology.vertices().map((coord) => ({ coord })) : [];
    const edges = [];
    if (typeof topology?.neighbors === 'function') {
        for (const node of nodes) {
            for (const neighbor of topology.neighbors(node.coord) || []) {
                edges.push({ from: node.coord, to: Array.isArray(neighbor) ? neighbor : neighbor.coord || neighbor });
            }
        }
    }
    return {
        nodes,
        edges,
        nodeFeatureNames: [
            'pieceType',
            'owner',
            'age',
            'spin',
            'parity',
            'charge',
            'targetZone',
            'homeZone'
        ],
        globalFeatures: topologyFeaturesFromInfo(info)
    };
}

export function selfPlayRecordToExamples(record, { graphEncoding = null } = {}) {
    validateSelfPlayRecord(record);
    const examples = [];
    const legalPerTurn = record.legalMovesPerTurn || [];
    const evaluations = record.evaluationsPerTurn || [];
    const moves = record.moves || [];
    for (let index = 0; index < moves.length; index += 1) {
        const move = moves[index];
        const legalMoves = legalPerTurn[index] || [];
        const player = move?.player || evaluations[index]?.player || '';
        const terminal = index === moves.length - 1;
        const valueTarget = terminal
            ? valueTargetForWinner(record.winner, player)
            : valueTargetForWinner(record.winner, player) * 0.98;
        examples.push({
            schema: MODEL_EXAMPLE_SCHEMA,
            stateEncoding: move?.stateEncoding || evaluations[index]?.stateEncoding || record.initialState,
            graphEncoding: graphEncoding || record.graphEncoding || null,
            legalActionMask: legalMoves.map((entry) => Boolean(entry)),
            actionPlayed: clone(move),
            policyTarget: move?.policyTarget || oneHotPolicyTarget(legalMoves, move),
            valueTarget,
            reward: terminal ? valueTarget : 0,
            nextStateEncoding: moves[index + 1]?.stateEncoding || record.result?.finalState || null,
            terminal,
            topologyFeatures: record.topologyFeatures || {
                topology: record.topology,
                variant: record.variant,
                dimension: record.dimension,
                boardSize: record.boardSize
            },
            rulesVersion: record.rulesVersion
        });
    }
    return examples;
}

async function ensureNodeFs() {
    if (typeof process === 'undefined' || !process.versions?.node) return null;
    const [fs, path] = await Promise.all([import('node:fs/promises'), import('node:path')]);
    return { fs, path };
}

export class TrainingDataRecorder {
    constructor({ optIn = false, storageKey = 'topoboardgame.trainingData', maxMemoryRecords = 5000 } = {}) {
        this.optIn = Boolean(optIn);
        this.storageKey = storageKey;
        this.maxMemoryRecords = maxMemoryRecords;
        this.records = [];
    }

    setOptIn(value) {
        this.optIn = Boolean(value);
    }

    recordSelfPlayGame(record) {
        const normalized = validateSelfPlayRecord(createSelfPlayRecord(record));
        this.records.push(normalized);
        if (this.records.length > this.maxMemoryRecords) this.records.shift();
        return normalized;
    }

    recordPlayerGame(record) {
        if (!this.optIn) {
            return { ok: false, reason: 'player-game learning is opt-in only' };
        }
        return {
            ok: true,
            record: this.recordSelfPlayGame({
                ...record,
                source: 'opt-in-player-game'
            })
        };
    }

    convertToExamples(record, options = {}) {
        return selfPlayRecordToExamples(record, options);
    }

    exportJSON() {
        return JSON.stringify({
            schema: 'topoboardgame.trainingDataBundle.v1',
            exportedAt: createdAt(),
            records: this.records
        }, null, 2);
    }

    importJSON(text) {
        const parsed = typeof text === 'string' ? JSON.parse(text) : text;
        const records = Array.isArray(parsed) ? parsed : parsed?.records || [];
        for (const record of records) this.recordSelfPlayGame(record);
        return this.records.length;
    }

    async writeJsonl(filePath, records = this.records) {
        const node = await ensureNodeFs();
        if (!node) throw new Error('JSONL output is only available in Node.js.');
        await node.fs.mkdir(node.path.dirname(node.path.resolve(filePath)), { recursive: true });
        await node.fs.writeFile(
            node.path.resolve(filePath),
            records.map((record) => JSON.stringify(record)).join('\n') + (records.length ? '\n' : ''),
            'utf8'
        );
        return filePath;
    }
}

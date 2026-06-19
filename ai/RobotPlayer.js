export const ROBOT_INTERFACE_VERSION = 'topoboardgame.robot.v1';

export const ROBOT_FAMILIES = Object.freeze({
    chess: 'ChessRobot',
    go: 'GoRobot',
    reversi: 'ReversiRobot',
    jump: 'JumpRobot',
    life: 'LifeRobot',
    anyon: 'AnyonRobot'
});

export const BASE_ROBOT_IDS = Object.freeze({
    chess: 'BaseChessRobot',
    go: 'BaseGoRobot',
    reversi: 'BaseReversiRobot',
    jump: 'BaseJumpRobot',
    life: 'BaseLifeRobot',
    anyon: 'BaseAnyonRobot'
});

export const SUPPORTED_TOPOLOGY_VARIANTS = Object.freeze([
    'normal',
    'torus',
    'mobius',
    'klein',
    'rp2',
    'sphere',
    'cube',
    '3d-torus',
    '4d'
]);

const SHARED_GAME_METHODS = Object.freeze([
    'getLegalMoves',
    'applyMove',
    'undoMove',
    'isTerminal',
    'getResult',
    'encodeState',
    'evaluateHeuristic',
    'getRulesVersion',
    'getTopologyInfo'
]);

function callable(target, name) {
    return target && typeof target[name] === 'function';
}

function clonePlain(value, seen = new WeakSet()) {
    if (value == null || typeof value !== 'object') return value;
    if (seen.has(value)) return '[Circular]';
    if (value instanceof Map) {
        return [...value.entries()].map(([key, entry]) => [clonePlain(key, seen), clonePlain(entry, seen)]);
    }
    if (value instanceof Set) return [...value.values()].map((entry) => clonePlain(entry, seen));
    if (Array.isArray(value)) {
        seen.add(value);
        return value.map((entry) => clonePlain(entry, seen));
    }
    seen.add(value);
    const output = {};
    for (const [key, entry] of Object.entries(value)) {
        if (typeof entry !== 'function') output[key] = clonePlain(entry, seen);
    }
    return output;
}

function inferCurrentPlayer(game, fallback = 'black') {
    if (!game) return fallback;
    if (typeof game.currentPlayer === 'string') return game.currentPlayer;
    if (typeof game.turn === 'string') return game.turn;
    if (typeof game.playerToMove === 'string') return game.playerToMove;
    return fallback;
}

function normalizeMoveList(value) {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    if (value instanceof Map) return [...value.values()];
    if (value instanceof Set) return [...value.values()];
    return [];
}

function fallbackResult(game) {
    if (!game) return null;
    const winner = game.winner || game.result?.winner || null;
    const draw = Boolean(game.draw || game.result?.draw);
    return {
        winner: draw ? 'draw' : winner,
        draw,
        score: game.score || game.result?.score || null,
        reason: game.reason || game.result?.reason || ''
    };
}

function materialLikeScore(game, player) {
    if (!game) return 0;
    if (callable(game, 'score')) {
        const value = game.score(player);
        if (Number.isFinite(Number(value))) return Number(value);
    }
    if (callable(game, 'counts')) {
        const counts = game.counts();
        const mine = Number(counts?.[player] || 0);
        const opponent = Object.entries(counts || {})
            .filter(([key]) => key !== player)
            .reduce((sum, [, value]) => sum + Number(value || 0), 0);
        return mine - opponent;
    }
    if (game.board instanceof Map) {
        let score = 0;
        for (const stone of game.board.values()) {
            const owner = stone?.owner || stone?.color || stone;
            if (owner === player) score += 1;
            else if (owner) score -= 1;
        }
        return score;
    }
    return 0;
}

export function createSharedGameAPI(game, metadata = {}) {
    const target = game?.game || game;
    const original = {};
    for (const name of [
        ...SHARED_GAME_METHODS,
        'legalMoves',
        'allLegalMoves',
        'tryPlay',
        'play',
        'pass',
        'serialize',
        'serializeState',
        'exportState',
        'evaluate',
        'analyze',
        'topologyInfo'
    ]) {
        if (callable(target, name)) original[name] = target[name].bind(target);
    }

    return {
        get source() {
            return target;
        },

        getLegalMoves(player = inferCurrentPlayer(target)) {
            if (original.getLegalMoves) return normalizeMoveList(original.getLegalMoves(player));
            if (original.legalMoves) return normalizeMoveList(original.legalMoves(player));
            if (original.allLegalMoves) return normalizeMoveList(original.allLegalMoves(player));
            if (callable(target?.logic, 'legalMoves')) return normalizeMoveList(target.logic.legalMoves(player));
            return [];
        },

        applyMove(move) {
            if (original.applyMove) return original.applyMove(move);
            if (original.play) {
                const coord = move?.coord || move?.to || move;
                return original.play(coord, move?.player || inferCurrentPlayer(target));
            }
            if (original.tryPlay) {
                const coord = move?.coord || move?.to || move;
                return original.tryPlay(coord, move?.player || inferCurrentPlayer(target));
            }
            if (move?.type === 'pass' && original.pass) return original.pass(inferCurrentPlayer(target));
            return { ok: false, error: 'No applyMove-compatible method is exposed by this game.' };
        },

        undoMove(move) {
            if (original.undoMove) return original.undoMove(move);
            return { ok: false, error: 'Undo is not available for this game adapter.' };
        },

        isTerminal() {
            if (original.isTerminal) return Boolean(original.isTerminal());
            return Boolean(target?.gameOver || target?.winner || target?.result?.terminal);
        },

        getResult() {
            if (original.getResult) return original.getResult();
            return fallbackResult(target);
        },

        encodeState() {
            if (original.encodeState) return original.encodeState();
            if (original.serializeState) return original.serializeState();
            if (original.serialize) return original.serialize();
            if (original.exportState) return original.exportState();
            return clonePlain(target);
        },

        evaluateHeuristic(player = inferCurrentPlayer(target)) {
            if (original.evaluateHeuristic) return Number(original.evaluateHeuristic(player)) || 0;
            if (original.evaluate) return Number(original.evaluate(player)) || 0;
            if (original.analyze) {
                const analysis = original.analyze(player);
                const score = analysis?.score ?? analysis?.currentScore ?? analysis?.evaluation;
                if (Number.isFinite(Number(score))) return Number(score);
            }
            return materialLikeScore(target, player);
        },

        getRulesVersion() {
            if (original.getRulesVersion) return original.getRulesVersion();
            return target?.rulesVersion || target?.version || metadata.rulesVersion || 'local-current';
        },

        getTopologyInfo() {
            if (original.getTopologyInfo) return original.getTopologyInfo();
            if (original.topologyInfo) return original.topologyInfo();
            const topology = target?.topology || target?.topologyInfo || {};
            return {
                topology: topology.topology || topology.name || metadata.topology || target?.topologyName || 'normal',
                variant: target?.variant || metadata.variant || '',
                dimension: topology.dimension || topology.dimensions || metadata.dimension || target?.dimension || 2,
                sizes: topology.sizes || metadata.sizes || [],
                lattice: topology.lattice || metadata.lattice || ''
            };
        }
    };
}

export function attachSharedGameAPI(game, metadata = {}) {
    if (!game || typeof game !== 'object') return game;
    const api = createSharedGameAPI(game, metadata);
    for (const name of SHARED_GAME_METHODS) {
        if (!callable(game, name)) game[name] = api[name].bind(api);
    }
    return game;
}

export class RobotPlayer {
    constructor({ gameType, variant = 'base', topology = 'normal', level = 1, modelId = '', adapter = null } = {}) {
        this.interfaceVersion = ROBOT_INTERFACE_VERSION;
        this.gameType = gameType || 'unknown';
        this.variant = variant;
        this.topology = topology;
        this.level = Number(level) || 1;
        this.modelId = modelId || `${this.gameType}/${this.variant}/${this.topology}/local`;
        this.adapter = adapter;
    }

    async chooseMove(gameState, options = {}) {
        if (callable(this.adapter, 'chooseMove')) {
            return this.adapter.chooseMove(gameState, options);
        }
        const api = options.gameApi || createSharedGameAPI(gameState, this);
        const player = options.player || inferCurrentPlayer(api.source);
        const legalMoves = api.getLegalMoves(player);
        if (!legalMoves.length) return null;
        if (this.level <= 1) return legalMoves[0];
        const index = Math.min(legalMoves.length - 1, Math.floor(Math.random() * legalMoves.length));
        return legalMoves[index];
    }

    async evaluate(gameState, options = {}) {
        if (callable(this.adapter, 'evaluate')) return this.adapter.evaluate(gameState, options);
        const api = options.gameApi || createSharedGameAPI(gameState, this);
        const player = options.player || inferCurrentPlayer(api.source);
        return {
            score: api.evaluateHeuristic(player),
            player,
            modelId: this.modelId,
            source: 'local-heuristic'
        };
    }

    async analyze(gameState, options = {}) {
        if (callable(this.adapter, 'analyze')) return this.adapter.analyze(gameState, options);
        const api = options.gameApi || createSharedGameAPI(gameState, this);
        const player = options.player || inferCurrentPlayer(api.source);
        const [move, evaluation] = await Promise.all([
            this.chooseMove(gameState, { ...options, gameApi: api, player }),
            this.evaluate(gameState, { ...options, gameApi: api, player })
        ]);
        return {
            player,
            bestMove: move,
            legalMoves: api.getLegalMoves(player),
            evaluation,
            modelId: this.modelId,
            topology: api.getTopologyInfo(),
            rulesVersion: api.getRulesVersion()
        };
    }
}

export class BaseChessRobot extends RobotPlayer {
    constructor(options = {}) {
        super({ gameType: 'chess', variant: 'base', topology: 'normal', modelId: 'models/chess/base', ...options });
    }
}

export class BaseGoRobot extends RobotPlayer {
    constructor(options = {}) {
        super({ gameType: 'go', variant: 'base', topology: 'normal', modelId: 'models/go/base', ...options });
    }
}

export class BaseReversiRobot extends RobotPlayer {
    constructor(options = {}) {
        super({ gameType: 'reversi', variant: 'base', topology: 'normal', modelId: 'models/reversi/base', ...options });
    }
}

export class BaseJumpRobot extends RobotPlayer {
    constructor(options = {}) {
        super({ gameType: 'jump', variant: 'base', topology: 'normal', modelId: 'models/jump/base', ...options });
    }
}

export class BaseLifeRobot extends RobotPlayer {
    constructor(options = {}) {
        super({ gameType: 'life', variant: 'base', topology: 'normal', modelId: 'models/life/base', ...options });
    }
}

export class BaseAnyonRobot extends RobotPlayer {
    constructor(options = {}) {
        super({ gameType: 'anyon', variant: 'base', topology: 'normal', modelId: 'models/anyon/base', ...options });
    }
}

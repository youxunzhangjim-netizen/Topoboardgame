import {
    GO_COLORS,
    GraphGoGame,
    goValueToColor
} from '../go/GraphGoGame.js';
import {
    VirasoroLayer,
    normalizeVirasoroConfig
} from '../virasoro/VirasoroLayer.js';

export const VIRASORO_GO_MODE = 'virasoro_go';

function cloneCoord(coord) {
    return [...coord];
}

function cloneValue(value) {
    if (Array.isArray(value)) return value.map(cloneValue);
    if (value && typeof value === 'object') {
        return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, cloneValue(entry)]));
    }
    return value;
}

export class VirasoroGoGame {
    constructor(options = {}) {
        this.reset(options);
    }

    reset(options = {}) {
        this.mode = VIRASORO_GO_MODE;
        this.go = new GraphGoGame({
            topology: options.topology || options,
            komi: Number.isFinite(Number(options.komi)) ? Number(options.komi) : 7.5,
            currentPlayer: options.currentPlayer || 'black'
        });
        this.topology = this.go.topology;
        this.virasoro = new VirasoroLayer({
            topology: this.topology,
            game: this.go,
            config: normalizeVirasoroConfig(options.virasoro || options.config?.virasoro || {})
        });
        this.virasoro.evaluateInstability();
    }

    get currentPlayer() {
        return this.go.currentPlayer;
    }

    set currentPlayer(value) {
        this.go.currentPlayer = value === 'white' ? 'white' : 'black';
    }

    get moveNumber() {
        return this.go.moveNumber;
    }

    get history() {
        return this.go.moveHistory;
    }

    get captures() {
        return this.go.captures;
    }

    get score() {
        return this.go.score;
    }

    get winner() {
        return this.go.winner;
    }

    get scoringPending() {
        return this.go.scoringPending;
    }

    normalize(coord) {
        return this.go.normalize(coord);
    }

    getStone(coord) {
        const normalized = this.normalize(coord);
        if (!normalized) return null;
        const value = this.go.valueAt(normalized);
        const color = goValueToColor(value);
        return color ? { color, coord: normalized } : null;
    }

    stressAt(coord) {
        return this.virasoro.getState(coord);
    }

    groupInfoAt(coord) {
        const info = this.go.groupInfoAt(coord);
        if (!info) return null;
        const key = this.go.key(coord);
        return {
            ...info,
            unstable: this.virasoro.groupStatusForKey(key)
        };
    }

    counts() {
        return this.go.counts();
    }

    emptyLegalKeys() {
        return this.go.vertexKeys.filter((key) => this.go.valueAtKey(key) === GO_COLORS.empty);
    }

    legalMoves() {
        return this.emptyLegalKeys().map((key) => this.go.coordFromKey(key));
    }

    tryPlay(coord, color = this.currentPlayer) {
        const result = this.go.tryPlay(coord, color);
        if (!result.ok) return result;
        result.instability = this.virasoro.evaluateInstability();
        return result;
    }

    pass(color = this.currentPlayer) {
        return this.go.pass(color);
    }

    agreeToCount(color = this.currentPlayer) {
        return this.go.agreeToCount(color);
    }

    previewVirasoroAction({ action, coord, direction, player = this.currentPlayer } = {}) {
        return this.virasoro.previewAction({ action, coord, direction, player });
    }

    applyVirasoroAction({ action, coord, direction, player = this.currentPlayer } = {}) {
        if (player !== this.currentPlayer) return { ok: false, error: `It is ${this.currentPlayer}'s turn.` };
        const result = this.virasoro.applyAction({ action, coord, direction, player });
        if (!result.ok) return result;
        const event = this.go.endTurnWithEvent({
            type: 'virasoro',
            action,
            coord: coord ? cloneCoord(coord) : null,
            direction: direction ? cloneCoord(direction) : null,
            affected: result.event.affected.map(cloneValue),
            transfers: result.event.transfers.map(cloneValue),
            instability: result.instability
        }, player);
        result.event = event;
        return result;
    }

    exportState() {
        return {
            mode: this.mode,
            topology: {
                name: this.topology.name,
                sizes: [...this.topology.sizes],
                dimensions: this.topology.dimensions
            },
            currentPlayer: this.currentPlayer,
            moveNumber: this.moveNumber,
            captures: { ...this.captures },
            score: this.score ? { ...this.score } : null,
            winner: this.winner,
            scoringPending: this.scoringPending,
            go: this.go.exportState(),
            virasoro: this.virasoro.exportState(),
            history: this.history.map(cloneValue)
        };
    }
}

export function createVirasoroGo(options = {}) {
    return new VirasoroGoGame(options);
}

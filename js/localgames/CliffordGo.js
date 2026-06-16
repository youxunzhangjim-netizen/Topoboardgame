import {
    normalizePauliLabel,
    normalizePauliSign,
    transformSignedPauli
} from '../algebra/PauliAlgebra.js';
import {
    GraphGoGame,
    goValueToColor
} from '../go/GraphGoGame.js';
import { coordKey } from '../topology/GraphTopologies.js';

export const CLIFFORD_GO_MODE = 'clifford_go';

function cloneValue(value) {
    if (Array.isArray(value)) return value.map(cloneValue);
    if (value && typeof value === 'object') {
        return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, cloneValue(entry)]));
    }
    return value;
}

export class CliffordGoGame {
    constructor(options = {}) {
        this.reset(options);
    }

    reset(options = {}) {
        this.mode = CLIFFORD_GO_MODE;
        this.go = new GraphGoGame({
            topology: options.topology || options,
            komi: Number.isFinite(Number(options.komi)) ? Number(options.komi) : 7.5,
            currentPlayer: options.currentPlayer || 'black'
        });
        this.topology = this.go.topology;
        this.labels = new Map();
        this.defaultFlipTransform = options.defaultFlipTransform === 'S' ? 'S' : 'H';
        this.trackPhaseSigns = options.trackPhaseSigns !== false;
        this.algebraHistory = [];
    }

    get currentPlayer() { return this.go.currentPlayer; }
    set currentPlayer(value) { this.go.currentPlayer = value === 'white' ? 'white' : 'black'; }
    get moveNumber() { return this.go.moveNumber; }
    get history() { return this.go.moveHistory; }
    get captures() { return this.go.captures; }
    get score() { return this.go.score; }
    get winner() { return this.go.winner; }
    get scoringPending() { return this.go.scoringPending; }

    normalize(coord) {
        return this.go.normalize(coord);
    }

    getStone(coord) {
        const normalized = this.normalize(coord);
        if (!normalized) return null;
        const color = goValueToColor(this.go.valueAt(normalized));
        if (!color) return null;
        const algebra = this.labels.get(coordKey(normalized)) || { pauliLabel: 'X', pauliSign: 1 };
        return { color, coord: normalized, ...cloneValue(algebra) };
    }

    primaryLabel(stone) {
        return `${normalizePauliSign(stone?.pauliSign) < 0 ? '-' : '+'}${normalizePauliLabel(stone?.pauliLabel, 'X')}`;
    }

    groupInfoAt(coord) {
        return this.go.groupInfoAt(coord);
    }

    counts() {
        return this.go.counts();
    }

    legalMoves() {
        return this.go.legalMoves(this.currentPlayer);
    }

    tryPlay(coord, color = this.currentPlayer, options = {}) {
        const result = this.go.tryPlay(coord, color);
        if (!result.ok) return result;
        const normalized = this.normalize(coord);
        const label = {
            pauliLabel: normalizePauliLabel(options.pauliLabel, 'X'),
            pauliSign: normalizePauliSign(options.pauliSign)
        };
        this.labels.set(coordKey(normalized), label);
        const capturedLabels = result.event.capturedStones.map((captured) => {
            const key = coordKey(captured);
            const capturedLabel = this.labels.get(key) || null;
            this.labels.delete(key);
            return { coord: [...captured], label: cloneValue(capturedLabel) };
        });
        result.event.pauliLabel = label.pauliLabel;
        result.event.pauliSign = label.pauliSign;
        result.event.capturedLabels = capturedLabels;
        this.algebraHistory.push(cloneValue(result.event));
        return result;
    }

    applyCliffordAction(coord, generator = this.defaultFlipTransform, player = this.currentPlayer) {
        const normalized = this.normalize(coord);
        if (!normalized) return { ok: false, error: 'Choose a valid graph vertex.' };
        const key = coordKey(normalized);
        const stone = this.getStone(normalized);
        if (!stone || stone.color !== player) return { ok: false, error: 'Choose one of your Go stones.' };
        const before = { pauliLabel: stone.pauliLabel, pauliSign: stone.pauliSign };
        const after = transformSignedPauli(before, generator, this.trackPhaseSigns);
        this.labels.set(key, after);
        const event = this.go.endTurnWithEvent({
            type: 'clifford_action',
            coord: [...normalized],
            generator,
            before,
            after
        }, player);
        this.algebraHistory.push(cloneValue(event));
        return { ok: true, event };
    }

    pass(color = this.currentPlayer) {
        return this.go.pass(color);
    }

    agreeToCount(color = this.currentPlayer) {
        return this.go.agreeToCount(color);
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
            go: this.go.exportState(),
            labels: [...this.labels.entries()].map(([key, label]) => ({
                key,
                coord: this.go.coordFromKey(key),
                ...cloneValue(label)
            })),
            algebraHistory: cloneValue(this.algebraHistory),
            history: cloneValue(this.history)
        };
    }
}

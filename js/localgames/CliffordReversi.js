import {
    normalizePauliLabel,
    transformPauliLabel,
    transportLabelAcrossEdges
} from '../algebra/PauliAlgebra.js';
import {
    coordKey,
    createGraphTopology,
    sumHomology
} from '../topology/GraphTopologies.js';

export const CLIFFORD_REVERSI_MODE = 'clifford_reversi';

const PLAYERS = Object.freeze(['black', 'white']);
const DEFAULT_LABELS = Object.freeze(['X', 'Y', 'Z']);

function otherPlayer(player) {
    return player === 'black' ? 'white' : 'black';
}

function cloneStone(stone) {
    return stone ? { color: stone.color, pauliLabel: stone.pauliLabel } : null;
}

export class CliffordReversiGame {
    constructor(options = {}) {
        this.reset(options);
    }

    reset(options = {}) {
        this.mode = CLIFFORD_REVERSI_MODE;
        this.topology = createGraphTopology(options.topology || options);
        this.currentPlayer = options.currentPlayer || 'black';
        this.defaultFlipTransform = options.defaultFlipTransform || 'H';
        this.board = new Map();
        this.moveNumber = 0;
        this.history = [];
        this.positionHistory = [];
        this.setupInitialPosition();
        this.recordPosition('setup');
    }

    setupInitialPosition() {
        const sizes = this.topology.sizes;
        if (this.topology.dimensions === 4) {
            const x = Math.max(1, Math.floor(sizes[0] / 2) - 1);
            const y = Math.max(1, Math.floor(sizes[1] / 2) - 1);
            const z = Math.floor(sizes[2] / 2);
            const w = Math.floor(sizes[3] / 2);
            this.setStone([x, y, z, w], { color: 'white', pauliLabel: 'X' });
            this.setStone([x + 1, y + 1, z, w], { color: 'white', pauliLabel: 'Z' });
            this.setStone([x + 1, y, z, w], { color: 'black', pauliLabel: 'Y' });
            this.setStone([x, y + 1, z, w], { color: 'black', pauliLabel: 'X' });
            return;
        }
        const x = Math.max(1, Math.floor(sizes[0] / 2) - 1);
        const y = Math.max(1, Math.floor(sizes[1] / 2) - 1);
        this.setStone([x, y], { color: 'white', pauliLabel: 'X' });
        this.setStone([x + 1, y + 1], { color: 'white', pauliLabel: 'Z' });
        this.setStone([x + 1, y], { color: 'black', pauliLabel: 'Y' });
        this.setStone([x, y + 1], { color: 'black', pauliLabel: 'X' });
    }

    getStone(coord) {
        const normalized = this.topology.normalize(coord);
        if (!normalized) return null;
        return cloneStone(this.board.get(coordKey(normalized)));
    }

    setStone(coord, stone) {
        const normalized = this.topology.normalize(coord);
        if (!normalized) return false;
        const label = normalizePauliLabel(stone.pauliLabel || stone.pauli || DEFAULT_LABELS[this.board.size % DEFAULT_LABELS.length], 'X');
        this.board.set(coordKey(normalized), { color: stone.color, pauliLabel: label });
        return true;
    }

    isEmpty(coord) {
        const normalized = this.topology.normalize(coord);
        return Boolean(normalized) && !this.board.has(coordKey(normalized));
    }

    collectRay(coord, direction, player) {
        const opponent = otherPlayer(player);
        const chain = [];
        const edges = [];
        const seen = new Set([coordKey(coord)]);
        let cursor = coord;

        for (let step = 0; step < this.topology.maxRaySteps; step++) {
            const next = this.topology.step(cursor, direction);
            if (!next) break;
            const nextKey = coordKey(next.coord);
            if (seen.has(nextKey)) break;
            seen.add(nextKey);
            edges.push(next.edge);

            const stone = this.board.get(nextKey);
            if (!stone) break;
            if (stone.color === opponent) {
                chain.push({
                    coord: next.coord,
                    key: nextKey,
                    stone: cloneStone(stone),
                    edges: [...edges]
                });
                cursor = next.coord;
                continue;
            }
            if (stone.color === player && chain.length) {
                return { bracketed: true, chain, edges: [...edges] };
            }
            break;
        }

        return { bracketed: false, chain: [], edges };
    }

    previewMove(coord, player = this.currentPlayer, transform = this.defaultFlipTransform) {
        const normalized = this.topology.normalize(coord);
        if (!normalized) return { legal: false, reason: 'outside', flips: [] };
        if (!this.isEmpty(normalized)) return { legal: false, reason: 'occupied', flips: [] };

        const rays = [];
        const flips = [];
        for (const direction of this.topology.rayDirections()) {
            const ray = this.collectRay(normalized, direction, player);
            if (!ray.bracketed) continue;
            rays.push({ direction, chain: ray.chain.map((item) => item.coord), edges: ray.edges });
            for (const item of ray.chain) {
                flips.push({
                    coord: item.coord,
                    key: item.key,
                    before: item.stone,
                    after: {
                        color: player,
                        pauliLabel: transportLabelAcrossEdges(
                            transformPauliLabel(item.stone.pauliLabel, transform),
                            item.edges
                        )
                    },
                    transportEdges: item.edges
                });
            }
        }

        const unique = new Map();
        for (const flip of flips) unique.set(flip.key, flip);
        return {
            legal: unique.size > 0,
            coord: normalized,
            player,
            transform,
            rays,
            flips: [...unique.values()]
        };
    }

    legalMoves(player = this.currentPlayer, transform = this.defaultFlipTransform) {
        return this.topology.vertices()
            .map((coord) => this.previewMove(coord, player, transform))
            .filter((preview) => preview.legal);
    }

    place(coord, options = {}) {
        const player = options.player || this.currentPlayer;
        const transform = options.transform || this.defaultFlipTransform;
        const pauliLabel = normalizePauliLabel(options.pauliLabel || options.pauli || DEFAULT_LABELS[this.moveNumber % DEFAULT_LABELS.length], 'X');
        const preview = this.previewMove(coord, player, transform);
        if (!preview.legal) return { ok: false, error: 'Place a stone where it brackets at least one opponent chain.', preview };

        this.setStone(preview.coord, { color: player, pauliLabel });
        for (const flip of preview.flips) this.board.set(flip.key, flip.after);

        const edges = preview.rays.flatMap((ray) => ray.edges);
        const sector = sumHomology(edges);
        this.moveNumber++;
        const event = {
            mode: this.mode,
            type: 'place',
            number: this.moveNumber,
            player,
            coord: preview.coord,
            pauliLabel,
            transform,
            flipped: preview.flips.map((flip) => ({
                coord: flip.coord,
                before: flip.before,
                after: flip.after
            })),
            winding: sector,
            seamTransports: edges
                .filter((edge) => edge.transport && edge.transport !== 'identity')
                .map((edge) => ({ from: edge.from, to: edge.to, transport: edge.transport }))
        };
        this.history.unshift(event);
        this.currentPlayer = otherPlayer(player);
        this.recordPosition('move');
        return { ok: true, event };
    }

    pass(player = this.currentPlayer) {
        this.moveNumber++;
        const event = { mode: this.mode, type: 'pass', number: this.moveNumber, player };
        this.history.unshift(event);
        this.currentPlayer = otherPlayer(player);
        return { ok: true, event };
    }

    counts() {
        const result = { black: 0, white: 0, labels: { X: 0, Y: 0, Z: 0 } };
        for (const stone of this.board.values()) {
            result[stone.color] = (result[stone.color] || 0) + 1;
            result.labels[stone.pauliLabel] = (result.labels[stone.pauliLabel] || 0) + 1;
        }
        return result;
    }

    recordPosition(type) {
        this.positionHistory.push({
            type,
            number: this.moveNumber,
            stones: [...this.board.entries()].map(([key, stone]) => ({ key, ...stone }))
        });
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
            board: [...this.board.entries()].map(([key, stone]) => ({ key, coord: key.split(',').map(Number), ...stone })),
            counts: this.counts(),
            history: this.history,
            positionHistory: this.positionHistory
        };
    }
}

export function createCliffordReversi(options = {}) {
    return new CliffordReversiGame(options);
}

import {
    anyonTypes,
    applyAnyonAutomorphism,
    createFusionResult,
    normalizeAnyonConfig,
    normalizeAnyonType
} from '../anyon/AnyonAlgebra.js';
import { coordKey, sumHomology } from '../topology/GraphTopologies.js';
import { CliffordReversiGame } from './CliffordReversi.js';

export const ANYON_REVERSI_MODE = 'anyon_reversi';

const PAULI_TO_TORIC = Object.freeze({
    I: '1',
    X: 'e',
    Z: 'm',
    Y: 'psi'
});

function cloneValue(value) {
    if (Array.isArray(value)) return value.map(cloneValue);
    if (value && typeof value === 'object') {
        return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, cloneValue(entry)]));
    }
    return value;
}

function otherPlayer(player) {
    return player === 'black' ? 'white' : 'black';
}

function positiveModulo(value, modulus) {
    return ((value % modulus) + modulus) % modulus;
}

export class AnyonReversiGame extends CliffordReversiGame {
    reset(options = {}) {
        this.config = normalizeAnyonConfig({
            anyonModel: 'toric_code',
            vacuumFusionBehavior: 'keep_resolved',
            ...options.config
        });
        this.algebraSet = 'anyon';
        super.reset({ ...options, algebraSet: 'anyon', physicalProblem: null, physicalProblemId: null, problemId: null });
        this.mode = ANYON_REVERSI_MODE;
        this.algebraSet = 'anyon';
    }

    placementTypes() {
        const types = anyonTypes(this.config.anyonModel, this.config.generalAnyonGrade)
            .filter((type) => type !== '1');
        return types.length ? types : ['e', 'm', 'psi'];
    }

    normalizeConfiguredType(type = null) {
        const requested = String(type || '').trim();
        const mapped = this.config.anyonModel === 'toric_code'
            ? (PAULI_TO_TORIC[requested.toUpperCase()] || requested)
            : requested;
        const normalized = normalizeAnyonType(mapped || this.placementTypes()[0], this.config.anyonModel, this.config.generalAnyonGrade);
        return normalized === '1' ? this.placementTypes()[0] : normalized;
    }

    setupInitialPosition() {
        const sizes = this.topology.sizes;
        const x = Math.max(1, Math.floor(sizes[0] / 2) - 1);
        const y = Math.max(1, Math.floor(sizes[1] / 2) - 1);
        const extra = sizes.slice(2).map((size) => Math.floor(size / 2));
        const types = this.placementTypes();
        this.setStone([x, y, ...extra], { color: 'white', anyonType: types[0] });
        this.setStone([x + 1, y + 1, ...extra], { color: 'white', anyonType: types[1 % types.length] });
        this.setStone([x + 1, y, ...extra], { color: 'black', anyonType: types[2 % types.length] });
        this.setStone([x, y + 1, ...extra], { color: 'black', anyonType: types[0] });
    }

    getStone(coord) {
        const normalized = this.topology.normalize(coord);
        if (!normalized) return null;
        return cloneValue(this.board.get(coordKey(normalized)) || null);
    }

    setStone(coord, stone = {}) {
        const normalized = this.topology.normalize(coord);
        if (!normalized) return false;
        const anyonType = this.normalizeConfiguredType(stone.anyonType || stone.primaryType || stone.pauliLabel);
        this.board.set(coordKey(normalized), {
            color: stone.color,
            anyonType,
            pauliLabel: anyonType,
            revealed: stone.revealed ?? true,
            stability: Number.isFinite(Number(stone.stability)) ? Number(stone.stability) : 1,
            age: Number.isFinite(Number(stone.age)) ? Number(stone.age) : 0,
            energy: Number.isFinite(Number(stone.energy)) ? Number(stone.energy) : 0,
            phaseLabel: Number.isFinite(Number(stone.phaseLabel)) ? Number(stone.phaseLabel) : 0,
            anyonPhaseNumerator: positiveModulo(Number(stone.anyonPhaseNumerator || 0), this.config.generalAnyonGrade),
            anyonPhaseDenominator: this.config.generalAnyonGrade,
            fusionHistory: Array.isArray(stone.fusionHistory) ? cloneValue(stone.fusionHistory) : [],
            measurementHistory: Array.isArray(stone.measurementHistory) ? cloneValue(stone.measurementHistory) : [],
            noiseHistory: Array.isArray(stone.noiseHistory) ? cloneValue(stone.noiseHistory) : [],
            lastUpdate: stone.lastUpdate ? cloneValue(stone.lastUpdate) : null
        });
        return true;
    }

    transformTypeAcrossEdges(type, edges) {
        return edges.reduce((current, edge) =>
            applyAnyonAutomorphism(
                current,
                this.topology.seamTransform(edge),
                this.config.anyonModel,
                this.config.generalAnyonGrade
            ), this.normalizeConfiguredType(type));
    }

    previewMove(coord, player = this.currentPlayer, anyonType = this.placementTypes()[this.moveNumber % this.placementTypes().length]) {
        const normalized = this.topology.normalize(coord);
        if (!normalized) return { legal: false, reason: 'outside', flips: [] };
        if (!this.isEmpty(normalized)) return { legal: false, reason: 'occupied', flips: [] };

        const placedType = this.normalizeConfiguredType(anyonType);
        const rays = [];
        const flips = [];
        for (const direction of this.topology.rayDirections()) {
            const ray = this.collectRay(normalized, direction, player);
            if (!ray.bracketed) continue;
            rays.push({ direction, chain: ray.chain.map((item) => item.coord), edges: ray.edges });
            for (const item of ray.chain) {
                const transportedType = this.transformTypeAcrossEdges(item.stone.anyonType, item.edges);
                const fusion = createFusionResult(placedType, transportedType, this.config);
                const resolved = fusion.resolved && fusion.resolved !== '1'
                    ? fusion.resolved
                    : (fusion.outputs.find((output) => output !== '1') || placedType);
                flips.push({
                    coord: item.coord,
                    key: item.key,
                    before: item.stone,
                    after: {
                        ...item.stone,
                        color: player,
                        anyonType: resolved,
                        pauliLabel: resolved,
                        fusionHistory: [
                            ...(item.stone.fusionHistory || []),
                            {
                                input: [placedType, transportedType],
                                outputs: fusion.outputs,
                                resolved,
                                vacuumAvailable: fusion.vacuum
                            }
                        ],
                        lastUpdate: {
                            action: 'anyon_reversi_fusion',
                            tick: this.moveNumber + 1,
                            placedType,
                            transportedType,
                            resolved
                        }
                    },
                    fusion,
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
            anyonType: placedType,
            rays,
            flips: [...unique.values()]
        };
    }

    legalMoves(player = this.currentPlayer, anyonType = this.placementTypes()[this.moveNumber % this.placementTypes().length]) {
        return this.topology.vertices()
            .map((coord) => this.previewMove(coord, player, anyonType))
            .filter((preview) => preview.legal);
    }

    place(coord, options = {}) {
        const player = options.player || this.currentPlayer;
        const anyonType = this.normalizeConfiguredType(options.anyonType || options.primaryType || options.pauliLabel);
        const preview = this.previewMove(coord, player, anyonType);
        if (!preview.legal) return { ok: false, error: 'Place a charge where it brackets at least one opponent chain.', preview };

        this.setStone(preview.coord, {
            color: player,
            anyonType,
            lastUpdate: { action: 'anyon_reversi_place', tick: this.moveNumber + 1 }
        });
        for (const flip of preview.flips) this.board.set(flip.key, flip.after);

        const edges = preview.rays.flatMap((ray) => ray.edges);
        const sector = sumHomology(edges);
        this.moveNumber++;
        const event = {
            mode: this.mode,
            algebraSet: this.algebraSet,
            type: 'place',
            number: this.moveNumber,
            player,
            coord: preview.coord,
            anyonType,
            flipped: preview.flips.map((flip) => ({
                coord: flip.coord,
                before: flip.before,
                after: flip.after,
                fusion: flip.fusion
            })),
            winding: sector,
            seamTransports: edges
                .filter((edge) => this.topology.seamTransform(edge) !== 'identity')
                .map((edge) => ({ from: edge.from, to: edge.to, automorphism: this.topology.seamTransform(edge) }))
        };
        this.history.unshift(event);
        this.currentPlayer = otherPlayer(player);
        event.noise = this.maybeApplyNoise('after_move', player);
        event.time = this.maybeApplyTime('after_move', player);
        this.recordPosition(event.time?.applied ? 'time' : 'move');
        return { ok: true, event };
    }

    measureAnyonChargeAt(coord, player = this.currentPlayer) {
        const group = this.connectedGroup(coord);
        if (!group.length) return { ok: false, error: 'Measure a connected anyon domain by targeting a charge.' };
        const tokens = group.map(({ entity, key, coord: vertex }) => ({
            id: key,
            owner: entity.color,
            anyonType: entity.anyonType,
            coord: vertex,
            vertex
        }));
        const measurement = this.probability.measureAnyonTotalCharge({
            tokens,
            player,
            model: this.config.anyonModel,
            tick: this.probability.nextTick()
        });
        this.history.unshift({
            mode: this.mode,
            type: 'measurement',
            number: this.moveNumber,
            player,
            measurement
        });
        return { ok: true, measurement };
    }

    counts() {
        const labels = Object.fromEntries(anyonTypes(this.config.anyonModel, this.config.generalAnyonGrade).map((type) => [type, 0]));
        const result = { black: 0, white: 0, labels };
        for (const stone of this.board.values()) {
            result[stone.color] = (result[stone.color] || 0) + 1;
            result.labels[stone.anyonType] = (result.labels[stone.anyonType] || 0) + 1;
        }
        return result;
    }

    stoneLabel(stone) {
        return stone?.anyonType || '1';
    }

    exportState() {
        return {
            ...super.exportState(),
            mode: this.mode,
            algebraSet: this.algebraSet,
            anyonConfig: cloneValue(this.config)
        };
    }
}

export function createAnyonReversi(options = {}) {
    return new AnyonReversiGame(options);
}

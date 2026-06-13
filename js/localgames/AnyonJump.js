import {
    applyAnyonAutomorphism,
    braidEffectForPhase,
    createFusionResult,
    mutualBraidPhase,
    normalizeAnyonConfig,
    normalizeAnyonType
} from '../anyon/AnyonAlgebra.js';
import {
    coordKey,
    createGraphTopology,
    coordsEqual,
    sumHomology
} from '../topology/GraphTopologies.js';

export const ANYON_JUMP_MODE = 'anyon_jump';

const OWNERS = Object.freeze(['black', 'white']);
const DEFAULT_TYPES = Object.freeze(['e', 'm', 'psi']);

function otherOwner(owner) {
    return owner === 'black' ? 'white' : 'black';
}

function cloneCoord(coord) {
    return [...coord];
}

export class AnyonJumpGame {
    constructor(options = {}) {
        this.reset(options);
    }

    reset(options = {}) {
        this.mode = ANYON_JUMP_MODE;
        this.topology = createGraphTopology(options.topology || options);
        this.config = normalizeAnyonConfig({
            anyonModel: 'toric_code',
            braidEffect: 'add_braid_token',
            vacuumFusionBehavior: 'remove',
            ...options.config
        });
        this.currentPlayer = options.currentPlayer || 'black';
        this.tokens = new Map();
        this.worldlines = new Map();
        this.braidTokens = { black: 0, white: 0 };
        this.score = { black: 0, white: 0 };
        this.parity = { black: 0, white: 0 };
        this.fusionOutcomes = [];
        this.history = [];
        this.topologicalSectors = [];
        this.moveNumber = 0;
        this.fusionSites = new Set();
        this.setupInitialPosition();
    }

    setupInitialPosition() {
        const sizes = this.topology.sizes;
        const width = sizes[0];
        const yBlack = this.topology.dimensions === 4 ? 0 : 1;
        const yWhite = this.topology.dimensions === 4 ? sizes[1] - 1 : Math.max(0, sizes[1] - 2);
        const z = this.topology.dimensions === 4 ? Math.floor(sizes[2] / 2) : null;
        const w = this.topology.dimensions === 4 ? Math.floor(sizes[3] / 2) : null;
        const count = Math.min(width, 6);
        const offset = Math.floor((width - count) / 2);

        for (let i = 0; i < count; i++) {
            const x = offset + i;
            const type = DEFAULT_TYPES[i % DEFAULT_TYPES.length];
            const blackCoord = this.topology.dimensions === 4 ? [x, yBlack, z, w] : [x, yBlack];
            const whiteCoord = this.topology.dimensions === 4 ? [x, yWhite, z, w] : [x, yWhite];
            this.addToken({ owner: 'black', coord: blackCoord, anyonType: type });
            this.addToken({ owner: 'white', coord: whiteCoord, anyonType: DEFAULT_TYPES[(i + 1) % DEFAULT_TYPES.length] });
        }

        const center = this.topology.dimensions === 4
            ? [Math.floor(sizes[0] / 2), Math.floor(sizes[1] / 2), z, w]
            : [Math.floor(sizes[0] / 2), Math.floor(sizes[1] / 2)];
        this.fusionSites.add(coordKey(center));
    }

    addToken({ id, owner = this.currentPlayer, coord, anyonType = 'e' }) {
        const normalized = this.topology.normalize(coord);
        if (!normalized) return null;
        const tokenId = id || `a${this.tokens.size + 1}`;
        const token = {
            id: tokenId,
            owner,
            coord: normalized,
            anyonType: normalizeAnyonType(anyonType, this.config.anyonModel)
        };
        this.tokens.set(tokenId, token);
        this.worldlines.set(tokenId, [cloneCoord(normalized)]);
        return token;
    }

    tokenAt(coord, exceptId = '') {
        const key = coordKey(coord);
        return [...this.tokens.values()].find((token) => token.id !== exceptId && coordKey(token.coord) === key) || null;
    }

    tokensAt(coord, exceptId = '') {
        const key = coordKey(coord);
        return [...this.tokens.values()].filter((token) => token.id !== exceptId && coordKey(token.coord) === key);
    }

    isFusionSite(coord) {
        return this.fusionSites.has(coordKey(coord));
    }

    pathEdgesFromCoords(path, directions = []) {
        const edges = [];
        for (let index = 1; index < path.length; index++) {
            const direction = directions[index - 1] || path[index].map((value, axis) => value - path[index - 1][axis]);
            const step = this.topology.step(path[index - 1], direction);
            if (step) edges.push(step.edge);
        }
        return edges;
    }

    transformTypeAcrossEdges(type, edges) {
        return edges.reduce((current, edge) =>
            applyAnyonAutomorphism(current, this.topology.seamTransform(edge), this.config.anyonModel), type);
    }

    legalActionsForToken(id) {
        const token = this.tokens.get(id);
        if (!token || token.owner !== this.currentPlayer) return [];
        const actions = [];
        for (const direction of this.topology.directions()) {
            const one = this.topology.step(token.coord, direction);
            if (!one) continue;
            const adjacent = this.tokenAt(one.coord, id);
            if (!adjacent) {
                actions.push({
                    kind: 'move',
                    tokenId: id,
                    from: cloneCoord(token.coord),
                    to: one.coord,
                    path: [cloneCoord(token.coord), one.coord],
                    directions: [direction],
                    over: null
                });
                continue;
            }
            const two = this.topology.step(one.coord, direction);
            if (!two) continue;
            const landingOccupant = this.tokenAt(two.coord, id);
            const canLandForFusion = landingOccupant && this.isFusionSite(two.coord);
            if (!landingOccupant || canLandForFusion) {
                actions.push({
                    kind: 'jump',
                    tokenId: id,
                    from: cloneCoord(token.coord),
                    over: adjacent.id,
                    overCoord: one.coord,
                    to: two.coord,
                    path: [cloneCoord(token.coord), one.coord, two.coord],
                    directions: [direction, direction]
                });
            }
        }
        return this.dedupeActions(actions);
    }

    dedupeActions(actions) {
        const seen = new Set();
        return actions.filter((action) => {
            const key = `${action.kind}:${coordKey(action.to)}:${action.over || ''}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });
    }

    legalActions(owner = this.currentPlayer) {
        return [...this.tokens.values()]
            .filter((token) => token.owner === owner)
            .flatMap((token) => this.legalActionsForToken(token.id));
    }

    applyBraidEffect(owner, effect) {
        if (effect.effect === 'add_braid_token') this.braidTokens[owner] += effect.delta;
        if (effect.effect === 'score_bonus') this.score[owner] += effect.delta;
        if (effect.effect === 'flip_parity') this.parity[owner] = this.parity[owner] ? 0 : 1;
    }

    move(tokenId, toCoord) {
        const token = this.tokens.get(tokenId);
        if (!token) return { ok: false, error: 'Unknown token.' };
        if (token.owner !== this.currentPlayer) return { ok: false, error: 'Choose one of your own anyons.' };
        const normalizedTo = this.topology.normalize(toCoord);
        if (!normalizedTo) return { ok: false, error: 'Target is outside this graph.' };
        const action = this.legalActionsForToken(tokenId)
            .find((candidate) => coordsEqual(candidate.to, normalizedTo));
        if (!action) return { ok: false, error: 'Choose an adjacent empty point or a legal jump landing.' };
        return this.applyAction(action);
    }

    applyAction(action) {
        const token = this.tokens.get(action.tokenId);
        if (!token) return { ok: false, error: 'Unknown token.' };

        const edges = this.pathEdgesFromCoords(action.path, action.directions);
        const beforeType = token.anyonType;
        token.anyonType = this.transformTypeAcrossEdges(token.anyonType, edges);
        token.coord = cloneCoord(action.to);
        this.worldlines.get(token.id)?.push(...action.path.slice(1).map(cloneCoord));

        let braid = null;
        if (action.kind === 'jump' && action.over) {
            const jumped = this.tokens.get(action.over);
            if (jumped) {
                const phase = mutualBraidPhase(token.anyonType, jumped.anyonType, this.config.anyonModel);
                const effect = braidEffectForPhase(phase, this.config);
                this.applyBraidEffect(token.owner, effect);
                braid = {
                    jumpedId: jumped.id,
                    jumpedType: jumped.anyonType,
                    phase,
                    effect
                };
            }
        }

        const fusion = this.resolveFusion(token.id);
        const winding = sumHomology(edges);
        this.topologicalSectors.push({ number: this.moveNumber + 1, tokenId: action.tokenId, winding });
        this.moveNumber++;
        const event = {
            mode: this.mode,
            number: this.moveNumber,
            player: token.owner,
            kind: action.kind,
            tokenId: action.tokenId,
            from: action.from,
            to: action.to,
            path: action.path,
            beforeType,
            afterType: this.tokens.get(action.tokenId)?.anyonType || '1',
            braid,
            fusion,
            winding,
            seamTransforms: edges
                .filter((edge) => this.topology.seamTransform(edge) !== 'identity')
                .map((edge) => ({ from: edge.from, to: edge.to, automorphism: this.topology.seamTransform(edge) }))
        };
        this.history.unshift(event);
        this.currentPlayer = otherOwner(token.owner);
        return { ok: true, event };
    }

    resolveFusion(tokenId) {
        const token = this.tokens.get(tokenId);
        if (!token) return null;
        const occupants = this.tokensAt(token.coord, token.id);
        if (!occupants.length) return null;
        if (!this.isFusionSite(token.coord)) return null;

        const other = occupants[0];
        const fusion = createFusionResult(token.anyonType, other.anyonType, this.config);
        const outcome = {
            coord: cloneCoord(token.coord),
            firstId: token.id,
            secondId: other.id,
            input: fusion.input,
            outputs: fusion.outputs,
            resolved: fusion.resolved,
            vacuum: fusion.vacuum
        };

        if (fusion.resolved === '1') {
            this.tokens.delete(token.id);
            this.tokens.delete(other.id);
            outcome.removed = [token.id, other.id];
        } else if (fusion.resolved) {
            token.anyonType = fusion.resolved;
            this.tokens.delete(other.id);
            outcome.replaced = { id: token.id, anyonType: fusion.resolved };
        }
        this.fusionOutcomes.push(outcome);
        return outcome;
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
            braidTokens: { ...this.braidTokens },
            score: { ...this.score },
            parity: { ...this.parity },
            tokens: [...this.tokens.values()].map((token) => ({ ...token, coord: cloneCoord(token.coord) })),
            fusionSites: [...this.fusionSites].map((key) => key.split(',').map(Number)),
            worldlines: Object.fromEntries([...this.worldlines.entries()].map(([id, path]) => [id, path.map(cloneCoord)])),
            fusionOutcomes: this.fusionOutcomes,
            topologicalSectors: this.topologicalSectors,
            history: this.history
        };
    }
}

export function createAnyonJump(options = {}) {
    return new AnyonJumpGame(options);
}

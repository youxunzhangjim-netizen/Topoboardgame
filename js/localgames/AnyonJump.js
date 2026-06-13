import {
    applyAnyonAutomorphism,
    braidEffectForPhase,
    createFusionResult,
    mutualBraidPhase,
    normalizeAnyonConfig,
    normalizeAnyonType
} from '../anyon/AnyonAlgebra.js';
import {
    applyBraid as applyBraidToMemory,
    attemptUnbraid as applyUnbraidGenerator,
    attachBraidMemory,
    braidGeneratorIndex,
    braidSignFromDirection,
    mergeBraidMemory
} from '../anyon/BraidMemory.js';
import { detectTopologyBraidEvents } from '../anyon/BraidPathDetector.js';
import {
    coordKey,
    createGraphTopology,
    coordsEqual,
    sumHomology
} from '../topology/GraphTopologies.js';
import { ProbabilityEngine } from '../probability/ProbabilityEngine.js';
import { FloquetEngine } from '../time/FloquetEngine.js';

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
            braidMemoryMode: 'abelian_parity',
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
        this.probability = new ProbabilityEngine(options.probability || {});
        this.time = new FloquetEngine({
            topology: this.topology,
            config: options.time || options.floquet || {},
            game: this
        });
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

    addToken({ id, owner = this.currentPlayer, coord, anyonType = 'e', hiddenState = null, revealed = true, stability = 1 }) {
        const normalized = this.topology.normalize(coord);
        if (!normalized) return null;
        let tokenId = id || `a${this.tokens.size + 1}`;
        let suffix = this.tokens.size + 1;
        while (this.tokens.has(tokenId)) {
            suffix += 1;
            tokenId = `a${suffix}`;
        }
        const token = {
            id: tokenId,
            owner,
            coord: normalized,
            anyonType: normalizeAnyonType(anyonType, this.config.anyonModel),
            hiddenState,
            revealed,
            stability: Number.isFinite(Number(stability)) ? Number(stability) : 1,
            age: 0,
            energy: 0,
            phaseLabel: 0,
            cooldown: 0,
            measurementHistory: [],
            noiseHistory: []
        };
        attachBraidMemory(token, {}, this.config);
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

    applyBraid(movingToken, event) {
        const target = this.tokens.get(event.targetId) || event.target || { id: event.targetId, defect: true };
        const phase = target?.anyonType
            ? mutualBraidPhase(movingToken.anyonType, target.anyonType, this.config.anyonModel)
            : 1;
        if (this.config.braidMemoryMode === 'abelian_parity' && phase !== -1) {
            return {
                ...event,
                jumpedId: event.reason === 'jump_over' ? event.targetId : null,
                jumpedType: event.reason === 'jump_over' ? target?.anyonType : null,
                targetType: target?.anyonType || target?.type || event.reason,
                phase,
                effect: { phase, effect: 'none', delta: 0 },
                braidGenerator: null,
                braidParity: movingToken.braidParity || 0,
                braidWord: movingToken.braidWord.map((entry) => ({ ...entry })),
                isBraided: movingToken.isBraided,
                skipped: 'abelian_trivial_mutual_braid'
            };
        }
        const memory = applyBraidToMemory(movingToken, target, event, this.config);
        const effect = braidEffectForPhase(phase, this.config);
        if (effect.effect !== 'none') this.applyBraidEffect(movingToken.owner, effect);
        return {
            ...memory,
            jumpedId: event.reason === 'jump_over' ? event.targetId : null,
            jumpedType: event.reason === 'jump_over' ? target?.anyonType : null,
            targetType: target?.anyonType || target?.type || event.reason,
            phase,
            effect
        };
    }

    braidGeneratorFor(token, targetId, { path = [], direction = [], sign = null, index = null } = {}) {
        const resolvedDirection = direction.length
            ? direction
            : (path.length > 1 ? path[1].map((value, axis) => value - path[0][axis]) : []);
        return {
            generator: 'sigma',
            index: index ?? braidGeneratorIndex([...this.tokens.keys(), targetId], token.id, targetId),
            sign: sign == null ? braidSignFromDirection(resolvedDirection) : sign,
            targetId,
            tick: this.moveNumber
        };
    }

    canAttemptUnbraid(token, target) {
        if (!target) return { ok: true };
        if (target.owner === token.owner && !this.config.allowFriendlyUnbraid) {
            return { ok: false, error: 'Friendly unbraid targets are disabled.' };
        }
        if (target.owner !== token.owner && !this.config.allowOpponentUnbraid) {
            return { ok: false, error: 'Opponent unbraid targets are disabled.' };
        }
        return { ok: true };
    }

    attemptUnbraid(tokenId, targetId, { player = this.currentPlayer, path = [], direction = [], sign = null, index = null } = {}) {
        const token = this.tokens.get(tokenId);
        if (!token) return { ok: false, error: 'Unknown token.' };
        if (token.owner !== player) return { ok: false, error: 'Choose one of your own anyons.' };
        const target = this.tokens.get(targetId) || null;
        const allowed = this.canAttemptUnbraid(token, target);
        if (!allowed.ok) return allowed;

        const resolvedPath = path.length
            ? path.map(cloneCoord)
            : (target ? [cloneCoord(token.coord), cloneCoord(target.coord)] : [cloneCoord(token.coord)]);
        const resolvedDirection = direction.length
            ? direction
            : (resolvedPath.length > 1 ? resolvedPath[1].map((value, axis) => value - resolvedPath[0][axis]) : []);
        const beforeWord = token.braidWord.map((entry) => ({ ...entry }));
        const generator = this.braidGeneratorFor(token, targetId, {
            path: resolvedPath,
            direction: resolvedDirection,
            sign,
            index
        });
        const unbraid = applyUnbraidGenerator(token, generator, this.config);
        const cost = this.config.unbraidActionCost;
        if (cost > 0) {
            this.moveNumber += cost;
            this.currentPlayer = otherOwner(token.owner);
        }
        const event = {
            mode: this.mode,
            number: this.moveNumber,
            player: token.owner,
            kind: 'attempt_unbraid',
            tokenId,
            targetId,
            path: resolvedPath,
            direction: resolvedDirection,
            beforeWord,
            unbraid
        };
        this.history.unshift(event);
        return { ok: true, event };
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

        const jumped = action.over ? this.tokens.get(action.over) : null;
        const braidEvents = detectTopologyBraidEvents({
            movingToken: token,
            path: action.path,
            topology: this.topology,
            targets: [...this.tokens.values()].filter((target) => target.id !== token.id),
            explicitTargets: jumped ? [{
                target: jumped,
                reason: 'jump_over',
                sign: braidSignFromDirection(action.directions[0]),
                path: action.path
            }] : [],
            edges,
            directions: action.directions,
            tick: this.moveNumber,
            tokenIds: [...this.tokens.keys()]
        }).map((event) => this.applyBraid(token, event));
        const braid = braidEvents[0] || null;

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
            braidEvents,
            fusion,
            winding,
            seamTransforms: edges
                .filter((edge) => this.topology.seamTransform(edge) !== 'identity')
                .map((edge) => ({ from: edge.from, to: edge.to, automorphism: this.topology.seamTransform(edge) }))
        };
        this.history.unshift(event);
        this.currentPlayer = otherOwner(token.owner);
        event.noise = this.maybeApplyNoise('after_move', token.owner);
        event.time = this.maybeApplyTime('after_move', token.owner);
        return { ok: true, event };
    }

    maybeApplyNoise(trigger, player = this.currentPlayer) {
        if (!this.probability?.shouldApplyNoise(trigger, this.currentPlayer)) return [];
        return this.applyNoiseCycle({ player, tick: this.moveNumber, trigger });
    }

    applyNoiseCycle({ player = this.currentPlayer, tick = null, trigger = 'manual' } = {}) {
        if (!this.probability?.isEnabled()) return [];
        const resolvedTick = tick == null ? this.probability.nextTick() : this.probability.nextTick(tick);
        const events = this.probability.applyAnyonNoiseToGame(this, {
            player,
            tick: resolvedTick
        });
        if (events.length && trigger === 'manual') {
            this.history.unshift({
                mode: this.mode,
                type: 'noise',
                number: this.moveNumber,
                player,
                noiseEvents: events.length
            });
        }
        return events;
    }

    maybeApplyTime(trigger, player = this.currentPlayer) {
        const completedRound = player === 'white';
        if (!this.time?.shouldUpdate(trigger, { player, completedRound })) return null;
        return this.time.applyTimeEvolution({
            trigger,
            player,
            completedRound,
            tokens: this.tokens,
            game: this
        });
    }

    measureAnyonCharge(tokenIds = [], player = this.currentPlayer) {
        const tokens = tokenIds.map((id) => this.tokens.get(id)).filter(Boolean);
        if (!tokens.length) return { ok: false, error: 'Select at least one anyon to measure total charge.' };
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
            mergeBraidMemory(token, other, this.config);
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
            history: this.history,
            probability: this.probability.exportState({ fusionOutcomes: this.fusionOutcomes }),
            time: this.time.exportState()
        };
    }
}

export function createAnyonJump(options = {}) {
    return new AnyonJumpGame(options);
}

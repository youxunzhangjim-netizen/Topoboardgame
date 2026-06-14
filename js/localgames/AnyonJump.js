import {
    applyAnyonAutomorphism,
    anyonTypes,
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
import {
    attachBraidedCaptureState,
    canCaptureBraidedEntity,
    movementPenaltyActive,
    recordUnbraidCaptureUnlock
} from '../anyon/BraidedCapture.js';
import { detectTopologyBraidEvents } from '../anyon/BraidPathDetector.js';
import {
    coordKey,
    createGraphTopology,
    coordsEqual,
    sumHomology
} from '../topology/GraphTopologies.js';
import { ProbabilityEngine } from '../probability/ProbabilityEngine.js';
import { FloquetEngine } from '../time/FloquetEngine.js';
import {
    createPhysicalProblem,
    topologyOptionsForPhysicalProblem
} from '../physics/PhysicalProblems.js';

export const ANYON_JUMP_MODE = 'anyon_jump';

const OWNERS = Object.freeze(['black', 'white']);
const DEFAULT_TYPES = Object.freeze(['e', 'm', 'psi']);
const DEFAULT_TORIC_GAPS = Object.freeze({ e: 2, m: 2, psi: 4, '1': 0 });

function otherOwner(owner) {
    return owner === 'black' ? 'white' : 'black';
}

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

function cloneBraidWord(word = []) {
    return Array.isArray(word) ? word.map((entry) => ({ ...entry })) : [];
}

function positiveModulo(value, modulus) {
    return ((value % modulus) + modulus) % modulus;
}

function signedPhaseText(numerator = 0, denominator = 2) {
    const n = Math.max(2, Number(denominator) || 2);
    const value = positiveModulo(Number(numerator) || 0, n);
    if (value === 0) return '0';
    const signed = value > n / 2 ? value - n : value;
    return `${signed >= 0 ? '+' : '-'}${Math.abs(signed)}/${n}`;
}

function fusionChannelState(token) {
    return token?.hiddenFusionState?.currentChannel ?? token?.fusionChannel ?? null;
}

function defaultTypesForModel(model = 'toric_code', grade = 2) {
    if (model === 'ising') return ['sigma', 'sigma', 'psi'];
    if (model === 'fibonacci') return ['tau'];
    const types = anyonTypes(model, grade).filter((type) => type !== '1');
    return types.length ? types : [...DEFAULT_TYPES];
}

function defaultExcitationGaps(config) {
    if (config.anyonModel === 'ising') return { '1': 0, sigma: 2, psi: 4 };
    if (config.anyonModel === 'fibonacci') return { '1': 0, tau: 3 };
    if (config.anyonModel === 'zn') {
        return Object.fromEntries(anyonTypes('zn', config.generalAnyonGrade)
            .map((type) => [type, type === '1' ? 0 : 2]));
    }
    return { ...DEFAULT_TORIC_GAPS };
}

export class AnyonJumpGame {
    constructor(options = {}) {
        this.reset(options);
    }

    reset(options = {}) {
        this.mode = ANYON_JUMP_MODE;
        const physicalProblemSource = options.physicalProblem || options.physicalProblemId || options.problemId || null;
        const physicalProblemConfig = options.physicalProblemConfig || {};
        const problemTopology = topologyOptionsForPhysicalProblem(physicalProblemSource, physicalProblemConfig);
        this.physicalProblem = createPhysicalProblem(physicalProblemSource, physicalProblemConfig);
        this.topology = createGraphTopology(problemTopology || options.topology || options);
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
        this.energy = {
            black: Number(options.config?.excitationEnergy?.black ?? options.config?.initialEnergy ?? 12),
            white: Number(options.config?.excitationEnergy?.white ?? options.config?.initialEnergy ?? 12)
        };
        this.anyonGaps = { ...defaultExcitationGaps(this.config), ...(options.config?.anyonGaps || {}) };
        this.excitationCosts = { ...this.anyonGaps, ...(options.config?.excitationCosts || {}) };
        this.dropLossRate = Math.max(0, Math.min(1, Number(options.config?.dropLossRate ?? 0.25)));
        this.parity = { black: 0, white: 0 };
        this.fusionOutcomes = [];
        this.entanglementEvents = [];
        this.history = [];
        this.braidEventLog = [];
        this.unbraidAttempts = [];
        this.topologicalSectors = [];
        this.moveNumber = 0;
        this.fusionSites = new Set();
        this.probability = new ProbabilityEngine(options.probability || {});
        this.time = new FloquetEngine({
            topology: this.topology,
            config: options.time || options.floquet || {},
            game: this
        });
        if (this.physicalProblem?.setupInitialState) this.physicalProblem.setupInitialState(this);
        else if (this.config.setupMode !== 'excitation') this.setupInitialPosition();
        else this.setupExcitationMode();
        this.initialState = this.snapshotState('initial');
        this.physicalProblem?.start?.(this);
    }

    setupExcitationMode() {
        const sizes = this.topology.sizes;
        const center = this.topology.dimensions === 4
            ? [Math.floor(sizes[0] / 2), Math.floor(sizes[1] / 2), Math.floor(sizes[2] / 2), Math.floor(sizes[3] / 2)]
            : this.topology.dimensions === 3
                ? [Math.floor(sizes[0] / 2), Math.floor(sizes[1] / 2), Math.floor(sizes[2] / 2)]
            : [Math.floor(sizes[0] / 2), Math.floor(sizes[1] / 2)];
        this.fusionSites.add(coordKey(center));
    }

    setupInitialPosition() {
        const sizes = this.topology.sizes;
        const width = sizes[0];
        const yBlack = this.topology.dimensions >= 3 ? 0 : 1;
        const yWhite = this.topology.dimensions >= 3 ? sizes[1] - 1 : Math.max(0, sizes[1] - 2);
        const z = this.topology.dimensions >= 3 ? Math.floor(sizes[2] / 2) : null;
        const w = this.topology.dimensions === 4 ? Math.floor(sizes[3] / 2) : null;
        const count = Math.min(width, 6);
        const offset = Math.floor((width - count) / 2);
        const modelTypes = defaultTypesForModel(this.config.anyonModel, this.config.generalAnyonGrade);

        for (let i = 0; i < count; i++) {
            const x = offset + i;
            const type = modelTypes[i % modelTypes.length];
            const blackCoord = this.topology.dimensions === 4
                ? [x, yBlack, z, w]
                : this.topology.dimensions === 3 ? [x, yBlack, z] : [x, yBlack];
            const whiteCoord = this.topology.dimensions === 4
                ? [x, yWhite, z, w]
                : this.topology.dimensions === 3 ? [x, yWhite, z] : [x, yWhite];
            this.addToken({ owner: 'black', coord: blackCoord, anyonType: type });
            this.addToken({ owner: 'white', coord: whiteCoord, anyonType: modelTypes[(i + 1) % modelTypes.length] });
        }

        const center = this.topology.dimensions === 4
            ? [Math.floor(sizes[0] / 2), Math.floor(sizes[1] / 2), z, w]
            : this.topology.dimensions === 3
                ? [Math.floor(sizes[0] / 2), Math.floor(sizes[1] / 2), z]
            : [Math.floor(sizes[0] / 2), Math.floor(sizes[1] / 2)];
        this.fusionSites.add(coordKey(center));
    }

    addToken({
        id,
        owner = this.currentPlayer,
        coord = null,
        vertex = null,
        anyonType = 'e',
        hiddenState = null,
        revealed = true,
        stability = 1,
        energy = 0,
        anyonPhaseNumerator = 0,
        anyonPhaseDenominator = null
    }) {
        const normalized = this.topology.normalize(vertex ?? coord);
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
            vertex: normalized,
            anyonType: this.normalizeConfiguredType(anyonType),
            hiddenState,
            revealed,
            stability: Number.isFinite(Number(stability)) ? Number(stability) : 1,
            age: 0,
            energy: Number.isFinite(Number(energy)) ? Number(energy) : 0,
            phaseLabel: 0,
            cooldown: 0,
            anyonPhaseNumerator: this.phaseEnabled()
                ? positiveModulo(Number(anyonPhaseNumerator) || 0, this.phaseDenominator())
                : 0,
            anyonPhaseDenominator: anyonPhaseDenominator || this.phaseDenominator(),
            measurementHistory: [],
            noiseHistory: []
        };
        attachBraidMemory(token, {}, this.config);
        attachBraidedCaptureState(token, {}, this.config);
        this.tokens.set(tokenId, token);
        this.worldlines.set(tokenId, [cloneCoord(normalized)]);
        return token;
    }

    excitationCost(type) {
        const normalized = this.normalizeConfiguredType(type);
        return Number(this.excitationCosts[normalized] ?? this.excitationCosts.psi ?? 4);
    }

    excitationGap(type) {
        const normalized = this.normalizeConfiguredType(type);
        return Number(this.anyonGaps[normalized] ?? this.anyonGaps.psi ?? 4);
    }

    normalizeConfiguredType(type) {
        return normalizeAnyonType(type, this.config.anyonModel, this.config.generalAnyonGrade);
    }

    exciteAnyon(coord, type = this.config.excitationType || 'e', player = this.currentPlayer) {
        if (this.config.setupMode !== 'excitation') return { ok: false, error: 'Excitation mode is off.' };
        const normalized = this.topology.normalize(coord);
        if (!normalized) return { ok: false, error: 'Choose a valid graph vertex.' };
        if (this.tokenAt(normalized)) return { ok: false, error: 'That vertex already has an anyon.' };
        const anyonType = this.normalizeConfiguredType(type);
        if (anyonType === '1') return { ok: false, error: 'Choose a non-vacuum anyon excitation.' };
        const cost = this.excitationCost(anyonType);
        if ((this.energy[player] || 0) < cost) return { ok: false, error: `Not enough energy to excite ${anyonType}.` };
        const token = this.addToken({
            owner: player,
            coord: normalized,
            anyonType,
            energy: this.excitationGap(anyonType)
        });
        if (!token) return { ok: false, error: 'Could not create anyon.' };
        this.energy[player] -= cost;
        this.moveNumber++;
        const event = {
            mode: this.mode,
            number: this.moveNumber,
            player,
            kind: 'excite',
            tokenId: token.id,
            anyonType,
            coord: normalized,
            cost,
            energyAfter: this.energy[player]
        };
        this.history.unshift(event);
        this.currentPlayer = otherOwner(player);
        this.physicalProblem?.record?.(this, { type: 'excite', event });
        return { ok: true, event };
    }

    dropAnyon(tokenId, player = this.currentPlayer) {
        if (this.config.setupMode !== 'excitation') return { ok: false, error: 'Drop recovery is only available in excitation mode.' };
        const token = this.tokens.get(tokenId);
        if (!token) return { ok: false, error: 'Unknown token.' };
        if (token.owner !== player) return { ok: false, error: 'Choose one of your own anyons.' };
        const gap = this.excitationGap(token.anyonType);
        const recovered = Math.max(0, gap * (1 - this.dropLossRate));
        this.tokens.delete(token.id);
        this.energy[player] += recovered;
        const entanglement = this.enforceEntanglementDistance();
        this.moveNumber++;
        const event = {
            mode: this.mode,
            number: this.moveNumber,
            player,
            kind: 'drop',
            tokenId,
            anyonType: token.anyonType,
            coord: cloneCoord(token.coord),
            recovered,
            lossRate: this.dropLossRate,
            energyAfter: this.energy[player],
            entanglement
        };
        this.history.unshift(event);
        this.currentPlayer = otherOwner(player);
        this.physicalProblem?.record?.(this, { type: 'drop', event });
        return { ok: true, event };
    }

    tokenAt(coord, exceptId = '') {
        const key = coordKey(coord);
        return [...this.tokens.values()].find((token) => token.id !== exceptId && coordKey(token.coord) === key) || null;
    }

    graphDistance(fromCoord, toCoord, maxDistance = Infinity) {
        const from = this.topology.normalize(fromCoord);
        const to = this.topology.normalize(toCoord);
        if (!from || !to) return Infinity;
        const targetKey = coordKey(to);
        if (coordKey(from) === targetKey) return 0;
        const finiteLimit = Number.isFinite(maxDistance) ? Math.max(0, Math.floor(maxDistance)) : Infinity;
        const visited = new Set([coordKey(from)]);
        let frontier = [from];
        let distance = 0;
        while (frontier.length && distance < finiteLimit) {
            distance++;
            const next = [];
            for (const coord of frontier) {
                for (const neighbor of this.topology.neighbors(coord)) {
                    const key = coordKey(neighbor);
                    if (key === targetKey) return distance;
                    if (visited.has(key)) continue;
                    visited.add(key);
                    next.push(neighbor);
                }
            }
            frontier = next;
        }
        return Number.isFinite(finiteLimit) ? finiteLimit + 1 : Infinity;
    }

    enforceEntanglementDistance() {
        if (this.config.braidMemoryMode !== 'nonabelian_fusion_channel'
            || this.config.entanglementRangeMode !== 'finite') return [];
        const limit = Math.max(1, Math.floor(Number(this.config.entanglementDistance) || 1));
        const events = [];
        for (const token of this.tokens.values()) {
            const state = token.hiddenFusionState;
            if (!state?.channels || typeof state.channels !== 'object') continue;
            for (const targetId of Object.keys(state.channels)) {
                const target = this.tokens.get(targetId);
                const distance = target ? this.graphDistance(token.coord, target.coord, limit) : Infinity;
                if (distance <= limit) continue;
                delete state.channels[targetId];
                state.snapshots = [];
                if (state.currentTargetId === targetId) {
                    const replacement = Object.values(state.channels)[0] || null;
                    state.currentTargetId = replacement?.targetId || '';
                    state.currentChannel = replacement?.currentChannel || null;
                    state.currentPossibleOutputs = replacement ? [...replacement.possibleOutputs] : [];
                    state.revealed = false;
                    token.fusionChannel = '?';
                }
                const event = {
                    tick: this.moveNumber,
                    type: 'entanglement_decoherence',
                    tokenId: token.id,
                    targetId,
                    distance: Number.isFinite(distance) ? distance : null,
                    limit,
                    reason: target ? 'distance_exceeded' : 'target_removed'
                };
                state.transitions.push(event);
                token.fusionChannelHistory.push(event);
                this.entanglementEvents.push(event);
                events.push(event);
            }
        }
        return events;
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
            applyAnyonAutomorphism(
                current,
                this.topology.seamTransform(edge),
                this.config.anyonModel,
                this.config.generalAnyonGrade
            ), type);
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
            if (movementPenaltyActive(token, this.config)) continue;
            const two = this.topology.step(one.coord, direction);
            if (!two) continue;
            const landingOccupant = this.tokenAt(two.coord, id);
            const canLandForFusion = landingOccupant
                && this.isFusionSite(two.coord)
                && canCaptureBraidedEntity(token, landingOccupant, this.config).legal;
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

    adjustBraidTokenCount(owner, delta) {
        this.braidTokens[owner] = Math.max(0, (this.braidTokens[owner] || 0) + delta);
    }

    applyBraidEffect(owner, effect) {
        if (effect.effect === 'add_braid_token') this.adjustBraidTokenCount(owner, effect.delta);
        if (effect.effect === 'score_bonus') this.score[owner] += effect.delta;
        if (effect.effect === 'flip_parity') this.parity[owner] = this.parity[owner] ? 0 : 1;
    }

    applyUnbraidEffect(owner, effect) {
        if (effect.effect === 'add_braid_token') this.adjustBraidTokenCount(owner, -Math.abs(effect.delta || 1));
        if (effect.effect === 'flip_parity') this.parity[owner] = this.parity[owner] ? 0 : 1;
    }

    phaseEnabled() {
        return this.config?.phaseModel === 'zn_phase';
    }

    phaseDenominator() {
        return Math.max(2, Math.min(64, Math.floor(Number(this.config?.generalAnyonGrade) || 2)));
    }

    phaseSnapshot(token) {
        const denominator = Math.max(2, Number(token?.anyonPhaseDenominator || this.phaseDenominator()));
        const numerator = positiveModulo(Number(token?.anyonPhaseNumerator || 0), denominator);
        return {
            enabled: this.phaseEnabled(),
            numerator,
            denominator,
            text: this.phaseEnabled() ? signedPhaseText(numerator, denominator) : '0'
        };
    }

    applyGeneralPhase(token, sign = 1) {
        const before = this.phaseSnapshot(token);
        if (!this.phaseEnabled()) return { before, after: before, delta: 0 };
        const denominator = this.phaseDenominator();
        token.anyonPhaseDenominator = denominator;
        const delta = Number(sign) < 0 ? -1 : 1;
        token.anyonPhaseNumerator = positiveModulo(Number(token.anyonPhaseNumerator || 0) + delta, denominator);
        const after = this.phaseSnapshot(token);
        return { before, after, delta };
    }

    applyBraid(movingToken, event) {
        const target = this.tokens.get(event.targetId) || event.target || { id: event.targetId, defect: true };
        const beforeWord = cloneBraidWord(movingToken.braidWord);
        const beforeFusionChannel = fusionChannelState(movingToken);
        const phase = target?.anyonType
            ? mutualBraidPhase(movingToken.anyonType, target.anyonType, this.config.anyonModel)
            : 1;
        if (!this.phaseEnabled() && this.config.braidMemoryMode === 'abelian_parity' && phase !== -1) {
            const skipped = {
                ...event,
                jumpedId: event.reason === 'jump_over' ? event.targetId : null,
                jumpedType: event.reason === 'jump_over' ? target?.anyonType : null,
                targetType: target?.anyonType || target?.type || event.reason,
                phase,
                effect: { phase, effect: 'none', delta: 0 },
                braidGenerator: null,
                braidParity: movingToken.braidParity || 0,
                braidWord: cloneBraidWord(movingToken.braidWord),
                isBraided: movingToken.isBraided,
                skipped: 'abelian_trivial_mutual_braid'
            };
            this.recordBraidEvent({
                kind: 'braid',
                player: movingToken.owner,
                movingToken,
                target,
                sourceEvent: event,
                generator: null,
                beforeWord,
                afterWord: cloneBraidWord(movingToken.braidWord),
                cancelledInverse: false,
                fullyUnbraided: !movingToken.isBraided,
                beforeFusionChannel,
                afterFusionChannel: fusionChannelState(movingToken),
                skipped: skipped.skipped
            });
            return {
                ...skipped
            };
        }
        const memory = applyBraidToMemory(movingToken, target, event, this.config);
        const phaseShift = this.applyGeneralPhase(movingToken, memory.braidGenerator?.sign ?? event.sign ?? 1);
        const successfulUnbraid = Boolean(
            memory.cancelledInverse
            || memory.successfulPartialUnbraid
            || (memory.parityToggled && memory.fullyUnbraided)
        );
        const captureUnlockGranted = recordUnbraidCaptureUnlock(movingToken, event.targetId, {
            successfulPartialUnbraid: successfulUnbraid,
            fullyUnbraided: memory.fullyUnbraided
        });
        const effect = braidEffectForPhase(phase, this.config);
        if (effect.effect !== 'none') {
            if (successfulUnbraid) this.applyUnbraidEffect(movingToken.owner, effect);
            else this.applyBraidEffect(movingToken.owner, effect);
        }
        const applied = {
            ...memory,
            jumpedId: event.reason === 'jump_over' ? event.targetId : null,
            jumpedType: event.reason === 'jump_over' ? target?.anyonType : null,
            targetType: target?.anyonType || target?.type || event.reason,
            phase,
            effect,
            captureUnlockGranted,
            anyonPhase: phaseShift,
            unbraid: successfulUnbraid || memory.fullyUnbraided
                ? {
                    successfulPartialUnbraid: successfulUnbraid,
                    fullyUnbraided: memory.fullyUnbraided,
                    targetId: event.targetId
                }
                : null
        };
        this.recordBraidEvent({
            kind: successfulUnbraid ? 'unbraid' : 'braid',
            player: movingToken.owner,
            movingToken,
            target,
            sourceEvent: event,
            generator: memory.braidGenerator,
            beforeWord,
            afterWord: memory.braidWord,
            cancelledInverse: successfulUnbraid,
            fullyUnbraided: memory.fullyUnbraided,
            beforeFusionChannel,
            afterFusionChannel: fusionChannelState(movingToken),
            phaseBefore: phaseShift.before,
            phaseAfter: phaseShift.after,
            skipped: null
        });
        return applied;
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
        const beforeFusionChannel = fusionChannelState(token);
        const generator = this.braidGeneratorFor(token, targetId, {
            path: resolvedPath,
            direction: resolvedDirection,
            sign,
            index
        });
        const unbraid = applyUnbraidGenerator(token, generator, this.config, { target });
        const phaseShift = this.applyGeneralPhase(token, unbraid.attempted?.sign ?? generator.sign ?? -1);
        const phase = target?.anyonType
            ? mutualBraidPhase(token.anyonType, target.anyonType, this.config.anyonModel)
            : 1;
        const effect = braidEffectForPhase(phase, this.config);
        if ((unbraid.successfulPartialUnbraid || unbraid.fullyUnbraided) && effect.effect !== 'none') {
            this.applyUnbraidEffect(token.owner, effect);
        }
        const captureUnlockGranted = recordUnbraidCaptureUnlock(token, targetId, unbraid);
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
            unbraid,
            anyonPhase: phaseShift,
            captureUnlockGranted
        };
        this.history.unshift(event);
        const unbraidLog = this.recordBraidEvent({
            kind: 'attempt_unbraid',
            player: token.owner,
            movingToken: token,
            target,
            sourceEvent: event,
            generator: unbraid.attempted,
            beforeWord,
            afterWord: unbraid.braidWord,
            cancelledInverse: unbraid.successfulPartialUnbraid,
            fullyUnbraided: unbraid.fullyUnbraided,
            beforeFusionChannel,
            afterFusionChannel: fusionChannelState(token),
            phaseBefore: phaseShift.before,
            phaseAfter: phaseShift.after,
            wrongOrder: unbraid.wrongOrder
        });
        this.unbraidAttempts.push(unbraidLog);
        this.physicalProblem?.record?.(this, { type: 'attempt_unbraid', event });
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

    applyAction(action, options = {}) {
        const token = this.tokens.get(action.tokenId);
        if (!token) return { ok: false, error: 'Unknown token.' };

        const edges = this.pathEdgesFromCoords(action.path, action.directions);
        const beforeType = token.anyonType;
        token.anyonType = this.transformTypeAcrossEdges(token.anyonType, edges);
        token.coord = cloneCoord(action.to);
        token.vertex = token.coord;
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
        const entanglement = this.enforceEntanglementDistance();
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
            entanglement,
            winding,
            seamTransforms: edges
                .filter((edge) => this.topology.seamTransform(edge) !== 'identity')
                .map((edge) => ({ from: edge.from, to: edge.to, automorphism: this.topology.seamTransform(edge) }))
        };
        this.history.unshift(event);
        if (!options.keepTurn) this.currentPlayer = otherOwner(token.owner);
        event.noise = this.maybeApplyNoise('after_move', token.owner);
        event.time = this.maybeApplyTime('after_move', token.owner);
        this.physicalProblem?.record?.(this, { type: action.kind, event });
        return { ok: true, event };
    }

    chainJump(tokenId, destinations = []) {
        const token = this.tokens.get(tokenId);
        if (!token) return { ok: false, error: 'Unknown token.', events: [] };
        if (token.owner !== this.currentPlayer) return { ok: false, error: 'Choose one of your own anyons.', events: [] };
        if (!Array.isArray(destinations) || destinations.length === 0) {
            return { ok: false, error: 'Choose at least one jump landing for a chain jump.', events: [] };
        }
        const player = token.owner;
        const events = [];
        for (const destination of destinations) {
            const normalized = this.topology.normalize(destination);
            const action = normalized
                ? this.legalActionsForToken(tokenId).find((candidate) =>
                    candidate.kind === 'jump' && coordsEqual(candidate.to, normalized))
                : null;
            if (!action) {
                return {
                    ok: false,
                    error: 'Chain jumps must continue with legal jump landings.',
                    events
                };
            }
            const result = this.applyAction(action, { keepTurn: true });
            if (!result.ok) return { ...result, events };
            events.push(result.event);
        }
        this.currentPlayer = otherOwner(player);
        return { ok: true, events };
    }

    braidStatusForToken(token) {
        const wordLength = token?.braidWord?.length || 0;
        const parity = Number(token?.braidParity || 0);
        if (wordLength === 0 && parity === 0) return 'trivial';
        const historyLength = token?.braidHistory?.length || 0;
        return historyLength > wordLength ? 'partially_unbraided' : 'braided';
    }

    recordBraidEvent({
        kind = 'braid',
        player = this.currentPlayer,
        movingToken,
        target = null,
        sourceEvent = {},
        generator = null,
        beforeWord = [],
        afterWord = [],
        cancelledInverse = false,
        fullyUnbraided = false,
        beforeFusionChannel = null,
        afterFusionChannel = null,
        phaseBefore = null,
        phaseAfter = null,
        skipped = null,
        wrongOrder = false
    } = {}) {
        const entry = {
            tick: this.moveNumber,
            player,
            type: kind,
            movingTokenId: movingToken?.id || sourceEvent.tokenId || sourceEvent.movingId || '',
            targetId: target?.id || sourceEvent.targetId || '',
            generator: generator ? { ...generator } : null,
            sign: generator?.sign ?? sourceEvent.sign ?? null,
            braidWordBefore: cloneBraidWord(beforeWord),
            braidWordAfter: cloneBraidWord(afterWord),
            cancellationOccurred: Boolean(cancelledInverse),
            fullyUnbraided: Boolean(fullyUnbraided),
            wrongOrder: Boolean(wrongOrder),
            skipped,
            anyonPhaseBefore: phaseBefore,
            anyonPhaseAfter: phaseAfter,
            fusionChannelBefore: beforeFusionChannel,
            fusionChannelAfter: afterFusionChannel,
            path: Array.isArray(sourceEvent.path) ? sourceEvent.path.map(cloneCoord) : [],
            reason: sourceEvent.reason || sourceEvent.kind || kind
        };
        this.braidEventLog.push(entry);
        return entry;
    }

    tokenSnapshot(token) {
        return {
            ...cloneValue(token),
            coord: cloneCoord(token.coord),
            vertex: cloneCoord(token.vertex ?? token.coord),
            braidStatus: this.braidStatusForToken(token),
            fusionChannelDisplay: token.hiddenFusionState?.revealed ? token.hiddenFusionState.currentChannel : token.fusionChannel
        };
    }

    snapshotState(label = 'state') {
        return {
            label,
            currentPlayer: this.currentPlayer,
            moveNumber: this.moveNumber,
            energy: { ...this.energy },
            braidTokens: { ...this.braidTokens },
            score: { ...this.score },
            parity: { ...this.parity },
            tokens: [...this.tokens.values()].map((token) => this.tokenSnapshot(token)),
            fusionSites: [...this.fusionSites].map((key) => key.split(',').map(Number)),
            worldlines: Object.fromEntries([...this.worldlines.entries()].map(([id, path]) => [id, path.map(cloneCoord)]))
        };
    }

    braidStatistics() {
        const tokens = [...this.tokens.values()];
        const wordLengths = tokens.map((token) => token.braidWord?.length || 0);
        const totalLength = wordLengths.reduce((sum, length) => sum + length, 0);
        const unbraids = this.braidEventLog.filter((event) => event.type === 'unbraid' || event.type === 'attempt_unbraid');
        return {
            totalBraids: this.braidEventLog.filter((event) => event.type === 'braid' && !event.skipped).length,
            totalUnbraids: unbraids.length,
            successfulUnbraids: unbraids.filter((event) => event.cancellationOccurred || event.fullyUnbraided).length,
            failedInverseAttempts: this.braidEventLog.filter((event) => event.wrongOrder).length,
            averageBraidWordLength: tokens.length ? totalLength / tokens.length : 0,
            longestBraidWord: wordLengths.length ? Math.max(...wordLengths) : 0,
            finalNumberOfBraidedPieces: tokens.filter((token) => this.braidStatusForToken(token) !== 'trivial').length
        };
    }

    braidHistories() {
        return [...this.tokens.values()].map((token) => ({
            id: token.id,
            owner: token.owner,
            anyonType: token.anyonType,
            braidStatus: this.braidStatusForToken(token),
            braidParity: token.braidParity || 0,
            anyonPhase: this.phaseSnapshot(token),
            braidWord: cloneBraidWord(token.braidWord),
            braidHistory: cloneBraidWord(token.braidHistory),
            requiredInverse: token.braidWord?.length ? cloneBraidWord([...token.braidWord].reverse().map((entry) => ({
                ...entry,
                sign: entry.sign === 1 ? -1 : 1
            }))) : []
        }));
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
            this.physicalProblem?.record?.(this, { type: 'noise', event: { player, trigger, events } });
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
        this.physicalProblem?.record?.(this, { type: 'measurement', event: { player, measurement } });
        return { ok: true, measurement };
    }

    resolveFusion(tokenId) {
        const token = this.tokens.get(tokenId);
        if (!token) return null;
        const occupants = this.tokensAt(token.coord, token.id);
        if (!occupants.length) return null;
        if (!this.isFusionSite(token.coord)) return null;

        const other = occupants[0];
        const captureStatus = canCaptureBraidedEntity(token, other, this.config, { consume: true });
        if (!captureStatus.legal) {
            return {
                coord: cloneCoord(token.coord),
                firstId: token.id,
                secondId: other.id,
                blocked: true,
                reason: captureStatus.reason
            };
        }
        const fusion = createFusionResult(token.anyonType, other.anyonType, this.config);
        const outcome = {
            coord: cloneCoord(token.coord),
            firstId: token.id,
            secondId: other.id,
            captureStatus,
            input: fusion.input,
            outputs: fusion.outputs,
            resolved: fusion.resolved,
            vacuum: fusion.vacuum
        };

        if (fusion.resolved === '1') {
            this.tokens.delete(token.id);
            this.tokens.delete(other.id);
            outcome.removed = [token.id, other.id];
            if (this.config.setupMode === 'excitation') {
                const firstRecovered = this.excitationGap(token.anyonType) * (1 - this.dropLossRate);
                const secondRecovered = this.excitationGap(other.anyonType) * (1 - this.dropLossRate);
                this.energy[token.owner] = (this.energy[token.owner] || 0) + firstRecovered;
                this.energy[other.owner] = (this.energy[other.owner] || 0) + secondRecovered;
                outcome.energyRecovered = firstRecovered + secondRecovered;
                outcome.lossRate = this.dropLossRate;
            }
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
        const finalState = this.snapshotState('final');
        return {
            mode: this.mode,
            topology: {
                name: this.topology.name,
                sizes: [...this.topology.sizes],
                dimensions: this.topology.dimensions
            },
            currentPlayer: this.currentPlayer,
            moveNumber: this.moveNumber,
            energy: { ...this.energy },
            braidTokens: { ...this.braidTokens },
            score: { ...this.score },
            parity: { ...this.parity },
            winner: this.score.black === this.score.white ? null : (this.score.black > this.score.white ? 'black' : 'white'),
            initialState: cloneValue(this.initialState),
            finalState,
            tokens: [...this.tokens.values()].map((token) => this.tokenSnapshot(token)),
            fusionSites: [...this.fusionSites].map((key) => key.split(',').map(Number)),
            worldlines: Object.fromEntries([...this.worldlines.entries()].map(([id, path]) => [id, path.map(cloneCoord)])),
            braidHistories: this.braidHistories(),
            braidEventLog: this.braidEventLog.map(cloneValue),
            unbraidAttempts: this.unbraidAttempts.map(cloneValue),
            fusionOutcomes: this.fusionOutcomes,
            entanglement: {
                rangeMode: this.config.entanglementRangeMode,
                distance: this.config.entanglementRangeMode === 'finite'
                    ? this.config.entanglementDistance
                    : null,
                events: this.entanglementEvents.map(cloneValue)
            },
            windingNumbers: this.topologicalSectors.map((sector) => ({ number: sector.number, tokenId: sector.tokenId, winding: { ...sector.winding } })),
            topologicalSectors: this.topologicalSectors,
            topologicalSectorChanges: this.topologicalSectors,
            statistics: this.braidStatistics(),
            history: this.history,
            probability: this.probability.exportState({ fusionOutcomes: this.fusionOutcomes }),
            time: this.time.exportState(),
            physicalProblem: this.physicalProblem?.export?.(this) || null
        };
    }
}

export function createAnyonJump(options = {}) {
    return new AnyonJumpGame(options);
}

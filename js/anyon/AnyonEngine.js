import {
    braidEffectForPhase,
    createFusionResult,
    mutualBraidPhase,
    normalizeAnyonConfig,
    normalizeAnyonType,
    previewAnyonCapture
} from './AnyonAlgebra.js';
import {
    applySeamTransforms,
    createRectTorusTopology,
    isClosedLoop,
    sameVertex,
    vertexKey,
    windingNumbers
} from './AnyonTopology.js';
import {
    applyBraid as applyBraidToMemory,
    attemptUnbraid as applyUnbraidGenerator,
    attachBraidMemory,
    braidGeneratorIndex,
    braidSignFromDirection,
    braidSignFromWinding,
    mergeBraidMemory
} from './BraidMemory.js';
import {
    attachBraidedCaptureState,
    canCaptureBraidedEntity,
    recordUnbraidCaptureUnlock
} from './BraidedCapture.js';
import { detectTopologyBraidEvents } from './BraidPathDetector.js';

function cloneValue(value) {
    if (Array.isArray(value)) return value.map(cloneValue);
    if (value && typeof value === 'object') {
        return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, cloneValue(entry)]));
    }
    return value;
}

function cloneVertex(vertex) {
    return Array.isArray(vertex) ? [...vertex] : vertex;
}

function cloneWord(word = []) {
    return Array.isArray(word) ? word.map((entry) => ({ ...entry })) : [];
}

function fusionChannelState(token) {
    return token?.hiddenFusionState?.currentChannel ?? token?.fusionChannel ?? null;
}

export class AnyonGameEngine {
    constructor({ topology = createRectTorusTopology(), config = {}, players = ['black', 'white'] } = {}) {
        this.topology = topology;
        this.config = normalizeAnyonConfig(config);
        this.players = [...players];
        this.currentPlayer = this.players[0] || 'black';
        this.tokens = new Map();
        this.worldlines = new Map();
        this.braidTokens = Object.fromEntries(this.players.map((player) => [player, 0]));
        this.parity = Object.fromEntries(this.players.map((player) => [player, 0]));
        this.score = Object.fromEntries(this.players.map((player) => [player, 0]));
        this.disabledUntilTurn = Object.fromEntries(this.players.map((player) => [player, 0]));
        this.turn = 0;
        this.fusionChannels = [];
        this.events = [];
        this.braidEventLog = [];
        this.unbraidAttempts = [];
        this.defects = Array.isArray(topology?.defects) ? [...topology.defects] : [];
        this.initialState = this.snapshotState('initial');
    }

    addToken({ id, owner = this.currentPlayer, vertex, anyonType = '1', metadata = {} }) {
        const tokenId = id || `a${this.tokens.size + 1}`;
        const normalizedVertex = this.normalizeVertex(vertex);
        const token = {
            id: tokenId,
            owner,
            vertex: normalizedVertex,
            anyonType: normalizeAnyonType(anyonType, this.config.anyonModel),
            metadata: { ...metadata },
            disabledTurns: 0
        };
        attachBraidMemory(token, metadata, this.config);
        attachBraidedCaptureState(token, metadata, this.config);
        this.tokens.set(tokenId, token);
        this.worldlines.set(tokenId, [normalizedVertex]);
        return token;
    }

    normalizeVertex(vertex) {
        return this.topology?.normalize ? this.topology.normalize(vertex) : vertex;
    }

    tokenAt(vertex, exceptId = '') {
        const key = vertexKey(this.normalizeVertex(vertex));
        return [...this.tokens.values()].find((token) => token.id !== exceptId && vertexKey(token.vertex) === key) || null;
    }

    neighbors(vertex) {
        return this.topology?.neighbors?.(vertex) || [];
    }

    moveToken(id, toVertex, { player = this.currentPlayer, confirmFusion = true } = {}) {
        const token = this.tokens.get(id);
        if (!token) return { ok: false, error: 'Unknown anyon token.' };
        if (token.owner !== player) return { ok: false, error: 'That anyon belongs to another player.' };
        if (this.disabledUntilTurn[player] > this.turn) return { ok: false, error: 'Player is disabled this turn.' };

        const normalizedTo = this.normalizeVertex(toVertex);
        const legal = this.neighbors(token.vertex).some((neighbor) => sameVertex(neighbor, normalizedTo));
        if (!legal) return { ok: false, error: 'Anyon moves must follow one graph edge.' };
        const occupantBeforeMove = this.tokenAt(normalizedTo, id);
        if (occupantBeforeMove && confirmFusion) {
            const captureStatus = canCaptureBraidedEntity(token, occupantBeforeMove, this.config);
            if (!captureStatus.legal) return { ok: false, error: captureStatus.reason, captureStatus };
        }

        const from = token.vertex;
        const rawPath = [from, normalizedTo];
        const beforeType = token.anyonType;
        if (this.config.enableTopologySeamTransforms) {
            token.anyonType = applySeamTransforms(token.anyonType, rawPath, this.topology, this.config.anyonModel);
        }
        token.vertex = normalizedTo;
        if (this.config.enablePathHistory) this.worldlines.get(id)?.push(normalizedTo);

        const braid = this.evaluateBraids(token, rawPath, player);
        const occupant = this.tokenAt(normalizedTo, id);
        const fusion = occupant && confirmFusion ? this.fuseTokens(id, occupant.id) : null;

        this.turn++;
        this.currentPlayer = this.nextPlayer(player);
        const event = {
            type: 'move',
            id,
            player,
            from,
            to: normalizedTo,
            beforeType,
            afterType: token.anyonType,
            braid,
            fusion
        };
        this.events.push(event);
        return { ok: true, event };
    }

    evaluateBraids(movingToken, path, player) {
        const targets = [...this.tokens.values()].filter((target) => target.id !== movingToken.id);
        const detected = detectTopologyBraidEvents({
            movingToken,
            path,
            topology: this.topology,
            targets,
            defects: this.defects,
            tick: this.turn,
            tokenIds: [...this.tokens.keys()]
        });
        const localBraids = detected.map((event) => this.applyBraid(movingToken, event, player));

        return {
            closedLoop: isClosedLoop(path),
            winding: windingNumbers(path, this.topology),
            noncontractible: localBraids.some((event) => event.reason === 'noncontractible_cycle'),
            events: localBraids,
            localBraids
        };
    }

    applyBraid(movingToken, event, player = movingToken.owner) {
        const target = this.tokens.get(event.targetId) || event.target || { id: event.targetId, defect: true };
        const beforeWord = cloneWord(movingToken.braidWord);
        const beforeFusionChannel = fusionChannelState(movingToken);
        const phase = target?.anyonType
            ? mutualBraidPhase(movingToken.anyonType, target.anyonType, this.config.anyonModel)
            : 1;
        if (this.config.braidMemoryMode === 'abelian_parity' && phase !== -1) {
            this.recordBraidEvent({
                type: 'braid',
                player,
                movingToken,
                target,
                sourceEvent: event,
                generator: null,
                beforeWord,
                afterWord: cloneWord(movingToken.braidWord),
                skipped: 'abelian_trivial_mutual_braid',
                beforeFusionChannel,
                afterFusionChannel: fusionChannelState(movingToken)
            });
            return {
                ...event,
                around: event.targetId,
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
        const captureUnlockGranted = recordUnbraidCaptureUnlock(movingToken, event.targetId, {
            successfulPartialUnbraid: memory.cancelledInverse,
            fullyUnbraided: memory.fullyUnbraided
        });
        const effect = braidEffectForPhase(phase, this.config);
        if (effect.effect !== 'none') this.applyBraidEffect(player, effect);
        const applied = {
            ...memory,
            around: event.targetId,
            targetType: target?.anyonType || target?.type || event.reason,
            phase,
            effect,
            captureUnlockGranted
        };
        this.recordBraidEvent({
            type: memory.cancelledInverse ? 'unbraid' : 'braid',
            player,
            movingToken,
            target,
            sourceEvent: event,
            generator: memory.braidGenerator,
            beforeWord,
            afterWord: memory.braidWord,
            cancellationOccurred: memory.cancelledInverse,
            fullyUnbraided: memory.fullyUnbraided,
            beforeFusionChannel,
            afterFusionChannel: fusionChannelState(movingToken)
        });
        return applied;
    }

    applyBraidEffect(player, effect) {
        switch (effect.effect) {
            case 'add_braid_token':
                this.braidTokens[player] = (this.braidTokens[player] || 0) + effect.delta;
                break;
            case 'flip_parity':
                this.parity[player] = this.parity[player] ? 0 : 1;
                break;
            case 'disable_one_turn':
                this.disabledUntilTurn[player] = Math.max(this.disabledUntilTurn[player] || 0, this.turn + 2);
                break;
            case 'score_bonus':
                this.score[player] = (this.score[player] || 0) + effect.delta;
                break;
            default:
                break;
        }
    }

    braidGeneratorFor(token, targetId, { path = [], direction = [], sign = null, index = null } = {}) {
        const winding = path.length ? windingNumbers(path, this.topology) : {};
        const resolvedSign = sign == null
            ? (path.length ? braidSignFromWinding(winding) : braidSignFromDirection(direction))
            : sign;
        return {
            generator: 'sigma',
            index: index ?? braidGeneratorIndex([...this.tokens.keys(), targetId], token.id, targetId),
            sign: resolvedSign,
            targetId,
            tick: this.turn
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

    attemptUnbraid(id, targetId, { player = this.currentPlayer, path = [], direction = [], sign = null, index = null } = {}) {
        const token = this.tokens.get(id);
        if (!token) return { ok: false, error: 'Unknown anyon token.' };
        if (token.owner !== player) return { ok: false, error: 'That anyon belongs to another player.' };
        const target = this.tokens.get(targetId) || null;
        const allowed = this.canAttemptUnbraid(token, target);
        if (!allowed.ok) return allowed;

        const beforeWord = token.braidWord.map((entry) => ({ ...entry }));
        const beforeFusionChannel = fusionChannelState(token);
        const generator = this.braidGeneratorFor(token, targetId, { path, direction, sign, index });
        const unbraid = applyUnbraidGenerator(token, generator, this.config, { target });
        const captureUnlockGranted = recordUnbraidCaptureUnlock(token, targetId, unbraid);
        const cost = this.config.unbraidActionCost;
        if (cost > 0) {
            this.turn += cost;
            this.currentPlayer = this.nextPlayer(player);
        }
        const event = {
            type: 'attempt_unbraid',
            id,
            player,
            targetId,
            path: path.map((vertex) => [...vertex]),
            direction: [...direction],
            beforeWord,
            unbraid,
            captureUnlockGranted
        };
        this.events.push(event);
        const unbraidLog = this.recordBraidEvent({
            type: 'attempt_unbraid',
            player,
            movingToken: token,
            target,
            sourceEvent: event,
            generator: unbraid.attempted,
            beforeWord,
            afterWord: unbraid.braidWord,
            cancellationOccurred: unbraid.successfulPartialUnbraid,
            fullyUnbraided: unbraid.fullyUnbraided,
            wrongOrder: unbraid.wrongOrder,
            beforeFusionChannel,
            afterFusionChannel: fusionChannelState(token)
        });
        this.unbraidAttempts.push(unbraidLog);
        return { ok: true, event };
    }

    fuseTokens(firstId, secondId) {
        const first = this.tokens.get(firstId);
        const second = this.tokens.get(secondId);
        if (!first || !second) return null;
        const fusion = createFusionResult(first.anyonType, second.anyonType, this.config);
        const captureStatus = canCaptureBraidedEntity(first, second, this.config, { consume: true });
        const result = { firstId, secondId, captureStatus, ...fusion };
        if (!captureStatus.legal) {
            result.blocked = true;
            result.reason = captureStatus.reason;
            return result;
        }

        if (fusion.fusionChannel) {
            this.fusionChannels.push({ ...fusion.fusionChannel, tokenIds: [firstId, secondId] });
            result.pending = true;
            return result;
        }

        if (fusion.resolved === '1') {
            if (this.config.vacuumFusionBehavior === 'replace') {
                mergeBraidMemory(first, second, this.config);
                first.anyonType = '1';
                this.tokens.delete(secondId);
            } else {
                this.tokens.delete(firstId);
                this.tokens.delete(secondId);
            }
            result.removed = this.config.vacuumFusionBehavior !== 'replace';
            return result;
        }

        mergeBraidMemory(first, second, this.config);
        first.anyonType = fusion.resolved;
        first.vertex = second.vertex;
        this.tokens.delete(secondId);
        return result;
    }

    previewCapture(attackerId, defenderId) {
        const attacker = this.tokens.get(attackerId);
        const defender = this.tokens.get(defenderId);
        if (!attacker || !defender) return { legalCapture: false, error: 'Unknown token.' };
        return previewAnyonCapture(attacker.anyonType, defender.anyonType, this.config);
    }

    nextPlayer(player) {
        const index = this.players.indexOf(player);
        return this.players[(index + 1 + this.players.length) % this.players.length] || player;
    }

    braidStatusForToken(token) {
        const wordLength = token?.braidWord?.length || 0;
        const parity = Number(token?.braidParity || 0);
        if (wordLength === 0 && parity === 0) return 'trivial';
        return (token?.braidHistory?.length || 0) > wordLength ? 'partially_unbraided' : 'braided';
    }

    tokenSnapshot(token) {
        return {
            ...cloneValue(token),
            vertex: cloneVertex(token.vertex),
            metadata: { ...(token.metadata || {}) },
            braidStatus: this.braidStatusForToken(token)
        };
    }

    snapshotState(label = 'state') {
        return {
            label,
            currentPlayer: this.currentPlayer,
            turn: this.turn,
            tokens: [...this.tokens.values()].map((token) => this.tokenSnapshot(token)),
            worldlines: Object.fromEntries([...this.worldlines.entries()].map(([id, path]) => [id, path.map(cloneVertex)])),
            braidTokens: { ...this.braidTokens },
            parity: { ...this.parity },
            score: { ...this.score }
        };
    }

    recordBraidEvent({
        type = 'braid',
        player = this.currentPlayer,
        movingToken,
        target = null,
        sourceEvent = {},
        generator = null,
        beforeWord = [],
        afterWord = [],
        cancellationOccurred = false,
        fullyUnbraided = false,
        wrongOrder = false,
        skipped = null,
        beforeFusionChannel = null,
        afterFusionChannel = null
    } = {}) {
        const entry = {
            tick: this.turn,
            player,
            type,
            movingTokenId: movingToken?.id || sourceEvent.id || sourceEvent.movingId || '',
            targetId: target?.id || sourceEvent.targetId || '',
            generator: generator ? { ...generator } : null,
            sign: generator?.sign ?? sourceEvent.sign ?? null,
            braidWordBefore: cloneWord(beforeWord),
            braidWordAfter: cloneWord(afterWord),
            cancellationOccurred: Boolean(cancellationOccurred),
            fullyUnbraided: Boolean(fullyUnbraided),
            wrongOrder: Boolean(wrongOrder),
            skipped,
            fusionChannelBefore: beforeFusionChannel,
            fusionChannelAfter: afterFusionChannel,
            path: Array.isArray(sourceEvent.path) ? sourceEvent.path.map(cloneVertex) : []
        };
        this.braidEventLog.push(entry);
        return entry;
    }

    braidHistories() {
        return [...this.tokens.values()].map((token) => ({
            id: token.id,
            owner: token.owner,
            anyonType: token.anyonType,
            braidStatus: this.braidStatusForToken(token),
            braidParity: token.braidParity || 0,
            braidWord: cloneWord(token.braidWord),
            braidHistory: cloneWord(token.braidHistory)
        }));
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

    exportState() {
        const finalState = this.snapshotState('final');
        return {
            config: { ...this.config },
            players: [...this.players],
            currentPlayer: this.currentPlayer,
            initialState: cloneValue(this.initialState),
            finalState,
            tokens: [...this.tokens.values()].map((token) => this.tokenSnapshot(token)),
            worldlines: Object.fromEntries([...this.worldlines.entries()].map(([id, path]) => [id, path.map(cloneVertex)])),
            braidTokens: { ...this.braidTokens },
            parity: { ...this.parity },
            score: { ...this.score },
            winner: this.score.black === this.score.white ? null : (this.score.black > this.score.white ? 'black' : 'white'),
            disabledUntilTurn: { ...this.disabledUntilTurn },
            turn: this.turn,
            fusionChannels: this.fusionChannels.map((channel) => ({ ...channel })),
            fusionOutcomes: this.events.map((event) => event.fusion).filter(Boolean),
            braidHistories: this.braidHistories(),
            braidEventLog: this.braidEventLog.map(cloneValue),
            unbraidAttempts: this.unbraidAttempts.map(cloneValue),
            topologicalSectorChanges: this.events
                .map((event) => event.braid?.winding ? { id: event.id, winding: { ...event.braid.winding } } : null)
                .filter(Boolean),
            windingNumbers: this.events
                .map((event) => event.braid?.winding ? { id: event.id, winding: { ...event.braid.winding } } : null)
                .filter(Boolean),
            statistics: this.braidStatistics(),
            events: this.events.map(cloneValue)
        };
    }
}

export function createToricAnyonLoopsGame(options = {}) {
    return new AnyonGameEngine({
        topology: options.topology || createRectTorusTopology(options),
        config: {
            anyonModel: 'toric_code',
            braidEffect: 'add_braid_token',
            ...options.config
        },
        players: options.players || ['black', 'white']
    });
}

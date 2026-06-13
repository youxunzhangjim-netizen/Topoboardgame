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
import { detectTopologyBraidEvents } from './BraidPathDetector.js';

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
        this.defects = Array.isArray(topology?.defects) ? [...topology.defects] : [];
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
        const phase = target?.anyonType
            ? mutualBraidPhase(movingToken.anyonType, target.anyonType, this.config.anyonModel)
            : 1;
        if (this.config.braidMemoryMode === 'abelian_parity' && phase !== -1) {
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
        const effect = braidEffectForPhase(phase, this.config);
        if (effect.effect !== 'none') this.applyBraidEffect(player, effect);
        return {
            ...memory,
            around: event.targetId,
            targetType: target?.anyonType || target?.type || event.reason,
            phase,
            effect
        };
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
        const generator = this.braidGeneratorFor(token, targetId, { path, direction, sign, index });
        const unbraid = applyUnbraidGenerator(token, generator, this.config);
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
            unbraid
        };
        this.events.push(event);
        return { ok: true, event };
    }

    fuseTokens(firstId, secondId) {
        const first = this.tokens.get(firstId);
        const second = this.tokens.get(secondId);
        if (!first || !second) return null;
        const fusion = createFusionResult(first.anyonType, second.anyonType, this.config);
        const result = { firstId, secondId, ...fusion };

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

    exportState() {
        return {
            config: { ...this.config },
            players: [...this.players],
            currentPlayer: this.currentPlayer,
            tokens: [...this.tokens.values()].map((token) => ({ ...token, vertex: [...token.vertex], metadata: { ...token.metadata } })),
            worldlines: Object.fromEntries([...this.worldlines.entries()].map(([id, path]) => [id, path.map((vertex) => [...vertex])])),
            braidTokens: { ...this.braidTokens },
            parity: { ...this.parity },
            score: { ...this.score },
            disabledUntilTurn: { ...this.disabledUntilTurn },
            turn: this.turn,
            fusionChannels: this.fusionChannels.map((channel) => ({ ...channel })),
            events: this.events.map((event) => ({ ...event }))
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

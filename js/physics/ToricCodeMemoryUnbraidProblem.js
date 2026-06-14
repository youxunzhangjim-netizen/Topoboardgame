import { AnyonGameEngine } from '../anyon/AnyonEngine.js';
import { createFusionResult, normalizeAnyonType } from '../anyon/AnyonAlgebra.js';
import { createGraphTopology } from '../topology/GraphTopologies.js';
import { ProbabilityEngine } from '../probability/ProbabilityEngine.js';

export const TORIC_CODE_MEMORY_UNBRAID_ID = 'toric_code_memory_unbraid';

export const TORIC_CODE_MEMORY_UNBRAID_COMPATIBLE_MODES = Object.freeze([
    'anyon_jump',
    'braided_jump',
    'braided_capture',
    'toric_anyon_loops'
]);

const TORIC_TYPES = Object.freeze(['1', 'e', 'm', 'psi']);
const DEFAULT_CONFIG = Object.freeze({
    id: TORIC_CODE_MEMORY_UNBRAID_ID,
    topology: 'torus',
    boardSize: 8,
    numPairsE: 2,
    numPairsM: 2,
    pairSeparation: 1,
    createPairsLocally: true,
    enableTwistSeam: true,
    initialLogicalSector: '(0,0)'
});

function integer(value, fallback, min = 0, max = 64) {
    const parsed = Math.floor(Number(value));
    if (!Number.isFinite(parsed)) return fallback;
    return Math.max(min, Math.min(max, parsed));
}

function mod2(value) {
    return ((Math.trunc(Number(value) || 0) % 2) + 2) % 2;
}

function cloneValue(value) {
    if (Array.isArray(value)) return value.map(cloneValue);
    if (value && typeof value === 'object') {
        return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, cloneValue(entry)]));
    }
    return value;
}

function keyOf(vertex) {
    return Array.isArray(vertex) ? vertex.join(',') : String(vertex ?? '');
}

function tokenVertex(token) {
    return token?.vertex ?? null;
}

function gameTick(game) {
    return Number(game?.moveNumber ?? game?.turn ?? 0);
}

function normalizeProblemTopology(topology = DEFAULT_CONFIG.topology) {
    const value = String(topology || DEFAULT_CONFIG.topology).toLowerCase();
    if (value === 'rp2' || value === 'rp' || value === 'real_projective_plane') return 'rp2';
    if (value === 'klein' || value === 'klein_bottle' || value === 'klein-bottle') return 'klein_bottle';
    if (value === 'sphere' || value === 's2' || value === 'sphere_latitude' || value === 'sphere_latitude_ring') {
        return 'sphere_latitude';
    }
    return 'torus';
}

export function normalizeToricCodeMemoryUnbraidConfig(config = {}) {
    return {
        ...DEFAULT_CONFIG,
        ...config,
        id: TORIC_CODE_MEMORY_UNBRAID_ID,
        topology: normalizeProblemTopology(config.topology),
        boardSize: integer(config.boardSize ?? config.size, DEFAULT_CONFIG.boardSize, 2, 32),
        numPairsE: integer(config.numPairsE, DEFAULT_CONFIG.numPairsE, 0, 32),
        numPairsM: integer(config.numPairsM, DEFAULT_CONFIG.numPairsM, 0, 32),
        pairSeparation: integer(config.pairSeparation, DEFAULT_CONFIG.pairSeparation, 1, 16),
        createPairsLocally: config.createPairsLocally ?? DEFAULT_CONFIG.createPairsLocally,
        enableTwistSeam: config.enableTwistSeam ?? DEFAULT_CONFIG.enableTwistSeam,
        initialLogicalSector: String(config.initialLogicalSector || DEFAULT_CONFIG.initialLogicalSector)
    };
}

export function topologyOptionsForToricCodeMemoryUnbraid(config = {}) {
    const normalized = normalizeToricCodeMemoryUnbraidConfig(config);
    return {
        topology: normalized.topology,
        width: normalized.boardSize,
        height: normalized.boardSize
    };
}

export function isToricCodeMemoryUnbraidCompatibleMode(mode) {
    return TORIC_CODE_MEMORY_UNBRAID_COMPATIBLE_MODES.includes(String(mode || ''));
}

function tokenWordLength(token) {
    return Array.isArray(token?.braidWord) ? token.braidWord.length : 0;
}

function tokenIsBraided(token) {
    return tokenWordLength(token) > 0
        || Number(token?.braidParity || 0) === 1
        || Boolean(token?.isBraided);
}

function normalizeTokenType(type) {
    return normalizeAnyonType(type, 'toric_code');
}

function toricFusionLabel(a, b) {
    return createFusionResult(a, b, { anyonModel: 'toric_code' }).resolved || '1';
}

function totalCharge(tokens = []) {
    return tokens.reduce((charge, token) => toricFusionLabel(charge, token.anyonType), '1');
}

function windingEntries(game) {
    if (Array.isArray(game?.topologicalSectors)) {
        return game.topologicalSectors.map((entry) => entry?.winding || {});
    }
    if (Array.isArray(game?.events)) {
        return game.events.map((event) => event?.braid?.winding || event?.winding).filter(Boolean);
    }
    return [];
}

function sumWinding(game) {
    return windingEntries(game).reduce((sum, winding) => ({
        x: sum.x + (Number(winding?.x) || 0),
        y: sum.y + (Number(winding?.y) || 0)
    }), { x: 0, y: 0 });
}

function logicalSectorFromWinding(winding = {}) {
    return `(${mod2(winding.x)},${mod2(winding.y)})`;
}

function fusionHistory(game) {
    if (Array.isArray(game?.fusionOutcomes)) return game.fusionOutcomes;
    return (game?.events || []).map((event) => event?.fusion).filter(Boolean);
}

function moveHistory(game) {
    return Array.isArray(game?.history) ? game.history : (game?.events || []);
}

function countEvents(game) {
    const braidEvents = Array.isArray(game?.braidEventLog) ? game.braidEventLog : [];
    const unbraids = braidEvents.filter((event) => event.type === 'unbraid' || event.type === 'attempt_unbraid');
    const fusions = fusionHistory(game);
    const history = moveHistory(game);
    return {
        braidEvents: braidEvents.filter((event) => event.type === 'braid' && !event.skipped).length,
        unbraidAttempts: unbraids.length,
        successfulUnbraids: unbraids.filter((event) => event.cancellationOccurred || event.fullyUnbraided).length,
        failedUnbraids: unbraids.filter((event) =>
            event.wrongOrder || (!event.cancellationOccurred && !event.fullyUnbraided)).length,
        fusionEvents: fusions.length,
        vacuumFusions: fusions.filter((event) =>
            event.vacuum || event.resolved === '1' || event.removed === true || event.removed?.length).length,
        seamTransforms: history.reduce((count, event) =>
            count + (Array.isArray(event?.seamTransforms) ? event.seamTransforms.length : 0), 0),
        noiseEvents: history.reduce((count, event) =>
            count + (Array.isArray(event?.noise) ? event.noise.length : 0), 0),
        measurements: history.filter((event) => event?.type === 'measurement' || event?.measurement).length
    };
}

export function computeToricCodeMemoryUnbraidObservables(game, options = {}) {
    const tokens = [...(game?.tokens?.values?.() || [])].map((token) => ({
        ...token,
        vertex: tokenVertex(token) ? [...tokenVertex(token)] : null,
        anyonType: normalizeTokenType(token.anyonType)
    }));
    const numE = tokens.filter((token) => token.anyonType === 'e').length;
    const numM = tokens.filter((token) => token.anyonType === 'm').length;
    const numPsi = tokens.filter((token) => token.anyonType === 'psi').length;
    const braidWordLengthByToken = Object.fromEntries(tokens.map((token) => [token.id, tokenWordLength(token)]));
    const lengths = Object.values(braidWordLengthByToken);
    const winding = sumWinding(game);
    const logicalSector = logicalSectorFromWinding(winding);
    const initialLogicalSector = String(options.initialLogicalSector
        ?? game?.physicalProblem?.config?.initialLogicalSector
        ?? DEFAULT_CONFIG.initialLogicalSector);
    const logicalErrorOccurred = logicalSector !== initialLogicalSector;
    const totalFusionCharge = totalCharge(tokens);
    const totalNonVacuumCount = tokens.filter((token) => token.anyonType !== '1').length;
    const braidParityTotal = tokens.reduce((sum, token) => mod2(sum + Number(token.braidParity || 0)), 0);
    const numberOfBraidedTokens = tokens.filter(tokenIsBraided).length;
    const eventCounts = countEvents(game);
    const returnedToVacuum = totalFusionCharge === '1' && totalNonVacuumCount === 0;
    const topologicalMemoryAlive = !logicalErrorOccurred && !returnedToVacuum && Boolean(
        totalNonVacuumCount
        || braidParityTotal
        || numberOfBraidedTokens
        || logicalSector !== '(0,0)'
    );

    return {
        tick: gameTick(game),
        source: options.source || 'state',
        numE,
        numM,
        numPsi,
        totalFusionCharge,
        totalNonVacuumCount,
        braidParityTotal,
        braidWordLengthByToken,
        averageBraidWordLength: lengths.length
            ? lengths.reduce((sum, length) => sum + length, 0) / lengths.length
            : 0,
        maxBraidWordLength: lengths.length ? Math.max(...lengths) : 0,
        numberOfBraidedTokens,
        numberOfSuccessfulUnbraids: eventCounts.successfulUnbraids,
        numberOfFailedUnbraids: eventCounts.failedUnbraids,
        fusionEvents: eventCounts.fusionEvents,
        vacuumFusions: eventCounts.vacuumFusions,
        numberOfFusionEvents: eventCounts.fusionEvents,
        numberOfVacuumFusions: eventCounts.vacuumFusions,
        windingX: winding.x,
        windingY: winding.y,
        logicalSector,
        initialLogicalSector,
        logicalErrorOccurred,
        topologicalMemoryAlive,
        returnedToVacuum
    };
}

function firstMemoryLifetime(history, finalTick) {
    const entries = Array.isArray(history) ? history : [];
    const firstAlive = entries.findIndex((entry) => entry.observables?.topologicalMemoryAlive);
    if (firstAlive < 0) return 0;
    const lost = entries.slice(firstAlive + 1).find((entry) => !entry.observables?.topologicalMemoryAlive);
    return lost ? lost.tick : finalTick;
}

function mostBraidedTokenFromObservables(observables) {
    const entries = Object.entries(observables?.braidWordLengthByToken || {});
    if (!entries.length) return { id: null, braidWordLength: 0 };
    const [id, braidWordLength] = entries.reduce((best, entry) => entry[1] > best[1] ? entry : best, entries[0]);
    return { id, braidWordLength };
}

export function calculateToricCodeMemoryUnbraidAnswer({
    initialObservables,
    finalObservables,
    history = [],
    eventCounts = {}
} = {}) {
    const finalTick = finalObservables?.tick || 0;
    const attempts = eventCounts.unbraidAttempts || 0;
    const successes = eventCounts.successfulUnbraids || 0;
    const failures = eventCounts.failedUnbraids || 0;
    const logicalErrorEntries = history.filter((entry) => entry.observables?.logicalErrorOccurred).length;
    const logicalErrorOccurred = Boolean(finalObservables?.logicalErrorOccurred
        || history.some((entry) => entry.observables?.logicalErrorOccurred));
    const vacuumRecovery = history.some((entry) => entry.observables?.returnedToVacuum)
        || Boolean(finalObservables?.returnedToVacuum);
    const mostBraidedToken = mostBraidedTokenFromObservables(finalObservables);

    let finalAnswerLabel = finalObservables?.topologicalMemoryAlive ? 'memory_survived' : 'memory_lost';
    if (attempts > 0 && failures > successes) finalAnswerLabel = 'unbraid_failed';
    if (vacuumRecovery) finalAnswerLabel = 'vacuum_recovered';
    if (logicalErrorOccurred) finalAnswerLabel = 'logical_error';

    const answer = {
        memoryLifetime: firstMemoryLifetime(history, finalTick),
        vacuumRecovery,
        exactUnbraidSuccessRate: attempts ? successes / attempts : 0,
        logicalErrorRate: history.length ? logicalErrorEntries / history.length : Number(logicalErrorOccurred),
        logicalErrorOccurred,
        finalTotalCharge: finalObservables?.totalFusionCharge || '1',
        finalLogicalSector: finalObservables?.logicalSector || '(0,0)',
        finalAverageBraidWordLength: finalObservables?.averageBraidWordLength || 0,
        finalMaxBraidWordLength: finalObservables?.maxBraidWordLength || 0,
        mostBraidedToken,
        finalAnswerLabel
    };
    answer.summary = humanReadableToricCodeMemoryUnbraidAnswer({
        initialObservables,
        finalObservables,
        eventCounts,
        answer
    });
    return answer;
}

export function humanReadableToricCodeMemoryUnbraidAnswer({
    initialObservables,
    finalObservables,
    eventCounts = {},
    answer = {}
} = {}) {
    const survived = finalObservables?.topologicalMemoryAlive ? 'survived' : 'was lost';
    const vacuumText = answer.vacuumRecovery
        ? 'The system returned to total vacuum charge.'
        : `The final total charge was ${finalObservables?.totalFusionCharge || '1'}, so the system did not return to vacuum.`;
    const initialSector = initialObservables?.logicalSector || '(0,0)';
    const finalSector = finalObservables?.logicalSector || '(0,0)';
    const sectorText = answer.logicalErrorOccurred
        ? `The logical sector changed from ${initialSector} to ${finalSector}, so a logical error occurred.`
        : `The logical sector remained ${finalSector}.`;
    return `The toric-code memory ${survived} for ${answer.memoryLifetime ?? finalObservables?.tick ?? 0} turns. ${vacuumText} There were ${eventCounts.braidEvents || 0} braid events, ${eventCounts.successfulUnbraids || 0} successful unbraids, and ${eventCounts.failedUnbraids || 0} failed inverse attempts. ${sectorText}`;
}

function verticesAtDistance(game, start, distance, occupied) {
    let frontier = [start];
    const visited = new Set([keyOf(start)]);
    for (let stepIndex = 0; stepIndex < distance; stepIndex++) {
        const next = [];
        for (const vertex of frontier) {
            const neighbors = game.topology.neighbors?.(vertex)
                ?? game.topology.directions().map((direction) => game.topology.step(vertex, direction)?.coord).filter(Boolean);
            for (const neighbor of neighbors) {
                const normalized = game.topology.normalize(neighbor);
                const key = keyOf(normalized);
                if (!normalized || visited.has(key)) continue;
                visited.add(key);
                next.push(normalized);
            }
        }
        frontier = next;
    }
    return frontier.filter((vertex) => !occupied.has(keyOf(vertex)));
}

export class ToricCodeMemoryUnbraidProblem {
    constructor(config = {}) {
        this.id = TORIC_CODE_MEMORY_UNBRAID_ID;
        this.config = normalizeToricCodeMemoryUnbraidConfig(config);
        this.initialObservables = null;
        this.initialState = null;
        this.history = [];
    }

    setupInitialState(game) {
        if (!this.config.createPairsLocally || !game?.tokens || typeof game.addToken !== 'function') return;
        game.tokens.clear();
        game.worldlines?.clear?.();
        game.fusionSites?.clear?.();
        const sizes = game.topology.sizes || [game.topology.width, game.topology.height].filter(Number.isFinite);
        if (sizes.length) {
            const center = sizes.map((size) => Math.floor(size / 2));
            game.fusionSites?.add?.(keyOf(center));
        }
        this.placePairs(game, 'e', this.config.numPairsE);
        this.placePairs(game, 'm', this.config.numPairsM);
    }

    placePairs(game, type, count) {
        const occupied = new Set([...game.tokens.values()].map((token) => keyOf(token.vertex)));
        let pairIndex = 0;
        for (const rawVertex of game.topology.vertices()) {
            if (pairIndex >= count) break;
            const vertex = game.topology.normalize(rawVertex);
            if (!vertex || occupied.has(keyOf(vertex))) continue;
            const partner = verticesAtDistance(
                game,
                vertex,
                this.config.pairSeparation,
                new Set([...occupied, keyOf(vertex)])
            )[0];
            if (!partner) continue;
            const owner = pairIndex % 2 === 0 ? 'black' : 'white';
            const baseId = `${type}${pairIndex + 1}`;
            const first = game.addToken({ id: `${baseId}a`, owner, vertex, anyonType: type });
            const second = game.addToken({ id: `${baseId}b`, owner, vertex: partner, anyonType: type });
            if (!first || !second) continue;
            occupied.add(keyOf(first.vertex));
            occupied.add(keyOf(second.vertex));
            pairIndex++;
        }
    }

    start(game) {
        this.initialObservables = computeToricCodeMemoryUnbraidObservables(game, {
            source: 'initial',
            initialLogicalSector: this.config.initialLogicalSector
        });
        this.initialState = {
            tick: this.initialObservables.tick,
            tokens: [...game.tokens.values()].map((token) => ({
                id: token.id,
                owner: token.owner,
                anyonType: token.anyonType,
                vertex: [...token.vertex]
            })),
            logicalSector: this.config.initialLogicalSector
        };
        this.history = [{
            tick: this.initialObservables.tick,
            source: 'initial',
            observables: cloneValue(this.initialObservables)
        }];
    }

    record(game, source = 'move') {
        const sourceName = typeof source === 'string' ? source : source?.type || 'move';
        const observables = computeToricCodeMemoryUnbraidObservables(game, {
            source: sourceName,
            initialLogicalSector: this.config.initialLogicalSector
        });
        const entry = {
            tick: observables.tick,
            source: sourceName,
            event: typeof source === 'object' ? cloneValue(source.event || source) : null,
            observables
        };
        this.history.push(entry);
        return entry;
    }

    export(game) {
        const finalObservables = computeToricCodeMemoryUnbraidObservables(game, {
            source: 'final',
            initialLogicalSector: this.config.initialLogicalSector
        });
        const initialObservables = this.initialObservables || finalObservables;
        const eventCounts = countEvents(game);
        const fullHistory = this.history.length
            ? this.history.map(cloneValue)
            : [{ tick: finalObservables.tick, source: 'final', observables: cloneValue(finalObservables) }];
        const answer = calculateToricCodeMemoryUnbraidAnswer({
            initialObservables,
            finalObservables,
            history: fullHistory,
            eventCounts
        });
        return {
            problemId: this.id,
            config: { ...this.config },
            compatibleGameModes: [...TORIC_CODE_MEMORY_UNBRAID_COMPATIBLE_MODES],
            physicalSystem: {
                anyonModel: 'toric_code',
                anyonTypes: [...TORIC_TYPES],
                fusionRules: {
                    '1xa': 'a',
                    'exe': '1',
                    'mxm': '1',
                    'psixpsi': '1',
                    'exm': 'psi',
                    'expsi': 'm',
                    'mxpsi': 'e'
                },
                braiding: {
                    'e around m': 'nontrivial Z2 phase/parity',
                    'm around e': 'nontrivial Z2 phase/parity',
                    default: 'trivial'
                },
                twistSeam: this.config.enableTwistSeam ? { e: 'm', m: 'e', psi: 'psi', 1: '1' } : null
            },
            physicalQuestion: [
                'How long does topological braid memory survive under legal moves, unbraiding attempts, noise, and measurements?',
                'Can the system return to total vacuum charge?',
                'Can an opponent exactly unbraid a braided token?'
            ],
            initialState: cloneValue(this.initialState),
            initialObservables,
            finalObservables,
            answer,
            fullHistory,
            moveHistory: cloneValue(moveHistory(game)),
            braidHistory: cloneValue(game?.braidEventLog || []),
            fusionHistory: cloneValue(fusionHistory(game)),
            logicalSectorHistory: fullHistory.map((entry) => ({
                tick: entry.tick,
                logicalSector: entry.observables.logicalSector,
                windingX: entry.observables.windingX,
                windingY: entry.observables.windingY,
                logicalErrorOccurred: entry.observables.logicalErrorOccurred
            })),
            eventCounts
        };
    }
}

function hashSeed(seed) {
    let state = 2166136261;
    for (const char of String(seed)) {
        state ^= char.charCodeAt(0);
        state = Math.imul(state, 16777619);
    }
    return state >>> 0;
}

function chooseWithRng(values, rng) {
    if (!values.length) return null;
    return values[Math.floor(rng.next() * values.length)];
}

function createExperimentTopology(spec, boardSize = 8) {
    const topology = typeof spec === 'string' ? spec : spec?.topology || spec?.name || 'torus';
    const size = integer(spec?.boardSize ?? spec?.size, boardSize, 2, 32);
    return createGraphTopology({ topology: normalizeProblemTopology(topology), width: size, height: size });
}

function coreLegalMoves(game) {
    const moves = [];
    for (const token of game.tokens.values()) {
        if (token.owner !== game.currentPlayer) continue;
        for (const neighbor of game.topology.neighbors(token.vertex)) {
            moves.push({ token, to: neighbor });
        }
    }
    return moves;
}

function runPolicyTurn(game, policy, rng) {
    if (policy === 'unbraid_first') {
        const candidate = [...game.tokens.values()].find((token) => {
            if (token.owner !== game.currentPlayer || !tokenIsBraided(token)) return false;
            const lastGenerator = token.braidWord?.[token.braidWord.length - 1];
            const targetId = lastGenerator?.targetId || token.braidedWith?.[token.braidedWith.length - 1];
            return targetId && game.tokens.has(targetId);
        });
        if (candidate) {
            const lastGenerator = candidate.braidWord?.[candidate.braidWord.length - 1];
            const targetId = lastGenerator?.targetId || candidate.braidedWith?.[candidate.braidedWith.length - 1];
            const result = game.attemptUnbraid(candidate.id, targetId, {
                player: game.currentPlayer,
                sign: lastGenerator ? -lastGenerator.sign : -1,
                index: lastGenerator?.index
            });
            if (result.ok) return true;
        }
    }
    const moves = coreLegalMoves(game);
    if (!moves.length) return false;
    let selected;
    if (typeof policy === 'function') selected = policy({ game, moves, rng });
    else selected = chooseWithRng(moves, rng);
    if (!selected) return false;
    return game.moveToken(selected.token.id, selected.to, { player: game.currentPlayer }).ok;
}

export function runToricMemoryExperiment({
    topologyList = ['torus'],
    numTrials = 10,
    maxTurns = 100,
    noiseRate = 0,
    measurementErrorRate = 0,
    policy = 'random',
    seed = 'toric-memory-experiment',
    boardSize = 8,
    numPairsE = 2,
    numPairsM = 2,
    pairSeparation = 1
} = {}) {
    const trials = [];
    for (const topologySpec of topologyList) {
        for (let trialIndex = 0; trialIndex < numTrials; trialIndex++) {
            const trialSeed = `${seed}:${typeof topologySpec === 'string' ? topologySpec : JSON.stringify(topologySpec)}:${trialIndex}`;
            const probability = new ProbabilityEngine({
                seed: hashSeed(trialSeed),
                noiseMode: noiseRate > 0 ? 'anyon_pair_creation' : 'off',
                noiseRate,
                measurementErrorRate
            });
            const topology = createExperimentTopology(topologySpec, boardSize);
            const game = new AnyonGameEngine({
                topology,
                config: {
                    anyonModel: 'toric_code',
                    braidMemoryMode: 'abelian_parity',
                    braidEffect: 'flip_parity',
                    enablePathHistory: true,
                    enableTopologySeamTransforms: true
                }
            });
            const problem = new ToricCodeMemoryUnbraidProblem({
                topology: topology.name,
                boardSize: topology.sizes?.[0] || boardSize,
                numPairsE,
                numPairsM,
                pairSeparation,
                enableTwistSeam: true
            });
            problem.setupInitialState(game);
            problem.start(game);
            const measurementHistory = [];
            for (let turn = 0; turn < maxTurns; turn++) {
                if (!runPolicyTurn(game, policy, probability.rng)) break;
                if (noiseRate > 0) probability.applyAnyonNoiseToGame(game, {
                    player: 'environment',
                    tick: game.turn
                });
                const entry = problem.record(game, 'experiment_move');
                const measurement = probability.roll({
                    tick: game.turn,
                    player: 'observer',
                    type: 'measurement_error:logical_sector',
                    probability: measurementErrorRate,
                    outcome: ({ triggered }) => ({
                        applied: triggered,
                        trueSector: entry.observables.logicalSector,
                        reportedSector: triggered
                            ? `(${1 - mod2(entry.observables.windingX)},${mod2(entry.observables.windingY)})`
                            : entry.observables.logicalSector
                    })
                });
                measurementHistory.push(measurement);
            }
            const exported = problem.export(game);
            trials.push({
                topology: topology.name,
                trial: trialIndex,
                seed: trialSeed,
                randomEvents: cloneValue(probability.randomEvents),
                measurementHistory: cloneValue(measurementHistory),
                ...exported
            });
        }
    }

    const count = trials.length || 1;
    const finalChargeDistribution = {};
    const finalLogicalSectorDistribution = {};
    for (const trial of trials) {
        const charge = trial.answer.finalTotalCharge;
        const sector = trial.answer.finalLogicalSector;
        finalChargeDistribution[charge] = (finalChargeDistribution[charge] || 0) + 1;
        finalLogicalSectorDistribution[sector] = (finalLogicalSectorDistribution[sector] || 0) + 1;
    }
    return {
        config: {
            topologyList: cloneValue(topologyList),
            numTrials,
            maxTurns,
            noiseRate,
            measurementErrorRate,
            policy: typeof policy === 'function' ? 'custom_function' : policy,
            seed
        },
        aggregate: {
            averageMemoryLifetime: trials.reduce((sum, trial) => sum + trial.answer.memoryLifetime, 0) / count,
            vacuumRecoveryRate: trials.filter((trial) => trial.answer.vacuumRecovery).length / count,
            logicalErrorRate: trials.filter((trial) => trial.answer.logicalErrorOccurred).length / count,
            unbraidSuccessRate: trials.reduce((sum, trial) => sum + trial.answer.exactUnbraidSuccessRate, 0) / count,
            averageBraidWordLength: trials.reduce((sum, trial) =>
                sum + trial.finalObservables.averageBraidWordLength, 0) / count,
            finalChargeDistribution,
            finalLogicalSectorDistribution
        },
        trials
    };
}

export function createToricCodeMemoryUnbraidProblem(config = {}) {
    return new ToricCodeMemoryUnbraidProblem(config);
}

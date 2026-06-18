import { SeededRandom } from '../probability/SeededRandom.js';

import { VirasoroGoGame } from '../localgames/VirasoroGo.js';
export const CFT_CONFORMAL_BLOCK_OBSERVABLES_ID = 'cft_conformal_block_observables';
export const CFT_CONFORMAL_BLOCK_COMPATIBLE_MODES = Object.freeze([
    'physical_virasoro_go'
]);

const INITIAL_STATES = Object.freeze([
    'two_point_insertions',
    'four_point_block',
    'boundary_cft',
    'thermal_sparse',
    'identity_background_with_defects'
]);

const DEFAULT_CONFIG = Object.freeze({
    id: CFT_CONFORMAL_BLOCK_OBSERVABLES_ID,
    cftInitialState: 'four_point_block',
    cftModel: 'ising_CFT',
    maxMode: 1,
    maxTurns: 100,
    seed: 'cft-observable-experiment'
});

function cloneValue(value) {
    if (Array.isArray(value)) return value.map(cloneValue);
    if (value && typeof value === 'object') {
        return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, cloneValue(entry)]));
    }
    return value;
}

function average(values) {
    return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

function distribution(values) {
    return values.reduce((counts, value) => {
        counts[value] = (counts[value] || 0) + 1;
        return counts;
    }, {});
}

function channelDistribution(observables = {}) {
    if (observables.opeChannelDistribution && Object.keys(observables.opeChannelDistribution).length) {
        return cloneValue(observables.opeChannelDistribution);
    }
    const result = {};
    for (const cluster of observables.OPEClusters || []) {
        for (const channel of cluster.channelLabels || []) {
            result[channel] = (result[channel] || 0) + 1;
        }
    }
    return result;
}

function finalOPESector(observables = {}) {
    if (observables.finalOPESector) return observables.finalOPESector;
    const entries = Object.entries(channelDistribution(observables));
    if (!entries.length) return 'identity';
    entries.sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
    return entries[0][0] || 'identity';
}

function entropyTrend(history = []) {
    const values = history
        .map((entry) => Number(entry?.observables?.entanglementEntropyEstimate))
        .filter(Number.isFinite);
    if (values.length < 2) return 0;
    return (values.at(-1) - values[0]) / (values.length - 1);
}

function strongestCorrelationValue(observables = {}) {
    const first = observables.strongestCorrelations?.[0];
    return Math.abs(Number(first?.estimate) || 0);
}

export function normalizeCFTConformalBlockConfig(config = {}) {
    const cftModel = config.cftModel === 'free_boson_CFT' ? 'free_boson_CFT' : 'ising_CFT';
    return {
        ...DEFAULT_CONFIG,
        ...config,
        id: CFT_CONFORMAL_BLOCK_OBSERVABLES_ID,
        cftInitialState: INITIAL_STATES.includes(config.cftInitialState)
            ? config.cftInitialState
            : DEFAULT_CONFIG.cftInitialState,
        cftModel,
        centralCharge: cftModel === 'free_boson_CFT' ? 1 : 0.5,
        maxMode: Number(config.maxMode) >= 2 ? 2 : 1,
        maxTurns: Math.max(1, Math.min(10000, Math.floor(Number(config.maxTurns) || DEFAULT_CONFIG.maxTurns))),
        estimatorNotice: 'All CFT values are discrete graph estimators, not exact continuum CFT results.'
    };
}

export function computeCFTPhysicalAnswer({
    finalObservables = {},
    physicsHistory = [],
    entropyHistory = []
} = {}) {
    const nonIdentityWeight = Number(finalObservables.totalConformalWeight) || 0;
    const vacuumBlockDominates = finalObservables.dominantConformalBlock === 'identity';
    const closeToIdentityVacuumSector = vacuumBlockDominates
        && nonIdentityWeight <= Math.max(0.25, (finalObservables.primaryCount || 0) * 0.125);
    const answer = {
        estimatorNotice: finalObservables.estimatorNotice
            || 'All CFT values are discrete graph estimators, not exact continuum CFT results.',
        finalDominantBlock: finalObservables.dominantConformalBlock || 'identity',
        finalDominantConformalBlock: finalObservables.dominantConformalBlock || 'identity',
        finalOPEChannelDistribution: channelDistribution(finalObservables),
        finalOPEFusionChannelDistribution: channelDistribution(finalObservables),
        finalOPESector: finalOPESector(finalObservables),
        finalEntropyEstimate: Number(finalObservables.entanglementEntropyEstimate) || 0,
        entropyGrowth: entropyTrend(physicsHistory),
        entropyGrowthTrend: entropyTrend(physicsHistory),
        entropyGrowthHistory: [...entropyHistory],
        strongestCorrelations: cloneValue(finalObservables.strongestCorrelations || []),
        strongestTwoPointCorrelations: cloneValue(finalObservables.strongestCorrelations || []),
        identityBlockDominates: vacuumBlockDominates,
        vacuumBlockDominates,
        closeToIdentityVacuumSector,
        anomalyCount: finalObservables.centralChargeAnomalyEvents?.length || 0,
        numberOfAnomalyEvents: finalObservables.centralChargeAnomalyEvents?.length || 0,
        finalTotalConformalWeight: nonIdentityWeight
    };
    answer.summary = `Discrete ${finalObservables.cftModel || 'CFT'} graph estimate: `
        + `${answer.finalDominantConformalBlock} block dominates; entropy `
        + `${answer.finalEntropyEstimate.toFixed(3)} with trend ${answer.entropyGrowthTrend.toFixed(3)} per recorded step; `
        + `total conformal weight ${answer.finalTotalConformalWeight.toFixed(3)}; `
        + `${answer.numberOfAnomalyEvents} central-charge anomaly event`
        + `${answer.numberOfAnomalyEvents === 1 ? '' : 's'}.`;
    return answer;
}

export class CFTConformalBlockObservablesProblem {
    constructor(config = {}) {
        this.id = CFT_CONFORMAL_BLOCK_OBSERVABLES_ID;
        this.config = normalizeCFTConformalBlockConfig(config);
        this.initialObservables = null;
        this.history = [];
    }

    start(game) {
        this.initialObservables = cloneValue(game.computeCFTObservables());
        this.history = [{
            tick: game.moveNumber,
            source: 'initial',
            observables: cloneValue(this.initialObservables)
        }];
    }

    record(game, source = 'move') {
        if (!this.initialObservables) this.start(game);
        const entry = {
            tick: game.moveNumber,
            source: typeof source === 'string' ? source : source?.type || 'move',
            observables: cloneValue(game.computeCFTObservables())
        };
        this.history.push(entry);
        return entry;
    }

    measureTwoPoint(game, first, second, player) {
        return game.measureTwoPoint(first, second, player);
    }

    measureFourPoint(game, coords, player) {
        return game.measureFourPoint(coords, player);
    }

    measureRegionEntropy(game, region, player) {
        return game.measureRegionEntropy(region, player);
    }

    measureOPEChannel(game, group, player) {
        return game.measureOPEChannel(group, player);
    }

    measureDominantBlock(game, coords, player) {
        return game.measureDominantBlock(coords, player);
    }

    measureStress(game, coords, player) {
        return game.measureCFT('stress', coords, player);
    }

    export(game) {
        const finalObservables = cloneValue(game.computeCFTObservables());
        const entropyHistory = [...(game.cft?.entropyHistory || [])];
        const answer = computeCFTPhysicalAnswer({
            finalObservables,
            physicsHistory: game.physicsHistory,
            entropyHistory
        });
        return {
            problemId: this.id,
            compatibleGameModes: [...CFT_CONFORMAL_BLOCK_COMPATIBLE_MODES],
            estimatorNotice: this.config.estimatorNotice,
            config: cloneValue(this.config),
            initialObservables: cloneValue(this.initialObservables || finalObservables),
            finalObservables,
            answer,
            finalAnswer: answer,
            fullHistory: cloneValue(this.history),
            fullPhysicsHistory: cloneValue(game.physicsHistory || []),
            measurementHistory: cloneValue(game.measurementHistory || []),
            entropyHistory,
            OPEChannelTransitionHistory: cloneValue(game.cft?.opeChannelHistory || []),
            centralChargeAnomalyEvents: cloneValue(game.cft?.anomalyEvents || [])
        };
    }
}

function hashSeed(seed) {
    let state = 2166136261;
    for (const character of String(seed)) {
        state ^= character.charCodeAt(0);
        state = Math.imul(state, 16777619);
    }
    return state >>> 0;
}

async function applyPolicy(game, policy, rng) {
    if (typeof policy === 'function') return Boolean(await policy({ game, rng }));
    const legal = game.legalMoves();
    if (!legal.length) return game.pass(game.currentPlayer).ok;
    const move = legal[rng.integer(legal.length)];
    return game.tryPlay(move, game.currentPlayer, {
        primaryType: game.cftConfig.primaryType
    }).ok;
}

export async function runCFTObservableExperiment({
    topologyList = ['flat', 'torus', 'sphere_latitude'],
    cftInitialState = 'four_point_block',
    cftModel = 'ising_CFT',
    maxMode = 1,
    numTrials = 10,
    maxTurns = 100,
    policy = 'random_legal',
    seed = DEFAULT_CONFIG.seed
} = {}) {
    const trials = [];
    for (const topologySpec of topologyList) {
        const topology = typeof topologySpec === 'string'
            ? { topology: topologySpec, width: 8, height: 8 }
            : { ...topologySpec };
        for (let trial = 0; trial < numTrials; trial++) {
            const trialSeed = `${seed}:${JSON.stringify(topologySpec)}:${trial}`;
            const rng = new SeededRandom(hashSeed(trialSeed));
            const game = new VirasoroGoGame({
                topology,
                cftInitialState,
                cftModel,
                maxMode,
                probability: { seed: trialSeed },
                physicalProblem: {
                    id: CFT_CONFORMAL_BLOCK_OBSERVABLES_ID,
                    cftInitialState,
                    cftModel,
                    maxMode,
                    maxTurns,
                    seed: trialSeed
                }
            });
            for (let turn = 0; turn < maxTurns && !game.go.gameOver; turn++) {
                if (!await applyPolicy(game, policy, rng)) break;
            }
            const exported = game.physicalProblem.export(game);
            trials.push({
                topology: game.topology.name,
                trial,
                seed: trialSeed,
                ...exported
            });
        }
    }

    const byTopology = {};
    for (const trial of trials) (byTopology[trial.topology] ||= []).push(trial);
    const topologyRanking = Object.entries(byTopology).map(([topology, entries]) => ({
        topology,
        averageFinalEntropy: average(entries.map((entry) => entry.answer.finalEntropyEstimate)),
        vacuumBlockDominanceRate: average(entries.map((entry) => Number(entry.answer.vacuumBlockDominates))),
        anomalyEventRate: average(entries.map((entry) => Number(entry.answer.numberOfAnomalyEvents > 0)))
    })).sort((left, right) => left.averageFinalEntropy - right.averageFinalEntropy);

    return {
        config: {
            topologyList: cloneValue(topologyList),
            cftInitialState,
            cftModel,
            maxMode,
            numTrials,
            maxTurns,
            policy: typeof policy === 'function' ? 'custom_function' : policy,
            seed
        },
        estimatorNotice: DEFAULT_CONFIG.estimatorNotice,
        aggregate: {
            vacuumBlockDominanceRate: average(trials.map((trial) => Number(trial.answer.vacuumBlockDominates))),
            averageFinalEntropy: average(trials.map((trial) => trial.answer.finalEntropyEstimate)),
            averageEntropyGrowth: average(trials.map((trial) => trial.answer.entropyGrowthTrend)),
            dominantBlockDistribution: distribution(trials.map((trial) => trial.answer.finalDominantConformalBlock)),
            anomalyEventRate: average(trials.map((trial) => Number(trial.answer.numberOfAnomalyEvents > 0))),
            averageStrongestCorrelation: average(
                trials.map((trial) => strongestCorrelationValue(trial.finalObservables))
            ),
            topologyRanking
        },
        trials
    };
}

export function createCFTConformalBlockObservablesProblem(config = {}) {
    return new CFTConformalBlockObservablesProblem(config);
}

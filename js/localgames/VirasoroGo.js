import {
    CFTReversiPhysics,
    ISING_CFT_PRIMARIES,
    normalizeCFTStone
} from '../cft/CFTReversiPhysics.js';
import {
    GO_COLORS,
    GraphGoGame,
    goColorToValue,
    goValueToColor
} from '../go/GraphGoGame.js';
import { ProbabilityEngine } from '../probability/ProbabilityEngine.js';
import { coordKey } from '../topology/GraphTopologies.js';
import { createPhysicalProblem } from '../physics/PhysicalProblems.js';

export const PHYSICAL_VIRASORO_GO_MODE = 'physical_virasoro_go';
export const VIRASORO_GO_MODE = PHYSICAL_VIRASORO_GO_MODE;

export const CFT_GO_INITIAL_STATES = Object.freeze([
    'two_point_insertions',
    'four_point_block',
    'boundary_cft',
    'thermal_sparse',
    'identity_background_with_defects'
]);

export const CFT_GO_PHYSICAL_SYSTEM_NAME = 'CFT observable Go on a discretized Riemann graph';
export const CFT_GO_BLACK_WHITE_MEANING = 'board = discretized Riemann surface / graph manifold; empty = identity operator; stone = primary-field insertion; black/white = source sign or player control; primaryType carries the physical field';
export const CFT_GO_ALLOWED_ACTIONS = Object.freeze([
    'place_primary_field',
    'capture_fuse_cluster',
    'measure_ope_channel',
    'measure_two_point_correlator',
    'measure_four_point_correlator',
    'measure_region_entropy',
    'measure_stress_tensor_proxy',
    'apply_Ln_deformation',
    'pass',
    'count'
]);
export const CFT_GO_LOCAL_UPDATE_RULES = 'Legal Go placement inserts a primary field and captures/fuses clusters by topology-aware graph liberties. Measurements estimate OPE channels, two-point/four-point correlators, entropy, and stress. Virasoro L_n actions update a stress proxy; N=2 records central-charge anomaly events.';

const CFT_MODELS = Object.freeze({
    ising_CFT: Object.freeze({
        centralCharge: 0.5,
        primaries: ISING_CFT_PRIMARIES
    }),
    free_boson_CFT: Object.freeze({
        centralCharge: 1,
        primaries: Object.freeze({
            identity: Object.freeze({ h: 0, hbar: 0 }),
            vertex: Object.freeze({ h: 0.25, hbar: 0.25 })
        })
    })
});

function cloneValue(value) {
    if (Array.isArray(value)) return value.map(cloneValue);
    if (value && typeof value === 'object') {
        return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, cloneValue(entry)]));
    }
    return value;
}

function primarySymbol(primaryType) {
    if (primaryType === 'sigma') return '\u03c3';
    if (primaryType === 'epsilon') return '\u03b5';
    if (primaryType === 'identity') return '1';
    if (primaryType === 'vertex') return 'V';
    return String(primaryType || 'field').slice(0, 5);
}

function signForColor(color) {
    return color === 'white' ? -1 : 1;
}

function modelPrimary(model, requested) {
    const primaries = CFT_MODELS[model]?.primaries || CFT_MODELS.ising_CFT.primaries;
    if (Object.hasOwn(primaries, requested)) return requested;
    return model === 'free_boson_CFT' ? 'vertex' : 'sigma';
}

export class VirasoroGoGame {
    constructor(options = {}) {
        this.reset(options);
    }

    reset(options = {}) {
        this.mode = PHYSICAL_VIRASORO_GO_MODE;
        this.go = new GraphGoGame({
            topology: options.topology || options,
            komi: Number.isFinite(Number(options.komi)) ? Number(options.komi) : 7.5,
            currentPlayer: options.currentPlayer || 'black'
        });
        this.topology = this.go.topology;
        this.cftConfig = {
            model: Object.hasOwn(CFT_MODELS, options.cftModel) ? options.cftModel : 'ising_CFT',
            initialState: CFT_GO_INITIAL_STATES.includes(options.cftInitialState)
                ? options.cftInitialState
                : 'four_point_block',
            primaryType: options.primaryType || 'sigma',
            hiddenChannels: options.hiddenChannels !== false,
            centralCharge: Number.isFinite(Number(options.centralCharge))
                ? Number(options.centralCharge)
                : null,
            maxMode: Number(options.maxMode) >= 2 ? 2 : 1,
            temperature: Math.max(0, Number(options.temperature) || 0.35)
        };
        this.cftConfig.primaryType = modelPrimary(this.cftConfig.model, this.cftConfig.primaryType);
        this.cftConfig.centralCharge ??= CFT_MODELS[this.cftConfig.model].centralCharge;
        this.cft = new CFTReversiPhysics({
            topology: this.topology,
            config: {
                centralCharge: this.cftConfig.centralCharge,
                maxMode: this.cftConfig.maxMode,
                hiddenChannels: this.cftConfig.hiddenChannels,
                temperature: this.cftConfig.temperature
            }
        });
        this.probability = new ProbabilityEngine(options.probability || {});
        this.physicalProblem = createPhysicalProblem(
            options.physicalProblem || options.physicalProblemId || options.problemId || null,
            options.physicalProblemConfig || {}
        );
        this.primaryBoard = new Map();
        this.physicsHistory = [];
        this.measurementHistory = [];
        this.lastInsertedCoord = null;
        this.lastCapturedGroups = [];
        this.setupCFTInitialState(this.cftConfig.initialState);
        this.resetPositionHistory();
        this.physicalProblem?.start?.(this);
        this.appendPhysicsHistory({
            player: 'system',
            action: 'initial_state',
            metadata: {
                cftInitialState: this.cftConfig.initialState,
                cftModel: this.cftConfig.model
            }
        });
    }

    get currentPlayer() {
        return this.go.currentPlayer;
    }

    set currentPlayer(value) {
        this.go.currentPlayer = value === 'white' ? 'white' : 'black';
    }

    get moveNumber() {
        return this.go.moveNumber;
    }

    get history() {
        return this.go.moveHistory;
    }

    get captures() {
        return this.go.captures;
    }

    get score() {
        return this.go.score;
    }

    get winner() {
        return this.go.winner;
    }

    get scoringPending() {
        return this.go.scoringPending;
    }

    normalize(coord) {
        return this.go.normalize(coord);
    }

    primaryWeights(primaryType) {
        const model = CFT_MODELS[this.cftConfig.model];
        return model.primaries[primaryType] || { h: 0.25, hbar: 0.25 };
    }

    createPrimaryStone(color, primaryType, overrides = {}) {
        const resolvedType = modelPrimary(this.cftConfig.model, primaryType);
        const weights = this.primaryWeights(resolvedType);
        return normalizeCFTStone({
            owner: color,
            color,
            sign: signForColor(color),
            primaryType: resolvedType,
            h: weights.h,
            hbar: weights.hbar,
            phaseAngle: Number(overrides.phaseAngle) || 0,
            channelLabel: overrides.channelLabel || 'identity',
            hiddenChannel: overrides.hiddenChannel || null,
            ...overrides
        });
    }

    placeSetupPrimary(coord, color, primaryType, overrides = {}) {
        const normalized = this.normalize(coord);
        if (!normalized) return false;
        const key = coordKey(normalized);
        if (this.go.valueAtKey(key) !== GO_COLORS.empty) return false;
        this.go.setValueAtKey(this.go.board, key, goColorToValue(color));
        this.primaryBoard.set(key, this.createPrimaryStone(color, primaryType, overrides));
        return true;
    }

    setupCFTInitialState(initialState) {
        const [width, height] = this.topology.sizes;
        const centerX = Math.floor(width / 2);
        const centerY = Math.floor(height / 2);
        if (initialState === 'two_point_insertions') {
            this.placeSetupPrimary([Math.max(0, centerX - 2), centerY], 'black', this.cftConfig.primaryType);
            this.placeSetupPrimary([Math.min(width - 1, centerX + 2), centerY], 'white', this.cftConfig.primaryType);
        } else if (initialState === 'four_point_block') {
            const points = [
                [Math.max(0, centerX - 2), Math.max(0, centerY - 2)],
                [Math.min(width - 1, centerX + 2), Math.max(0, centerY - 2)],
                [Math.max(0, centerX - 2), Math.min(height - 1, centerY + 2)],
                [Math.min(width - 1, centerX + 2), Math.min(height - 1, centerY + 2)]
            ];
            points.forEach((coord, index) => this.placeSetupPrimary(
                coord,
                index % 2 ? 'white' : 'black',
                this.cftConfig.model === 'ising_CFT' ? 'sigma' : 'vertex'
            ));
        } else if (initialState === 'boundary_cft') {
            const boundary = this.topology.vertices().filter((coord) =>
                coord[0] === 0 || coord[0] === width - 1 || coord[1] === 0 || coord[1] === height - 1);
            const stride = Math.max(1, Math.floor(boundary.length / 8));
            boundary.filter((_, index) => index % stride === 0).slice(0, 8).forEach((coord, index) => {
                this.placeSetupPrimary(coord, index % 2 ? 'white' : 'black', this.cftConfig.primaryType, {
                    channelLabel: 'boundary_change'
                });
                this.cft.addStress(coord, 0.5, index % 2 ? 'white' : 'black');
            });
        } else if (initialState === 'thermal_sparse') {
            const probability = Math.min(0.3, 0.04 + this.cftConfig.temperature * 0.12);
            for (const coord of this.topology.vertices()) {
                if (this.probability.rng.next() >= probability) continue;
                const color = this.probability.rng.next() < 0.5 ? 'black' : 'white';
                const primaryType = this.cftConfig.model === 'free_boson_CFT'
                    ? 'vertex'
                    : this.probability.rng.next() < 0.72 ? 'sigma' : 'epsilon';
                this.placeSetupPrimary(coord, color, primaryType, {
                    phaseAngle: this.probability.rng.next() * Math.PI * 2
                });
            }
        } else if (initialState === 'identity_background_with_defects') {
            const defectCoords = [
                [Math.max(0, centerX - 2), centerY],
                [Math.min(width - 1, centerX + 2), centerY],
                [centerX, Math.max(0, centerY - 2)],
                [centerX, Math.min(height - 1, centerY + 2)]
            ];
            defectCoords.forEach((coord, index) => {
                const primaryType = this.cftConfig.model === 'free_boson_CFT'
                    ? 'vertex'
                    : index < 2 ? 'sigma' : 'epsilon';
                this.placeSetupPrimary(coord, index % 2 ? 'white' : 'black', primaryType, {
                    channelLabel: index < 2 ? 'defect_pair' : 'energy_defect',
                    hiddenChannel: null,
                    lastUpdate: { action: 'identity_background_with_defects', tick: 0 }
                });
                this.cft.addStress(coord, primaryType === 'epsilon' ? 0.75 : 0.25, index % 2 ? 'white' : 'black');
            });
        }
    }

    resetPositionHistory() {
        const serialized = this.go.serializeBoard();
        this.go.positionHistory = [serialized];
        this.go.positionSet = new Set(this.go.positionHistory);
    }

    getStone(coord) {
        const normalized = this.normalize(coord);
        if (!normalized) return null;
        const value = this.go.valueAt(normalized);
        const color = goValueToColor(value);
        if (!color) return null;
        const primary = this.primaryBoard.get(coordKey(normalized))
            || this.createPrimaryStone(color, this.cftConfig.primaryType);
        return { ...cloneValue(primary), color, coord: normalized };
    }

    primaryLabel(stone) {
        return stone ? primarySymbol(stone.primaryType) : '1';
    }

    stressAt(coord) {
        return this.cft.stressAt(coord);
    }

    groupInfoAt(coord) {
        const info = this.go.groupInfoAt(coord);
        if (!info) return null;
        return {
            ...info,
            primaryTypes: [...info.group].map((key) => this.primaryBoard.get(key)?.primaryType || 'identity')
        };
    }

    counts() {
        return this.go.counts();
    }

    emptyLegalKeys() {
        return this.go.vertexKeys.filter((key) => this.go.valueAtKey(key) === GO_COLORS.empty);
    }

    legalMoves() {
        return this.go.legalMoves(this.currentPlayer);
    }

    resolveAdjacentOPE(coord, stone) {
        const updates = [];
        for (const neighbor of this.topology.neighbors(coord)) {
            const neighborStone = this.primaryBoard.get(coordKey(neighbor));
            if (!neighborStone) continue;
            const ope = this.cftConfig.model === 'free_boson_CFT'
                ? {
                    input: [stone.primaryType, neighborStone.primaryType],
                    outputs: ['vertex'],
                    resolved: 'vertex',
                    channelLabel: 'vertex_charge',
                    hiddenChannel: null,
                    tick: this.moveNumber,
                    coord: [...coord]
                }
                : this.cft.resolveOPE(stone.primaryType, neighborStone.primaryType, {
                    tick: this.moveNumber,
                    coord
                });
            stone.channelLabel = ope.channelLabel;
            stone.hiddenChannel = ope.hiddenChannel;
            updates.push({ neighbor: [...neighbor], ...cloneValue(ope) });
        }
        return updates;
    }

    tryPlay(coord, color = this.currentPlayer, options = {}) {
        const normalized = this.normalize(coord);
        const result = this.go.tryPlay(coord, color);
        if (!result.ok) return result;
        const primaryType = modelPrimary(
            this.cftConfig.model,
            options.primaryType || this.cftConfig.primaryType
        );
        const stone = this.createPrimaryStone(color, primaryType, options);
        const OPEUpdates = this.resolveAdjacentOPE(normalized, stone);
        this.primaryBoard.set(coordKey(normalized), stone);
        const capturedGroups = result.event.capturedStones.map((captured) => {
            const key = coordKey(captured);
            const capturedStone = this.primaryBoard.get(key);
            this.primaryBoard.delete(key);
            return { coord: [...captured], stone: cloneValue(capturedStone) };
        });
        this.lastInsertedCoord = [...normalized];
        this.lastCapturedGroups = capturedGroups;
        result.event.insertedPrimary = cloneValue(stone);
        result.event.OPEUpdates = cloneValue(OPEUpdates);
        this.appendPhysicsHistory({
            player: color,
            action: capturedGroups.length ? 'capture_fuse_cluster' : 'place_primary_field',
            move: cloneValue(result.event),
            insertedPrimary: { coord: [...normalized], ...cloneValue(stone) },
            capturedGroups,
            OPEUpdates
        });
        return result;
    }

    pass(color = this.currentPlayer) {
        const result = this.go.pass(color);
        if (result.ok) this.appendPhysicsHistory({ player: color, action: 'pass', move: result.event });
        return result;
    }

    agreeToCount(color = this.currentPlayer) {
        const result = this.go.agreeToCount(color);
        if (result.ok) this.appendPhysicsHistory({ player: color, action: 'count_agreement' });
        return result;
    }

    previewVirasoroAction({ action, coord, direction, player = this.currentPlayer } = {}) {
        return this.cft.previewAction({
            action,
            coord,
            direction,
            board: this.primaryBoard,
            player
        });
    }

    applyVirasoroAction({ action, coord, direction, player = this.currentPlayer } = {}) {
        if (player !== this.currentPlayer) return { ok: false, error: `It is ${this.currentPlayer}'s turn.` };
        const result = this.cft.applyAction({
            action,
            coord,
            direction,
            board: this.primaryBoard,
            player,
            tick: this.moveNumber + 1
        });
        if (!result.ok) return result;
        result.event = this.go.endTurnWithEvent({
            type: 'virasoro',
            action,
            coord: coord ? [...coord] : null,
            direction: direction ? [...direction] : null,
            affected: result.event.affected.map(cloneValue),
            anomaly: cloneValue(result.event.anomaly)
        }, player);
        this.appendPhysicsHistory({
            player,
            action: 'apply_Ln_deformation',
            move: result.event,
            VirasoroActions: [cloneValue(result.event)]
        });
        return result;
    }

    measureCFT(type, coords, player = this.currentPlayer) {
        const result = this.cft.measure({
            type,
            coords,
            board: this.primaryBoard,
            player,
            tick: this.moveNumber,
            errorRate: this.probability.config.measurementErrorRate,
            sample: this.probability.rng.next()
        });
        if (!result.ok) return result;
        this.measurementHistory.push(cloneValue(result.measurement));
        const actionByType = {
            ope_channel: 'measure_ope_channel',
            four_point_block: 'measure_four_point_correlator',
            region_entropy: 'measure_region_entropy',
            stress: 'measure_stress_tensor_proxy',
            line_parity: 'measure_line_parity'
        };
        this.appendPhysicsHistory({
            player,
            action: actionByType[type] || 'measurement',
            measurements: [result.measurement]
        });
        return result;
    }

    measureTwoPoint(first, second, player) {
        const observables = this.computeCFTObservables();
        const keys = new Set([coordKey(first), coordKey(second)]);
        const correlation = observables.twoPointCorrelations.find((item) =>
            item.pair.every((key) => keys.has(key))) || null;
        const measurement = {
            tick: this.moveNumber,
            player: player || this.currentPlayer,
            type: 'two_point',
            vertices: [[...first], [...second]],
            reported: correlation?.estimate ?? 0,
            approximate: true
        };
        this.measurementHistory.push(cloneValue(measurement));
        this.appendPhysicsHistory({
            player: measurement.player,
            action: 'measure_two_point_correlator',
            measurements: [measurement]
        });
        return { ok: true, measurement };
    }

    measureFourPoint(coords, player) {
        return this.measureCFT('four_point_block', coords, player);
    }

    measureRegionEntropy(region, player) {
        return this.measureCFT('region_entropy', region, player);
    }

    measureOPEChannel(group, player) {
        return this.measureCFT('ope_channel', group, player);
    }

    measureDominantBlock(coords, player) {
        return this.measureCFT('four_point_block', coords, player);
    }

    computeOPEClusters() {
        return this.go.connectedGroups().map((group) => {
            const types = [...group.group].map((key) => this.primaryBoard.get(key)?.primaryType || 'identity');
            const channels = [...group.group].map((key) => {
                const stone = this.primaryBoard.get(key);
                return stone?.hiddenChannel || stone?.channelLabel || 'identity';
            });
            return {
                color: group.color,
                vertices: [...group.group].map((key) => this.go.coordFromKey(key)),
                primaryTypes: types,
                channelLabels: [...new Set(channels)],
                liberties: group.liberties.size
            };
        });
    }

    computeOPEChannelDistribution(clusters = this.computeOPEClusters()) {
        const distribution = {};
        for (const cluster of clusters) {
            for (const channel of cluster.channelLabels || []) {
                distribution[channel] = (distribution[channel] || 0) + 1;
            }
        }
        for (const event of this.cft.opeChannelHistory || []) {
            const channel = event.hiddenChannel || event.channelLabel || event.resolved;
            if (channel) distribution[channel] = (distribution[channel] || 0) + 1;
        }
        return distribution;
    }

    finalOPESector(distribution = this.computeOPEChannelDistribution()) {
        const entries = Object.entries(distribution);
        if (!entries.length) return 'identity';
        entries.sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
        return entries[0][0] || 'identity';
    }

    computeStressTensorProxy() {
        const insertions = [...this.primaryBoard.entries()].map(([key, stone]) => ({
            coord: this.go.coordFromKey(key),
            stone
        }));
        return this.topology.vertices().map((coord) => {
            let real = this.cft.stressAt(coord).stress;
            let imaginary = 0;
            for (const insertion of insertions) {
                const dx = Number(coord[0] || 0) - Number(insertion.coord[0] || 0);
                const dy = Number(coord[1] || 0) - Number(insertion.coord[1] || 0);
                const radiusSquared = Math.max(0.25, dx * dx + dy * dy);
                const weight = Number(insertion.stone.h || 0);
                real += weight * (dx * dx - dy * dy) / (radiusSquared * radiusSquared);
                imaginary += weight * (-2 * dx * dy) / (radiusSquared * radiusSquared);
            }
            return {
                key: coordKey(coord),
                coord: [...coord],
                real,
                imaginary,
                magnitude: Math.hypot(real, imaginary),
                approximate: true
            };
        });
    }

    computeCFTObservables(recordHistory = false) {
        const observables = this.cft.computeObservables(this.primaryBoard, {
            interval: this.lastInsertedCoord ? [this.lastInsertedCoord] : [],
            recordHistory
        });
        const sum_h = [...this.primaryBoard.values()]
            .reduce((total, stone) => total + Number(stone.h || 0) + Number(stone.hbar || 0), 0);
        const clusters = this.computeOPEClusters();
        const opeChannelDistribution = this.computeOPEChannelDistribution(clusters);
        const anomalyEvents = cloneValue(observables.centralChargeAnomalyEvents || []);
        const stressTensorProxy = this.computeStressTensorProxy();
        return {
            ...observables,
            physicalSystemName: CFT_GO_PHYSICAL_SYSTEM_NAME,
            blackWhiteMeaning: CFT_GO_BLACK_WHITE_MEANING,
            cftModel: this.cftConfig.model,
            centralCharge: this.cftConfig.centralCharge,
            defaultCFT: this.cftConfig.model === 'ising_CFT'
                ? { name: 'Ising CFT', c: 0.5, primaries: cloneValue(ISING_CFT_PRIMARIES) }
                : { name: 'Free Boson CFT', c: 1, primaries: cloneValue(CFT_MODELS.free_boson_CFT.primaries) },
            primaryCount: this.primaryBoard.size,
            identityOperatorCount: Math.max(0, this.topology.vertices().length - this.primaryBoard.size),
            primaryFieldCounts: cloneValue(observables.primaryCounts),
            totalConformalWeight: sum_h,
            OPEClusters: clusters,
            opeChannelDistribution,
            OPEChannelDistribution: cloneValue(opeChannelDistribution),
            finalOPESector: this.finalOPESector(opeChannelDistribution),
            twoPointCorrelationEstimates: cloneValue(observables.twoPointCorrelations || []),
            fourPointCrossRatio: observables.fourPointCrossRatio,
            conformalBlockWeights: cloneValue(observables.conformalBlockWeights),
            dominantConformalBlock: observables.dominantConformalBlock,
            stressTensorProxy,
            stressTensorProxyT: cloneValue(stressTensorProxy),
            VirasoroModes: this.cft.allowedActions(),
            anomalyEvents,
            anomalyEventCount: anomalyEvents.length,
            capturedPrimaryGroups: cloneValue(this.lastCapturedGroups)
        };
    }

    appendPhysicsHistory({
        player,
        action,
        move = null,
        insertedPrimary = null,
        capturedGroups = [],
        OPEUpdates = [],
        VirasoroActions = [],
        measurements = [],
        metadata = {}
    }) {
        const entry = {
            tick: this.moveNumber,
            player,
            action,
            move: cloneValue(move),
            insertedPrimary: cloneValue(insertedPrimary),
            capturedGroups: cloneValue(capturedGroups),
            VirasoroActions: cloneValue(VirasoroActions),
            OPEUpdates: cloneValue(OPEUpdates),
            measurements: cloneValue(measurements),
            metadata: cloneValue(metadata),
            observables: this.computeCFTObservables(true)
        };
        this.physicsHistory.push(entry);
        this.physicalProblem?.record?.(this, { type: action, event: entry });
        return entry;
    }

    computeCFTAnswer() {
        const observables = this.computeCFTObservables();
        const entropy = this.cft.entropyHistory;
        const entropyGrowthHistory = [...entropy];
        const channelDistribution = {};
        for (const cluster of observables.OPEClusters) {
            for (const channel of cluster.channelLabels) {
                channelDistribution[channel] = (channelDistribution[channel] || 0) + 1;
            }
        }
        const fullChannelDistribution = Object.keys(observables.opeChannelDistribution || {}).length
            ? observables.opeChannelDistribution
            : channelDistribution;
        const entropyGrowth = entropy.length >= 2
            ? entropy.at(-1) - entropy[0]
            : 0;
        const nonIdentity = [...this.primaryBoard.values()]
            .filter((stone) => stone.primaryType !== 'identity').length;
        return {
            estimatorNotice: observables.estimatorNotice,
            finalDominantBlock: observables.dominantConformalBlock,
            finalDominantConformalBlock: observables.dominantConformalBlock,
            finalOPEFusionChannelDistribution: cloneValue(fullChannelDistribution),
            finalOPEChannelDistribution: cloneValue(fullChannelDistribution),
            finalOPESector: observables.finalOPESector || this.finalOPESector(fullChannelDistribution),
            finalEntropyEstimate: observables.entanglementEntropyEstimate,
            entropyGrowth,
            entropyGrowthHistory,
            strongestCorrelations: cloneValue(observables.strongestCorrelations),
            strongestTwoPointCorrelations: cloneValue(observables.strongestCorrelations),
            identityBlockDominates: observables.dominantConformalBlock === 'identity',
            vacuumBlockDominates: observables.dominantConformalBlock === 'identity',
            anomalyCount: observables.centralChargeAnomalyEvents.length,
            centralChargeAnomalyEventsOccurred: observables.centralChargeAnomalyEvents.length > 0,
            closeToIdentityVacuumSector: nonIdentity === 0 || (
                observables.dominantConformalBlock === 'identity'
                && nonIdentity <= Math.max(2, this.topology.vertices().length * 0.03)
            ),
            summary: `Approximate ${this.cftConfig.model} graph estimate: ${observables.dominantConformalBlock} block dominates, entropy ${observables.entanglementEntropyEstimate.toFixed(3)}, total conformal weight ${observables.totalConformalWeight.toFixed(3)}, and ${observables.centralChargeAnomalyEvents.length} anomaly event${observables.centralChargeAnomalyEvents.length === 1 ? '' : 's'} were recorded.`
        };
    }

    exportState() {
        const observables = this.computeCFTObservables();
        const answer = this.computeCFTAnswer();
        return {
            mode: this.mode,
            physicalSystemName: CFT_GO_PHYSICAL_SYSTEM_NAME,
            blackWhiteMeaning: CFT_GO_BLACK_WHITE_MEANING,
            initialStateOptions: [...CFT_GO_INITIAL_STATES],
            allowedActions: [...CFT_GO_ALLOWED_ACTIONS],
            localUpdateRules: CFT_GO_LOCAL_UPDATE_RULES,
            topology: {
                name: this.topology.name,
                sizes: [...this.topology.sizes],
                dimensions: this.topology.dimensions
            },
            cftConfig: cloneValue(this.cftConfig),
            currentPlayer: this.currentPlayer,
            moveNumber: this.moveNumber,
            captures: { ...this.captures },
            score: this.score ? { ...this.score } : null,
            winner: this.winner,
            scoringPending: this.scoringPending,
            go: this.go.exportState(),
            primaryBoard: [...this.primaryBoard.entries()].map(([key, stone]) => ({
                key,
                coord: this.go.coordFromKey(key),
                ...cloneValue(stone)
            })),
            cft: this.cft.exportState(),
            measurements: cloneValue(this.measurementHistory),
            physicsHistory: cloneValue(this.physicsHistory),
            observables,
            answer,
            physicalAnswer: cloneValue(answer),
            physicalProblem: this.physicalProblem?.export?.(this) || null,
            history: this.history.map(cloneValue)
        };
    }
}

export function createVirasoroGo(options = {}) {
    return new VirasoroGoGame(options);
}

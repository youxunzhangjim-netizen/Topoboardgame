import {
    CFT_REVERSI_INITIAL_STATES,
    CFTReversiPhysics,
    ISING_CFT_PRIMARIES,
    normalizeCFTStone
} from '../cft/CFTReversiPhysics.js';
import { coordKey, sumHomology } from '../topology/GraphTopologies.js';
import { CliffordReversiGame } from './CliffordReversi.js';

export const PHYSICAL_VIRASORO_REVERSI_MODE = 'physical_virasoro_reversi';
export const CFT_REVERSI_PHYSICAL_SYSTEM_NAME = 'CFT local operator and OPE interval system on a topology graph';
export const CFT_REVERSI_BLACK_WHITE_MEANING = 'black = + source/domain sign; white = - source/domain sign; stone = primary-field insertion; occupied neighbors/rays define a discrete OPE interaction interval instead of an enclosing boardgame bracket';
export const CFT_REVERSI_ALLOWED_ACTIONS = Object.freeze([
    'insert_primary_field',
    'propagate_local_ope_kernel',
    'update_ope_channel_along_interval',
    'measure_interval_parity',
    'measure_ope_channel',
    'measure_region_entropy',
    'apply_Ln_deformation',
    'pass'
]);
export const CFT_REVERSI_LOCAL_UPDATE_RULES = 'A primary insertion is legal on an empty graph vertex. The inserted field couples to occupied sites along nearby graph rays through the Ising-CFT OPE table, updates channel labels, phase transport, stress, entropy, and conformal-block estimators, and never requires an enclosing boardgame bracket. Measurements reveal interval parity, OPE channel, entropy, stress, or four-point block estimators; L_n actions update the stress proxy and N=2 anomaly log.';

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

function primarySymbol(primaryType) {
    if (primaryType === 'sigma') return '\u03c3';
    if (primaryType === 'epsilon') return '\u03b5';
    if (primaryType === 'identity') return 'I';
    return String(primaryType || 'field').slice(0, 5);
}

export class PhysicalVirasoroReversiGame extends CliffordReversiGame {
    reset(options = {}) {
        super.reset({ ...options, physicalProblem: null, physicalProblemId: null, problemId: null });
        this.mode = PHYSICAL_VIRASORO_REVERSI_MODE;
        this.algebraSet = 'virasoro_cft';
        this.cftConfig = {
            initialState: CFT_REVERSI_INITIAL_STATES.includes(options.cftReversiInitialState)
                ? options.cftReversiInitialState
                : 'four_sigma_block',
            primaryType: options.primaryType || 'sigma',
            hiddenChannels: options.hiddenChannels !== false,
            centralCharge: Number.isFinite(Number(options.centralCharge)) ? Number(options.centralCharge) : 0.5,
            maxMode: Number(options.maxMode) >= 2 ? 2 : 1,
            temperature: Number.isFinite(Number(options.temperature)) ? Number(options.temperature) : 0.35,
            domainWallThickness: Math.max(1, Math.min(6, Math.floor(Number(options.domainWallThickness) || 1))),
            interactionRadius: Math.max(1, Math.min(6, Math.floor(Number(options.interactionRadius) || 2)))
        };
        this.board.clear();
        this.history = [];
        this.positionHistory = [];
        this.physicsHistory = [];
        this.moveNumber = 0;
        this.currentPlayer = options.currentPlayer || 'black';
        this.cft = new CFTReversiPhysics({
            topology: this.topology,
            config: {
                centralCharge: this.cftConfig.centralCharge,
                maxMode: this.cftConfig.maxMode,
                hiddenChannels: this.cftConfig.hiddenChannels,
                temperature: this.cftConfig.temperature
            }
        });
        this.lastFlippedPath = [];
        this.selectedMeasurementRegion = [];
        this.setupCFTInitialState(this.cftConfig.initialState);
        this.recordPosition('cft_setup');
        this.appendPhysicsHistory({
            player: 'system',
            action: 'initial_state',
            metadata: { cftReversiInitialState: this.cftConfig.initialState }
        });
    }

    setStone(coord, stone) {
        const normalized = this.topology.normalize(coord);
        if (!normalized) return false;
        this.board.set(coordKey(normalized), normalizeCFTStone(stone));
        return true;
    }

    getStone(coord) {
        const normalized = this.topology.normalize(coord);
        if (!normalized) return null;
        const stone = this.board.get(coordKey(normalized));
        return stone ? cloneValue(stone) : null;
    }

    setupCFTInitialState(initialState) {
        if (initialState === 'domain_wall_seed') this.setupDomainWallSeed();
        if (initialState === 'four_sigma_block') this.setupFourSigmaBlock();
        if (initialState === 'boundary_condition_change') this.setupBoundaryConditionChange();
        if (initialState === 'thermal_cft_sample') this.setupThermalSample();
        if (initialState === 'two_phase_interval_seed') this.setupTwoPhaseIntervalSeed();
    }

    activeSliceVertices() {
        const centers = this.topology.sizes.map((size) => Math.floor(size / 2));
        return this.topology.vertices().filter((coord) =>
            coord.slice(2).every((value, axis) => value === centers[axis + 2]));
    }

    setupDomainWallSeed() {
        const width = this.topology.sizes[0];
        const height = this.topology.sizes[1];
        const middle = Math.floor(width / 2);
        const thickness = Math.max(1, Math.min(this.cftConfig.domainWallThickness, Math.floor((width - 2) / 2) || 1));
        const leftStart = Math.max(1, middle - thickness);
        const leftEnd = Math.max(leftStart, middle - 1);
        const rightStart = middle;
        const rightEnd = Math.min(width - 2, middle + thickness - 1);
        const yMin = 1;
        const yMax = Math.max(1, height - 2);
        for (const coord of this.activeSliceVertices()) {
            const x = coord[0];
            const y = coord[1];
            if (y < yMin || y > yMax) continue;
            let sign = 0;
            if (x >= leftStart && x <= leftEnd) sign = 1;
            else if (x >= rightStart && x <= rightEnd) sign = -1;
            if (!sign) continue;
            this.setStone(coord, {
                sign,
                primaryType: y % 3 === 0 ? 'epsilon' : 'sigma',
                channelLabel: 'identity',
                lastUpdate: {
                    action: 'domain_wall_seed',
                    tick: 0,
                    wallThickness: thickness
                }
            });
        }
        const midY = Math.floor(height / 2);
        this.lastFlippedPath = [
            [leftEnd, midY, ...this.topology.sizes.slice(2).map((size) => Math.floor(size / 2))],
            [rightStart, midY, ...this.topology.sizes.slice(2).map((size) => Math.floor(size / 2))]
        ];
    }

    setupFourSigmaBlock() {
        const [width, height] = this.topology.sizes;
        const x = Math.max(1, Math.floor(width / 2) - 1);
        const y = Math.max(1, Math.floor(height / 2) - 1);
        const tail = this.topology.dimensions > 2
            ? this.topology.sizes.slice(2).map((size) => Math.floor(size / 2))
            : [];
        const placements = [
            [[x, y, ...tail], -1],
            [[x + 1, y + 1, ...tail], -1],
            [[x + 1, y, ...tail], 1],
            [[x, y + 1, ...tail], 1]
        ];
        for (const [coord, sign] of placements) {
            this.setStone(coord, {
                sign,
                primaryType: 'sigma',
                channelLabel: this.cftConfig.hiddenChannels ? 'unmeasured' : 'identity',
                hiddenChannel: this.cftConfig.hiddenChannels ? 'identity' : null,
                lastUpdate: { action: 'four_sigma_block', tick: 0 }
            });
        }
    }

    setupBoundaryConditionChange() {
        const [width, height] = this.topology.sizes;
        const tail = this.topology.dimensions > 2
            ? this.topology.sizes.slice(2).map((size) => Math.floor(size / 2))
            : [];
        const coordinates = [
            [0, Math.floor(height / 3), ...tail],
            [0, Math.floor(2 * height / 3), ...tail],
            [width - 1, Math.floor(height / 3), ...tail],
            [width - 1, Math.floor(2 * height / 3), ...tail]
        ];
        for (let index = 0; index < coordinates.length; index++) {
            this.setStone(coordinates[index], {
                sign: index < 2 ? 1 : -1,
                primaryType: 'sigma',
                channelLabel: 'boundary_change',
                lastUpdate: { action: 'boundary_condition_change', tick: 0 }
            });
            this.cft.addStress(coordinates[index], 1, index < 2 ? 'black' : 'white');
        }
    }

    setupThermalSample() {
        const candidates = this.activeSliceVertices();
        const density = Math.min(0.45, 0.12 + this.cftConfig.temperature * 0.25);
        for (const coord of candidates) {
            if (this.probability.rng.next() > density) continue;
            const primaryType = this.probability.rng.next() < 0.72 ? 'sigma' : 'epsilon';
            const sign = this.probability.rng.next() < 0.5 ? 1 : -1;
            this.setStone(coord, {
                sign,
                primaryType,
                phaseAngle: this.probability.rng.next() * Math.PI * 2,
                channelLabel: 'thermal',
                lastUpdate: { action: 'thermal_cft_sample', tick: 0 }
            });
            this.cft.addStress(coord, primaryType === 'epsilon' ? 1 : 0.25, sign > 0 ? 'black' : 'white');
        }
        if (!this.board.size && candidates.length) {
            this.setStone(candidates[Math.floor(candidates.length / 2)], {
                sign: 1,
                primaryType: 'sigma',
                channelLabel: 'thermal',
                lastUpdate: { action: 'thermal_cft_sample', tick: 0 }
            });
        }
    }

    setupTwoPhaseIntervalSeed() {
        const [width, height] = this.topology.sizes;
        const tail = this.topology.dimensions > 2
            ? this.topology.sizes.slice(2).map((size) => Math.floor(size / 2))
            : [];
        const y = Math.max(1, Math.min(height - 2, Math.floor(height / 2)));
        const x0 = Math.max(1, Math.floor(width / 2) - 2);
        const placements = [
            [[x0, y, ...tail], 1, 'sigma', 'phase_A_source'],
            [[Math.min(width - 2, x0 + 1), y, ...tail], -1, 'sigma', 'interface_sigma'],
            [[Math.min(width - 2, x0 + 2), y, ...tail], -1, 'epsilon', 'phase_B_energy'],
            [[Math.min(width - 2, x0 + 3), y, ...tail], 1, 'sigma', 'phase_A_sink']
        ];
        for (const [coord, sign, primaryType, channelLabel] of placements) {
            this.setStone(coord, {
                sign,
                primaryType,
                channelLabel,
                lastUpdate: { action: 'two_phase_interval_seed', tick: 0 }
            });
            this.cft.addStress(coord, primaryType === 'epsilon' ? 0.75 : 0.25, sign > 0 ? 'black' : 'white');
        }
        this.lastFlippedPath = placements.map(([coord]) => [...coord]);
        this.cft.lastInterval = this.lastFlippedPath;
    }

    collectCFTRay(coord, direction, player) {
        const opponent = otherPlayer(player);
        const chain = [];
        const edges = [];
        const seen = new Set([coordKey(coord)]);
        let cursor = coord;
        for (let index = 0; index < this.topology.maxRaySteps; index++) {
            const next = this.topology.step(cursor, direction);
            if (!next) break;
            const key = coordKey(next.coord);
            if (seen.has(key)) break;
            seen.add(key);
            edges.push(next.edge);
            const stone = this.board.get(key);
            if (!stone) break;
            if (stone.color === opponent) {
                chain.push({ coord: [...next.coord], key, stone: cloneValue(stone), edges: [...edges] });
                cursor = next.coord;
                continue;
            }
            if (stone.color === player && chain.length) return { coupled: true, chain, edges };
            break;
        }
        return { coupled: false, chain: [], edges };
    }

    previewMove(coord, player = this.currentPlayer, primaryType = this.cftConfig?.primaryType || 'sigma') {
        const normalized = this.topology.normalize(coord);
        if (!normalized) return { legal: false, reason: 'outside', flips: [] };
        if (!this.isEmpty(normalized)) return { legal: false, reason: 'occupied', flips: [] };
        const flips = [];
        const rays = [];
        const seen = new Set();
        const radius = Math.max(1, Math.min(6, Number(this.cftConfig?.interactionRadius) || 2));
        for (const direction of this.topology.rayDirections()) {
            const chain = [];
            const edges = [];
            let cursor = normalized;
            for (let index = 0; index < radius; index++) {
                const step = this.topology.step(cursor, direction);
                if (!step) break;
                const key = coordKey(step.coord);
                if (key === coordKey(normalized)) break;
                edges.push(step.edge);
                const stone = this.board.get(key);
                cursor = step.coord;
                if (!stone || seen.has(key)) continue;
                seen.add(key);
                chain.push([...step.coord]);
                const ope = this.cft.resolveOPE(primaryType, stone.primaryType, {
                    tick: this.moveNumber + 1,
                    coord: step.coord,
                    record: false
                });
                let phaseAngle = Number(stone.phaseAngle) || 0;
                for (const edge of edges) {
                    const transport = this.topology.seamTransform(edge);
                    if (transport !== 'identity') phaseAngle += Math.PI / 2;
                }
                flips.push({
                    coord: [...step.coord],
                    key,
                    before: cloneValue(stone),
                    after: normalizeCFTStone({
                        ...stone,
                        primaryType: ope.resolved,
                        channelLabel: ope.channelLabel,
                        hiddenChannel: ope.hiddenChannel,
                        phaseAngle,
                        lastUpdate: { action: 'local_ope_update', tick: this.moveNumber + 1 }
                    }),
                    ope,
                    transportEdges: [...edges],
                    operator: 'local_ope_kernel'
                });
            }
            if (chain.length) rays.push({ direction, chain, edges: [...edges] });
        }
        return {
            legal: true,
            coord: normalized,
            player,
            primaryType,
            rays,
            flips
        };
    }

    legalMoves(player = this.currentPlayer, primaryType = this.cftConfig.primaryType) {
        return this.topology.vertices()
            .map((coord) => this.previewMove(coord, player, primaryType))
            .filter((preview) => preview.legal);
    }

    place(coord, options = {}) {
        const player = options.player || this.currentPlayer;
        const primaryType = options.primaryType || this.cftConfig.primaryType;
        const preview = this.previewMove(coord, player, primaryType);
        if (!preview.legal) return { ok: false, error: 'Insert a primary field on an empty graph vertex.', preview };
        const weights = ISING_CFT_PRIMARIES[primaryType] || { h: Number(options.h) || 0, hbar: Number(options.hbar) || 0 };
        this.setStone(preview.coord, {
            sign: player === 'black' ? 1 : -1,
            primaryType,
            h: weights.h,
            hbar: weights.hbar,
            phaseAngle: Number(options.phaseAngle) || 0,
            channelLabel: 'source',
            lastUpdate: { action: 'insert_primary_field', tick: this.moveNumber + 1 }
        });
        for (const flip of preview.flips) this.cft.opeChannelHistory.push(cloneValue(flip.ope));
        for (const flip of preview.flips) this.board.set(flip.key, flip.after);
        const edges = preview.rays.flatMap((ray) => ray.edges);
        const interval = [preview.coord, ...preview.flips.map((flip) => flip.coord)];
        this.lastFlippedPath = interval.map((entry) => [...entry]);
        this.cft.lastInterval = this.lastFlippedPath;
        for (const vertex of interval) this.cft.addStress(vertex, Math.max(0.125, weights.h + weights.hbar), player);
        this.moveNumber++;
        const event = {
            mode: this.mode,
            type: 'place',
            action: 'insert_primary_and_local_ope',
            number: this.moveNumber,
            player,
            placedStone: { coord: [...preview.coord], ...this.getStone(preview.coord) },
            flippedPath: this.lastFlippedPath,
            localOPEPath: this.lastFlippedPath,
            flipped: preview.flips.map((flip) => ({
                coord: flip.coord,
                before: flip.before,
                after: flip.after,
                ope: flip.ope
            })),
            OPEUpdates: preview.flips.map((flip) => cloneValue(flip.ope)),
            winding: sumHomology(edges),
            seamTransports: edges
                .filter((edge) => this.topology.seamTransform(edge) !== 'identity')
                .map((edge) => ({
                    from: edge.from,
                    to: edge.to,
                    transform: this.topology.seamTransform(edge)
                }))
        };
        this.history.unshift(event);
        this.currentPlayer = otherPlayer(player);
        this.appendPhysicsHistory({
            player,
            action: 'insert_primary_and_local_ope',
            placedStone: event.placedStone,
            flippedPath: event.flippedPath,
            OPEUpdates: event.OPEUpdates,
            metadata: { interactionRadius: this.cftConfig.interactionRadius }
        });
        this.recordPosition('cft_operator_move');
        return { ok: true, event };
    }

    previewVirasoroAction({ action, coord, direction, player = this.currentPlayer } = {}) {
        return this.cft.previewAction({ action, coord, direction, board: this.board, player });
    }

    applyVirasoroAction({ action, coord, direction, player = this.currentPlayer } = {}) {
        if (player !== this.currentPlayer) return { ok: false, error: `It is ${this.currentPlayer}'s turn.` };
        const result = this.cft.applyAction({
            action,
            coord,
            direction,
            board: this.board,
            player,
            tick: this.moveNumber + 1
        });
        if (!result.ok) return result;
        this.moveNumber++;
        const event = {
            mode: this.mode,
            type: 'virasoro',
            number: this.moveNumber,
            player,
            VirasoroActions: [cloneValue(result.event)],
            affected: result.event.affected
        };
        this.history.unshift(event);
        this.currentPlayer = otherPlayer(player);
        this.appendPhysicsHistory({
            player,
            action: 'apply_Ln_deformation',
            VirasoroActions: event.VirasoroActions
        });
        this.recordPosition('cft_virasoro');
        return { ok: true, event };
    }

    measureCFT(type, coords, player = this.currentPlayer) {
        const tick = this.probability.nextTick();
        const sample = this.probability.rng.next();
        const result = this.cft.measure({
            type,
            coords,
            board: this.board,
            player,
            tick,
            errorRate: this.probability.config.measurementErrorRate,
            sample
        });
        if (!result.ok) return result;
        this.moveNumber++;
        const event = {
            mode: this.mode,
            type: 'measurement',
            number: this.moveNumber,
            player,
            measurements: [cloneValue(result.measurement)]
        };
        this.history.unshift(event);
        this.currentPlayer = otherPlayer(player);
        const actionByType = {
            line_parity: 'measure_interval_parity',
            ope_channel: 'measure_ope_channel',
            four_point_block: 'measure_four_point_correlator',
            region_entropy: 'measure_region_entropy',
            stress: 'measure_stress_proxy'
        };
        this.appendPhysicsHistory({
            player,
            action: actionByType[type] || 'measurement',
            measurements: event.measurements
        });
        this.recordPosition('cft_measurement');
        return { ok: true, event, measurement: result.measurement };
    }

    measureLineParity(path, player) {
        return this.measureCFT('line_parity', path, player);
    }

    measureOPEChannel(pathOrDomain, player) {
        return this.measureCFT('ope_channel', pathOrDomain, player);
    }

    measureFourPointBlock(coords, player) {
        return this.measureCFT('four_point_block', coords, player);
    }

    measureRegionEntropy(region, player) {
        return this.measureCFT('region_entropy', region, player);
    }

    measureStress(region, player) {
        return this.measureCFT('stress', region, player);
    }

    stressAt(coord) {
        return this.cft.stressAt(coord);
    }

    primaryLabel(stone) {
        if (!stone) return 'I';
        return `${stone.sign > 0 ? '+' : '-'}${primarySymbol(stone.primaryType)}`;
    }

    computeCFTObservables(recordHistory = false) {
        const observables = this.cft.computeObservables(this.board, {
            interval: this.lastFlippedPath,
            recordHistory
        });
        const opeChannelDistribution = {};
        for (const event of this.cft.opeChannelHistory || []) {
            const channel = event.hiddenChannel || event.channelLabel || event.resolved;
            if (channel) opeChannelDistribution[channel] = (opeChannelDistribution[channel] || 0) + 1;
        }
        for (const [key, stone] of this.board.entries()) {
            const channel = stone.hiddenChannel || stone.channelLabel || 'identity';
            opeChannelDistribution[channel] = (opeChannelDistribution[channel] || 0) + 1;
            if (!key) continue;
        }
        const finalCFTSector = Object.entries(opeChannelDistribution)
            .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0]?.[0]
            || observables.dominantConformalBlock
            || 'identity';
        return {
            ...observables,
            physicalSystemName: CFT_REVERSI_PHYSICAL_SYSTEM_NAME,
            blackWhiteMeaning: CFT_REVERSI_BLACK_WHITE_MEANING,
            primaryCount: this.board.size,
            primaryFieldCounts: cloneValue(observables.primaryCounts),
            opeChannelDistribution,
            OPEChannelDistribution: cloneValue(opeChannelDistribution),
            OPEChannelTransitions: cloneValue(this.cft.opeChannelHistory || []),
            conformalBlockWeights: cloneValue(observables.conformalBlockWeights),
            dominantBlock: observables.dominantConformalBlock,
            intervalEntropyEstimate: observables.entanglementEntropyEstimate,
            stressProxy: cloneValue(observables.stressTensorProxy),
            centralChargeAnomalyEvents: cloneValue(observables.centralChargeAnomalyEvents),
            anomalyEventCount: observables.centralChargeAnomalyEvents.length,
            finalDominantOPEChannel: observables.dominantConformalBlock,
            finalCFTSector,
            topologicalSector: cloneValue(observables.topologySector),
            stableTopologicalOrTwistedSector: Boolean(
                observables.topologySector?.twisted
                || observables.topologySector?.x
                || observables.topologySector?.y
                || observables.topologySector?.z
                || observables.topologySector?.w
            )
        };
    }

    appendPhysicsHistory({
        player,
        action,
        placedStone = null,
        flippedPath = [],
        OPEUpdates = [],
        VirasoroActions = [],
        measurements = [],
        metadata = {}
    }) {
        const entry = {
            tick: this.moveNumber,
            player,
            action,
            placedStone: cloneValue(placedStone),
            flippedPath: cloneValue(flippedPath),
            OPEUpdates: cloneValue(OPEUpdates),
            VirasoroActions: cloneValue(VirasoroActions),
            measurements: cloneValue(measurements),
            metadata: cloneValue(metadata),
            observables: this.computeCFTObservables(true)
        };
        this.physicsHistory.push(entry);
        return entry;
    }

    computeCFTReversiAnswer() {
        const observables = this.computeCFTObservables();
        const entropy = this.cft.entropyHistory;
        const entropyGrowthTrend = entropy.length < 2
            ? 0
            : (entropy[entropy.length - 1] - entropy[0]) / Math.max(1, entropy.length - 1);
        const sector = observables.topologySector;
        const stableTwistedSector = Boolean(
            sector.twisted
            || sector.x
            || sector.y
            || sector.z
            || sector.w
        );
        return {
            estimatorNotice: observables.estimatorNotice,
            finalDominantOPEChannel: observables.dominantConformalBlock,
            finalCFTSector: observables.finalCFTSector,
            finalConformalBlockDistribution: cloneValue(observables.conformalBlockWeights),
            finalDomainWallLength: observables.domainWallLength,
            finalEntropyEstimate: observables.entanglementEntropyEstimate,
            entropyGrowth: entropy.length < 2 ? 0 : entropy[entropy.length - 1] - entropy[0],
            entropyGrowthTrend,
            strongestCorrelations: cloneValue(observables.strongestCorrelations),
            vacuumIdentityChannelDominates: observables.dominantConformalBlock === 'identity',
            stableTopologicalOrTwistedSector: stableTwistedSector,
            topologySector: cloneValue(sector),
            anomalyCount: observables.centralChargeAnomalyEvents.length,
            anomalyEvents: observables.centralChargeAnomalyEvents.length,
            summary: `Discrete CFT local-OPE interval estimate: ${observables.dominantConformalBlock} OPE/block dominates; final sector ${observables.finalCFTSector}; entropy ${observables.entanglementEntropyEstimate.toFixed(3)}; domain-wall length ${observables.domainWallLength}; ${observables.centralChargeAnomalyEvents.length} N=2 anomaly event${observables.centralChargeAnomalyEvents.length === 1 ? '' : 's'}.`
        };
    }

    counts() {
        const counts = { black: 0, white: 0, primaryTypes: { identity: 0, sigma: 0, epsilon: 0 } };
        for (const stone of this.board.values()) {
            counts[stone.color]++;
            counts.primaryTypes[stone.primaryType] = (counts.primaryTypes[stone.primaryType] || 0) + 1;
        }
        return counts;
    }

    pass(player = this.currentPlayer) {
        this.moveNumber++;
        const event = { mode: this.mode, type: 'pass', number: this.moveNumber, player };
        this.history.unshift(event);
        this.currentPlayer = otherPlayer(player);
        this.appendPhysicsHistory({ player, action: 'pass' });
        this.recordPosition('cft_pass');
        return { ok: true, event };
    }

    exportState() {
        const observables = this.computeCFTObservables();
        return {
            mode: this.mode,
            physicalSystemName: CFT_REVERSI_PHYSICAL_SYSTEM_NAME,
            blackWhiteMeaning: CFT_REVERSI_BLACK_WHITE_MEANING,
            initialStateOptions: [...CFT_REVERSI_INITIAL_STATES],
            allowedActions: [...CFT_REVERSI_ALLOWED_ACTIONS],
            localUpdateRules: CFT_REVERSI_LOCAL_UPDATE_RULES,
            topology: {
                name: this.topology.name,
                sizes: [...this.topology.sizes],
                dimensions: this.topology.dimensions
            },
            currentPlayer: this.currentPlayer,
            moveNumber: this.moveNumber,
            cftConfig: cloneValue(this.cftConfig),
            board: [...this.board.entries()].map(([key, stone]) => ({
                key,
                coord: key.split(',').map(Number),
                ...cloneValue(stone)
            })),
            counts: this.counts(),
            history: cloneValue(this.history),
            physicsHistory: cloneValue(this.physicsHistory),
            observables,
            cft: this.cft.exportState(),
            answer: this.computeCFTReversiAnswer(),
            physicalAnswer: this.computeCFTReversiAnswer(),
            probability: this.probability.exportState()
        };
    }
}

export function createPhysicalVirasoroReversi(options = {}) {
    return new PhysicalVirasoroReversiGame(options);
}

import {
    CFT_REVERSI_INITIAL_STATES,
    CFTReversiPhysics,
    ISING_CFT_PRIMARIES,
    normalizeCFTStone
} from '../cft/CFTReversiPhysics.js';
import { coordKey, sumHomology } from '../topology/GraphTopologies.js';
import { CliffordReversiGame } from './CliffordReversi.js';

export const PHYSICAL_VIRASORO_REVERSI_MODE = 'physical_virasoro_reversi';

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
            initialState: CFT_REVERSI_INITIAL_STATES.includes(options.cftReversiInitialState) && options.cftReversiInitialState !== 'vacuum'
                ? options.cftReversiInitialState
                : 'four_sigma_block',
            primaryType: options.primaryType || 'sigma',
            hiddenChannels: options.hiddenChannels !== false,
            centralCharge: Number.isFinite(Number(options.centralCharge)) ? Number(options.centralCharge) : 0.5,
            maxMode: Number(options.maxMode) >= 2 ? 2 : 1,
            temperature: Number.isFinite(Number(options.temperature)) ? Number(options.temperature) : 0.35,
            domainWallThickness: Math.max(1, Math.min(6, Math.floor(Number(options.domainWallThickness) || 1)))
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
        if (initialState === 'vacuum') {
            this.setupFourSigmaBlock();
            return;
        }
        if (initialState === 'domain_wall_seed') this.setupDomainWallSeed();
        if (initialState === 'four_sigma_block') this.setupFourSigmaBlock();
        if (initialState === 'boundary_condition_change') this.setupBoundaryConditionChange();
        if (initialState === 'thermal_cft_sample') this.setupThermalSample();
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
            if (stone.color === player && chain.length) return { bracketed: true, chain, edges };
            break;
        }
        return { bracketed: false, chain: [], edges };
    }

    previewMove(coord, player = this.currentPlayer, primaryType = this.cftConfig?.primaryType || 'sigma') {
        const normalized = this.topology.normalize(coord);
        if (!normalized) return { legal: false, reason: 'outside', flips: [] };
        if (!this.isEmpty(normalized)) return { legal: false, reason: 'occupied', flips: [] };
        const flips = [];
        const rays = [];
        for (const direction of this.topology.rayDirections()) {
            const ray = this.collectCFTRay(normalized, direction, player);
            if (!ray.bracketed) continue;
            rays.push({ direction, chain: ray.chain.map((item) => item.coord), edges: ray.edges });
            for (const item of ray.chain) {
                const ope = this.cft.resolveOPE(primaryType, item.stone.primaryType, {
                    tick: this.moveNumber + 1,
                    coord: item.coord,
                    record: false
                });
                let phaseAngle = item.stone.phaseAngle + Math.PI;
                for (const edge of item.edges) {
                    const transport = this.topology.seamTransform(edge);
                    if (transport !== 'identity') phaseAngle += Math.PI / 2;
                }
                flips.push({
                    coord: item.coord,
                    key: item.key,
                    before: item.stone,
                    after: normalizeCFTStone({
                        ...item.stone,
                        sign: -item.stone.sign,
                        primaryType: ope.resolved,
                        channelLabel: ope.channelLabel,
                        hiddenChannel: ope.hiddenChannel,
                        phaseAngle,
                        lastUpdate: { action: 'cft_flip', tick: this.moveNumber + 1 }
                    }),
                    ope,
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
            primaryType,
            rays,
            flips: [...unique.values()]
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
        if (!preview.legal) return { ok: false, error: 'Place a primary field where it brackets an opponent interval.', preview };
        const weights = ISING_CFT_PRIMARIES[primaryType] || { h: Number(options.h) || 0, hbar: Number(options.hbar) || 0 };
        this.setStone(preview.coord, {
            sign: player === 'black' ? 1 : -1,
            primaryType,
            h: weights.h,
            hbar: weights.hbar,
            phaseAngle: Number(options.phaseAngle) || 0,
            channelLabel: 'source',
            lastUpdate: { action: 'cft_place', tick: this.moveNumber + 1 }
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
            number: this.moveNumber,
            player,
            placedStone: { coord: [...preview.coord], ...this.getStone(preview.coord) },
            flippedPath: this.lastFlippedPath,
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
            action: 'place',
            placedStone: event.placedStone,
            flippedPath: event.flippedPath,
            OPEUpdates: event.OPEUpdates
        });
        this.recordPosition('cft_move');
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
            action: 'virasoro',
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
        this.appendPhysicsHistory({
            player,
            action: 'measurement',
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
        return this.cft.computeObservables(this.board, {
            interval: this.lastFlippedPath,
            recordHistory
        });
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
            finalConformalBlockDistribution: cloneValue(observables.conformalBlockWeights),
            finalDomainWallLength: observables.domainWallLength,
            finalEntropyEstimate: observables.entanglementEntropyEstimate,
            entropyGrowthTrend,
            strongestCorrelations: cloneValue(observables.strongestCorrelations),
            vacuumIdentityChannelDominates: observables.dominantConformalBlock === 'identity',
            stableTopologicalOrTwistedSector: stableTwistedSector,
            topologySector: cloneValue(sector),
            anomalyEvents: observables.centralChargeAnomalyEvents.length,
            summary: `Discrete CFT estimate: ${observables.dominantConformalBlock} block dominates; entropy ${observables.entanglementEntropyEstimate.toFixed(3)}; domain-wall length ${observables.domainWallLength}; ${observables.centralChargeAnomalyEvents.length} N=2 anomaly event${observables.centralChargeAnomalyEvents.length === 1 ? '' : 's'}.`
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
            probability: this.probability.exportState()
        };
    }
}

export function createPhysicalVirasoroReversi(options = {}) {
    return new PhysicalVirasoroReversiGame(options);
}

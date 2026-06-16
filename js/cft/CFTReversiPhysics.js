import { coordKey } from '../topology/GraphTopologies.js';

export const ISING_CFT_PRIMARIES = Object.freeze({
    identity: Object.freeze({ h: 0, hbar: 0 }),
    sigma: Object.freeze({ h: 1 / 16, hbar: 1 / 16 }),
    epsilon: Object.freeze({ h: 1 / 2, hbar: 1 / 2 })
});

export const CFT_REVERSI_INITIAL_STATES = Object.freeze([
    'vacuum',
    'domain_wall_seed',
    'four_sigma_block',
    'boundary_condition_change',
    'thermal_cft_sample'
]);

export const CFT_MEASUREMENTS = Object.freeze([
    'line_parity',
    'ope_channel',
    'four_point_block',
    'region_entropy',
    'stress'
]);

export const CFT_VIRASORO_ACTIONS = Object.freeze(['L-1', 'L0', 'L1', 'L-2', 'L2']);

function cloneValue(value) {
    if (Array.isArray(value)) return value.map(cloneValue);
    if (value && typeof value === 'object') {
        return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, cloneValue(entry)]));
    }
    return value;
}

function finite(value, fallback = 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
}

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

function normalizedSign(value) {
    return Number(value) < 0 ? -1 : 1;
}

function otherColor(color) {
    return color === 'black' ? 'white' : 'black';
}

function pairKey(first, second) {
    return [first, second].sort().join('|');
}

function edgeKey(first, second) {
    return [coordKey(first), coordKey(second)].sort().join('|');
}

function primaryWeights(primaryType, custom = {}) {
    return ISING_CFT_PRIMARIES[primaryType] || {
        h: Math.max(0, finite(custom.h)),
        hbar: Math.max(0, finite(custom.hbar))
    };
}

export function normalizeCFTStone(stone = {}) {
    const sign = normalizedSign(stone.sign ?? stone.pauliSign ?? (stone.owner === 'white' || stone.color === 'white' ? -1 : 1));
    const owner = sign > 0 ? 'black' : 'white';
    const primaryType = stone.primaryType || 'sigma';
    const weights = primaryWeights(primaryType, stone);
    return {
        owner,
        color: owner,
        sign,
        primaryType,
        h: finite(stone.h, weights.h),
        hbar: finite(stone.hbar, weights.hbar),
        phaseAngle: finite(stone.phaseAngle),
        channelLabel: stone.channelLabel || 'identity',
        hiddenChannel: stone.hiddenChannel || null,
        channelRevealed: stone.channelRevealed ?? !stone.hiddenChannel,
        lastUpdate: stone.lastUpdate ? cloneValue(stone.lastUpdate) : null,
        measurementHistory: Array.isArray(stone.measurementHistory) ? cloneValue(stone.measurementHistory) : []
    };
}

export function isingOPE(first, second) {
    const a = first || 'identity';
    const b = second || 'identity';
    if (a === 'identity') return [b];
    if (b === 'identity') return [a];
    if (a === 'sigma' && b === 'sigma') return ['identity', 'epsilon'];
    if ((a === 'sigma' && b === 'epsilon') || (a === 'epsilon' && b === 'sigma')) return ['sigma'];
    if (a === 'epsilon' && b === 'epsilon') return ['identity'];
    return [a === b ? 'identity' : b];
}

export function estimateCrossRatio(coords = []) {
    if (coords.length < 4) return null;
    const complex = coords.slice(0, 4).map((coord) => ({
        x: finite(coord[0]),
        y: finite(coord[1])
    }));
    const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
    const numerator = distance(complex[0], complex[1]) * distance(complex[2], complex[3]);
    const denominator = distance(complex[0], complex[2]) * distance(complex[1], complex[3]);
    if (denominator <= 1e-9) return 0;
    return clamp(numerator / denominator, 1e-6, 1 - 1e-6);
}

export function estimateIsingBlockWeights(crossRatio) {
    if (crossRatio == null) return { identity: 1, epsilon: 0 };
    const x = clamp(crossRatio, 1e-6, 1 - 1e-6);
    const root = Math.sqrt(1 - x);
    const identityRaw = Math.sqrt(Math.max(0, (1 + root) / 2));
    const epsilonRaw = Math.sqrt(Math.max(0, (1 - root) / 2));
    const total = identityRaw + epsilonRaw || 1;
    return {
        identity: identityRaw / total,
        epsilon: epsilonRaw / total
    };
}

export class CFTReversiPhysics {
    constructor({ topology, config = {} } = {}) {
        this.topology = topology;
        this.config = {
            centralCharge: Math.max(0, finite(config.centralCharge, 0.5)),
            maxMode: Number(config.maxMode) >= 2 ? 2 : 1,
            hiddenChannels: config.hiddenChannels !== false,
            cutoff: Math.max(1e-3, finite(config.cutoff, 1)),
            temperature: Math.max(0, finite(config.temperature, 0.35))
        };
        this.stress = new Map();
        this.stressOwner = new Map();
        this.opeChannelHistory = [];
        this.anomalyEvents = [];
        this.measurements = [];
        this.lastInterval = [];
        this.lastObservables = null;
        this.entropyHistory = [];
    }

    allowedActions() {
        return this.config.maxMode >= 2
            ? [...CFT_VIRASORO_ACTIONS]
            : ['L-1', 'L0', 'L1'];
    }

    stressAt(coordOrKey) {
        const key = Array.isArray(coordOrKey) ? coordKey(coordOrKey) : String(coordOrKey);
        return {
            stress: this.stress.get(key) || 0,
            owner: this.stressOwner.get(key) || ''
        };
    }

    setStress(coordOrKey, value, owner = '') {
        const key = Array.isArray(coordOrKey) ? coordKey(coordOrKey) : String(coordOrKey);
        const stress = Math.max(0, finite(value));
        if (stress <= 1e-9) {
            this.stress.delete(key);
            this.stressOwner.delete(key);
        } else {
            this.stress.set(key, stress);
            if (owner) this.stressOwner.set(key, owner);
        }
        return this.stressAt(key);
    }

    addStress(coordOrKey, amount, owner = '') {
        const current = this.stressAt(coordOrKey);
        return this.setStress(coordOrKey, current.stress + finite(amount), owner || current.owner);
    }

    resolveOPE(first, second, context = {}) {
        const outputs = isingOPE(first, second);
        const index = outputs.length === 1
            ? 0
            : Math.abs(Math.floor(finite(context.tick) + finite(context.coord?.[0]) + finite(context.coord?.[1]))) % outputs.length;
        const resolved = outputs[index];
        const hiddenChannel = this.config.hiddenChannels && outputs.length > 1 ? resolved : null;
        const result = {
            input: [first, second],
            outputs,
            resolved,
            channelLabel: hiddenChannel ? 'unmeasured' : resolved,
            hiddenChannel,
            tick: finite(context.tick),
            coord: context.coord ? [...context.coord] : null
        };
        if (context.record !== false) this.opeChannelHistory.push(cloneValue(result));
        return result;
    }

    graphDistance(start, target) {
        const startKey = coordKey(start);
        const targetKey = coordKey(target);
        if (startKey === targetKey) return 0;
        const queue = [[start, 0]];
        const seen = new Set([startKey]);
        while (queue.length) {
            const [coord, distance] = queue.shift();
            for (const neighbor of this.topology.neighbors(coord)) {
                const key = coordKey(neighbor);
                if (seen.has(key)) continue;
                if (key === targetKey) return distance + 1;
                seen.add(key);
                queue.push([neighbor, distance + 1]);
            }
        }
        return Infinity;
    }

    connectedDomains(board) {
        const domains = [];
        const visited = new Set();
        for (const [key, stone] of board.entries()) {
            if (visited.has(key)) continue;
            const queue = [key.split(',').map(Number)];
            const keys = [];
            visited.add(key);
            while (queue.length) {
                const coord = queue.shift();
                const currentKey = coordKey(coord);
                keys.push(currentKey);
                for (const neighbor of this.topology.neighbors(coord)) {
                    const neighborKey = coordKey(neighbor);
                    const neighborStone = board.get(neighborKey);
                    if (visited.has(neighborKey) || !neighborStone || neighborStone.color !== stone.color) continue;
                    visited.add(neighborKey);
                    queue.push(neighbor);
                }
            }
            domains.push({ color: stone.color, keys, size: keys.length });
        }
        return domains;
    }

    domainWallData(board) {
        let length = 0;
        const wallEdges = [];
        const topologySector = { x: 0, y: 0, z: 0, w: 0, twisted: false };
        const seen = new Set();
        for (const coord of this.topology.vertices()) {
            const stone = board.get(coordKey(coord));
            if (!stone) continue;
            for (const direction of this.topology.directions()) {
                const step = this.topology.step(coord, direction);
                if (!step) continue;
                const key = edgeKey(coord, step.coord);
                if (seen.has(key)) continue;
                seen.add(key);
                const neighbor = board.get(coordKey(step.coord));
                if (!neighbor || neighbor.sign === stone.sign) continue;
                length++;
                wallEdges.push({ from: [...coord], to: [...step.coord], edge: cloneValue(step.edge) });
                const winding = this.topology.homologyCycleCrossing(step.edge) || {};
                for (const axis of ['x', 'y', 'z', 'w']) topologySector[axis] += finite(winding[axis]);
                if (this.topology.seamTransform(step.edge) !== 'identity') topologySector.twisted = true;
            }
        }
        for (const axis of ['x', 'y', 'z', 'w']) {
            topologySector[axis] = ((topologySector[axis] % 2) + 2) % 2;
        }
        return { length, wallEdges, topologySector };
    }

    correlationEstimates(board) {
        const insertions = [...board.entries()]
            .filter(([, stone]) => stone.primaryType !== 'identity')
            .map(([key, stone]) => ({ key, coord: key.split(',').map(Number), stone }));
        const correlations = [];
        for (let first = 0; first < insertions.length; first++) {
            for (let second = first + 1; second < insertions.length; second++) {
                const a = insertions[first];
                const b = insertions[second];
                const distance = this.graphDistance(a.coord, b.coord);
                if (!Number.isFinite(distance)) continue;
                const scalingDimension = a.stone.h + a.stone.hbar + b.stone.h + b.stone.hbar;
                const estimate = a.stone.sign * b.stone.sign
                    / Math.pow(Math.max(1, distance), Math.max(0.125, scalingDimension));
                correlations.push({
                    pair: [a.key, b.key],
                    primaryTypes: [a.stone.primaryType, b.stone.primaryType],
                    distance,
                    estimate
                });
            }
        }
        return correlations.sort((a, b) => Math.abs(b.estimate) - Math.abs(a.estimate));
    }

    mutualInformationEstimate(domains, wallLength) {
        if (domains.length < 2) return 0;
        const sorted = [...domains].sort((a, b) => b.size - a.size);
        const denominator = Math.max(1, sorted[0].size + sorted[1].size);
        return Math.max(0, (2 * wallLength) / denominator);
    }

    entropyEstimate(intervalLength, blockWeights) {
        const length = Math.max(1, finite(intervalLength, 1));
        const base = (this.config.centralCharge / 3) * Math.log(length / this.config.cutoff + 1);
        const channelCorrection = 0.5 * finite(blockWeights?.epsilon);
        return Math.max(0, base + channelCorrection);
    }

    computeObservables(board, context = {}) {
        const primaryCounts = { identity: this.topology.vertices().length - board.size, sigma: 0, epsilon: 0, custom: 0 };
        const signDistribution = { positive: 0, negative: 0 };
        const sigmaCoords = [];
        for (const [key, stone] of board.entries()) {
            if (Object.hasOwn(primaryCounts, stone.primaryType)) primaryCounts[stone.primaryType]++;
            else primaryCounts.custom++;
            signDistribution[stone.sign > 0 ? 'positive' : 'negative']++;
            if (stone.primaryType === 'sigma') sigmaCoords.push(key.split(',').map(Number));
        }
        const domains = this.connectedDomains(board);
        const wall = this.domainWallData(board);
        const correlations = this.correlationEstimates(board);
        const fourPointCrossRatio = sigmaCoords.length >= 4 ? estimateCrossRatio(sigmaCoords) : null;
        const conformalBlockWeights = estimateIsingBlockWeights(fourPointCrossRatio);
        const dominantConformalBlock = conformalBlockWeights.identity >= conformalBlockWeights.epsilon
            ? 'identity'
            : 'epsilon';
        const interval = context.interval || this.lastInterval || [];
        const entropyEstimate = this.entropyEstimate(interval.length || 1, conformalBlockWeights);
        const stressTensorProxy = [...this.stress.entries()].map(([key, stress]) => ({
            key,
            coord: key.split(',').map(Number),
            stress,
            owner: this.stressOwner.get(key) || ''
        }));
        const observables = {
            estimatorNotice: 'Discrete graph estimators; not exact continuum CFT observables.',
            primaryCounts,
            signDistribution,
            domainWallLength: wall.length,
            connectedPositiveDomains: domains.filter((domain) => domain.color === 'black').length,
            connectedNegativeDomains: domains.filter((domain) => domain.color === 'white').length,
            domainSizes: domains.map((domain) => ({ color: domain.color, size: domain.size })),
            twoPointCorrelations: correlations,
            strongestCorrelations: correlations.slice(0, 8),
            fourPointCrossRatio,
            conformalBlockWeights,
            dominantConformalBlock,
            stressTensorProxy,
            entanglementEntropyEstimate: entropyEstimate,
            mutualInformationEstimate: this.mutualInformationEstimate(domains, wall.length),
            OPEChannelTransitionHistory: cloneValue(this.opeChannelHistory),
            centralChargeAnomalyEvents: cloneValue(this.anomalyEvents),
            topologySector: wall.topologySector
        };
        this.lastObservables = observables;
        if (context.recordHistory) this.entropyHistory.push(entropyEstimate);
        return observables;
    }

    previewAction({ action, coord, direction, board, player } = {}) {
        if (!this.allowedActions().includes(action)) {
            return { ok: false, error: `${action} requires Virasoro max mode N=${action.includes('2') ? 2 : 1}.` };
        }
        const normalized = this.topology.normalize(coord);
        if (!normalized) return { ok: false, error: 'Choose a valid graph vertex.' };
        const selected = board.get(coordKey(normalized));
        const affected = new Map();
        const add = (target, delta) => {
            if (!target) return;
            const key = coordKey(target);
            affected.set(key, {
                key,
                coord: [...target],
                before: this.stressAt(key).stress,
                after: Math.max(0, this.stressAt(key).stress + delta),
                owner: player
            });
        };
        if (action === 'L0') {
            if (!selected || selected.color !== player) return { ok: false, error: 'L0 selects a friendly CFT domain.' };
            const domain = this.connectedDomains(board).find((entry) => entry.keys.includes(coordKey(normalized)));
            for (const key of domain?.keys || []) {
                const stone = board.get(key);
                add(key.split(',').map(Number), Math.max(0.125, stone.h + stone.hbar));
            }
        } else if (action === 'L1') {
            for (const neighbor of this.topology.neighbors(normalized)) add(neighbor, -Math.min(1, this.stressAt(neighbor).stress));
            add(normalized, this.topology.neighbors(normalized).reduce(
                (total, neighbor) => total + Math.min(1, this.stressAt(neighbor).stress),
                0
            ));
        } else if (action === 'L2') {
            for (const ray of this.topology.rayDirections()) {
                let cursor = normalized;
                for (let stepIndex = 0; stepIndex < 2; stepIndex++) {
                    const step = this.topology.step(cursor, ray);
                    if (!step) break;
                    cursor = step.coord;
                }
                add(cursor, -Math.min(1, this.stressAt(cursor).stress));
            }
            add(normalized, [...affected.values()].reduce((total, item) => total + Math.max(0, item.before - item.after), 0));
        } else {
            if (!selected || selected.color !== player) return { ok: false, error: `${action} selects a friendly source/domain.` };
            if (!Array.isArray(direction)) return { ok: false, error: `${action} requires a graph direction.` };
            const opposite = direction.map((value) => -value);
            const distance = action === 'L-2' ? 2 : 1;
            const stepAlong = (ray) => {
                let cursor = normalized;
                const path = [normalized];
                for (let index = 0; index < distance; index++) {
                    const step = this.topology.step(cursor, ray);
                    if (!step) return null;
                    cursor = step.coord;
                    path.push(cursor);
                }
                return { coord: cursor, path };
            };
            const forward = stepAlong(direction);
            add(normalized, Math.max(0.25, selected.h + selected.hbar));
            if (forward) add(forward.coord, action === 'L-2' ? 0.5 : 1);
            if (action === 'L-2') {
                const backward = stepAlong(opposite);
                if (backward) add(backward.coord, 0.5);
            }
        }
        return { ok: true, action, coord: normalized, direction: direction ? [...direction] : null, affected: [...affected.values()] };
    }

    applyAction(input = {}) {
        const preview = this.previewAction(input);
        if (!preview.ok) return preview;
        for (const item of preview.affected) this.setStress(item.key, item.after, item.owner);
        let anomaly = null;
        if (this.config.maxMode >= 2 && ['L-2', 'L2'].includes(preview.action)) {
            const overlap = preview.affected.filter((item) => item.before > 0 && item.after > 0);
            if (overlap.length) {
                anomaly = {
                    tick: finite(input.tick),
                    action: preview.action,
                    centralCharge: this.config.centralCharge,
                    vertices: overlap.map((item) => item.coord),
                    magnitude: this.config.centralCharge * overlap.length / 12
                };
                this.anomalyEvents.push(anomaly);
            }
        }
        return { ok: true, event: { ...preview, anomaly } };
    }

    measure({ type, coords = [], board, player = 'system', tick = 0, errorRate = 0, sample = 1 } = {}) {
        const normalized = coords.map((coord) => this.topology.normalize(coord)).filter(Boolean);
        if (!normalized.length) return { ok: false, error: 'Choose at least one CFT site.' };
        let trueResult;
        if (type === 'line_parity') {
            trueResult = normalized.reduce((product, coord) => product * (board.get(coordKey(coord))?.sign || 1), 1);
        } else if (type === 'ope_channel') {
            const stone = board.get(coordKey(normalized[0]));
            trueResult = stone?.hiddenChannel || stone?.channelLabel || 'identity';
            if (stone?.hiddenChannel) {
                stone.channelLabel = stone.hiddenChannel;
                stone.hiddenChannel = null;
                stone.channelRevealed = true;
            }
        } else if (type === 'four_point_block') {
            const sigmaCoords = normalized.filter((coord) => board.get(coordKey(coord))?.primaryType === 'sigma').slice(0, 4);
            const blocks = estimateIsingBlockWeights(estimateCrossRatio(sigmaCoords));
            trueResult = blocks.identity >= blocks.epsilon ? 'identity' : 'epsilon';
        } else if (type === 'region_entropy') {
            trueResult = this.entropyEstimate(normalized.length, this.lastObservables?.conformalBlockWeights);
        } else {
            trueResult = normalized.reduce((total, coord) => total + this.stressAt(coord).stress, 0);
        }
        const error = sample < clamp(errorRate, 0, 1);
        const reported = error
            ? typeof trueResult === 'number' ? -trueResult : `ambiguous:${trueResult}`
            : trueResult;
        const measurement = {
            tick,
            player,
            type,
            vertices: normalized.map((coord) => [...coord]),
            probability: clamp(errorRate, 0, 1),
            trueResult,
            reported,
            error
        };
        for (const coord of normalized) {
            const stone = board.get(coordKey(coord));
            if (stone) stone.measurementHistory = [...(stone.measurementHistory || []), cloneValue(measurement)];
        }
        this.measurements.push(cloneValue(measurement));
        return { ok: true, measurement };
    }

    exportState() {
        return {
            config: { ...this.config },
            stress: [...this.stress.entries()].map(([key, stress]) => ({
                key,
                coord: key.split(',').map(Number),
                stress,
                owner: this.stressOwner.get(key) || ''
            })),
            opeChannelHistory: cloneValue(this.opeChannelHistory),
            anomalyEvents: cloneValue(this.anomalyEvents),
            measurements: cloneValue(this.measurements),
            entropyHistory: [...this.entropyHistory],
            lastObservables: cloneValue(this.lastObservables)
        };
    }
}

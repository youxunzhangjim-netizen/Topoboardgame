import {
    coordKey,
    coordsEqual,
    createGraphTopology
} from '../../topology/GraphTopologies.js';
import {
    addOperatorEdge,
    addOperatorNode,
    createOperatorGraphSpec,
    exportOperatorGraph
} from '../OperatorGraphSpec.js';
import {
    braidGeneratorSymbol,
    deterministicParityFromIds,
    flavorLabel,
    gammaDisplay,
    MAJORANA_MODE,
    majoranaBraidTransform,
    majoranaUnitarySymbol,
    normalizeFlavor,
    normalizeParity,
    parityToFusionChannel
} from './MajoranaRules.js';

function cloneCoord(coord) {
    return Array.isArray(coord) ? [...coord] : null;
}

function cloneValue(value) {
    if (Array.isArray(value)) return value.map(cloneValue);
    if (value && typeof value === 'object') {
        return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, cloneValue(entry)]));
    }
    return value;
}

function siteId(coord) {
    return `site:${coordKey(coord)}`;
}

function graphNodeId(modeId) {
    return `majorana:${modeId}`;
}

function distanceToCenter(coord, sizes) {
    return coord.reduce((total, value, axis) => {
        const center = Math.max(0, (Number(sizes[axis]) || 1) - 1) / 2;
        return total + (value - center) ** 2;
    }, 0);
}

export class MajoranaLab {
    constructor(options = {}) {
        this.reset(options);
    }

    reset(options = {}) {
        this.mode = MAJORANA_MODE;
        this.topology = createGraphTopology(options.topology || options);
        this.currentPlayer = 'research';
        this.config = {
            defaultFlavor: normalizeFlavor(options.majorana?.flavor ?? 0),
            defaultParity: normalizeParity(options.majorana?.parity ?? 'even'),
            stochasticParity: Boolean(options.majorana?.stochasticParity),
            setupDefaultPair: options.majorana?.setupDefaultPair !== false
        };
        this.modes = new Map();
        this.tokens = this.modes;
        this.history = [];
        this.braidEventLog = [];
        this.braidWord = [];
        this.fusionResults = [];
        this.measurements = [];
        this.moveNumber = 0;
        this.nextModeNumber = 1;
        this.operatorGraph = createOperatorGraphSpec({
            id: `${this.mode}:${this.topology.name}:${this.topology.sizes.join('x')}:operator-graph`,
            nameEn: 'Majorana mode operator graph',
            nameZh: 'Majorana 模式算子圖',
            baseBoardId: this.topology.name,
            baseBoardSpecRef: {
                topology: this.topology.name,
                sizes: [...this.topology.sizes],
                dimensions: this.topology.dimensions,
                lattice: this.topology.lattice || 'graph'
            },
            metadata: {
                labMode: this.mode,
                validationLevel: 'toy',
                interpretation: 'Discrete symbolic Majorana zero-mode manipulation; not a physical experiment simulator.'
            }
        });
        if (this.config.setupDefaultPair) this.setupInitialPair();
    }

    setupInitialPair() {
        const [siteA, siteB] = this.findEmptyAdjacentPair();
        if (siteA && siteB) {
            this.create_pair(this.config.defaultFlavor, siteA, siteB, this.config.defaultParity, {
                silent: true,
                consumeTurn: false
            });
        }
    }

    findEmptyAdjacentPair(origin = null) {
        const vertices = this.topology.vertices()
            .map((coord) => cloneCoord(coord))
            .sort((a, b) => {
                const sizes = this.topology.sizes || [];
                const da = origin ? this.graphDistanceEstimate(origin, a) : distanceToCenter(a, sizes);
                const db = origin ? this.graphDistanceEstimate(origin, b) : distanceToCenter(b, sizes);
                return da - db;
            });
        for (const coord of vertices) {
            if (this.modeAt(coord)) continue;
            const neighbor = this.topology.neighbors(coord)
                .find((candidate) => !this.modeAt(candidate));
            if (neighbor) return [coord, neighbor];
        }
        return [null, null];
    }

    graphDistanceEstimate(a, b) {
        if (!a || !b) return Number.POSITIVE_INFINITY;
        return a.reduce((total, value, axis) => total + Math.abs(value - (b[axis] || 0)), 0);
    }

    normalizeSite(site) {
        if (Array.isArray(site)) return this.topology.normalize(site);
        if (typeof site === 'string') {
            const raw = site.replace(/^site:/, '').split(',').map(Number);
            return this.topology.normalize(raw);
        }
        if (site && typeof site === 'object') {
            if (Array.isArray(site.coord)) return this.topology.normalize(site.coord);
            if (Array.isArray(site.position)) return this.topology.normalize(site.position);
        }
        return null;
    }

    modeAt(coord) {
        const normalized = this.normalizeSite(coord);
        if (!normalized) return null;
        return [...this.modes.values()].find((mode) => mode.active && coordsEqual(mode.position, normalized)) || null;
    }

    tokenAt(coord) {
        return this.modeAt(coord);
    }

    getMode(modeId) {
        return this.modes.get(String(modeId)) || null;
    }

    createMode({ flavor, position, parityPartnerId = null, tags = [] }) {
        const coord = this.normalizeSite(position);
        if (!coord) return null;
        let id = `m${this.nextModeNumber}`;
        while (this.modes.has(id)) {
            this.nextModeNumber += 1;
            id = `m${this.nextModeNumber}`;
        }
        this.nextModeNumber += 1;
        const normalizedFlavor = normalizeFlavor(flavor);
        const mode = {
            id,
            gammaLabel: `gamma_${id.slice(1)}`,
            flavor: normalizedFlavor,
            position: coord,
            coord,
            vertex: coord,
            attachedBoardSiteId: siteId(coord),
            parityPartnerId,
            active: true,
            tags: ['MajoranaMode', ...new Set(tags.map(String))],
            owner: normalizedFlavor % 2 ? 'white' : 'black',
            anyonType: 'sigma',
            braidWord: [],
            braidParity: 0,
            isBraided: false,
            fusionChannel: null,
            hiddenFusionState: null,
            age: 0
        };
        this.modes.set(id, mode);
        this.syncOperatorNode(mode);
        return mode;
    }

    syncOperatorNode(mode) {
        addOperatorNode(this.operatorGraph, {
            id: graphNodeId(mode.id),
            kind: 'operator',
            label: gammaDisplay(mode.gammaLabel),
            flavor: mode.flavor,
            charge: '\u03c3',
            state: {
                active: mode.active,
                gammaLabel: mode.gammaLabel,
                parityPartnerId: mode.parityPartnerId,
                fusionChannel: mode.fusionChannel || null
            },
            position: cloneCoord(mode.position),
            attachedBoardSiteId: mode.attachedBoardSiteId,
            tags: mode.tags
        });
    }

    recordEvent(event, { consumeTurn = true } = {}) {
        if (consumeTurn) this.moveNumber += 1;
        const normalized = {
            number: this.moveNumber,
            player: this.currentPlayer,
            ...event,
            step: this.moveNumber,
            createdAt: Date.now()
        };
        this.history.unshift(normalized);
        this.operatorGraph.history.push(cloneValue(normalized));
        return normalized;
    }

    resolveParity(modeA, modeB, requestedParity = 'even') {
        const parity = normalizeParity(requestedParity);
        if (parity === 'random') {
            if (this.config.stochasticParity) return Math.random() < 0.5 ? 'even' : 'odd';
            return deterministicParityFromIds(modeA?.id, modeB?.id, this.moveNumber % 2 ? 'odd' : 'even');
        }
        return parity;
    }

    create_pair(flavor = 0, siteA, siteB, initialParity = 'even', options = {}) {
        const coordA = this.normalizeSite(siteA);
        const coordB = this.normalizeSite(siteB);
        if (!coordA || !coordB) return { ok: false, error: 'Choose two valid board sites.' };
        if (coordsEqual(coordA, coordB)) return { ok: false, error: 'A Majorana pair needs two distinct sites.' };
        if (this.modeAt(coordA) || this.modeAt(coordB)) return { ok: false, error: 'Create Pair requires two empty sites.' };
        const normalizedFlavor = normalizeFlavor(flavor);
        const modeA = this.createMode({ flavor: normalizedFlavor, position: coordA, tags: ['sigma', 'pair'] });
        const modeB = this.createMode({ flavor: normalizedFlavor, position: coordB, tags: ['sigma', 'pair'] });
        modeA.parityPartnerId = modeB.id;
        modeB.parityPartnerId = modeA.id;
        const parity = this.resolveParity(modeA, modeB, initialParity);
        const channel = parityToFusionChannel(parity);
        modeA.fusionChannel = channel;
        modeB.fusionChannel = channel;
        modeA.hiddenFusionState = { parity, currentChannel: channel };
        modeB.hiddenFusionState = { parity, currentChannel: channel };
        this.syncOperatorNode(modeA);
        this.syncOperatorNode(modeB);
        addOperatorEdge(this.operatorGraph, {
            id: `pair:${modeA.id}:${modeB.id}`,
            source: graphNodeId(modeA.id),
            target: graphNodeId(modeB.id),
            kind: 'fusion-channel',
            state: { parity, channel, flavor: normalizedFlavor },
            tags: ['majorana-pair']
        });
        const event = this.recordEvent({
            type: 'majorana',
            kind: 'create_pair',
            action: 'create_pair',
            modeIds: [modeA.id, modeB.id],
            flavor: normalizedFlavor,
            parity,
            fusionChannel: channel,
            coordA,
            coordB,
            messageEn: `Created ${flavorLabel(normalizedFlavor)} Majorana pair with ${parity} parity.`,
            messageZh: `已建立 ${flavorLabel(normalizedFlavor)} Majorana 成對模式，奇偶為 ${parity}。`
        }, { consumeTurn: options.consumeTurn !== false });
        if (options.silent) {
            this.history.shift();
            this.operatorGraph.history.pop();
        }
        return { ok: true, event, modes: [modeA, modeB] };
    }

    areAdjacentModes(modeA, modeB) {
        if (!modeA?.active || !modeB?.active) return false;
        return this.topology.neighbors(modeA.position)
            .some((neighbor) => coordsEqual(neighbor, modeB.position));
    }

    canExchangePair(modeAId, modeBId) {
        const modeA = this.getMode(modeAId);
        const modeB = this.getMode(modeBId);
        if (!modeA || !modeB) return { ok: false, error: 'Select two known Majorana modes.' };
        if (!modeA.active || !modeB.active) return { ok: false, error: 'Merged or inactive modes cannot braid.' };
        if (modeA.id === modeB.id) return { ok: false, error: 'Choose two different modes.' };
        if (!this.areAdjacentModes(modeA, modeB)) return { ok: false, error: 'Majorana braiding requires two adjacent modes.' };
        return { ok: true };
    }

    exchangePair(modeAId, modeBId, clockwise = true) {
        const allowed = this.canExchangePair(modeAId, modeBId);
        if (!allowed.ok) return allowed;
        const modeA = this.getMode(modeAId);
        const modeB = this.getMode(modeBId);
        const beforeA = cloneCoord(modeA.position);
        const beforeB = cloneCoord(modeB.position);
        const generatorSymbol = braidGeneratorSymbol(modeA, modeB, clockwise);
        const unitarySymbol = majoranaUnitarySymbol(modeA, modeB, clockwise);
        const transform = majoranaBraidTransform(modeA.gammaLabel, modeB.gammaLabel, clockwise);
        modeA.position = beforeB;
        modeA.coord = cloneCoord(beforeB);
        modeA.vertex = cloneCoord(beforeB);
        modeA.attachedBoardSiteId = siteId(beforeB);
        modeB.position = beforeA;
        modeB.coord = cloneCoord(beforeA);
        modeB.vertex = cloneCoord(beforeA);
        modeB.attachedBoardSiteId = siteId(beforeA);
        modeA.gammaLabel = transform.nextA;
        modeB.gammaLabel = transform.nextB;
        modeA.braidParity = (Number(modeA.braidParity || 0) + 1) % 2;
        modeB.braidParity = (Number(modeB.braidParity || 0) + 1) % 2;
        modeA.isBraided = true;
        modeB.isBraided = true;
        const generator = {
            modeA: modeA.id,
            modeB: modeB.id,
            sign: clockwise ? 1 : -1,
            symbol: generatorSymbol,
            unitarySymbol
        };
        modeA.braidWord.push(generator);
        modeB.braidWord.push(generator);
        this.braidWord.push(generator);
        this.syncOperatorNode(modeA);
        this.syncOperatorNode(modeB);
        addOperatorEdge(this.operatorGraph, {
            id: `worldline:${modeA.id}:${modeB.id}:${this.moveNumber + 1}:${clockwise ? 'cw' : 'ccw'}`,
            source: graphNodeId(modeA.id),
            target: graphNodeId(modeB.id),
            kind: 'worldline',
            orientation: clockwise ? 'clockwise' : 'counterclockwise',
            state: {
                beforeA,
                beforeB,
                afterA: cloneCoord(modeA.position),
                afterB: cloneCoord(modeB.position),
                generator
            },
            tags: ['majorana-braid']
        });
        const event = this.recordEvent({
            type: 'majorana',
            kind: clockwise ? 'braid_clockwise' : 'braid_counterclockwise',
            action: clockwise ? 'braid_clockwise' : 'braid_counterclockwise',
            modeA: modeA.id,
            modeB: modeB.id,
            beforeA,
            beforeB,
            afterA: cloneCoord(modeA.position),
            afterB: cloneCoord(modeB.position),
            generator,
            messageEn: clockwise
                ? 'Exchanged two modes clockwise.'
                : 'Exchanged two modes counterclockwise.',
            messageZh: clockwise
                ? '已順時針交換兩個模式。'
                : '已逆時針交換兩個模式。'
        });
        this.braidEventLog.push({
            tick: event.number,
            player: this.currentPlayer,
            type: event.kind,
            movingTokenId: modeA.id,
            targetId: modeB.id,
            generator,
            braidWordBefore: this.braidWord.slice(0, -1),
            braidWordAfter: [...this.braidWord],
            skipped: 'recorded'
        });
        return { ok: true, event, modes: [modeA, modeB] };
    }

    braid_clockwise(modeAId, modeBId) {
        return this.exchangePair(modeAId, modeBId, true);
    }

    braid_counterclockwise(modeAId, modeBId) {
        return this.exchangePair(modeAId, modeBId, false);
    }

    exchange_pair_clockwise(modeAId, modeBId) {
        return this.braid_clockwise(modeAId, modeBId);
    }

    exchange_pair_counterclockwise(modeAId, modeBId) {
        return this.braid_counterclockwise(modeAId, modeBId);
    }

    merge(modeAId, modeBId, requestedParity = 'even') {
        const modeA = this.getMode(modeAId);
        const modeB = this.getMode(modeBId);
        if (!modeA || !modeB) return { ok: false, error: 'Select two known Majorana modes.' };
        if (!modeA.active || !modeB.active) return { ok: false, error: 'Only active Majorana modes can merge.' };
        const parity = modeA.hiddenFusionState?.parity
            || modeB.hiddenFusionState?.parity
            || this.resolveParity(modeA, modeB, requestedParity);
        const channel = parityToFusionChannel(parity);
        modeA.active = false;
        modeB.active = false;
        modeA.tags = [...new Set([...modeA.tags, 'merged'])];
        modeB.tags = [...new Set([...modeB.tags, 'merged'])];
        modeA.fusionChannel = channel;
        modeB.fusionChannel = channel;
        this.syncOperatorNode(modeA);
        this.syncOperatorNode(modeB);
        const result = { parity, channel, modeIds: [modeA.id, modeB.id], tick: this.moveNumber + 1 };
        this.fusionResults.push(result);
        const measurementId = `measurement:merge:${modeA.id}:${modeB.id}:${this.moveNumber + 1}`;
        addOperatorNode(this.operatorGraph, {
            id: measurementId,
            kind: 'measurement',
            label: `p=${parity}`,
            state: { observable: 'i gamma_i gamma_j', parity, channel },
            position: cloneCoord(modeA.position),
            tags: ['majorana-merge', 'fusion-channel']
        });
        addOperatorEdge(this.operatorGraph, {
            id: `fusion:${modeA.id}:${modeB.id}:${this.moveNumber + 1}`,
            source: graphNodeId(modeA.id),
            target: measurementId,
            kind: 'measurement-link',
            state: result,
            tags: ['majorana-fusion']
        });
        addOperatorEdge(this.operatorGraph, {
            id: `fusion:${modeB.id}:${modeA.id}:${this.moveNumber + 1}`,
            source: graphNodeId(modeB.id),
            target: measurementId,
            kind: 'measurement-link',
            state: result,
            tags: ['majorana-fusion']
        });
        const event = this.recordEvent({
            type: 'majorana',
            kind: 'merge',
            action: 'merge',
            modeA: modeA.id,
            modeB: modeB.id,
            parity,
            fusionChannel: channel,
            observable: `p = i ${gammaDisplay(modeA.gammaLabel)} ${gammaDisplay(modeB.gammaLabel)}`,
            messageEn: `Merged modes; fusion channel ${channel}.`,
            messageZh: `已合併模式；融合通道為 ${channel}。`
        });
        return { ok: true, event, result };
    }

    split(parentPairOrSite, flavor = 0, parity = 'even') {
        let origin = null;
        const sourceMode = this.getMode(parentPairOrSite);
        if (sourceMode) origin = sourceMode.position;
        else origin = this.normalizeSite(parentPairOrSite);
        if (!origin) return { ok: false, error: 'Choose a valid split source site or mode.' };
        const [siteA, siteB] = this.modeAt(origin)
            ? this.findEmptyAdjacentPair(origin)
            : [origin, this.topology.neighbors(origin).find((coord) => !this.modeAt(coord))];
        if (!siteA || !siteB) return { ok: false, error: 'No adjacent empty sites are available for splitting.' };
        const result = this.create_pair(flavor, siteA, siteB, parity, { consumeTurn: false, silent: true });
        if (!result.ok) return result;
        const event = this.recordEvent({
            type: 'majorana',
            kind: 'split',
            action: 'split',
            source: sourceMode?.id || siteId(origin),
            modeIds: result.modes.map((mode) => mode.id),
            flavor: normalizeFlavor(flavor),
            parity: result.event.parity,
            fusionChannel: result.event.fusionChannel,
            coordA: cloneCoord(siteA),
            coordB: cloneCoord(siteB),
            messageEn: 'Split source into a new Majorana pair.',
            messageZh: '已從來源分裂出新的 Majorana 成對模式。'
        });
        return { ok: true, event, modes: result.modes };
    }

    measure_parity(modeAId, modeBId) {
        const modeA = this.getMode(modeAId);
        const modeB = this.getMode(modeBId);
        if (!modeA || !modeB) return { ok: false, error: 'Select two known Majorana modes.' };
        const parity = modeA.hiddenFusionState?.parity
            || modeB.hiddenFusionState?.parity
            || deterministicParityFromIds(modeA.id, modeB.id);
        const channel = parityToFusionChannel(parity);
        const measurement = {
            modeA: modeA.id,
            modeB: modeB.id,
            parity,
            channel,
            observable: `p = i ${gammaDisplay(modeA.gammaLabel)} ${gammaDisplay(modeB.gammaLabel)}`,
            tick: this.moveNumber + 1
        };
        this.measurements.push(measurement);
        const event = this.recordEvent({
            type: 'majorana',
            kind: 'measure_parity',
            action: 'measure_parity',
            ...measurement,
            fusionChannel: channel,
            messageEn: `Measured parity ${parity}; channel ${channel}.`,
            messageZh: `測得奇偶 ${parity}；通道 ${channel}。`
        });
        return { ok: true, event, measurement };
    }

    reset_lab() {
        this.reset({
            topology: {
                topology: this.topology.name,
                lattice: this.topology.lattice,
                width: this.topology.sizes[0],
                height: this.topology.sizes[1],
                depth: this.topology.sizes[2],
                nw: this.topology.sizes[3]
            },
            majorana: {
                flavor: this.config.defaultFlavor,
                parity: this.config.defaultParity,
                stochasticParity: this.config.stochasticParity,
                setupDefaultPair: this.config.setupDefaultPair
            }
        });
        return { ok: true };
    }

    legalMoves() {
        return this.topology.vertices().filter((coord) => !this.modeAt(coord));
    }

    legalActionsForToken(modeId) {
        const mode = this.getMode(modeId);
        if (!mode?.active) return [];
        return this.topology.neighbors(mode.position)
            .map((coord) => this.modeAt(coord))
            .filter(Boolean)
            .map((target) => ({
                action: 'braid_clockwise',
                from: cloneCoord(mode.position),
                to: cloneCoord(target.position),
                targetId: target.id,
                path: [cloneCoord(mode.position), cloneCoord(target.position)]
            }));
    }

    isFusionSite() {
        return false;
    }

    counts() {
        const modes = [...this.modes.values()];
        return {
            black: modes.filter((mode) => mode.active && mode.owner === 'black').length,
            white: modes.filter((mode) => mode.active && mode.owner === 'white').length,
            active: modes.filter((mode) => mode.active).length,
            total: modes.length
        };
    }

    activePairs() {
        const modes = [...this.modes.values()].filter((mode) => mode.active);
        const seen = new Set();
        const pairs = [];
        for (const mode of modes) {
            if (!mode.parityPartnerId || seen.has(mode.id)) continue;
            const partner = this.getMode(mode.parityPartnerId);
            if (!partner?.active) continue;
            seen.add(mode.id);
            seen.add(partner.id);
            pairs.push([mode, partner]);
        }
        return pairs;
    }

    totalParity() {
        const pairs = this.activePairs();
        if (!pairs.length) return 'undefined';
        const odd = pairs.filter(([mode]) => mode.hiddenFusionState?.parity === 'odd').length;
        return odd % 2 ? 'odd' : 'even';
    }

    fusionChannelCounts() {
        return this.fusionResults.reduce((counts, result) => {
            counts[result.channel] = (counts[result.channel] || 0) + 1;
            return counts;
        }, { '1': 0, '\u03c8': 0 });
    }

    computePhysicalObservables() {
        const modes = [...this.modes.values()];
        const active = modes.filter((mode) => mode.active);
        const fusionChannelCounts = this.fusionChannelCounts();
        return {
            modeCount: modes.length,
            activeModeCount: active.length,
            activePairCount: this.activePairs().length,
            braidWordLength: this.braidWord.length,
            totalParity: this.totalParity(),
            fusionChannelCounts,
            vacuumFusionChannels: fusionChannelCounts['1'] || 0,
            psiFusionChannels: fusionChannelCounts['\u03c8'] || 0,
            recentBraidUnitarySymbols: this.braidWord.slice(-5).map((entry) => entry.unitarySymbol),
            measurementCount: this.measurements.length,
            eventCount: this.history.length
        };
    }

    computePhysicalAnswer() {
        const observables = this.computePhysicalObservables();
        return {
            finalState: observables.activeModeCount ? 'active_majorana_modes' : 'all_modes_merged',
            totalParity: observables.totalParity,
            braidWordLength: observables.braidWordLength
        };
    }

    exportState() {
        return {
            mode: this.mode,
            validationLevel: 'toy',
            note: 'Discrete symbolic Majorana manipulation toy model; not physical experimental accuracy.',
            topology: {
                name: this.topology.name,
                sizes: [...this.topology.sizes],
                dimensions: this.topology.dimensions,
                lattice: this.topology.lattice || 'graph'
            },
            modes: [...this.modes.values()].map((mode) => ({
                id: mode.id,
                gammaLabel: mode.gammaLabel,
                flavor: mode.flavor,
                position: cloneCoord(mode.position),
                attachedBoardSiteId: mode.attachedBoardSiteId,
                parityPartnerId: mode.parityPartnerId,
                active: mode.active,
                tags: [...mode.tags]
            })),
            braidWord: [...this.braidWord],
            fusionResults: [...this.fusionResults],
            measurements: [...this.measurements],
            observables: this.computePhysicalObservables(),
            history: [...this.history],
            operatorGraph: JSON.parse(exportOperatorGraph(this.operatorGraph))
        };
    }
}

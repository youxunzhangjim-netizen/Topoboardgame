import { coordKey } from '../topology/GraphTopologies.js';

const PHYSICAL_MODE_BASE = Object.freeze({
    physical_clifford_reversi: 'clifford_reversi',
    physical_clifford_go: 'clifford_go',
    physical_clifford_jump: 'clifford_jump',
    physical_anyon_reversi: 'anyon_reversi',
    physical_anyon_jump: 'anyon_jump',
    physical_jump_particles: 'physical_jump_particles',
    physical_virasoro_jump: 'virasoro_jump',
    physical_cluster_go: 'physical_cluster_go'
});

const WRAPPED = Symbol('physicalGameFrameworkWrapped');

function cloneValue(value) {
    if (Array.isArray(value)) return value.map(cloneValue);
    if (value && typeof value === 'object') {
        return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, cloneValue(entry)]));
    }
    return value;
}

function normalizeCoord(coord) {
    if (!coord) return null;
    if (Array.isArray(coord)) return coord.map(Number);
    if (Array.isArray(coord.coord)) return normalizeCoord(coord.coord);
    if (Array.isArray(coord.vertex)) return normalizeCoord(coord.vertex);
    if (typeof coord === 'string') return coord.split(',').map(Number);
    return null;
}

function uniqueCoords(coords = []) {
    const unique = new Map();
    for (const item of coords) {
        const coord = normalizeCoord(item);
        if (!coord || coord.some((value) => !Number.isFinite(value))) continue;
        unique.set(coordKey(coord), coord);
    }
    return [...unique.values()];
}

function topologySummary(game) {
    return {
        name: game?.topology?.name || game?.go?.topology?.name || 'unknown',
        sizes: [...(game?.topology?.sizes || game?.go?.topology?.sizes || [])],
        dimensions: game?.topology?.dimensions || game?.go?.topology?.dimensions || 2,
        lattice: game?.topology?.lattice || game?.go?.topology?.lattice || 'square',
        seamSummary: typeof game?.topology?.seamSummary === 'function'
            ? game.topology.seamSummary()
            : ''
    };
}

function currentTick(game) {
    return Number(game?.moveNumber ?? game?.go?.moveNumber ?? 0) || 0;
}

function boardEntries(game) {
    if (game?.board instanceof Map) {
        return [...game.board.entries()].map(([key, entity]) => ({
            key,
            coord: key.split(',').map(Number),
            entity
        }));
    }
    if (game?.primaryBoard instanceof Map) {
        return [...game.primaryBoard.entries()].map(([key, entity]) => ({
            key,
            coord: key.split(',').map(Number),
            entity
        }));
    }
    if (game?.go?.board instanceof Map) {
        return [...game.go.board.entries()]
            .filter(([, value]) => value)
            .map(([key, value]) => ({
                key,
                coord: game.go.coordFromKey?.(key) || key.split(',').map(Number),
                entity: {
                    color: value === 1 ? 'black' : 'white',
                    value
                }
            }));
    }
    return [];
}

function tokenEntries(game) {
    return game?.tokens instanceof Map
        ? [...game.tokens.values()].map((token) => cloneValue(token))
        : [];
}

function countBy(items, getter) {
    const counts = {};
    for (const item of items) {
        const key = getter(item);
        if (!key) continue;
        counts[key] = (counts[key] || 0) + 1;
    }
    return counts;
}

function latestMove(game) {
    const history = Array.isArray(game?.history)
        ? game.history
        : Array.isArray(game?.go?.moveHistory) ? game.go.moveHistory : [];
    return history[0] || history[history.length - 1] || null;
}

function affectedVerticesFromEvent(event = {}) {
    return uniqueCoords([
        event.coord,
        event.from,
        event.to,
        ...(event.path || []),
        ...(event.affected || []),
        ...(event.affectedVertices || []),
        ...(event.flipped || []).flatMap((flip) => [flip.coord, flip.before?.coord, flip.after?.coord]),
        ...(event.capturedStones || []),
        ...(event.captured || []),
        ...(event.capturedGroups || []).flatMap((group) => group.coords || group.stones || []),
        ...(event.measurement?.vertices || []),
        ...(event.measurements || []).flatMap((measurement) => measurement.vertices || measurement.region || [])
    ]);
}

function affectedEdgesFromEvent(event = {}) {
    const edges = [
        ...(event.seamTransports || []),
        ...(event.edges || []),
        ...(event.affectedEdges || []),
        ...(event.transportEdges || []),
        ...(event.rays || []).flatMap((ray) => ray.edges || [])
    ];
    return edges.map((edge) => cloneValue(edge));
}

function observablesForGame(game, definition) {
    if (typeof definition.computeObservables === 'function') {
        return definition.computeObservables(game);
    }
    if (typeof game.computePhysicalObservables === 'function') return game.computePhysicalObservables();
    if (typeof game.computeCFTObservables === 'function') return game.computeCFTObservables();

    const board = boardEntries(game);
    const tokens = tokenEntries(game);
    const counts = typeof game.counts === 'function' ? game.counts() : {};
    const labelCounts = countBy(board, ({ entity }) =>
        entity?.pauliLabel || entity?.primaryType || entity?.channelLabel || entity?.anyonType);
    const ownerCounts = countBy([...board, ...tokens], (entry) =>
        entry.entity?.color || entry.owner || entry.entity?.owner);
    const braidWordLengths = tokens.map((token) => token.braidWord?.length || 0);
    const energy = cloneValue(game?.energy || {});

    return {
        tick: currentTick(game),
        topology: topologySummary(game),
        occupiedVertices: board.length,
        tokenCount: tokens.length,
        ownerCounts: Object.keys(ownerCounts).length ? ownerCounts : counts,
        labelCounts,
        captures: cloneValue(game?.captures || game?.go?.captures || {}),
        score: cloneValue(game?.score || null),
        energy,
        totalEnergy: Object.values(energy).reduce((sum, value) => sum + Number(value || 0), 0),
        braidTokenCounts: cloneValue(game?.braidTokens || {}),
        averageBraidWordLength: braidWordLengths.length
            ? braidWordLengths.reduce((sum, value) => sum + value, 0) / braidWordLengths.length
            : 0,
        maxBraidWordLength: braidWordLengths.length ? Math.max(...braidWordLengths) : 0,
        fusionOutcomeCount: game?.fusionOutcomes?.length || 0,
        measurementCount: (game?.measurementHistory?.length || 0)
            + (game?.probability?.measurementLog?.length || 0),
        stochasticEventCount: game?.probability?.randomEvents?.length || 0
    };
}

function answerForGame(game, definition, history) {
    if (typeof definition.computePhysicalAnswer === 'function') {
        return definition.computePhysicalAnswer(history, game);
    }
    if (typeof game.computeCFTAnswer === 'function') return game.computeCFTAnswer();
    const finalObservables = history.at(-1)?.observables || observablesForGame(game, definition);
    return {
        finalTick: currentTick(game),
        finalObservables: cloneValue(finalObservables),
        summary: `${definition.physicalSystemName} reached tick ${currentTick(game)} on ${topologySummary(game).name}; occupied ${finalObservables.occupiedVertices ?? 0} vertices and ${finalObservables.tokenCount ?? 0} mobile tokens.`
    };
}

function eventAction(result, fallback) {
    const event = result?.event || result?.measurement || result || {};
    const measurementType = result?.measurement?.type || event.measurement?.type || event.type;
    const measurementActions = {
        line_parity: 'measure_interval_parity',
        ope_channel: 'measure_ope_channel',
        two_point: 'measure_two_point_correlator',
        four_point_block: 'measure_four_point_correlator',
        dominant_block: 'measure_four_point_correlator',
        region_entropy: 'measure_region_entropy',
        stress: 'measure_stress_tensor_proxy'
    };
    if (fallback === 'applyVirasoroAction') return 'apply_Ln_deformation';
    if (fallback === 'tryPlay' && event.insertedPrimary) {
        return Number(event.captured || 0) > 0 ? 'capture_fuse_cluster' : 'place_primary_field';
    }
    if (fallback === 'place' && event.mode === 'physical_virasoro_reversi') {
        return event.action || 'insert_primary_and_local_ope';
    }
    if (measurementActions[measurementType]) return measurementActions[measurementType];
    if (fallback === 'measureTwoPoint') return 'measure_two_point_correlator';
    if (fallback === 'measureFourPoint' || fallback === 'measureFourPointBlock' || fallback === 'measureDominantBlock') {
        return 'measure_four_point_correlator';
    }
    if (fallback === 'measureOPEChannel') return 'measure_ope_channel';
    if (fallback === 'measureLineParity') return 'measure_interval_parity';
    if (fallback === 'measureRegionEntropy') return 'measure_region_entropy';
    if (fallback === 'measureStress') return 'measure_stress_tensor_proxy';
    return event.kind || event.action || event.type || fallback;
}

function extractPhysicalUpdate(result, before, after) {
    const event = result?.event || result?.measurement || result || {};
    return {
        ok: result?.ok !== false,
        event: cloneValue(event),
        delta: {
            occupiedVertices: Number(after?.occupiedVertices || 0) - Number(before?.occupiedVertices || 0),
            tokenCount: Number(after?.tokenCount || 0) - Number(before?.tokenCount || 0),
            totalEnergy: Number(after?.totalEnergy || 0) - Number(before?.totalEnergy || 0)
        },
        noise: cloneValue(event.noise || []),
        time: cloneValue(event.time || null),
        winding: cloneValue(event.winding || null),
        fusion: cloneValue(event.fusion || null),
        measurement: cloneValue(result?.measurement || event.measurement || null)
    };
}

function makeEntry({ game, definition, result, methodName, player, beforeObservables }) {
    const event = result?.event || result?.measurement || result || {};
    const observables = observablesForGame(game, definition);
    return {
        tick: currentTick(game),
        player: player || event.player || game.currentPlayer || 'system',
        action: eventAction(result, methodName),
        affectedVertices: affectedVerticesFromEvent(event),
        affectedEdges: affectedEdgesFromEvent(event),
        topology: topologySummary(game),
        physicalUpdate: extractPhysicalUpdate(result, beforeObservables, observables),
        observables
    };
}

function csvEscape(value) {
    const text = typeof value === 'string' ? value : JSON.stringify(value ?? '');
    return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export function isPhysicalVariantMode(mode = '') {
    return mode in PHYSICAL_MODE_BASE
        || mode === 'physical_virasoro_go'
        || mode === 'physical_virasoro_reversi'
        || mode === 'physical_jump_particles'
        || mode === 'physical_cluster_go';
}

export function baseModeForPhysicalVariant(mode = '') {
    return PHYSICAL_MODE_BASE[mode] || mode;
}

export function createPhysicalModeDefinition(mode = '', options = {}) {
    const baseMode = baseModeForPhysicalVariant(mode);
    const family = baseMode.includes('anyon') || baseMode.includes('jump_particles') ? 'anyon'
        : baseMode.includes('virasoro') || mode.includes('virasoro') ? 'virasoro'
        : 'clifford';
    const isGo = baseMode.includes('go');
    const isJump = baseMode.includes('jump');
    const isReversi = baseMode.includes('reversi');
    const systemNames = {
        clifford: 'Discrete stabilizer/Pauli-frame lattice system',
        virasoro: 'Discrete Virasoro/CFT graph estimator',
        anyon: 'Discrete anyon worldline and fusion-memory system'
    };
    const meanings = {
        clifford: 'Black is the positive Pauli-frame sector and White is the negative Pauli-frame sector; X/Y/Z labels are local Pauli operators on graph qubit sites.',
        virasoro: 'Black and White are opposite domain/boundary sectors; labels are primary fields or Virasoro generators on graph insertions.',
        anyon: 'Black and White are two anyon-control/worldline owners; labels are topological charge types and braid/fusion memory states.'
    };
    const initialOptions = {
        clifford: ['stabilizer_vacuum', 'paired_defects', 'domain_wall_seed', 'prepared_circuit', 'custom_setup'],
        virasoro: ['vacuum', 'two_point_insertions', 'four_point_block', 'domain_wall_seed', 'thermal_sparse'],
        anyon: ['vacuum_pairs', 'excitation_energy', 'braided_pair_seed', 'fusion_site_seed']
    };
    const actions = {
        clifford: isGo
            ? ['place_pauli', 'local_clifford_action', 'pass', 'count', 'measure_parity']
            : isJump
                ? ['move', 'jump', 'braid', 'unbraid', 'measure']
                : ['place', 'flip', 'single_qubit_gate', 'entangle_ancilla', 'measure', 'pass'],
        virasoro: isJump
            ? ['move', 'jump', 'braid', 'L-1', 'L0', 'L1', 'L-2', 'L2', 'measure']
            : ['place_primary', 'capture_interval', 'L-1', 'L0', 'L1', 'L-2', 'L2', 'measure', isGo ? 'count' : 'pass'],
        anyon: isReversi
            ? ['place_charge', 'fuse_interval', 'measure_charge', 'pass']
            : ['excite', 'move', 'jump', 'braid', 'unbraid', 'recombine', 'measure_charge']
    };
    const localRules = {
        clifford: 'Each local action updates the Pauli-frame label, sign, phase, owner sector, and topology seam transport at affected graph vertices; observables are recomputed immediately after the action.',
        virasoro: 'Each local insertion, capture, measurement, or Virasoro generator updates primary fields, stress proxies, OPE channel data, domain sectors, and topology-sector estimators before observables are recomputed.',
        anyon: 'Each local excitation, hop, jump, braid, unbraid, fusion, or recombination updates worldlines, charge labels, braid memory, fusion channels, energy, and topology winding before observables are recomputed.'
    };
    return {
        id: mode,
        baseMode,
        physicalSystemName: options.physicalSystemName || systemNames[family],
        blackWhiteMeaning: options.blackWhiteMeaning || meanings[family],
        initialStateOptions: options.initialStateOptions || initialOptions[family],
        allowedActions: options.allowedActions || actions[family],
        localUpdateRules: options.localUpdateRules || localRules[family],
        computeObservables: options.computeObservables || null,
        computePhysicalAnswer: options.computePhysicalAnswer || null
    };
}

export function attachPhysicalGameFramework(game, definitionInput = {}) {
    if (!game || game[WRAPPED]) return game;
    const originalComputePhysicalAnswer = typeof game.computePhysicalAnswer === 'function'
        ? game.computePhysicalAnswer.bind(game)
        : null;
    const definition = {
        ...createPhysicalModeDefinition(definitionInput.id || game.mode || 'physical_game'),
        ...definitionInput,
        computePhysicalAnswer: definitionInput.computePhysicalAnswer || (
            originalComputePhysicalAnswer
                ? () => originalComputePhysicalAnswer()
                : null
        )
    };
    const framework = {
        definition,
        physicsHistory: [],
        observables: [],
        physicalAnswer: null,
        recordingDepth: 0,
        record(result, methodName, player) {
            if (!result || result.ok === false) return null;
            const beforeObservables = this.observables.at(-1) || observablesForGame(game, definition);
            const entry = makeEntry({
                game,
                definition,
                result,
                methodName,
                player,
                beforeObservables
            });
            this.physicsHistory.push(entry);
            this.observables.push(cloneValue(entry.observables));
            this.physicalAnswer = answerForGame(game, definition, this.physicsHistory);
            game.physicalAnswer = cloneValue(this.physicalAnswer);
            return entry;
        },
        exportJSON() {
            const finalObservables = observablesForGame(game, definition);
            const physicalAnswer = answerForGame(game, definition, this.physicsHistory);
            return {
                physicalSystemName: definition.physicalSystemName,
                blackWhiteMeaning: definition.blackWhiteMeaning,
                initialStateOptions: cloneValue(definition.initialStateOptions),
                allowedActions: cloneValue(definition.allowedActions),
                localUpdateRules: definition.localUpdateRules,
                topology: topologySummary(game),
                initialConditions: {
                    mode: definition.id,
                    baseMode: definition.baseMode,
                    selectedInitialState: game.physicalInitialState
                        || game.physicalConfig?.initialState
                        || game.cftConfig?.initialState
                        || game.config?.setupMode
                        || 'standard'
                },
                latestMove: cloneValue(latestMove(game)),
                physicsHistory: cloneValue(this.physicsHistory),
                observables: cloneValue(this.observables),
                finalObservables,
                physicalAnswer
            };
        },
        exportCSV() {
            const header = [
                'tick',
                'player',
                'action',
                'topology',
                'affectedVertices',
                'affectedEdges',
                'physicalUpdate',
                'observables'
            ];
            const rows = this.physicsHistory.map((entry) => [
                entry.tick,
                entry.player,
                entry.action,
                entry.topology?.name,
                entry.affectedVertices,
                entry.affectedEdges,
                entry.physicalUpdate,
                entry.observables
            ].map(csvEscape).join(','));
            return [header.join(','), ...rows].join('\n');
        }
    };

    game.physicalFramework = framework;
    game.physicalSystemName = definition.physicalSystemName;
    game.blackWhiteMeaning = definition.blackWhiteMeaning;
    game.initialStateOptions = cloneValue(definition.initialStateOptions);
    game.allowedActions = cloneValue(definition.allowedActions);
    game.localUpdateRules = definition.localUpdateRules;
    game.physicsHistory = Array.isArray(game.physicsHistory) ? game.physicsHistory : framework.physicsHistory;
    game.computeObservables = () => observablesForGame(game, definition);
    game.computePhysicalAnswer = (history = framework.physicsHistory) => answerForGame(game, definition, history);
    game.exportPhysicalHistoryJSON = () => framework.exportJSON();
    game.exportPhysicalHistoryCSV = () => framework.exportCSV();

    framework.record({
        ok: true,
        event: {
            type: 'initial_conditions',
            player: 'system',
            affectedVertices: boardEntries(game).map((entry) => entry.coord)
                .concat(tokenEntries(game).map((token) => token.coord || token.vertex))
        }
    }, 'initial_conditions', 'system');

    const methodNames = [
        'place',
        'tryPlay',
        'applyCliffordAction',
        'pass',
        'agreeToCount',
        'measurePauliParity',
        'measureAnyonChargeAt',
        'measureAnyonCharge',
        'exciteAnyon',
        'dropAnyon',
        'move',
        'attemptUnbraid',
        'applyAction',
        'chainJump',
        'measurePhysical',
        'prepareAncilla',
        'discardAncilla',
        'phaseAction',
        'entangleAncilla',
        'applySingleQubitGate',
        'applyVirasoroAction',
        'measureFourPointBlock',
        'measureLineParity',
        'measureOPEChannel',
        'measureRegionEntropy',
        'measureStress',
        'measureTwoPoint',
        'measureFourPoint',
        'measureDominantBlock',
        'measureCFT',
        'applyNoiseCycle',
        'placeSpin',
        'flipSpin',
        'flipDomain',
        'bracketFlip',
        'nucleate',
        'growDomain',
        'flipInterface',
        'flipArrow',
        'flipString',
        'flipLoop',
        'moveMonopole',
        'annihilateMonopoles',
        'flipGaugeEdge',
        'flipGaugeEdgeByKey',
        'flipGaugePath',
        'flipGaugeLoop',
        'measureGaugeCheck',
        'applyGaugeNoise',
        'applyGaugeNoiseByKey',
        'placeSpecies',
        'growCluster',
        'applyDiffusionNoise',
        'moveParticle',
        'recombine',
        'measurePathParity'
    ];

    for (const name of methodNames) {
        if (typeof game[name] !== 'function') continue;
        const original = game[name].bind(game);
        game[name] = (...args) => {
            const player = game.currentPlayer;
            const shouldRecord = framework.recordingDepth === 0;
            framework.recordingDepth += 1;
            try {
                const result = original(...args);
                if (result && typeof result.then === 'function') {
                    return result.then((resolved) => {
                        if (shouldRecord) framework.record(resolved, name, player);
                        return resolved;
                    }).finally(() => {
                        framework.recordingDepth = Math.max(0, framework.recordingDepth - 1);
                    });
                }
                framework.recordingDepth = Math.max(0, framework.recordingDepth - 1);
                if (shouldRecord) framework.record(result, name, player);
                return result;
            } catch (error) {
                framework.recordingDepth = Math.max(0, framework.recordingDepth - 1);
                throw error;
            }
        };
    }

    const originalExport = typeof game.exportState === 'function' ? game.exportState.bind(game) : null;
    if (originalExport) {
        game.exportState = () => {
            const state = originalExport();
            const physicalFramework = framework.exportJSON();
            return {
                ...state,
                physicalSystemName: definition.physicalSystemName,
                blackWhiteMeaning: definition.blackWhiteMeaning,
                initialStateOptions: cloneValue(definition.initialStateOptions),
                allowedActions: cloneValue(definition.allowedActions),
                localUpdateRules: definition.localUpdateRules,
                physicsHistory: cloneValue(framework.physicsHistory),
                observables: cloneValue(physicalFramework.finalObservables),
                observableHistory: cloneValue(framework.observables),
                observablesAfterEachMove: cloneValue(framework.observables),
                physicalAnswer: cloneValue(physicalFramework.physicalAnswer),
                physicalFramework,
                physicalHistoryCSV: framework.exportCSV()
            };
        };
    }

    game[WRAPPED] = true;
    return game;
}

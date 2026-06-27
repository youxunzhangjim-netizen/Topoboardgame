import {
    LAB_SCHEMA_VERSION,
    buildBasicReproducibilityMetadata,
    labHash,
    stableStringify
} from '../experiments/LabExperimentRegistry.js';

export const INITIAL_MAPPING_METHODS = [
    {
        id: 'seed_preserving_regeneration',
        label: { en: 'Seed-preserving regeneration', zh: '保留種子的重新生成' },
        description: {
            en: 'Safest default: each topology regenerates the same initial-condition family from the same seed.',
            zh: '最安全預設：每個拓撲用同一 seed 重新生成同一初始條件家族。'
        }
    },
    {
        id: 'coordinate_preserving',
        label: { en: 'Coordinate-preserving mapping', zh: '保留座標映射' },
        description: {
            en: 'Use only when rectangular coordinate grids are comparable.',
            zh: '只在矩形座標格可比較時使用。'
        }
    },
    {
        id: 'density_preserving',
        label: { en: 'Density-preserving mapping', zh: '保留密度映射' },
        description: {
            en: 'Preserve global density or phase fraction, not exact site identity.',
            zh: '保留全域密度或相比例，不保證同一 site identity。'
        }
    },
    {
        id: 'pattern_projection',
        label: { en: 'Pattern projection', zh: '圖樣投影' },
        description: {
            en: 'Project stripes, droplets, or paths when the target topology supports them.',
            zh: '當目標拓撲支援時，投影條紋、液滴或路徑。'
        }
    },
    {
        id: 'manual_mapping',
        label: { en: 'Manual mapping table', zh: '手動映射表' },
        description: {
            en: 'Advanced mode: store a user-provided mapping table with warnings.',
            zh: '進階模式：儲存使用者提供的映射表與警告。'
        }
    }
];

export const EVENT_DETECTOR_REGISTRY = [
    {
        id: 'detector.seam-crossing',
        label: { en: 'Seam crossing estimator', zh: '接縫穿越估計器' },
        eventType: 'seam_crossing_estimate',
        compatibleFamilies: ['Spin Systems', 'Phase Competition', 'Cluster Growth', 'Anyons / Braiding', 'Lattice Gauge Concepts'],
        exactness: 'estimated',
        limitations: ['Uses topology metadata and observable traces; it does not reconstruct exact paths unless path data exists.']
    },
    {
        id: 'detector.winding-loop',
        label: { en: 'Winding / noncontractible loop estimator', zh: '纏繞 / 非可縮迴路估計器' },
        eventType: 'winding_loop_estimate',
        compatibleFamilies: ['Spin Systems', 'Cluster Growth', 'Spin Ice', 'Lattice Gauge Concepts', 'Anyons / Braiding'],
        exactness: 'estimated',
        limitations: ['Reports finite-graph winding evidence, not a proof of homology class.']
    },
    {
        id: 'detector.logical-cycle',
        label: { en: 'Logical cycle crossing estimator', zh: '邏輯週期穿越估計器' },
        eventType: 'logical_cycle_crossing_estimate',
        compatibleFamilies: ['Stabilizer Codes', 'Lattice Gauge Concepts', 'Anyons / Braiding'],
        exactness: 'estimated',
        limitations: ['Logical-cycle labels depend on available cycle metadata and selected topology.']
    },
    {
        id: 'detector.boundary-interaction',
        label: { en: 'Boundary interaction count', zh: '邊界互動計數' },
        eventType: 'boundary_interaction_estimate',
        compatibleFamilies: ['Spin Systems', 'Phase Competition', 'Cluster Growth', 'Discrete Fields'],
        exactness: 'estimated',
        limitations: ['Boundary contact is estimated from topology type and final observable changes.']
    },
    {
        id: 'detector.orientation-reversal',
        label: { en: 'Orientation-reversal seam event', zh: '反定向接縫事件' },
        eventType: 'orientation_reversal_estimate',
        compatibleFamilies: ['Spin Systems', 'Lattice Gauge Concepts', 'Anyons / Braiding', 'Discrete Fields'],
        exactness: 'estimated',
        limitations: ['Only meaningful on Mobius, Klein, and RP2-style topology metadata.']
    }
];

const DECLARED_TOPOLOGY = {
    flat: {
        orientable: true,
        boundaryComponents: 1,
        eulerCharacteristic: 1,
        bettiNumbers: [1, 0, 0],
        genus: 0,
        exactness: 'manually_declared',
        limitations: ['Finite rectangular open grid is treated as a disk-like estimator.']
    },
    cylinder: {
        orientable: true,
        boundaryComponents: 2,
        eulerCharacteristic: 0,
        bettiNumbers: [1, 1, 0],
        genus: 0,
        exactness: 'manually_declared',
        limitations: ['Declared for the intended cylinder identification, not computed from exported cells.']
    },
    torus: {
        orientable: true,
        boundaryComponents: 0,
        eulerCharacteristic: 0,
        bettiNumbers: [1, 2, 1],
        genus: 1,
        exactness: 'manually_declared',
        limitations: ['Declared for T2 periodic boundary metadata.']
    },
    mobius: {
        orientable: false,
        boundaryComponents: 1,
        eulerCharacteristic: 0,
        bettiNumbers: [1, 1, 0],
        crosscapNumber: 1,
        exactness: 'manually_declared',
        limitations: ['Integer homology is simplified for UI comparison; use as topology metadata, not proof.']
    },
    klein_bottle: {
        orientable: false,
        boundaryComponents: 0,
        eulerCharacteristic: 0,
        bettiNumbers: [1, 1, 0],
        crosscapNumber: 2,
        exactness: 'manually_declared',
        limitations: ['Betti summary is simplified and manually declared for exploratory comparison.']
    },
    rp2: {
        orientable: false,
        boundaryComponents: 0,
        eulerCharacteristic: 1,
        bettiNumbers: [1, 0, 0],
        crosscapNumber: 1,
        exactness: 'manually_declared',
        limitations: ['Projective-plane metadata is manually declared.']
    },
    sphere_latitude: {
        orientable: true,
        boundaryComponents: 0,
        eulerCharacteristic: 2,
        bettiNumbers: [1, 0, 1],
        genus: 0,
        exactness: 'manually_declared',
        limitations: ['Latitude-grid sphere is an embedded lattice approximation.']
    },
    random_boundary: {
        orientable: null,
        boundaryComponents: null,
        eulerCharacteristic: null,
        bettiNumbers: null,
        exactness: 'estimated',
        limitations: ['Random boundary graph invariants are estimators until an adjacency export is available.']
    },
    r3: {
        orientable: true,
        boundaryComponents: 1,
        eulerCharacteristic: null,
        bettiNumbers: null,
        exactness: 'estimated',
        limitations: ['3D voxel complex metadata is estimated from dimensions.']
    },
    flat_4d_grid: {
        orientable: true,
        boundaryComponents: 1,
        eulerCharacteristic: null,
        bettiNumbers: null,
        exactness: 'estimated',
        limitations: ['4D grid topology summary is an exploratory metadata estimate.']
    }
};

export function topologySiteCount(topology) {
    return (topology.width || 1) * (topology.height || 1) * (topology.depth || 1) * (topology.w || 1);
}

export function estimateEdgeCount(topology) {
    const sizes = [topology.width || 1, topology.height || 1, topology.depth || 1, topology.w || 1].slice(0, topology.dimension);
    let edges = 0;
    for (let axis = 0; axis < sizes.length; axis += 1) {
        const axisOpenEdges = Math.max(0, sizes[axis] - 1) * sizes.reduce((product, size, index) => product * (index === axis ? 1 : size), 1);
        const periodicBonus = String(topology.boundaryCondition).includes('periodic') || ['torus', 'klein_bottle', 'cylinder'].includes(topology.id)
            ? sizes.reduce((product, size, index) => product * (index === axis ? 1 : size), 1)
            : 0;
        edges += axisOpenEdges + periodicBonus;
    }
    return Math.max(0, Math.round(edges));
}

export function estimateFaceCount(topology) {
    if (topology.dimension < 2) return 0;
    const w = topology.width || 1;
    const h = topology.height || 1;
    if (topology.dimension === 2) {
        if (['torus', 'klein_bottle', 'rp2', 'sphere_latitude'].includes(topology.id)) return w * h;
        if (['cylinder', 'mobius'].includes(topology.id)) return w * Math.max(1, h - 1);
        return Math.max(0, (w - 1) * (h - 1));
    }
    return Math.max(0, Math.round(topologySiteCount(topology) * topology.dimension / 2));
}

function invariant(topology, name, value, category, definition, method, exactness, limitations, computedAt) {
    const payload = { topologyId: topology.id, name, value, category, method, exactness, topologyHash: topology.hash };
    return {
        invariantId: `invariant.${labHash(payload, 'id').replace(':', '.')}`,
        topologyId: topology.id,
        name,
        value,
        category,
        definition,
        method,
        exactness,
        limitations,
        topologyHash: topology.hash,
        computedAt
    };
}

export function computeTopologyInvariants(topology, computedAt = new Date().toISOString()) {
    const declared = DECLARED_TOPOLOGY[topology.id] || {};
    const vertices = topologySiteCount(topology);
    const edges = estimateEdgeCount(topology);
    const faces = estimateFaceCount(topology);
    const connectedComponents = 1;
    const averageDegree = vertices ? Number(((2 * edges) / vertices).toFixed(4)) : 0;
    const cycleRank = Math.max(0, edges - vertices + connectedComponents);
    const dimensionLimit = ['Uses registry dimensions; does not inspect a full cell-complex export.'];
    const graphLimit = ['Computed from registry size and boundary metadata; adjacency export can refine this.'];
    const topologicalLimit = declared.limitations || ['Exact topological invariant is unknown for this registry entry.'];
    return [
        invariant(topology, 'dimension', topology.dimension, 'basic_topology', 'Number of discrete coordinate dimensions in the registry entry.', 'registry metadata', 'manually_declared', dimensionLimit, computedAt),
        invariant(topology, 'topology type', topology.topologyType, 'basic_topology', 'Named topology family for UI and adapter selection.', 'registry metadata', 'manually_declared', dimensionLimit, computedAt),
        invariant(topology, 'boundary condition', topology.boundaryCondition, 'basic_topology', 'Boundary rule label used by topology-aware adapters.', 'registry metadata', 'manually_declared', dimensionLimit, computedAt),
        invariant(topology, 'lattice type', topology.latticeTypes.join(', '), 'basic_topology', 'Available lattice families for this topology entry.', 'registry metadata', 'manually_declared', dimensionLimit, computedAt),
        invariant(topology, 'orientability', declared.orientable ?? 'unknown', 'cell_complex', 'Whether the intended surface admits consistent local orientation.', 'declared topology metadata', declared.exactness || 'unknown', topologicalLimit, computedAt),
        invariant(topology, 'boundary components', declared.boundaryComponents ?? 'unknown', 'cell_complex', 'Number of boundary components for the intended topology.', 'declared topology metadata', declared.exactness || 'unknown', topologicalLimit, computedAt),
        invariant(topology, 'vertices', vertices, 'graph', 'Number of registered lattice sites.', 'computed from registry dimensions', 'computed', graphLimit, computedAt),
        invariant(topology, 'edges', edges, 'graph', 'Estimated nearest-neighbor edge count.', 'estimated from dimensions and boundary metadata', 'estimated', graphLimit, computedAt),
        invariant(topology, 'faces', faces || 'unknown', 'cell_complex', 'Estimated face/plaquette count when a face model is available.', 'estimated from dimensions and topology type', faces ? 'estimated' : 'unknown', graphLimit, computedAt),
        invariant(topology, 'connected components', connectedComponents, 'graph', 'Connected component count assumed by current registry topologies.', 'registry assumption', 'estimated', ['Assumes a single connected component unless adjacency export says otherwise.'], computedAt),
        invariant(topology, 'average degree', averageDegree, 'graph', 'Mean graph degree 2E/V.', 'computed from estimated edge count', 'estimated', graphLimit, computedAt),
        invariant(topology, 'degree distribution', degreeDistributionEstimate(topology), 'graph', 'Estimated degree distribution summary.', 'boundary metadata estimator', 'estimated', graphLimit, computedAt),
        invariant(topology, 'diameter estimate', diameterEstimate(topology), 'graph', 'Shortest-path diameter proxy.', 'dimension-size estimator', 'estimated', graphLimit, computedAt),
        invariant(topology, 'clustering coefficient estimate', clusteringEstimate(topology), 'graph', 'Local triangle clustering proxy for selected lattice families.', 'lattice-family estimator', 'estimated', graphLimit, computedAt),
        invariant(topology, 'cycle rank', cycleRank, 'cycle', 'Graph cycle rank E - V + connected components.', 'computed from estimated graph counts', 'estimated', graphLimit, computedAt),
        invariant(topology, 'Euler characteristic', declared.eulerCharacteristic ?? 'unknown', 'cell_complex', 'V - E + F for a valid cell complex or declared surface value.', 'declared topology metadata', declared.exactness || 'unknown', topologicalLimit, computedAt),
        invariant(topology, 'Betti numbers', declared.bettiNumbers || 'unknown', 'cell_complex', 'b0, b1, b2 summary where meaningful.', 'declared topology metadata', declared.exactness || 'unknown', topologicalLimit, computedAt),
        invariant(topology, 'genus', declared.genus ?? 'unknown', 'cell_complex', 'Orientable surface genus where meaningful.', 'declared topology metadata', declared.genus === undefined ? 'unknown' : declared.exactness, topologicalLimit, computedAt),
        invariant(topology, 'crosscap number', declared.crosscapNumber ?? 'unknown', 'cell_complex', 'Non-orientable crosscap count where meaningful.', 'declared topology metadata', declared.crosscapNumber === undefined ? 'unknown' : declared.exactness, topologicalLimit, computedAt),
        invariant(topology, 'adjacency hash', labHash({ topologyHash: topology.hash, vertices, edges }, 'adjacency'), 'graph', 'Stable hash for the exported/estimated adjacency metadata.', 'hash of registry-derived graph summary', 'computed', graphLimit, computedAt)
    ];
}

function degreeDistributionEstimate(topology) {
    const dimension = Number(topology.dimension) || 2;
    const interiorDegree = dimension * 2;
    const boundary = String(topology.boundaryCondition);
    if (boundary.includes('periodic') && !boundary.includes('open')) return { [interiorDegree]: topologySiteCount(topology) };
    return {
        [Math.max(1, interiorDegree - 1)]: Math.max(0, Math.round(topologySiteCount(topology) * 0.28)),
        [interiorDegree]: Math.max(1, Math.round(topologySiteCount(topology) * 0.72))
    };
}

function diameterEstimate(topology) {
    const sizes = [topology.width || 1, topology.height || 1, topology.depth || 1, topology.w || 1].slice(0, topology.dimension);
    const open = sizes.reduce((sum, size) => sum + Math.max(0, size - 1), 0);
    const wrapped = sizes.reduce((sum, size) => sum + Math.floor(size / 2), 0);
    return String(topology.boundaryCondition).includes('periodic') ? wrapped : open;
}

function clusteringEstimate(topology) {
    if (topology.latticeTypes.includes('triangular')) return 0.28;
    if (topology.latticeTypes.includes('honeycomb')) return 0;
    return 0.04;
}

export function computeCycleData(topology) {
    const declared = DECLARED_TOPOLOGY[topology.id] || {};
    const hasTwist = ['mobius', 'klein_bottle', 'rp2'].includes(topology.id);
    const cycleRank = Math.max(0, estimateEdgeCount(topology) - topologySiteCount(topology) + 1);
    const fundamentalCycles = [];
    if (['cylinder', 'torus', 'mobius', 'klein_bottle', 'rp2'].includes(topology.id)) {
        fundamentalCycles.push({ id: `${topology.id}.cycle.x`, label: 'x cycle', method: 'declared from boundary identification' });
    }
    if (['torus', 'klein_bottle'].includes(topology.id)) {
        fundamentalCycles.push({ id: `${topology.id}.cycle.y`, label: 'y cycle', method: 'declared from boundary identification' });
    }
    const seamEdges = String(topology.boundaryCondition).includes('periodic') || String(topology.boundaryCondition).includes('twisted')
        ? [{ id: `${topology.id}.seam.primary`, label: 'primary boundary seam', method: 'metadata declaration' }]
        : [];
    const twistedSeamEdges = hasTwist
        ? [{ id: `${topology.id}.seam.twist`, label: 'orientation-reversing seam', method: 'metadata declaration' }]
        : [];
    return {
        topologyId: topology.id,
        cycleBasis: Array.from({ length: Math.min(cycleRank, 6) }, (_, index) => ({ id: `${topology.id}.cycleBasis.${index + 1}`, exactness: 'estimated' })),
        fundamentalCycles,
        noncontractibleCycles: fundamentalCycles,
        seamEdges,
        twistedSeamEdges,
        boundaryComponents: Number.isFinite(Number(declared.boundaryComponents))
            ? Array.from({ length: Number(declared.boundaryComponents) }, (_, index) => ({ id: `${topology.id}.boundary.${index + 1}` }))
            : [],
        logicalCycles: ['torus', 'klein_bottle', 'rp2', 'mobius', 'cylinder'].includes(topology.id)
            ? fundamentalCycles.map((cycle) => ({ ...cycle, role: 'logical-cycle-estimate' }))
            : [],
        homologyGenerators: fundamentalCycles.map((cycle) => ({ ...cycle, role: 'homology-generator-estimate' })),
        exactness: declared.exactness || 'unknown',
        limitations: declared.limitations || ['Cycle data unavailable without explicit adjacency/cell-complex export.']
    };
}

export function modelTopologyFeatureSummary(model) {
    const family = model.family || '';
    if (family.includes('Stabilizer')) {
        return {
            requiredTopologyFeatures: 'orientable 2D cell-complex preferred; graph estimator fallback allowed',
            requiredLatticeFeatures: 'primal/dual structure if available',
            topologySensitiveObservables: ['logical sector', 'vacuum recovery', 'global parity']
        };
    }
    if (family.includes('Anyons') || family.includes('Gauge')) {
        return {
            requiredTopologyFeatures: 'cycle and path structure preferred',
            requiredLatticeFeatures: 'nearest-neighbor path graph',
            topologySensitiveObservables: ['logical sector', 'Wilson loops', 'braid parity']
        };
    }
    if (family.includes('Discrete Fields')) {
        return {
            requiredTopologyFeatures: 'embedding or graph-distance estimator',
            requiredLatticeFeatures: 'distance proxy between insertions',
            topologySensitiveObservables: ['correlation estimator', 'entropy proxy', 'anomaly events']
        };
    }
    return {
        requiredTopologyFeatures: 'graph adjacency',
        requiredLatticeFeatures: 'nearest-neighbor graph',
        topologySensitiveObservables: model.observables.filter((observable) => observable.category === 'topology' || observable.category === 'logical').map((observable) => observable.name)
    };
}

export function detectorsForModel(model) {
    return EVENT_DETECTOR_REGISTRY.filter((detector) => detector.compatibleFamilies.some((family) => model.family.includes(family) || model.section.includes(family) || family.includes(model.family)));
}

export function detectTopologySensitiveEvents({ comparisonConfig, runResults, selectedDetectorIds, cycleDataByTopology }) {
    const selected = new Set(selectedDetectorIds);
    const detectors = EVENT_DETECTOR_REGISTRY.filter((detector) => selected.has(detector.id));
    const events = [];
    for (const result of runResults || []) {
        const cycleData = cycleDataByTopology.get(result.config.topologyId);
        const observableEntries = Object.entries(result.summary.observableSummary || {});
        for (const detector of detectors) {
            if (!detectorApplies(detector, result, cycleData, observableEntries)) continue;
            const payload = {
                detectorId: detector.id,
                modelId: comparisonConfig.modelId,
                topologyId: result.config.topologyId,
                seed: result.config.seed,
                resultHash: result.resultHash
            };
            events.push({
                eventId: `topoEvent.${labHash(payload, 'id').replace(':', '.')}`,
                eventType: detector.eventType,
                modelId: comparisonConfig.modelId,
                topologyId: result.config.topologyId,
                step: result.summary.finalStep,
                time: result.summary.finalTime,
                affectedSites: [],
                affectedEdges: [],
                affectedFaces: [],
                relatedCycle: cycleData?.noncontractibleCycles?.[0] || null,
                relatedSeam: cycleData?.seamEdges?.[0] || cycleData?.twistedSeamEdges?.[0] || null,
                relatedObservableIds: observableEntries.map(([id]) => id),
                stateHashBefore: result.eventLog?.[0]?.payload?.stateHash || undefined,
                stateHashAfter: result.finalState?.stateHash,
                confidence: eventConfidence(detector, result, cycleData),
                exactness: detector.exactness,
                limitations: detector.limitations,
                metadata: {
                    seed: result.config.seed,
                    source: 'topology-sensitive event detector registry',
                    exploratory: true
                }
            });
        }
    }
    return events;
}

function detectorApplies(detector, result, cycleData, observableEntries) {
    const topologyId = result.config.topologyId;
    const observableText = observableEntries.map(([id, value]) => `${id}:${stableStringify(value)}`).join(' ').toLowerCase();
    if (detector.id === 'detector.orientation-reversal') return ['mobius', 'klein_bottle', 'rp2'].includes(topologyId);
    if (detector.id === 'detector.logical-cycle') return observableText.includes('logical') || observableText.includes('memory') || cycleData?.logicalCycles?.length;
    if (detector.id === 'detector.winding-loop') return observableText.includes('wrapping') || observableText.includes('winding') || cycleData?.noncontractibleCycles?.length;
    if (detector.id === 'detector.boundary-interaction') return String(topologyId).includes('flat') || cycleData?.boundaryComponents?.length;
    if (detector.id === 'detector.seam-crossing') return cycleData?.seamEdges?.length || cycleData?.twistedSeamEdges?.length;
    return false;
}

function eventConfidence(detector, result, cycleData) {
    let confidence = 0.42;
    if (cycleData?.exactness === 'manually_declared') confidence += 0.18;
    if ((result.eventLog || []).length) confidence += 0.1;
    if (detector.id.includes('logical') && result.metadata?.modelValidationLevel === 'estimator') confidence += 0.08;
    return Math.min(0.82, Number(confidence.toFixed(3)));
}

export function buildObservableComparisons(comparisonConfig, runResults) {
    const rows = [];
    for (const result of runResults || []) {
        for (const observableId of comparisonConfig.selectedObservableIds) {
            const timeSeries = (result.observableTimeSeries?.[observableId] || []).map((sample) => ({
                step: sample.step,
                time: sample.time,
                value: sample.value
            }));
            const payload = {
                observableId,
                topologyId: result.config.topologyId,
                seed: result.config.seed,
                finalValue: result.summary.observableSummary?.[observableId],
                timeSeries
            };
            rows.push({
                ...payload,
                summaryHash: labHash(payload, 'observable-comparison')
            });
        }
    }
    return rows;
}

export function buildDivergenceScores(comparisonConfig, runResults, topologySensitiveEvents) {
    const scores = [];
    const referenceTopologyId = comparisonConfig.referenceTopologyId;
    const comparisonTopologyIds = comparisonConfig.comparisonTopologyIds.filter((id) => id !== referenceTopologyId);
    for (const observableId of comparisonConfig.selectedObservableIds) {
        for (const topologyId of comparisonTopologyIds) {
            const perSeedScores = [];
            const seeds = [...new Set(runResults.map((result) => String(result.config.seed)))];
            for (const seed of seeds) {
                const reference = runResults.find((result) => result.config.topologyId === referenceTopologyId && String(result.config.seed) === seed);
                const comparison = runResults.find((result) => result.config.topologyId === topologyId && String(result.config.seed) === seed);
                if (!reference || !comparison) continue;
                perSeedScores.push(timeSeriesDistance(reference.observableTimeSeries?.[observableId] || [], comparison.observableTimeSeries?.[observableId] || []));
            }
            const eventDifference = Math.abs(
                topologySensitiveEvents.filter((event) => event.topologyId === topologyId).length
                - topologySensitiveEvents.filter((event) => event.topologyId === referenceTopologyId).length
            );
            const value = perSeedScores.length
                ? perSeedScores.reduce((sum, entry) => sum + entry, 0) / perSeedScores.length
                : null;
            const payload = { comparisonId: comparisonConfig.comparisonId, referenceTopologyId, topologyId, observableId, value, eventDifference };
            scores.push({
                scoreId: `divergence.${labHash(payload, 'id').replace(':', '.')}`,
                comparisonId: comparisonConfig.comparisonId,
                referenceTopologyId,
                comparisonTopologyId: topologyId,
                observableId,
                distanceMethod: 'mean_absolute_time_series_difference',
                normalizationMethod: '1 + absolute reference magnitude',
                seedAggregationMethod: 'mean over matched seeds',
                value: value === null ? null : Number(value.toFixed(6)),
                confidence: perSeedScores.length ? Math.min(0.9, 0.45 + perSeedScores.length * 0.08) : 0.2,
                limitations: [
                    'Exploratory topology-sensitive divergence score; not a universal physical invariant.',
                    'Uses matched seeds and selected observables only.',
                    eventDifference ? `Topology-sensitive event count differs by ${eventDifference}.` : 'No event-count difference detected by selected estimators.'
                ]
            });
        }
    }
    return scores;
}

function timeSeriesDistance(referenceSeries, comparisonSeries) {
    const count = Math.max(referenceSeries.length, comparisonSeries.length);
    if (!count) return 0;
    let total = 0;
    for (let index = 0; index < count; index += 1) {
        const a = numericValue(referenceSeries[index]?.value ?? referenceSeries.at(-1)?.value ?? 0);
        const b = numericValue(comparisonSeries[index]?.value ?? comparisonSeries.at(-1)?.value ?? 0);
        total += Math.abs(a - b) / (1 + Math.abs(a));
    }
    return total / count;
}

export function numericValue(value) {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'boolean') return value ? 1 : 0;
    if (Array.isArray(value)) return value.map(numericValue).reduce((sum, entry) => sum + entry, 0);
    if (value && typeof value === 'object') {
        const entries = Object.values(value).map(numericValue).filter(Number.isFinite);
        return entries.length ? entries.reduce((sum, entry) => sum + entry, 0) / entries.length : 0;
    }
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : String(value ?? '').length;
}

export function buildTopologyComparisonResult({ comparisonConfig, batchConfig, runResults, failedRuns, topologyLookup, warnings = [] }) {
    const computedAt = new Date().toISOString();
    const topologyIds = [comparisonConfig.referenceTopologyId, ...comparisonConfig.comparisonTopologyIds]
        .filter((id, index, list) => id && list.indexOf(id) === index);
    const topologyInvariants = topologyIds.flatMap((id) => computeTopologyInvariants(topologyLookup(id), computedAt));
    const cycleData = topologyIds.map((id) => computeCycleData(topologyLookup(id)));
    const cycleDataByTopology = new Map(cycleData.map((entry) => [entry.topologyId, entry]));
    const topologySensitiveEvents = detectTopologySensitiveEvents({
        comparisonConfig,
        runResults,
        selectedDetectorIds: comparisonConfig.selectedEventDetectorIds,
        cycleDataByTopology
    });
    const observableComparisons = buildObservableComparisons(comparisonConfig, runResults);
    const divergenceScores = buildDivergenceScores(comparisonConfig, runResults, topologySensitiveEvents);
    const exportManifest = {
        schemaName: 'LabTopologyComparisonExportManifest',
        schemaVersion: LAB_SCHEMA_VERSION,
        comparisonId: comparisonConfig.comparisonId,
        comparisonHash: comparisonConfig.comparisonHash,
        batchHash: batchConfig.batchHash,
        appVersion: comparisonConfig.appVersion,
        createdAt: comparisonConfig.createdAt,
        exportedAt: computedAt,
        files: [
            { fileName: 'topology-comparison-config.json', mediaType: 'application/json', description: 'LabTopologyComparisonConfig.' },
            { fileName: 'experiment-configs.json', mediaType: 'application/json', description: 'Expanded LabExperimentConfig objects.' },
            { fileName: 'results.json', mediaType: 'application/json', description: 'LabExperimentResult records.' },
            { fileName: 'topology-invariants.csv', mediaType: 'text/csv', description: 'Invariant table with exactness labels.' },
            { fileName: 'topology-sensitive-events.json', mediaType: 'application/json', description: 'Detector output with confidence and limitations.' },
            { fileName: 'divergence-scores.csv', mediaType: 'text/csv', description: 'Exploratory topology-sensitive divergence scores.' },
            { fileName: 'replay-bundle.json', mediaType: 'application/json', description: 'Config, results, invariants, cycle data, and manifest.' }
        ],
        formats: ['json', 'csv'],
        reproducibilityNotes: [
            'Same model, fixed parameters, seed plan, initial-condition mapping method, and observable set are stored in the comparison config.',
            'Topology-sensitive divergence scores are exploratory metrics, not universal physical invariants.'
        ],
        validationWarnings: [
            'Estimated graph and cycle values are labelled as estimated.',
            ...warnings
        ]
    };
    exportManifest.manifestHash = labHash({ ...exportManifest, manifestHash: '' }, 'topology-comparison-manifest');
    const payload = { comparisonConfig, batchHash: batchConfig.batchHash, topologyInvariants, topologySensitiveEvents, divergenceScores, failedRuns };
    const result = {
        schemaName: 'LabTopologyComparisonResult',
        schemaVersion: LAB_SCHEMA_VERSION,
        comparisonConfig,
        batchConfig,
        topologyInvariants,
        cycleData,
        runResults,
        topologySensitiveEvents,
        observableComparisons,
        divergenceScores,
        failedRuns,
        warnings,
        exportManifest,
        comparisonResultHash: labHash(payload, 'topology-comparison-result'),
        metadata: {
            languageSafeguard: 'finite-size same-rule comparison; no proof or universal metric claimed'
        }
    };
    result.reproducibilityMetadata = buildBasicReproducibilityMetadata({
        schemaName: 'LabTopologyComparisonResult',
        modelId: comparisonConfig.modelId,
        modelVersion: `${comparisonConfig.modelId}@${comparisonConfig.appVersion}`,
        rngSeed: comparisonConfig.seedPlan?.resolvedSeeds?.[0] ?? null,
        seedPlan: comparisonConfig.seedPlan,
        configHash: comparisonConfig.comparisonHash,
        resultHash: result.comparisonResultHash,
        exportManifestHash: exportManifest.manifestHash,
        deterministicReplaySupported: true,
        createdAt: comparisonConfig.createdAt
    });
    return result;
}

export function invariantRows(result) {
    return (result?.topologyInvariants || []).map((entry) => ({
        topologyId: entry.topologyId,
        name: entry.name,
        value: stableStringify(entry.value),
        category: entry.category,
        exactness: entry.exactness,
        method: entry.method,
        topologyHash: entry.topologyHash
    }));
}

export function eventRows(result) {
    return (result?.topologySensitiveEvents || []).map((event) => ({
        eventId: event.eventId,
        eventType: event.eventType,
        step: event.step,
        topologyId: event.topologyId,
        confidence: event.confidence,
        exactness: event.exactness,
        relatedObservableIds: event.relatedObservableIds.join('|')
    }));
}

export function divergenceRows(result) {
    return (result?.divergenceScores || []).map((score) => ({
        scoreId: score.scoreId,
        referenceTopologyId: score.referenceTopologyId,
        comparisonTopologyId: score.comparisonTopologyId,
        observableId: score.observableId,
        distanceMethod: score.distanceMethod,
        normalizationMethod: score.normalizationMethod,
        seedAggregationMethod: score.seedAggregationMethod,
        value: score.value,
        confidence: score.confidence
    }));
}

const OPERATOR_GRAPH_SCHEMA = 'topoboard.operatorGraph.v0';

const NODE_KINDS = new Set([
    'operator',
    'particle',
    'defect',
    'domain',
    'site',
    'measurement',
    'boundary',
    'worldline'
]);

const EDGE_KINDS = new Set([
    'adjacency',
    'coupling',
    'worldline',
    'fusion-channel',
    'constraint',
    'measurement-link'
]);

function cloneValue(value) {
    if (Array.isArray(value)) return value.map(cloneValue);
    if (value && typeof value === 'object') {
        return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, cloneValue(entry)]));
    }
    return value;
}

function normalizeTags(tags) {
    return Array.isArray(tags)
        ? [...new Set(tags.map((tag) => String(tag)).filter(Boolean))]
        : [];
}

function normalizeNode(node = {}) {
    const id = String(node.id || '').trim();
    if (!id) throw new Error('Operator graph node requires a stable id.');
    return {
        id,
        kind: NODE_KINDS.has(node.kind) ? node.kind : 'operator',
        label: String(node.label || id),
        flavor: node.flavor ?? null,
        charge: node.charge ?? null,
        state: cloneValue(node.state ?? {}),
        position: cloneValue(node.position ?? null),
        attachedBoardSiteId: node.attachedBoardSiteId == null ? null : String(node.attachedBoardSiteId),
        tags: normalizeTags(node.tags)
    };
}

function normalizeEdge(edge = {}) {
    const source = String(edge.source || '').trim();
    const target = String(edge.target || '').trim();
    const id = String(edge.id || `${source}->${target}:${edge.kind || 'adjacency'}`).trim();
    if (!id || !source || !target) throw new Error('Operator graph edge requires id, source, and target.');
    return {
        id,
        source,
        target,
        kind: EDGE_KINDS.has(edge.kind) ? edge.kind : 'adjacency',
        orientation: edge.orientation ?? null,
        state: cloneValue(edge.state ?? {}),
        tags: normalizeTags(edge.tags)
    };
}

function normalizeAction(action = {}) {
    return {
        ...cloneValue(action),
        id: String(action.id || action.action || action.kind || `action:${Date.now()}`),
        action: String(action.action || action.kind || 'local_rewrite')
    };
}

function normalizeObservable(observable = {}) {
    return {
        ...cloneValue(observable),
        id: String(observable.id || observable.name || `observable:${Date.now()}`),
        name: String(observable.name || observable.id || 'Observable')
    };
}

export function createOperatorGraphSpec(raw = {}) {
    const graph = {
        schema: OPERATOR_GRAPH_SCHEMA,
        id: String(raw.id || `operator-graph:${Date.now()}`),
        nameEn: String(raw.nameEn || raw.name || 'Operator Graph'),
        nameZh: String(raw.nameZh || raw.name || '算子圖'),
        baseBoardId: raw.baseBoardId == null ? null : String(raw.baseBoardId),
        baseBoardSpecRef: raw.baseBoardSpecRef == null ? null : cloneValue(raw.baseBoardSpecRef),
        nodes: [],
        edges: [],
        actions: Array.isArray(raw.actions) ? raw.actions.map(normalizeAction) : [],
        observables: Array.isArray(raw.observables) ? raw.observables.map(normalizeObservable) : [],
        history: Array.isArray(raw.history) ? raw.history.map(cloneValue) : [],
        metadata: cloneValue(raw.metadata || {})
    };
    const seenNodes = new Set();
    for (const node of raw.nodes || []) {
        const normalized = normalizeNode(node);
        if (seenNodes.has(normalized.id)) throw new Error(`Duplicate operator graph node id: ${normalized.id}`);
        seenNodes.add(normalized.id);
        graph.nodes.push(normalized);
    }
    const seenEdges = new Set();
    for (const edge of raw.edges || []) {
        const normalized = normalizeEdge(edge);
        if (seenEdges.has(normalized.id)) throw new Error(`Duplicate operator graph edge id: ${normalized.id}`);
        seenEdges.add(normalized.id);
        graph.edges.push(normalized);
    }
    return graph;
}

export function addOperatorNode(graph, node) {
    const normalized = normalizeNode(node);
    const existing = graph.nodes.findIndex((entry) => entry.id === normalized.id);
    if (existing >= 0) graph.nodes[existing] = normalized;
    else graph.nodes.push(normalized);
    return normalized;
}

export function addOperatorEdge(graph, edge) {
    const normalized = normalizeEdge(edge);
    const existing = graph.edges.findIndex((entry) => entry.id === normalized.id);
    if (existing >= 0) graph.edges[existing] = normalized;
    else graph.edges.push(normalized);
    return normalized;
}

export function removeOperatorNode(graph, nodeId) {
    const id = String(nodeId);
    const before = graph.nodes.length;
    graph.nodes = graph.nodes.filter((node) => node.id !== id);
    graph.edges = graph.edges.filter((edge) => edge.source !== id && edge.target !== id);
    return before !== graph.nodes.length;
}

export function removeOperatorEdge(graph, edgeId) {
    const id = String(edgeId);
    const before = graph.edges.length;
    graph.edges = graph.edges.filter((edge) => edge.id !== id);
    return before !== graph.edges.length;
}

export function getOperatorNeighbors(graph, nodeId) {
    const id = String(nodeId);
    const neighbors = [];
    for (const edge of graph.edges) {
        if (edge.source === id) neighbors.push(edge.target);
        if (edge.target === id) neighbors.push(edge.source);
    }
    return [...new Set(neighbors)];
}

export function cloneOperatorGraph(graph) {
    return createOperatorGraphSpec(cloneValue(graph));
}

export function exportOperatorGraph(graph) {
    return JSON.stringify(createOperatorGraphSpec(graph), null, 2);
}

export function importOperatorGraph(json) {
    const raw = typeof json === 'string' ? JSON.parse(json) : json;
    return createOperatorGraphSpec(raw);
}

export const OPERATOR_GRAPH_NODE_KINDS = Object.freeze([...NODE_KINDS]);
export const OPERATOR_GRAPH_EDGE_KINDS = Object.freeze([...EDGE_KINDS]);

export function undirectedEdgeKey(a, b) {
    return String(a) < String(b) ? `${a}|${b}` : `${b}|${a}`;
}

export function buildAdjacencyMap(sites = [], edges = []) {
    const adjacency = new Map(sites.map((site) => [String(site.id), new Set()]));
    for (const edge of edges) {
        const source = String(edge.source);
        const target = String(edge.target);
        if (!adjacency.has(source) || !adjacency.has(target)) continue;
        adjacency.get(source).add(target);
        adjacency.get(target).add(source);
    }
    return adjacency;
}

export function connectedComponents(sites = [], edges = []) {
    const adjacency = buildAdjacencyMap(sites, edges);
    const remaining = new Set(adjacency.keys());
    const components = [];
    while (remaining.size) {
        const start = remaining.values().next().value;
        const component = [];
        const stack = [start];
        remaining.delete(start);
        while (stack.length) {
            const id = stack.pop();
            component.push(id);
            for (const neighbor of adjacency.get(id) || []) {
                if (!remaining.delete(neighbor)) continue;
                stack.push(neighbor);
            }
        }
        components.push(component);
    }
    return components;
}

export function validateVertexGraphBoard(board, options = {}) {
    const errors = [];
    const warnings = [];
    const sites = Array.isArray(board?.sites) ? board.sites : [];
    const edges = Array.isArray(board?.edges) ? board.edges : [];
    const ids = new Set();

    for (const [index, site] of sites.entries()) {
        if (site?.id === undefined || site?.id === null || site?.id === '') {
            errors.push(`Site at index ${index} has no stable id.`);
            continue;
        }
        const id = String(site.id);
        if (ids.has(id)) errors.push(`Duplicate site id: ${id}.`);
        ids.add(id);
        if (site.coord === undefined) warnings.push(`Site ${id} has no logical coord.`);
        if (site.draw === undefined && site.position === undefined) {
            warnings.push(`Site ${id} has no draw or position coordinate.`);
        }
    }

    const edgeKeys = new Set();
    for (const [index, edge] of edges.entries()) {
        const source = String(edge?.source);
        const target = String(edge?.target);
        if (!ids.has(source)) errors.push(`Edge ${index} references missing source ${source}.`);
        if (!ids.has(target)) errors.push(`Edge ${index} references missing target ${target}.`);
        if (source === target && !options.allowSelfLoops) errors.push(`Self-loop at ${source}.`);
        const key = undirectedEdgeKey(source, target);
        if (edgeKeys.has(key)) errors.push(`Duplicate undirected edge ${key}.`);
        edgeKeys.add(key);
    }

    const adjacency = buildAdjacencyMap(sites, edges);
    for (const [id, neighbors] of adjacency) {
        if (neighbors.size !== [...neighbors].length) errors.push(`Duplicate neighbors at ${id}.`);
        for (const neighbor of neighbors) {
            if (!adjacency.get(neighbor)?.has(id)) errors.push(`Asymmetric neighbor relation: ${id} -> ${neighbor}.`);
        }
    }

    const degrees = [...adjacency.values()].map((neighbors) => neighbors.size);
    const components = connectedComponents(sites, edges);
    const stats = {
        siteCount: sites.length,
        edgeCount: edges.length,
        minDegree: degrees.length ? Math.min(...degrees) : 0,
        maxDegree: degrees.length ? Math.max(...degrees) : 0,
        isolatedCount: degrees.filter((degree) => degree === 0).length,
        connectedComponents: components.length
    };

    if (options.expectedSiteCount !== undefined && stats.siteCount !== options.expectedSiteCount) {
        errors.push(`Expected ${options.expectedSiteCount} sites; found ${stats.siteCount}.`);
    }
    if (options.expectedEdgeCount !== undefined && stats.edgeCount !== options.expectedEdgeCount) {
        errors.push(`Expected ${options.expectedEdgeCount} edges; found ${stats.edgeCount}.`);
    }
    if (options.expectedDegree !== undefined) {
        for (const [id, neighbors] of adjacency) {
            if (neighbors.size !== options.expectedDegree) {
                errors.push(`Site ${id} has degree ${neighbors.size}; expected ${options.expectedDegree}.`);
            }
        }
    }
    if (Array.isArray(options.allowedDegreeRange)) {
        const [minimum, maximum] = options.allowedDegreeRange;
        for (const [id, neighbors] of adjacency) {
            if (neighbors.size < minimum || neighbors.size > maximum) {
                errors.push(`Site ${id} has degree ${neighbors.size}; expected ${minimum}-${maximum}.`);
            }
        }
    }
    if (options.bipartite) {
        const colors = new Map();
        for (const root of adjacency.keys()) {
            if (colors.has(root)) continue;
            colors.set(root, 0);
            const queue = [root];
            while (queue.length) {
                const id = queue.shift();
                for (const neighbor of adjacency.get(id) || []) {
                    if (!colors.has(neighbor)) {
                        colors.set(neighbor, 1 - colors.get(id));
                        queue.push(neighbor);
                    } else if (colors.get(neighbor) === colors.get(id)) {
                        errors.push(`Graph is not bipartite: ${id} and ${neighbor} share a color.`);
                    }
                }
            }
        }
    }
    if (options.connected && components.length !== (sites.length ? 1 : 0)) {
        errors.push(`Graph has ${components.length} connected components.`);
    }

    return { ok: errors.length === 0, errors, warnings, stats };
}

export function assertBoardValid(board, options = {}) {
    const result = validateVertexGraphBoard(board, options);
    if (!result.ok) {
        throw new Error(`Invalid vertex graph board:\n- ${result.errors.join('\n- ')}`);
    }
    return result;
}

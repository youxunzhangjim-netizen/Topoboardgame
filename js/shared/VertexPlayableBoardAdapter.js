export function getPlayableSites(board) {
    if (!board || board.playableKind !== 'vertex') return [];
    return Array.isArray(board.sites) ? board.sites : [];
}

export function getSiteDrawPosition(board, siteId) {
    const site = board?.siteById?.get(String(siteId))
        || getPlayableSites(board).find((candidate) => String(candidate.id) === String(siteId));
    return site?.draw || site?.position || null;
}

export function getGraphNeighbors(board, siteId) {
    if (!board || board.playableKind !== 'vertex') return [];
    return [...(board.adjacency?.get(String(siteId)) || [])];
}

export function hitTestPlayableSite(board, x, y, threshold) {
    const sites = getPlayableSites(board);
    const limit = Number.isFinite(Number(threshold))
        ? Number(threshold)
        : Number(board?.hitRadius) || 0;
    let best = null;
    for (const site of sites) {
        const draw = getSiteDrawPosition(board, site.id);
        if (!draw || !Number.isFinite(draw.x) || !Number.isFinite(draw.y)) continue;
        const distance = Math.hypot(Number(x) - draw.x, Number(y) - draw.y);
        if (distance > limit || (best && distance >= best.distance)) continue;
        best = { siteId: String(site.id), site, distance };
    }
    return best;
}

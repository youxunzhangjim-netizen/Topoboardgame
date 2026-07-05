import {
    getDrawPosition,
    getNeighborsForGame,
    getPlayableUnits,
    hitTestPlayableUnit
} from './PlayableSiteAdapter.js';

export function getPlayableSites(board) {
    return board?.playableKind === 'vertex' ? getPlayableUnits(board) : [];
}

export function getSiteDrawPosition(board, siteId) {
    return getDrawPosition(board, siteId);
}

export function getGraphNeighbors(board, siteId) {
    return board?.playableKind === 'vertex' ? getNeighborsForGame(board, siteId) : [];
}

export function hitTestPlayableSite(board, x, y, threshold) {
    if (board?.playableKind !== 'vertex') return null;
    return hitTestPlayableUnit(board, x, y, { threshold });
}

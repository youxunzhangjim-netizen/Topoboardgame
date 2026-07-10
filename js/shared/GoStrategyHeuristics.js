const DEFAULT_COLORS = Object.freeze({ empty: 0, black: 1, white: 2 });

function depsWithDefaults(deps = {}) {
  const COLORS = deps.COLORS || DEFAULT_COLORS;
  const valueToColor = deps.valueToColor || ((value) => {
    if (value === COLORS.black) return 'black';
    if (value === COLORS.white) return 'white';
    return '';
  });
  const otherColor = deps.otherColor || ((color) => color === 'black' ? 'white' : 'black');
  return { COLORS, valueToColor, otherColor };
}

function safeNeighbors(logic, index) {
  if (!logic || typeof logic.neighborsFromIndex !== 'function') return [];
  return logic.neighborsFromIndex(index).filter((next) => Number.isInteger(next) && next >= 0 && next < (logic.board?.length || 0));
}

function isPlayableIndex(logic, index) {
  if (!Number.isInteger(index) || index < 0 || index >= (logic.board?.length || 0)) return false;
  if (typeof logic.isPlayableIndex === 'function') return logic.isPlayableIndex(index);
  return true;
}

function coordIndex(logic, coord) {
  if (!Array.isArray(coord) || typeof logic?.indexFromCoord !== 'function') return -1;
  const index = logic.indexFromCoord(coord);
  return Number.isInteger(index) ? index : -1;
}

function adjacentGroups(logic, index, color, deps = {}) {
  const { COLORS } = depsWithDefaults(deps);
  const wanted = color === 'black' ? COLORS.black : COLORS.white;
  const seen = new Set();
  const groups = [];
  for (const next of safeNeighbors(logic, index)) {
    if (!isPlayableIndex(logic, next) || logic.board[next] !== wanted || seen.has(next)) continue;
    const group = logic.getGroupAndLiberties(logic.board, next);
    for (const stone of group.group) seen.add(stone);
    groups.push({
      anchor: next,
      size: group.group.size,
      liberties: group.liberties.size,
      libertySet: group.liberties
    });
  }
  return groups;
}

function simulateMove(logic, move, player, deps = {}) {
  if (!move || move.type === 'pass') return null;
  const { COLORS } = depsWithDefaults(deps);
  const index = coordIndex(logic, move.coord);
  if (!isPlayableIndex(logic, index) || logic.board[index] !== COLORS.empty) return null;
  const ownValue = player === 'black' ? COLORS.black : COLORS.white;
  const enemyValue = player === 'black' ? COLORS.white : COLORS.black;
  const nextBoard = new Uint8Array(logic.board);
  nextBoard[index] = ownValue;
  let captured = 0;
  const checked = new Set();
  for (const neighbor of safeNeighbors(logic, index)) {
    if (nextBoard[neighbor] !== enemyValue || checked.has(neighbor)) continue;
    const group = logic.getGroupAndLiberties(nextBoard, neighbor);
    for (const stone of group.group) checked.add(stone);
    if (group.liberties.size === 0) {
      for (const stone of group.group) {
        nextBoard[stone] = COLORS.empty;
        captured += 1;
      }
    }
  }
  if (nextBoard[index] !== ownValue) return null;
  const ownGroup = logic.getGroupAndLiberties(nextBoard, index);
  return { board: nextBoard, index, captured, ownLiberties: ownGroup.liberties.size, ownGroupSize: ownGroup.group.size };
}

function localEyeShape(logic, index, player, deps = {}) {
  const { COLORS } = depsWithDefaults(deps);
  const ownValue = player === 'black' ? COLORS.black : COLORS.white;
  const enemyValue = player === 'black' ? COLORS.white : COLORS.black;
  const neighbors = safeNeighbors(logic, index).filter((next) => isPlayableIndex(logic, next));
  if (!neighbors.length) return { ownEye: false, falseEyeRisk: false, friendlyRatio: 0, cutsNearby: 0 };
  let own = 0;
  let enemy = 0;
  let empty = 0;
  let weakFriendly = 0;
  for (const next of neighbors) {
    if (logic.board[next] === ownValue) {
      own += 1;
      const group = logic.getGroupAndLiberties(logic.board, next);
      if (group.liberties.size <= 2) weakFriendly += 1;
    } else if (logic.board[next] === enemyValue) {
      enemy += 1;
    } else {
      empty += 1;
    }
  }
  const friendlyRatio = own / neighbors.length;
  const ownEye = enemy === 0 && empty <= 1 && friendlyRatio >= 0.62;
  return {
    ownEye,
    falseEyeRisk: ownEye && weakFriendly >= 1,
    friendlyRatio,
    cutsNearby: empty + weakFriendly
  };
}

function groupLibertyAfterMove(logic, simulation, groupInfo) {
  if (!simulation || !groupInfo) return groupInfo?.liberties || 0;
  const anchor = groupInfo.anchor;
  if (!Number.isInteger(anchor) || simulation.board[anchor] === DEFAULT_COLORS.empty) return 0;
  try {
    return logic.getGroupAndLiberties(simulation.board, anchor).liberties.size;
  } catch {
    return groupInfo.liberties || 0;
  }
}

function boardPhase(logic) {
  const board = logic?.board || [];
  let playable = 0;
  let stones = 0;
  for (let i = 0; i < board.length; i += 1) {
    if (!isPlayableIndex(logic, i)) continue;
    playable += 1;
    if (board[i] !== DEFAULT_COLORS.empty) stones += 1;
  }
  return playable ? stones / playable : 0;
}

function topologyTag(logic) {
  return String(logic?.topology?.topology || logic?.topology || '').toLowerCase();
}

function latticeTag(logic) {
  return String(logic?.topology?.lattice || logic?.lattice || '').toLowerCase();
}

function hardBoundaryScore(logic, coord) {
  if (!Array.isArray(coord)) return 0;
  const topology = topologyTag(logic);
  const closed = /pbc|t2|t3|torus|sphere|rp2|klein|mobius/.test(topology);
  if (closed) return 0;
  const dims = coord.map((_, axis) => {
    if (logic.dimension === 3) return Number(logic.size) || 0;
    if (axis === 0) return Number(logic.width || logic.size) || 0;
    if (axis === 1) return Number(logic.height || logic.size) || 0;
    return Number(logic.size) || 0;
  });
  const minEdge = Math.min(...coord.map((v, axis) => Math.min(v, Math.max(0, dims[axis] - 1 - v))));
  if (minEdge === 0) return -9;
  if (minEdge === 1) return 5;
  if (minEdge === 2) return 3;
  return 0;
}

function graphDegreeScore(logic, index) {
  const degree = safeNeighbors(logic, index).filter((next) => isPlayableIndex(logic, next)).length;
  const lattice = latticeTag(logic);
  if (lattice === 'honeycomb') return 2.2 * Math.min(3, degree);
  if (lattice === 'triangular') return 0.75 * Math.min(6, degree);
  if (lattice === 'bcc' || lattice === 'fcc' || lattice === 'hcp') return 0.8 * Math.min(12, degree);
  return 1.1 * Math.min(4, degree);
}

export function scoreGoStrategicMove(logic, move, player, deps = {}) {
  if (!logic || !move || move.type === 'pass') return 0;
  const resolved = depsWithDefaults(deps);
  const opponent = resolved.otherColor(player);
  const index = coordIndex(logic, move.coord);
  if (!isPlayableIndex(logic, index)) return 0;
  const ownGroups = adjacentGroups(logic, index, player, resolved);
  const enemyGroups = adjacentGroups(logic, index, opponent, resolved);
  const simulation = simulateMove(logic, move, player, resolved);
  const captured = Math.max(Number(move.captured) || 0, simulation?.captured || 0);
  const phase = boardPhase(logic);
  const eye = localEyeShape(logic, index, player, resolved);
  let score = 0;

  score += 30 * captured + 6 * Math.min(6, captured);
  for (const group of enemyGroups) {
    if (group.liberties <= 1) score += 58 + 3.2 * group.size;
    else if (group.liberties === 2) score += 25 + 1.5 * group.size;
    else if (group.liberties === 3 && captured) score += 8;
  }
  const weakOwnGroups = ownGroups.filter((group) => group.liberties <= 2);
  for (const group of ownGroups) {
    if (group.liberties <= 1) score += 60 + 3.4 * group.size;
    else if (group.liberties === 2) score += 22 + 1.6 * group.size;
  }
  if (ownGroups.length >= 2) score += 20 + 9 * (ownGroups.length - 2);
  if (enemyGroups.length >= 2) score += 18 + 7 * (enemyGroups.length - 2);
  if (ownGroups.length >= 1 && enemyGroups.length >= 1) score += 9;

  if (simulation) {
    score += 2.4 * Math.min(8, simulation.ownLiberties);
    if (simulation.ownLiberties <= 1 && captured <= 0) score -= 78;
    else if (simulation.ownLiberties === 2 && weakOwnGroups.length === 0 && captured <= 0) score -= 18;
    for (const group of ownGroups) {
      const afterLibs = groupLibertyAfterMove(logic, simulation, group);
      if (group.liberties <= 2 && afterLibs > group.liberties) score += 10 * (afterLibs - group.liberties);
    }
  }

  if (eye.ownEye) score -= move.ownTerritoryFill ? 94 : 38;
  if (eye.falseEyeRisk) score -= 28;
  if (eye.cutsNearby >= 2 && ownGroups.length) score += 15;
  if (move.ownTerritoryFill && captured <= 0 && phase < 0.72) score -= 38;
  if (move.opponentTerritoryInvasion) score += 12 + Math.min(16, Number(move.regionSize) || 0);
  if (move.neutralRegion && ownGroups.length && enemyGroups.length === 0) score += 8;
  score += graphDegreeScore(logic, index);
  score += hardBoundaryScore(logic, move.coord);
  return score;
}

export function explainGoStrategicMove(logic, move, player, deps = {}) {
  if (!logic || !move || move.type === 'pass') return [];
  const resolved = depsWithDefaults(deps);
  const opponent = resolved.otherColor(player);
  const index = coordIndex(logic, move.coord);
  if (!isPlayableIndex(logic, index)) return [];
  const ownGroups = adjacentGroups(logic, index, player, resolved);
  const enemyGroups = adjacentGroups(logic, index, opponent, resolved);
  const simulation = simulateMove(logic, move, player, resolved);
  const reasons = [];
  if ((simulation?.captured || move.captured || 0) > 0) reasons.push('captures or finishes an adjacent atari group');
  if (ownGroups.some((group) => group.liberties <= 1)) reasons.push('saves a friendly group in atari');
  if (enemyGroups.filter((group) => group.liberties <= 2).length >= 2) reasons.push('creates multi-threat pressure against weak groups');
  if (ownGroups.length >= 2) reasons.push('connects friendly groups across a cutting point');
  if (enemyGroups.length >= 2) reasons.push('cuts between opponent groups on the graph');
  if (simulation && simulation.ownLiberties <= 1 && (simulation.captured || 0) <= 0) reasons.push('warning: self-atari risk');
  const eye = localEyeShape(logic, index, player, resolved);
  if (eye.ownEye) reasons.push('avoids filling a likely own eye unless tactically needed');
  if (/pbc|t2|t3|torus|sphere|rp2|klein|mobius/.test(topologyTag(logic))) {
    reasons.push('uses graph liberties instead of screen-edge corner assumptions');
  }
  return reasons.slice(0, 4);
}

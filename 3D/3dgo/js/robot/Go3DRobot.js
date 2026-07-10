import { GoGameLogic, COLORS, otherColor, valueToColor } from '../GoGame.js';
import { recordRobotLearningMove } from '../../../../js/shared/RobotLearningRecorder.js';
import { chooseGoOpeningBookMove } from '../../../../js/shared/RobotOpeningBook.js';
import { explainGoStrategicMove, scoreGoStrategicMove } from '../../../../js/shared/GoStrategyHeuristics.js';

const TOPOLOGY_INFLUENCE = new Set(['t3', 'r3_random', 't2', 'cylinder', 'sphere_latitude_ring', 'klein_bottle', 'mobius_strip', 'rp2']);
const BUDGET = { 1: 80, 2: 200, 3: 420, 4: 760 };
const TIME_MS = { 1: 160, 2: 380, 3: 760, 4: 1250 };
const CANDIDATE_CAP = { 1: 14, 2: 22, 3: 32, 4: 44 };
const PLAYOUT_DEPTH = { 1: 2, 2: 4, 3: 6, 4: 8 };

function sigmoid(score, scale = 90) { return 1 / (1 + Math.exp(-score / scale)); }
function now() { return globalThis.performance?.now?.() ?? Date.now(); }
function cloneLogic(logic) { const copy = new GoGameLogic(); copy.importState(logic.exportState()); return copy; }
function coordLabel(coord) { return `(${coord.join(',')})`; }
function clampLevel(value) { return Math.max(1, Math.min(4, Math.floor(Number(value) || 3))); }

function searchProfile(logic, level) {
  const points = playablePointCount(logic);
  const largeThreshold = logic.dimension === 3 ? 80 : 150;
  const hugeThreshold = logic.dimension === 3 ? 180 : 360;
  const large = points > largeThreshold;
  const huge = points > hugeThreshold;
  const baseCap = CANDIDATE_CAP[level] || 22;
  return {
    points,
    fullScan: !large,
    rawCandidateLimit: huge ? 128 : large ? 96 : Infinity,
    candidateCap: large ? Math.max(12, Math.round(baseCap * (huge ? 0.5 : 0.68))) : baseCap,
    budget: Math.max(34, Math.round((BUDGET[level] || 180) * (huge ? 0.32 : large ? 0.58 : 1))),
    timeMs: Math.max(95, Math.round((TIME_MS[level] || 350) * (huge ? 0.52 : large ? 0.72 : 1))),
    playoutDepth: Math.max(1, (PLAYOUT_DEPTH[level] || 4) - (huge ? 4 : large ? 2 : 0)),
    replyLimit: huge ? 4 : large ? 5 : 7
  };
}

function playablePointCount(logic) {
  try { return typeof logic.playableCoords === 'function' ? logic.playableCoords().length : logic.board?.length || 0; }
  catch { return logic.board?.length || 0; }
}

function coordKey(coord) { return Array.isArray(coord) ? coord.join(',') : String(coord); }

function isPlayableIndex(logic, index) {
  if (!Number.isInteger(Number(index)) || index < 0 || index >= (logic.board?.length || 0)) return false;
  return typeof logic.isPlayableIndex === 'function' ? logic.isPlayableIndex(index) : true;
}

function legalMoves(logic, player = logic.currentPlayer, options = {}) {
  const profile = options.profile || searchProfile(logic, 2);
  const coords = profile.fullScan && !options.opening
    ? logic.playableCoords()
    : tacticalCandidateCoords(logic, player, { limit: options.opening ? Math.max(36, Math.min(80, profile.rawCandidateLimit || 80)) : profile.rawCandidateLimit });
  const sparseLarge = isSparseLargeBoard(logic);
  const regionInfo = sparseLarge ? () => ({ owner: '', size: 0 }) : createEmptyRegionLookup(logic);
  const moves = [];
  for (const coord of coords) {
    const idx = logic.indexFromCoord(coord);
    if (idx < 0 || logic.board[idx] !== COLORS.empty) continue;
    const preview = previewLegalPlay(logic, coord, player);
    if (preview.ok) {
      const region = regionInfo(idx);
      moves.push({
        type: 'play',
        coord,
        captured: preview.captured || 0,
        liberties: preview.liberties || 0,
        ownTerritoryFill: region.owner === player && (preview.captured || 0) <= 0,
        opponentTerritoryInvasion: region.owner === otherColor(player),
        neutralRegion: !region.owner,
        regionSize: region.size,
        prior: 0
      });
    }
  }
  moves.push({ type: 'pass', coord: null, captured: 0, prior: passPrior(logic, player) });
  return moves;
}
function applyMove(logic, move, player) { return move.type === 'pass' ? logic.pass(player) : logic.tryPlay(move.coord, player); }

function previewLegalPlay(logic, coord, color) {
  if (logic.gameOver || logic.scoringPending || !logic.containsCoord(coord)) return { ok: false };
  const index = logic.indexFromCoord(coord);
  if (!isPlayableIndex(logic, index) || logic.board[index] !== COLORS.empty) return { ok: false };
  const ownValue = color === 'black' ? COLORS.black : COLORS.white;
  const enemyValue = color === 'black' ? COLORS.white : COLORS.black;
  const nextBoard = new Uint8Array(logic.board);
  nextBoard[index] = ownValue;
  let captured = 0;
  const checkedEnemyGroups = new Set();
  for (const neighbor of logic.neighborsFromIndex(index)) {
    if (nextBoard[neighbor] !== enemyValue || checkedEnemyGroups.has(neighbor)) continue;
    const enemy = logic.getGroupAndLiberties(nextBoard, neighbor);
    for (const stone of enemy.group) checkedEnemyGroups.add(stone);
    if (enemy.liberties.size === 0) {
      for (const stone of enemy.group) { nextBoard[stone] = COLORS.empty; captured += 1; }
    }
  }
  const own = logic.getGroupAndLiberties(nextBoard, index);
  if (own.liberties.size === 0) return { ok: false };
  const serialized = logic.serializeBoard(nextBoard);
  if (logic.positionSet?.has(serialized)) return { ok: false };
  return { ok: true, captured, liberties: own.liberties.size };
}

function createEmptyRegionLookup(logic) {
  const cache = new Map();
  return function regionFor(startIndex) {
    if (!isPlayableIndex(logic, startIndex) || logic.board[startIndex] !== COLORS.empty) return { owner: '', size: 0 };
    if (cache.has(startIndex)) return cache.get(startIndex);
    const visited = new Set([startIndex]);
    const region = [];
    const borders = new Set();
    const stack = [startIndex];
    while (stack.length) {
      const index = stack.pop();
      region.push(index);
      for (const next of logic.neighborsFromIndex(index)) {
        if (!isPlayableIndex(logic, next)) continue;
        const value = logic.board[next];
        if (value === COLORS.empty) {
          if (!visited.has(next)) {
            visited.add(next);
            stack.push(next);
          }
        } else {
          const color = valueToColor(value);
          if (color) borders.add(color);
        }
      }
    }
    const info = { owner: borders.size === 1 ? [...borders][0] : '', size: region.length };
    for (const index of region) cache.set(index, info);
    return info;
  };
}

function tacticalCandidateCoords(logic, player, { limit = 96 } = {}) {
  const all = logic.playableCoords();
  const cap = Number.isFinite(limit) ? Math.max(18, Math.floor(limit)) : Infinity;
  if (all.length <= 150) return all;
  const candidates = new Map();
  const addCoord = (coord, priority = 0) => {
    if (!Array.isArray(coord) || !logic.containsCoord(coord)) return;
    const index = logic.indexFromCoord(coord);
    if (!isPlayableIndex(logic, index) || logic.board[index] !== COLORS.empty) return;
    const key = coordKey(coord);
    const previous = candidates.get(key);
    if (!previous || previous.priority < priority) candidates.set(key, { coord: [...coord], priority });
  };
  const addIndex = (index, priority = 0) => {
    if (isPlayableIndex(logic, index) && logic.board[index] === COLORS.empty) addCoord(logic.coordFromIndex(index), priority);
  };

  addStrategicAnchors(logic, addCoord);
  addRecentLocalMoves(logic, addIndex);

  const visited = new Set();
  for (let index = 0; index < logic.board.length; index += 1) {
    if (!isPlayableIndex(logic, index) || visited.has(index)) continue;
    const color = valueToColor(logic.board[index]);
    if (!color) continue;
    const group = logic.getGroupAndLiberties(logic.board, index);
    for (const stone of group.group) visited.add(stone);
    const friendly = color === player;
    const urgency = group.liberties.size <= 1 ? 150 : group.liberties.size === 2 ? 115 : group.liberties.size === 3 ? 82 : 48;
    for (const liberty of group.liberties) addIndex(liberty, urgency + (friendly ? 6 : 18) + Math.min(18, group.group.size));
    for (const stone of group.group) {
      for (const next of logic.neighborsFromIndex(stone)) {
        if (logic.board[next] === COLORS.empty) addIndex(next, friendly ? 38 : 46);
        else for (const next2 of logic.neighborsFromIndex(next)) addIndex(next2, 24);
      }
    }
  }

  if (candidates.size < Math.min(24, cap * 0.45)) addSpacedAnchors(logic, addCoord, cap);
  if (!candidates.size) {
    for (const coord of all) {
      addCoord(coord, 1);
      if (candidates.size >= cap) break;
    }
  }
  return [...candidates.values()].sort((a, b) => b.priority - a.priority).slice(0, cap).map((entry) => entry.coord);
}

function addStrategicAnchors(logic, addCoord) {
  if (logic.dimension === 3) {
    const size = Math.max(1, Number(logic.size) || 1);
    const low = size >= 7 ? 2 : 1;
    const mid = Math.floor((size - 1) / 2);
    const high = size - 1 - low;
    const axes = uniqueNumbers([low, mid, high]).filter((v) => v >= 0 && v < size);
    for (const z of axes) for (const y of axes) for (const x of axes) addCoord([x, y, z], x === mid && y === mid && z === mid ? 78 : 58);
    if (TOPOLOGY_INFLUENCE.has(logic.topology)) {
      const stride = Math.max(1, Math.floor(size / 5));
      for (let i = 0; i < size; i += stride) for (const axis of axes) {
        addCoord([0, i, axis], 42);
        addCoord([size - 1, i, axis], 42);
        addCoord([i, 0, axis], 42);
        addCoord([i, size - 1, axis], 42);
      }
    }
    return;
  }
  const width = Math.max(1, Number(logic.width) || Number(logic.size) || 1);
  const height = Math.max(1, Number(logic.height) || Number(logic.size) || 1);
  const xs = uniqueNumbers([width >= 13 ? 3 : 2, Math.floor((width - 1) / 2), width - 1 - (width >= 13 ? 3 : 2)]).filter((v) => v >= 0 && v < width);
  const ys = uniqueNumbers([height >= 13 ? 3 : 2, Math.floor((height - 1) / 2), height - 1 - (height >= 13 ? 3 : 2)]).filter((v) => v >= 0 && v < height);
  for (const y of ys) for (const x of xs) addCoord([x, y], 58);
}

function addRecentLocalMoves(logic, addIndex) {
  const history = Array.isArray(logic.moveHistory) ? logic.moveHistory : [];
  for (const entry of history.slice(0, 8)) {
    if (entry?.type !== 'play' || !Array.isArray(entry.coord)) continue;
    const index = logic.indexFromCoord(entry.coord);
    if (!isPlayableIndex(logic, index)) continue;
    for (const next of logic.neighborsFromIndex(index)) {
      addIndex(next, 76);
      for (const next2 of logic.neighborsFromIndex(next)) addIndex(next2, 42);
    }
  }
}

function addSpacedAnchors(logic, addCoord, cap) {
  const all = logic.playableCoords();
  const stride = Math.max(2, Math.floor(Math.sqrt(all.length / Math.max(1, cap * 0.55))));
  for (let i = 0; i < all.length; i += stride) addCoord(all[i], 16);
}

function uniqueNumbers(values) {
  return [...new Set(values.map((value) => Math.round(Number(value))).filter(Number.isFinite))];
}

function groupStats(logic, color) {
  const value = color === 'black' ? COLORS.black : COLORS.white;
  const visited = new Set();
  const groups = [];
  for (let i = 0; i < logic.board.length; i += 1) {
    if (!logic.isPlayableIndex(i) || logic.board[i] !== value || visited.has(i)) continue;
    const group = logic.getGroupAndLiberties(logic.board, i);
    for (const s of group.group) visited.add(s);
    groups.push({ size: group.group.size, liberties: group.liberties.size, anchor: logic.coordFromIndex(i) });
  }
  return groups;
}
function latticeLibertyWeight(logic) {
  if (logic.lattice === 'bcc' || logic.lattice === 'fcc') return 1.2;
  if (logic.lattice === 'hcp') return 1.45;
  return 1.8;
}
function groupValue(logic, groups) {
  const lw = latticeLibertyWeight(logic);
  return groups.reduce((sum, g) => sum + 2.3 * g.size + lw * g.liberties - (g.liberties <= 1 ? 24 + g.size : g.liberties === 2 ? 9 : 0) + (g.size >= 5 && g.liberties >= 5 ? 8 : 0) + 14 * groupEyePotential(logic, g), 0);
}
function topologyValue(logic, color) {
  const value = color === 'black' ? COLORS.black : COLORS.white;
  let score = 0;
  for (let i = 0; i < logic.board.length; i += 1) {
    if (!logic.isPlayableIndex(i) || logic.board[i] !== value) continue;
    const coord = logic.coordFromIndex(i);
    const nearEdge = coord.some((v, axis) => v === 0 || v === (logic.dimension === 3 ? logic.size : axis === 0 ? logic.width : logic.height) - 1);
    if (logic.topology === 'cylinder' && coord[0] === 0) score += 2.8;
    else if (nearEdge && TOPOLOGY_INFLUENCE.has(logic.topology)) score += 1.6;
    const degree = logic.neighborsFromIndex(i).length;
    if (logic.lattice === 'bcc' || logic.lattice === 'fcc' || logic.lattice === 'hcp') score += 0.25 * degree;
  }
  return score;
}
function mobility(logic, color) {
  return fastMobility(logic, color);
}

function fastMobility(logic, color) {
  const friendly = color === 'black' ? COLORS.black : COLORS.white;
  const enemy = color === 'black' ? COLORS.white : COLORS.black;
  const visited = new Set();
  const liberties = new Set();
  let shape = 0;
  for (let index = 0; index < logic.board.length; index += 1) {
    if (!isPlayableIndex(logic, index) || visited.has(index)) continue;
    const value = logic.board[index];
    if (value !== friendly && value !== enemy) continue;
    const group = logic.getGroupAndLiberties(logic.board, index);
    for (const stone of group.group) visited.add(stone);
    const attacking = value === enemy;
    for (const liberty of group.liberties) liberties.add(liberty);
    shape += (attacking && group.liberties.size <= 3 ? 1.2 : value === friendly ? 1 : 0.35) * Math.min(7, group.liberties.size);
  }
  if (!visited.size) return Math.min(14, playablePointCount(logic));
  return liberties.size + shape;
}
function evaluate(logic, player = logic.currentPlayer) {
  if (logic.gameOver && logic.winner) {
    if (logic.winner === player) return 100000;
    if (logic.winner === 'draw') return 0;
    return -100000;
  }
  const opponent = otherColor(player);
  let area = { black: 0, white: 0 };
  try { area = logic.computeAreaScore?.() || area; } catch {}
  const areaDiff = (area[player] || 0) - (area[opponent] || 0);
  const captureDiff = (logic.captures[player] || 0) - (logic.captures[opponent] || 0);
  const sparseLarge = isSparseLargeBoard(logic);
  const territoryDiff = sparseLarge ? 0 : territorySecurityScore(logic, player) - territorySecurityScore(logic, opponent);
  return 13 * areaDiff + 9 * captureDiff + groupValue(logic, groupStats(logic, player)) - groupValue(logic, groupStats(logic, opponent)) + topologyValue(logic, player) - topologyValue(logic, opponent) + territoryDiff + 1.3 * (mobility(logic, player) - mobility(logic, opponent));
}

function isSparseLargeBoard(logic) {
  return playablePointCount(logic) > (logic.dimension === 3 ? 80 : 150) && boardFillRatio(logic) < 0.16;
}

function movePrior(logic, move, player) {
  if (move.type === 'pass') return passPrior(logic, player);
  if (isSparseLargeBoard(logic)) return staticMovePrior(logic, move, player);
  const trial = cloneLogic(logic);
  const before = evaluate(logic, player);
  const result = trial.tryPlay(move.coord, player);
  if (!result.ok) return -1e9;
  let score = evaluate(trial, player) - before + 18 * (move.captured || result.captured || 0);
  if (move.ownTerritoryFill) score -= ownTerritoryFillPenalty(logic, move);
  if (move.opponentTerritoryInvasion) score += Math.min(14, Math.max(0, Number(move.regionSize) || 0));
  if (move.neutralRegion) score += Math.min(8, Math.max(0, Number(move.regionSize) || 0) * 0.25);
  score += scoreGoStrategicMove(logic, move, player, { COLORS, valueToColor, otherColor });
  score += basicShapeScore(logic, move, player);
  score += territoryProtectionMoveScore(logic, move, player);
  const idx = trial.indexFromCoord(move.coord);
  if (idx >= 0) {
    const group = trial.getGroupAndLiberties(trial.board, idx);
    score += 1.8 * group.liberties.size;
    if (group.liberties.size <= 1) score -= 40;
  }
  const coord = move.coord;
  if (coord && logic.topology === 'cylinder' && (coord[0] === 0 || coord[0] === logic.width - 1)) score += 14;
  else if (coord && coord.some((v, axis) => v === 0 || v === (logic.dimension === 3 ? logic.size : axis === 0 ? logic.width : logic.height) - 1) && TOPOLOGY_INFLUENCE.has(logic.topology)) score += 10;
  if (logic.lattice !== 'sc' && logic.lattice !== 'square') score += 0.7 * (idx >= 0 ? trial.neighborsFromIndex(idx).length : 0);
  return score;
}

function staticMovePrior(logic, move, player) {
  if (move.type === 'pass') return passPrior(logic, player);
  const idx = logic.indexFromCoord(move.coord);
  if (idx < 0) return -1e9;
  let score = 0;
  score += 46 * (move.captured || 0);
  score += 2.4 * (move.liberties || logic.neighborsFromIndex(idx).length || 0);
  if (move.ownTerritoryFill) score -= ownTerritoryFillPenalty(logic, move);
  if (move.opponentTerritoryInvasion) score += Math.min(16, Math.max(0, Number(move.regionSize) || 0));
  if (move.neutralRegion) score += Math.min(10, Math.max(0, Number(move.regionSize) || 0) * 0.18);
  score += scoreGoStrategicMove(logic, move, player, { COLORS, valueToColor, otherColor });
  score += basicShapeScore(logic, move, player);
  score += topologyStaticBonus(logic, move.coord);
  score += centerInfluence(logic, move.coord);
  if (logic.lattice !== 'sc' && logic.lattice !== 'square') score += 0.55 * logic.neighborsFromIndex(idx).length;
  return score;
}

function topologyStaticBonus(logic, coord) {
  if (!coord) return 0;
  let score = 0;
  const last = logic.dimension === 3 ? logic.size - 1 : [logic.width - 1, logic.height - 1];
  const nearEdge = coord.some((value, axis) => value === 0 || value === (logic.dimension === 3 ? last : last[axis]));
  if (logic.topology === 'cylinder' && coord[0] === 0) score += 12;
  else if (nearEdge && TOPOLOGY_INFLUENCE.has(logic.topology)) score += 9;
  return score;
}

function centerInfluence(logic, coord) {
  if (!coord) return 0;
  if (logic.dimension === 3) {
    const center = (logic.size - 1) / 2;
    const distance = Math.abs(coord[0] - center) + Math.abs(coord[1] - center) + Math.abs(coord[2] - center);
    return Math.max(0, 18 - 3.2 * distance);
  }
  const cx = ((logic.width || logic.size) - 1) / 2;
  const cy = ((logic.height || logic.size) - 1) / 2;
  const distance = Math.abs(coord[0] - cx) + Math.abs(coord[1] - cy);
  return Math.max(0, 12 - 2.5 * distance);
}

function basicShapeScore(logic, move, player) {
  if (!move?.coord) return 0;
  const index = logic.indexFromCoord(move.coord);
  if (index < 0) return 0;
  const ownGroups = adjacentGroupInfos(logic, index, player);
  const enemyGroups = adjacentGroupInfos(logic, index, otherColor(player));
  let score = 0;
  for (const group of ownGroups) {
    if (group.liberties <= 1) score += 40 + 2 * group.size;
    else if (group.liberties === 2) score += 16 + group.size;
  }
  if (ownGroups.length >= 2) score += 18 + 7 * (ownGroups.length - 2);
  for (const group of enemyGroups) {
    if (group.liberties <= 1) score += 44 + 2.5 * group.size;
    else if (group.liberties === 2) score += 18 + group.size;
  }
  const eye = localEyeInfo(logic, index, player);
  if (eye.ownEye) score -= move.ownTerritoryFill ? 88 : 32;
  if (eye.falseEyeRisk) score -= 42;
  if (eye.fakeEye) score -= 62;
  if (eye.cutsNearby >= 2 && ownGroups.length) score += 20;
  if (move.neutralRegion && ownGroups.length && enemyGroups.length === 0) score += 12;
  return score;
}

function adjacentGroupInfos(logic, index, color) {
  const wanted = color === 'black' ? COLORS.black : COLORS.white;
  const seen = new Set();
  const groups = [];
  for (const next of logic.neighborsFromIndex(index)) {
    if (logic.board[next] !== wanted || seen.has(next)) continue;
    const group = logic.getGroupAndLiberties(logic.board, next);
    for (const stone of group.group) seen.add(stone);
    groups.push({ size: group.group.size, liberties: group.liberties.size, anchor: logic.coordFromIndex(next) });
  }
  return groups;
}

function localEyeInfo(logic, index, player) {
  const ownValue = player === 'black' ? COLORS.black : COLORS.white;
  const enemyValue = player === 'black' ? COLORS.white : COLORS.black;
  const neighbors = logic.neighborsFromIndex(index).filter((next) => typeof logic.isPlayableIndex !== 'function' || logic.isPlayableIndex(next));
  if (!neighbors.length) return { ownEye: false, falseEyeRisk: false, fakeEye: false, friendlyRatio: 0, cutsNearby: 0 };
  let own = 0;
  let enemy = 0;
  let empty = 0;
  let weakFriendly = 0;
  for (const next of neighbors) {
    if (logic.board[next] === ownValue) {
      own += 1;
      const group = logic.getGroupAndLiberties(logic.board, next);
      if (group.liberties.size <= 2) weakFriendly += 1;
    }
    else if (logic.board[next] === enemyValue) enemy += 1;
    else empty += 1;
  }
  const friendlyRatio = own / neighbors.length;
  const ownEye = enemy === 0 && empty <= 1 && friendlyRatio >= 0.62;
  const falseEyeRisk = ownEye && adjacentGroupInfos(logic, index, player).some((group) => group.liberties <= 2);
  const cutsNearby = empty + weakFriendly;
  const fakeEye = ownEye && (weakFriendly >= 2 || cutsNearby >= 3);
  return { ownEye, falseEyeRisk, fakeEye, friendlyRatio, cutsNearby };
}

function groupEyePotential(logic, groupInfo) {
  const anchor = Array.isArray(groupInfo.anchor) ? logic.indexFromCoord(groupInfo.anchor) : -1;
  if (anchor < 0) return 0;
  const color = valueToColor(logic.board[anchor]);
  if (!color) return 0;
  const group = logic.getGroupAndLiberties(logic.board, anchor);
  let potential = 0;
  const sparseLarge = isSparseLargeBoard(logic);
  for (const liberty of group.liberties) {
    const eye = localEyeInfo(logic, liberty, color);
    if (eye.ownEye && !eye.falseEyeRisk && !eye.fakeEye) potential += 1;
    else if (eye.friendlyRatio >= 0.5) potential += 0.3;
    if (!sparseLarge) {
      const region = emptyRegionInfo(logic, liberty);
      if (region.owner === color && region.size >= 2) potential += Math.min(1.4, region.size / 5);
    }
  }
  if (groupInfo.size >= 5 && groupInfo.liberties >= 4) potential += 0.3;
  return Math.min(2.5, potential);
}

function territoryProtectionMoveScore(logic, move, player) {
  if (!move?.coord) return 0;
  const index = logic.indexFromCoord(move.coord);
  const ownGroups = adjacentGroupInfos(logic, index, player);
  const enemyGroups = adjacentGroupInfos(logic, index, otherColor(player));
  let score = 0;
  const region = isSparseLargeBoard(logic) ? { owner: '', size: 0 } : emptyRegionInfo(logic, index);
  if (region.owner === player) {
    const security = territoryRegionSecurity(logic, index, player);
    if (security.borderWeakness > 0 && !move.ownTerritoryFill) score += 18 * security.borderWeakness;
    if (move.ownTerritoryFill && security.borderWeakness <= 0) score -= 70;
  }
  if (ownGroups.length >= 2 && enemyGroups.length === 0) score += 24;
  if (ownGroups.some((group) => group.liberties <= 2) && enemyGroups.length) score += 16;
  return score;
}

function territorySecurityScore(logic, player) {
  let score = 0;
  const visited = new Set();
  for (let index = 0; index < logic.board.length; index += 1) {
    if (typeof logic.isPlayableIndex === 'function' && !logic.isPlayableIndex(index)) continue;
    if (logic.board[index] !== COLORS.empty || visited.has(index)) continue;
    const region = emptyRegionInfo(logic, index, visited);
    if (region.owner !== player) continue;
    const security = territoryRegionSecurity(logic, index, player);
    score += Math.min(28, region.size * 1.5);
    score += 16 * security.safeBorders;
    score -= 30 * security.borderWeakness;
    if (region.size >= 5 && security.safeBorders >= 2) score += 18;
  }
  return score;
}

function territoryRegionSecurity(logic, startIndex, player) {
  const ownValue = player === 'black' ? COLORS.black : COLORS.white;
  const visited = new Set([startIndex]);
  const stack = [startIndex];
  const borderGroups = new Map();
  while (stack.length) {
    const index = stack.pop();
    for (const next of logic.neighborsFromIndex(index)) {
      if (typeof logic.isPlayableIndex === 'function' && !logic.isPlayableIndex(next)) continue;
      if (logic.board[next] === COLORS.empty && !visited.has(next)) {
        visited.add(next);
        stack.push(next);
      } else if (logic.board[next] === ownValue) {
        const group = logic.getGroupAndLiberties(logic.board, next);
        const anchor = [...group.group][0];
        borderGroups.set(anchor, group.liberties.size);
      }
    }
  }
  let safeBorders = 0;
  let borderWeakness = 0;
  for (const liberties of borderGroups.values()) {
    if (liberties >= 4) safeBorders += 1;
    else if (liberties <= 2) borderWeakness += 1;
  }
  return { safeBorders, borderWeakness };
}

function passPrior(logic, player) {
  const fill = boardFillRatio(logic);
  const score = areaScoreDiff(logic, player);
  const ownDanger = groupStats(logic, player).filter((group) => group.liberties <= 1).length;
  const opponentDanger = groupStats(logic, otherColor(player)).filter((group) => group.liberties <= 1).length;
  const regions = emptyRegionSummary(logic);
  const settled = regions.total ? (regions.black + regions.white) / regions.total : 1;
  const neutral = regions.total ? regions.neutral / regions.total : 0;
  let value = -92 + 70 * fill + 58 * settled - 34 * neutral;
  if (logic.passCount > 0) value += 55;
  if (fill > 0.62) value += 18;
  if (fill > 0.78) value += 24;
  value += Math.max(-22, Math.min(22, score * 0.65));
  value -= 18 * ownDanger;
  value -= 14 * opponentDanger;
  return value;
}

function ownTerritoryFillPenalty(logic, move) {
  const size = Math.max(1, Number(move.regionSize) || 1);
  return 62 + Math.min(34, size * 1.25) + (boardFillRatio(logic) > 0.55 ? 36 : 0);
}

function areaScoreDiff(logic, player) {
  try {
    const area = logic.computeAreaScore?.() || {};
    const opponent = otherColor(player);
    return (Number(area[player]) || 0) - (Number(area[opponent]) || 0);
  } catch {
    return 0;
  }
}

function boardFillRatio(logic) {
  if (!logic.board?.length) return 0;
  let stones = 0;
  let playable = 0;
  for (let index = 0; index < logic.board.length; index += 1) {
    if (typeof logic.isPlayableIndex === 'function' && !logic.isPlayableIndex(index)) continue;
    playable += 1;
    if (logic.board[index] !== COLORS.empty) stones += 1;
  }
  return playable ? stones / playable : 0;
}

function emptyRegionSummary(logic) {
  const summary = { black: 0, white: 0, neutral: 0, total: 0 };
  const visited = new Set();
  for (let index = 0; index < logic.board.length; index += 1) {
    if (typeof logic.isPlayableIndex === 'function' && !logic.isPlayableIndex(index)) continue;
    if (logic.board[index] !== COLORS.empty || visited.has(index)) continue;
    const region = emptyRegionInfo(logic, index, visited);
    summary.total += region.size;
    if (region.owner === 'black') summary.black += region.size;
    else if (region.owner === 'white') summary.white += region.size;
    else summary.neutral += region.size;
  }
  return summary;
}

function emptyRegionInfo(logic, startIndex, visited = null) {
  if (startIndex < 0 || logic.board[startIndex] !== COLORS.empty) return { owner: '', size: 0 };
  if (typeof logic.isPlayableIndex === 'function' && !logic.isPlayableIndex(startIndex)) return { owner: '', size: 0 };
  const localVisited = visited || new Set();
  if (localVisited.has(startIndex)) return { owner: '', size: 0 };
  const stack = [startIndex];
  const borders = new Set();
  let size = 0;
  localVisited.add(startIndex);
  while (stack.length) {
    const index = stack.pop();
    size += 1;
    for (const next of logic.neighborsFromIndex(index)) {
      if (typeof logic.isPlayableIndex === 'function' && !logic.isPlayableIndex(next)) continue;
      const value = logic.board[next];
      if (value === COLORS.empty) {
        if (!localVisited.has(next)) {
          localVisited.add(next);
          stack.push(next);
        }
      } else {
        const color = valueToColor(value);
        if (color) borders.add(color);
      }
    }
  }
  return { owner: borders.size === 1 ? [...borders][0] : '', size };
}

function rankedMoves(logic, player, level, options = {}) {
  const profile = options.profile || searchProfile(logic, clampLevel(level));
  const ranked = legalMoves(logic, player, { profile, playout: options.playout }).map((m) => ({ ...m, prior: movePrior(logic, m, player) })).sort((a, b) => b.prior - a.prior);
  const picked = ranked.slice(0, options.playout ? profile.replyLimit : profile.candidateCap);
  const pass = ranked.find((move) => move.type === 'pass');
  if (pass && !picked.some((move) => move.type === 'pass')) picked[picked.length - 1] = pass;
  return picked.sort((a, b) => b.prior - a.prior);
}
function playoutScore(logic, move, rootPlayer, level, profile = searchProfile(logic, level)) {
  const clone = cloneLogic(logic);
  const applied = applyMove(clone, move, rootPlayer);
  if (!applied?.ok && move.type !== 'pass') return -100000;
  let score = evaluate(clone, rootPlayer);
  for (let ply = 0; ply < profile.playoutDepth && !clone.gameOver && !clone.scoringPending; ply += 1) {
    const color = clone.currentPlayer;
    const replyProfile = searchProfile(clone, Math.min(level, 2));
    const moves = rankedMoves(clone, color, Math.min(level, 2), { profile: replyProfile, playout: true }).slice(0, profile.replyLimit);
    if (!moves.length) { clone.pass(color); continue; }
    const chosen = weightedPick(moves, clone, color);
    applyMove(clone, chosen, color);
  }
  return 0.45 * score + 0.55 * evaluate(clone, rootPlayer);
}
function weightedPick(moves, logic, player) {
  const weights = moves.map((m) => Math.exp(Math.max(-16, Math.min(16, movePrior(logic, m, player) / 12))));
  let r = Math.random() * (weights.reduce((a, b) => a + b, 0) || 1);
  for (let i = 0; i < moves.length; i += 1) { r -= weights[i]; if (r <= 0) return moves[i]; }
  return moves[0];
}
export function analyzeGo3DPosition(logic, level = 1) {
  level = clampLevel(level);
  const profile = searchProfile(logic, level);
  const player = logic.currentPlayer;
  const before = evaluate(logic, player);
  const opening = chooseGoOpeningBookMove(logic, legalMoves(logic, player, { profile, opening: true }), player);
  const candidates = rankedMoves(logic, player, level, { profile });
  if (opening && !candidates.some((move) => sameMove(move, opening.move))) candidates.unshift(opening.move);
  const stats = candidates.map((move) => ({
    move,
    visits: 0,
    total: 0,
    best: -Infinity,
    prior: (Number(move.prior) || movePrior(logic, move, player)) + (opening && sameMove(move, opening.move) ? Math.max(-12, Math.min(12, opening.score / 12)) : 0)
  }));
  const deadline = now() + profile.timeMs;
  let sims = 0;
  for (const s of stats) { const v = playoutScore(logic, s.move, player, level, profile); s.visits++; s.total += v; s.best = Math.max(s.best, v); sims++; }
  while (sims < profile.budget && now() < deadline) {
    const totalVisits = stats.reduce((a, s) => a + s.visits, 0) + 1;
    let picked = stats[0], bestUcb = -Infinity;
    for (const s of stats) {
      const mean = s.total / Math.max(1, s.visits);
      const ucb = mean + 20 * Math.sqrt(Math.log(totalVisits + 1) / Math.max(1, s.visits)) + Math.tanh(s.prior / 40) * 6;
      if (ucb > bestUcb) { bestUcb = ucb; picked = s; }
    }
    const v = playoutScore(logic, picked.move, player, level, profile);
    picked.visits++; picked.total += v; picked.best = Math.max(picked.best, v); sims++;
  }
  const rows = stats.map((s) => {
    const score = 0.82 * (s.total / Math.max(1, s.visits)) + 0.18 * s.best + 0.04 * s.prior;
    return { move: s.move, score, winRate: sigmoid(score), reasons: moveReason(logic, s.move, before, score), visits: s.visits };
  }).sort((a, b) => b.score - a.score);
  if (opening) {
    const row = rows.find((item) => sameMove(item.move, opening.move));
    if (row) {
      row.openingBook = opening.name;
      row.openingPly = opening.ply;
      row.reasons = [`Opening book considered: ${opening.name}`, ...row.reasons.filter((reason) => !String(reason).startsWith('Opening book'))];
    }
    rows.sort((a, b) => b.score - a.score);
  }
  const groups = groupStats(logic, player).sort((a, b) => (b.size + b.liberties) - (a.size + a.liberties)).slice(0, 8);
  return { player, currentScore: before, currentWinRate: sigmoid(before), topMoves: rows.slice(0, 5), badMoves: rows.slice(-5).reverse(), groups, searched: sims, topology: logic.topology, lattice: logic.lattice, truncated: sims < profile.budget, searchProfile: { points: profile.points, candidates: candidates.length, budget: profile.budget, largeBoard: !profile.fullScan } };
}

function sameMove(a, b) {
  if (!a || !b) return false;
  if (a.type === 'pass' || b.type === 'pass') return a.type === b.type;
  return Array.isArray(a.coord) && Array.isArray(b.coord) && a.coord.length === b.coord.length && a.coord.every((value, index) => Number(value) === Number(b.coord[index]));
}
function moveReason(logic, move, beforeScore, afterScore) {
  const reasons = [];
  if (move.type === 'pass') { reasons.push('passes because no local play wins enough value'); return reasons; }
  if (move.captured) reasons.push(`captures ${move.captured} stones`);
  const tmp = cloneLogic(logic); tmp.tryPlay(move.coord, logic.currentPlayer); const idx = tmp.indexFromCoord(move.coord);
  if (idx >= 0) { const group = tmp.getGroupAndLiberties(tmp.board, idx); if (group.liberties.size <= 1) reasons.push('danger: played group has one liberty'); else reasons.push(`creates ${group.liberties.size} liberties`); }
  if (afterScore > beforeScore + 10) reasons.push('improves estimated area/group value');
  if (logic.topology === 'cylinder') reasons.push('uses the 2D PBC robot strategy on the cylinder wrap');
  else if (logic.topology === 't3' || logic.topology === 't2') reasons.push('checks periodic wrap influence');
  if (logic.topology === 'r3_random') reasons.push('uses fixed 3D RBC neighbor graph');
  if (logic.topology === 'sphere_latitude_ring') reasons.push('uses sphere latitude-ring topology');
  if (logic.topology === 'klein_bottle') reasons.push('checks Klein bottle flipped wrap');
  if (logic.topology === 'mobius_strip') reasons.push('checks Mobius twisted seam');
  if (logic.topology === 'rp2') reasons.push('checks RP2 antipodal boundary');
  if (logic.lattice !== 'sc' && logic.lattice !== 'square') reasons.push(`uses ${logic.lattice.toUpperCase()} lattice liberties`);
  for (const reason of explainGoStrategicMove(logic, move, logic.currentPlayer, { COLORS, valueToColor, otherColor })) {
    if (!reasons.includes(reason)) reasons.push(reason);
  }
  return reasons.length ? reasons : ['best MCTS/root-search candidate'];
}
function render(panel, a) {
  panel.innerHTML = `<h3>3D Go Robot Analysis</h3><p><strong>${a.player}</strong> to play · score ${a.currentScore.toFixed(1)} · win estimate ${(a.currentWinRate * 100).toFixed(1)}% · ${a.topology}/${a.lattice} · sims ${a.searched}${a.truncated ? ' (time-limited)' : ''}</p><h4>Top plays</h4><ol>${a.topMoves.map(r => `<li><strong>${r.move.type === 'pass' ? 'Pass' : coordLabel(r.move.coord)}</strong> — ${r.score.toFixed(1)}, ${(r.winRate * 100).toFixed(1)}%, ${r.visits} sims<br>${r.reasons.join('; ')}</li>`).join('')}</ol><h4>Bad plays</h4><ol>${a.badMoves.map(r => `<li>${r.move.type === 'pass' ? 'Pass' : coordLabel(r.move.coord)} — ${r.score.toFixed(1)}<br>${r.reasons.join('; ')}</li>`).join('')}</ol><h4>Current group values</h4><div class="robot-chip-list">${a.groups.map(g => `<span class="robot-chip">${coordLabel(g.anchor)} size ${g.size}, libs ${g.liberties}</span>`).join('')}</div>`;
}

export function chooseGo3DRobotMove(logic, level = 1) {
  const player = logic.currentPlayer;
  const profile = searchProfile(logic, clampLevel(level));
  const opening = chooseGoOpeningBookMove(logic, legalMoves(logic, player, { profile, opening: true }), player);
  const analysis = analyzeGo3DPosition(logic, level);
  const best = analysis.topMoves[0] || null;
  const choseBookMove = opening && sameMove(best?.move, opening.move);
  return {
    move: best?.move || null,
    score: best?.score ?? analysis.currentScore,
    nodes: analysis.searched || 0,
    truncated: Boolean(analysis.truncated),
    openingBook: choseBookMove ? opening.name : undefined,
    openingPly: choseBookMove ? opening.ply : undefined,
    bookMoveConsidered: opening && !choseBookMove ? opening.name : undefined
  };
}

export function installGo3DRobot(app) {
  if (!app || app.__robot3dInstalled) return; app.__robot3dInstalled = true;
  const modeSelect = document.getElementById('gameModeSelect');
  if (modeSelect && !modeSelect.querySelector('option[value="robot"]')) modeSelect.insertAdjacentHTML('beforeend', '<option value="robot">Robot</option>');
  const sidebar = document.querySelector('.sidebar');
  const panel = document.createElement('section'); panel.className = 'panel robot-panel';
  panel.innerHTML = `<h3>Robot & Analysis</h3><div class="robot-row"><label>Robot side</label><select id="goRobotSideSelect"><option value="white">White</option><option value="black">Black</option></select></div><div class="robot-row"><label>Strength</label><select id="goRobotLevelSelect"><option value="1">Level 1</option><option value="2">Level 2</option><option value="3" selected>Level 3</option><option value="4">Level 4</option></select></div><div class="control-grid robot-buttons"><button id="goRobotMoveBtn" type="button">Robot Move</button><button id="goRobotAnalyzeBtn" type="button">Analyze Position</button></div><div class="robot-analysis" id="goRobotAnalysisPanel">Choose Robot, or click Analyze Position.</div>`;
  const historyPanel = document.getElementById('moveHistoryList')?.closest('.panel');
  if (historyPanel?.parentElement) historyPanel.insertAdjacentElement('afterend', panel);
  else sidebar?.appendChild(panel);
  const side = panel.querySelector('#goRobotSideSelect'); const level = panel.querySelector('#goRobotLevelSelect'); const out = panel.querySelector('#goRobotAnalysisPanel');
  const isRobotMode = () => modeSelect?.value === 'robot';
  let thinking = false;
  let pendingTimer = 0;
  function isRobotTurn() {
    return isRobotMode() && !app.logic.gameOver && !app.logic.scoringPending && app.logic.currentPlayer === side.value;
  }
  function updateButtons() {
    const closed = app.logic.gameOver || app.logic.scoringPending;
    panel.querySelector('#goRobotMoveBtn').disabled = thinking || closed || modeSelect?.value === 'online';
    panel.querySelector('#goRobotAnalyzeBtn').disabled = thinking || closed;
  }
  function chooseSafeMove(preferred) {
    if (app.logic.gameOver || app.logic.scoringPending) return null;
    const legal = legalMoves(app.logic, app.logic.currentPlayer);
    const legalPlays = legal.filter((move) => move.type === 'play');
    if (preferred?.type === 'play') {
      const key = coordLabel(preferred.coord);
      const match = legalPlays.find((move) => coordLabel(move.coord) === key);
      if (match) return match;
    }
    if (preferred?.type === 'pass') {
      const pass = legal.find((move) => move.type === 'pass');
      if (pass) return pass;
    }
    return legalPlays[0] || legal.find((move) => move.type === 'pass') || null;
  }
  function robotMessage(label) {
    if (app.logic.scoringPending) return `Robot played ${label}. Two passes. Both players must agree to count.`;
    if (app.logic.gameOver) return `Robot played ${label}.`;
    return `Robot played ${label}.`;
  }
  async function makeMove() {
    if (thinking || !isRobotTurn()) { updateButtons(); return; }
    thinking = true;
    out.textContent = 'Robot is thinking...';
    updateButtons();
    await new Promise(r => setTimeout(r, 20));
    try {
      const a = analyzeGo3DPosition(app.logic, Number(level.value) || 3); render(out, a);
      const move = chooseSafeMove(a.topMoves[0]?.move);
      if (!move) {
        const pass = app.logic.pass(app.logic.currentPlayer);
        if (pass.ok) {
          recordRobotLearningMove({ gameType: 'go', variant: '3d', topology: `${app.logic.topology || 'r3'}:${app.logic.lattice || 'sc'}`, player: side.value, robot: `level-${level.value || 1}`, move: { type: 'pass' }, result: app.logic.gameOver ? { gameOver: true, winner: app.logic.winner || null } : null });
          app.afterLocalAction?.(robotMessage('Pass'));
        }
        else out.textContent = `Robot found no legal move: ${pass.error || 'pass rejected'}`;
        return;
      }
      const actor = app.logic.currentPlayer;
      if (move.type !== 'pass' && await app.__spaceTimeScheduleRobotAction?.({
        kind: 'go',
        player: actor,
        coord: move.coord,
        score: a.topMoves[0]?.score ?? 0
      })) {
        recordRobotLearningMove({ gameType: 'go', variant: '3d+1', topology: `${app.logic.topology || 'r3'}:${app.logic.lattice || 'sc'}`, player: actor, robot: `level-${level.value || 1}:time-schedule`, move: { type: 'schedule', coord: move.coord, label: coordLabel(move.coord) }, score: a.topMoves[0]?.score ?? null, result: null });
        out.textContent = `Robot scheduled ${coordLabel(move.coord)}.`;
        return;
      }
      const result = move.type === 'pass' ? app.logic.pass(actor) : app.logic.tryPlay(move.coord, actor);
      if (!result.ok) {
        const pass = move.type === 'pass' ? null : app.logic.pass(actor);
        if (pass?.ok) {
          recordRobotLearningMove({ gameType: 'go', variant: '3d', topology: `${app.logic.topology || 'r3'}:${app.logic.lattice || 'sc'}`, player: actor, robot: `level-${level.value || 1}`, move: { type: 'pass', fallbackFor: move.coord || null }, result: app.logic.gameOver ? { gameOver: true, winner: app.logic.winner || null } : null });
          app.afterLocalAction?.(robotMessage('Pass'));
          return;
        }
        out.textContent = `Robot move was rejected: ${result.error || pass?.error || 'illegal move'}`;
        return;
      }
      recordRobotLearningMove({ gameType: 'go', variant: '3d', topology: `${app.logic.topology || 'r3'}:${app.logic.lattice || 'sc'}`, player: actor, robot: `level-${level.value || 1}`, move: { type: move.type, coord: move.coord || null, label: move.type === 'pass' ? 'Pass' : coordLabel(move.coord) }, result: app.logic.gameOver ? { gameOver: true, winner: app.logic.winner || null } : null });
      app.afterLocalAction?.(robotMessage(move.type === 'pass' ? 'Pass' : coordLabel(move.coord)));
      app.updateUI?.();
    } finally {
      thinking = false;
      updateButtons();
    }
  }
  function schedule() {
    if (pendingTimer) window.clearTimeout(pendingTimer);
    pendingTimer = 0;
    if (!isRobotTurn()) { updateButtons(); return; }
    pendingTimer = window.setTimeout(() => { pendingTimer = 0; makeMove(); }, 180);
  }
  panel.querySelector('#goRobotMoveBtn')?.addEventListener('click', makeMove);
  panel.querySelector('#goRobotAnalyzeBtn')?.addEventListener('click', () => render(out, analyzeGo3DPosition(app.logic, Number(level.value) || 3)));
  side.addEventListener('change', schedule); modeSelect?.addEventListener('change', () => { document.getElementById('onlineControls')?.classList.toggle('active', modeSelect.value === 'online'); schedule(); });
  const oldAfter = app.afterLocalAction?.bind(app); if (oldAfter) app.afterLocalAction = function(...args) { const result = oldAfter(...args); schedule(); return result; };
  const oldReset = app.resetGame?.bind(app); if (oldReset) app.resetGame = function(...args) { const result = oldReset(...args); schedule(); return result; };
  updateButtons();
  schedule();
}

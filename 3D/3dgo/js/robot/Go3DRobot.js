import { GoGameLogic, COLORS, otherColor, valueToColor } from '../GoGame.js';
import { recordRobotLearningMove } from '../../../../js/shared/RobotLearningRecorder.js';

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

function legalMoves(logic, player = logic.currentPlayer) {
  const moves = [];
  for (const coord of logic.playableCoords()) {
    const idx = logic.indexFromCoord(coord);
    if (idx < 0 || logic.board[idx] !== COLORS.empty) continue;
    const trial = cloneLogic(logic);
    const result = trial.tryPlay(coord, player);
    if (result.ok) {
      const region = emptyRegionInfo(logic, idx);
      moves.push({
        type: 'play',
        coord,
        captured: result.captured || 0,
        ownTerritoryFill: region.owner === player && (result.captured || 0) <= 0,
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
    if (nearEdge && TOPOLOGY_INFLUENCE.has(logic.topology)) score += 1.6;
    const degree = logic.neighborsFromIndex(i).length;
    if (logic.lattice === 'bcc' || logic.lattice === 'fcc' || logic.lattice === 'hcp') score += 0.25 * degree;
  }
  return score;
}
function mobility(logic, color) {
  const saved = logic.currentPlayer;
  logic.currentPlayer = color;
  let count = 0;
  try { count = legalMoves(logic, color).filter((m) => m.type !== 'pass').length; }
  finally { logic.currentPlayer = saved; }
  return count;
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
  return 13 * areaDiff + 9 * captureDiff + groupValue(logic, groupStats(logic, player)) - groupValue(logic, groupStats(logic, opponent)) + topologyValue(logic, player) - topologyValue(logic, opponent) + territorySecurityScore(logic, player) - territorySecurityScore(logic, opponent) + 1.3 * (mobility(logic, player) - mobility(logic, opponent));
}
function movePrior(logic, move, player) {
  if (move.type === 'pass') return passPrior(logic, player);
  const trial = cloneLogic(logic);
  const before = evaluate(logic, player);
  const result = trial.tryPlay(move.coord, player);
  if (!result.ok) return -1e9;
  let score = evaluate(trial, player) - before + 18 * (move.captured || result.captured || 0);
  if (move.ownTerritoryFill) score -= ownTerritoryFillPenalty(logic, move);
  if (move.opponentTerritoryInvasion) score += Math.min(14, Math.max(0, Number(move.regionSize) || 0));
  if (move.neutralRegion) score += Math.min(8, Math.max(0, Number(move.regionSize) || 0) * 0.25);
  score += basicShapeScore(logic, move, player);
  score += territoryProtectionMoveScore(logic, move, player);
  const idx = trial.indexFromCoord(move.coord);
  if (idx >= 0) {
    const group = trial.getGroupAndLiberties(trial.board, idx);
    score += 1.8 * group.liberties.size;
    if (group.liberties.size <= 1) score -= 40;
  }
  const coord = move.coord;
  if (coord && coord.some((v, axis) => v === 0 || v === (logic.dimension === 3 ? logic.size : axis === 0 ? logic.width : logic.height) - 1) && TOPOLOGY_INFLUENCE.has(logic.topology)) score += 10;
  if (logic.lattice !== 'sc' && logic.lattice !== 'square') score += 0.7 * (idx >= 0 ? trial.neighborsFromIndex(idx).length : 0);
  return score;
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
  for (const liberty of group.liberties) {
    const eye = localEyeInfo(logic, liberty, color);
    if (eye.ownEye && !eye.falseEyeRisk && !eye.fakeEye) potential += 1;
    else if (eye.friendlyRatio >= 0.5) potential += 0.3;
    const region = emptyRegionInfo(logic, liberty);
    if (region.owner === color && region.size >= 2) potential += Math.min(1.4, region.size / 5);
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
  const region = emptyRegionInfo(logic, index);
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

function rankedMoves(logic, player, level) {
  const ranked = legalMoves(logic, player).map((m) => ({ ...m, prior: movePrior(logic, m, player) })).sort((a, b) => b.prior - a.prior);
  const picked = ranked.slice(0, CANDIDATE_CAP[level] || 20);
  const pass = ranked.find((move) => move.type === 'pass');
  if (pass && !picked.some((move) => move.type === 'pass')) picked[picked.length - 1] = pass;
  return picked.sort((a, b) => b.prior - a.prior);
}
function playoutScore(logic, move, rootPlayer, level) {
  const clone = cloneLogic(logic);
  const applied = applyMove(clone, move, rootPlayer);
  if (!applied?.ok && move.type !== 'pass') return -100000;
  let score = evaluate(clone, rootPlayer);
  for (let ply = 0; ply < (PLAYOUT_DEPTH[level] || 4) && !clone.gameOver && !clone.scoringPending; ply += 1) {
    const color = clone.currentPlayer;
    const moves = rankedMoves(clone, color, Math.min(level, 2)).slice(0, 7);
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
  const player = logic.currentPlayer;
  const before = evaluate(logic, player);
  const candidates = rankedMoves(logic, player, level);
  const stats = candidates.map((move) => ({ move, visits: 0, total: 0, best: -Infinity, prior: move.prior }));
  const deadline = now() + (TIME_MS[level] || 350);
  let sims = 0;
  for (const s of stats) { const v = playoutScore(logic, s.move, player, level); s.visits++; s.total += v; s.best = Math.max(s.best, v); sims++; }
  while (sims < (BUDGET[level] || 180) && now() < deadline) {
    const totalVisits = stats.reduce((a, s) => a + s.visits, 0) + 1;
    let picked = stats[0], bestUcb = -Infinity;
    for (const s of stats) {
      const mean = s.total / Math.max(1, s.visits);
      const ucb = mean + 20 * Math.sqrt(Math.log(totalVisits + 1) / Math.max(1, s.visits)) + Math.tanh(s.prior / 40) * 6;
      if (ucb > bestUcb) { bestUcb = ucb; picked = s; }
    }
    const v = playoutScore(logic, picked.move, player, level);
    picked.visits++; picked.total += v; picked.best = Math.max(picked.best, v); sims++;
  }
  const rows = stats.map((s) => {
    const score = 0.82 * (s.total / Math.max(1, s.visits)) + 0.18 * s.best + 0.04 * s.prior;
    return { move: s.move, score, winRate: sigmoid(score), reasons: moveReason(logic, s.move, before, score), visits: s.visits };
  }).sort((a, b) => b.score - a.score);
  const groups = groupStats(logic, player).sort((a, b) => (b.size + b.liberties) - (a.size + a.liberties)).slice(0, 8);
  return { player, currentScore: before, currentWinRate: sigmoid(before), topMoves: rows.slice(0, 5), badMoves: rows.slice(-5).reverse(), groups, searched: sims, topology: logic.topology, lattice: logic.lattice, truncated: sims < (BUDGET[level] || 180) };
}
function moveReason(logic, move, beforeScore, afterScore) {
  const reasons = [];
  if (move.type === 'pass') { reasons.push('passes because no local play wins enough value'); return reasons; }
  if (move.captured) reasons.push(`captures ${move.captured} stones`);
  const tmp = cloneLogic(logic); tmp.tryPlay(move.coord, logic.currentPlayer); const idx = tmp.indexFromCoord(move.coord);
  if (idx >= 0) { const group = tmp.getGroupAndLiberties(tmp.board, idx); if (group.liberties.size <= 1) reasons.push('danger: played group has one liberty'); else reasons.push(`creates ${group.liberties.size} liberties`); }
  if (afterScore > beforeScore + 10) reasons.push('improves estimated area/group value');
  if (logic.topology === 't3' || logic.topology === 't2') reasons.push('checks periodic wrap influence');
  if (logic.topology === 'r3_random') reasons.push('uses fixed 3D RBC neighbor graph');
  if (logic.topology === 'sphere_latitude_ring') reasons.push('uses sphere latitude-ring topology');
  if (logic.topology === 'klein_bottle') reasons.push('checks Klein bottle flipped wrap');
  if (logic.topology === 'mobius_strip') reasons.push('checks Mobius twisted seam');
  if (logic.topology === 'rp2') reasons.push('checks RP2 antipodal boundary');
  if (logic.lattice !== 'sc' && logic.lattice !== 'square') reasons.push(`uses ${logic.lattice.toUpperCase()} lattice liberties`);
  return reasons.length ? reasons : ['best MCTS/root-search candidate'];
}
function render(panel, a) {
  panel.innerHTML = `<h3>3D Go Robot Analysis</h3><p><strong>${a.player}</strong> to play · score ${a.currentScore.toFixed(1)} · win estimate ${(a.currentWinRate * 100).toFixed(1)}% · ${a.topology}/${a.lattice} · sims ${a.searched}${a.truncated ? ' (time-limited)' : ''}</p><h4>Top plays</h4><ol>${a.topMoves.map(r => `<li><strong>${r.move.type === 'pass' ? 'Pass' : coordLabel(r.move.coord)}</strong> — ${r.score.toFixed(1)}, ${(r.winRate * 100).toFixed(1)}%, ${r.visits} sims<br>${r.reasons.join('; ')}</li>`).join('')}</ol><h4>Bad plays</h4><ol>${a.badMoves.map(r => `<li>${r.move.type === 'pass' ? 'Pass' : coordLabel(r.move.coord)} — ${r.score.toFixed(1)}<br>${r.reasons.join('; ')}</li>`).join('')}</ol><h4>Current group values</h4><div class="robot-chip-list">${a.groups.map(g => `<span class="robot-chip">${coordLabel(g.anchor)} size ${g.size}, libs ${g.liberties}</span>`).join('')}</div>`;
}

export function chooseGo3DRobotMove(logic, level = 1) {
  const analysis = analyzeGo3DPosition(logic, level);
  const best = analysis.topMoves[0] || null;
  return {
    move: best?.move || null,
    score: best?.score ?? analysis.currentScore,
    nodes: analysis.searched || 0,
    truncated: Boolean(analysis.truncated)
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

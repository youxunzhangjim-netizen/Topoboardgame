import { GoGameLogic, COLORS, otherColor, valueToColor } from '../GoGame.js';
const TOPOLOGY_INFLUENCE = new Set(['t3', 'r3_random', 't2', 'sphere_latitude_ring', 'klein_bottle', 'mobius_strip', 'rp2']);

function sigmoid(score, scale = 85) { return 1 / (1 + Math.exp(-score / scale)); }
function cloneLogic(logic) { const copy = new GoGameLogic(); copy.importState(logic.exportState()); return copy; }
function legalMoves(logic, limit = Infinity) {
  const moves = [];
  for (const coord of logic.playableCoords()) {
    if (logic.board[logic.indexFromCoord(coord)] !== COLORS.empty) continue;
    const trial = cloneLogic(logic);
    const result = trial.tryPlay(coord, logic.currentPlayer);
    if (result.ok) moves.push({ coord, captured: result.captured || 0 });
    if (moves.length >= limit) break;
  }
  return moves;
}
function coordLabel(coord) { return `(${coord.join(',')})`; }
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
function groupValue(groups) {
  return groups.reduce((sum, g) => sum + 2.2 * g.size + 1.8 * g.liberties - (g.liberties <= 1 ? 14 : g.liberties === 2 ? 5 : 0) + (g.size >= 4 && g.liberties >= 4 ? 4 : 0), 0);
}
function topologyValue(logic, color) {
  const value = color === 'black' ? COLORS.black : COLORS.white;
  let score = 0;
  for (let i = 0; i < logic.board.length; i += 1) {
    if (!logic.isPlayableIndex(i) || logic.board[i] !== value) continue;
    const coord = logic.coordFromIndex(i);
    const nearEdge = coord.some((v, axis) => v === 0 || v === (logic.dimension === 3 ? logic.size : axis === 0 ? logic.width : logic.height) - 1);
    if (nearEdge && TOPOLOGY_INFLUENCE.has(logic.topology)) score += 1.2;
    if (logic.lattice === 'bcc' || logic.lattice === 'fcc' || logic.lattice === 'hcp') score += 0.4 * logic.neighborsFromIndex(i).length;
  }
  return score;
}
function evaluate(logic, player = logic.currentPlayer) {
  const opponent = otherColor(player);
  const area = logic.computeAreaScore?.() || { black: 0, white: 0 };
  const areaDiff = (area[player] || 0) - (area[opponent] || 0);
  const captureDiff = (logic.captures[player] || 0) - (logic.captures[opponent] || 0);
  return 14 * areaDiff + 8 * captureDiff + groupValue(groupStats(logic, player)) - groupValue(groupStats(logic, opponent)) + topologyValue(logic, player) - topologyValue(logic, opponent);
}
function moveReason(logic, move, beforeScore, afterScore) {
  const reasons = [];
  if (move.captured) reasons.push(`captures ${move.captured} stones`);
  const idx = logic.indexFromCoord(move.coord);
  if (idx >= 0) {
    const tmp = cloneLogic(logic); tmp.tryPlay(move.coord, logic.currentPlayer);
    const group = tmp.getGroupAndLiberties(tmp.board, idx);
    if (group.liberties.size <= 1) reasons.push('danger: played group has one liberty');
    else reasons.push(`creates ${group.liberties.size} liberties`);
  }
  if (afterScore > beforeScore + 10) reasons.push('improves estimated area/group value');
  if (logic.topology === 't3' || logic.topology === 't2') reasons.push('checks periodic wrap influence');
  if (logic.topology === 'r3_random') reasons.push('uses fixed 3D RBC neighbor graph');
  if (logic.topology === 'sphere_latitude_ring') reasons.push('uses sphere latitude-ring topology');
  if (logic.topology === 'klein_bottle') reasons.push('checks Klein bottle flipped wrap');
  if (logic.topology === 'mobius_strip') reasons.push('checks Mobius twisted seam');
  if (logic.topology === 'rp2') reasons.push('checks RP2 antipodal boundary');
  if (logic.lattice !== 'sc' && logic.lattice !== 'square') reasons.push(`uses ${logic.lattice.toUpperCase()} lattice liberties`);
  return reasons;
}
function analyzeLogic(logic, level = 1) {
  const player = logic.currentPlayer;
  const before = evaluate(logic, player);
  let candidates = legalMoves(logic);
  candidates = candidates.map((move) => {
    const trial = cloneLogic(logic); trial.tryPlay(move.coord, player);
    const one = evaluate(trial, player);
    return { ...move, one };
  }).sort((a, b) => b.one - a.one).slice(0, level >= 2 ? 70 : 160);
  const rows = candidates.map((move) => {
    const trial = cloneLogic(logic); trial.tryPlay(move.coord, player);
    let score = evaluate(trial, player);
    if (level >= 2) {
      const replies = legalMoves(trial, 40).map((reply) => { const r = cloneLogic(trial); r.tryPlay(reply.coord, trial.currentPlayer); return evaluate(r, player); });
      if (replies.length) score = Math.min(...replies);
    }
    return { move, score, winRate: sigmoid(score), reasons: moveReason(logic, move, before, score) };
  }).sort((a, b) => b.score - a.score);
  const groups = groupStats(logic, player).sort((a, b) => (b.size + b.liberties) - (a.size + a.liberties)).slice(0, 8);
  return { player, currentScore: before, currentWinRate: sigmoid(before), topMoves: rows.slice(0, 5), badMoves: rows.slice(-5).reverse(), groups, searched: candidates.length, topology: logic.topology, lattice: logic.lattice };
}
function render(panel, a) {
  panel.innerHTML = `<h3>3D Go Robot Analysis</h3><p><strong>${a.player}</strong> to play · score ${a.currentScore.toFixed(1)} · win estimate ${(a.currentWinRate * 100).toFixed(1)}% · ${a.topology}/${a.lattice} · candidates ${a.searched}</p><h4>Top plays</h4><ol>${a.topMoves.map(r => `<li><strong>${coordLabel(r.move.coord)}</strong> — ${r.score.toFixed(1)}, ${(r.winRate * 100).toFixed(1)}%<br>${r.reasons.join('; ')}</li>`).join('')}</ol><h4>Bad plays</h4><ol>${a.badMoves.map(r => `<li>${coordLabel(r.move.coord)} — ${r.score.toFixed(1)}<br>${r.reasons.join('; ')}</li>`).join('')}</ol><h4>Current group values</h4><div class="robot-chip-list">${a.groups.map(g => `<span class="robot-chip">${coordLabel(g.anchor)} size ${g.size}, libs ${g.liberties}</span>`).join('')}</div>`;
}
export function installGo3DRobot(app) {
  if (!app || app.__robot3dInstalled) return; app.__robot3dInstalled = true;
  const modeSelect = document.getElementById('gameModeSelect');
  if (modeSelect && !modeSelect.querySelector('option[value="robot"]')) modeSelect.insertAdjacentHTML('beforeend', '<option value="robot">Local Robot</option>');
  const sidebar = document.querySelector('.sidebar');
  const panel = document.createElement('section'); panel.className = 'panel robot-panel';
  panel.innerHTML = `<h3>Local Robot & Analysis</h3><div class="robot-row"><label>Robot side</label><select id="goRobotSideSelect"><option value="white">White</option><option value="black">Black</option></select></div><div class="robot-row"><label>Strength</label><select id="goRobotLevelSelect"><option value="1" selected>Level 1</option><option value="2">Level 2</option></select></div><div class="control-grid robot-buttons"><button id="goRobotMoveBtn" type="button">Robot Move</button><button id="goRobotAnalyzeBtn" type="button">Analyze Position</button></div><div class="robot-analysis" id="goRobotAnalysisPanel">Choose Local Robot, or click Analyze Position.</div>`;
  sidebar?.appendChild(panel);
  const side = panel.querySelector('#goRobotSideSelect'); const level = panel.querySelector('#goRobotLevelSelect'); const out = panel.querySelector('#goRobotAnalysisPanel');
  const isRobotMode = () => modeSelect?.value === 'robot';
  async function makeMove() {
    if (!isRobotMode() || app.logic.gameOver || app.logic.scoringPending || app.logic.currentPlayer !== side.value) return;
    out.textContent = 'Robot is thinking...'; await new Promise(r => setTimeout(r, 20));
    const a = analyzeLogic(app.logic, Number(level.value) || 1); render(out, a);
    const move = a.topMoves[0]?.move; if (!move) return;
    app.logic.tryPlay(move.coord, app.logic.currentPlayer); app.afterLocalAction?.(`Robot played ${coordLabel(move.coord)}.`); app.updateUI?.();
  }
  function schedule() { if (isRobotMode()) window.setTimeout(makeMove, 180); }
  panel.querySelector('#goRobotMoveBtn')?.addEventListener('click', makeMove);
  panel.querySelector('#goRobotAnalyzeBtn')?.addEventListener('click', () => render(out, analyzeLogic(app.logic, Number(level.value) || 1)));
  side.addEventListener('change', schedule); modeSelect?.addEventListener('change', () => { document.getElementById('onlineControls')?.classList.toggle('active', modeSelect.value === 'online'); schedule(); });
  const oldAfter = app.afterLocalAction?.bind(app); if (oldAfter) app.afterLocalAction = function(...args) { const result = oldAfter(...args); schedule(); return result; };
  schedule();
}

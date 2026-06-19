import { ReversiGame, otherReversiColor } from '../../../../js/reversi/ReversiGame.js';

const INF = 1e9;
const TIME_MS = { 1: 80, 2: 220, 3: 520, 4: 900 };
const NODE_LIMIT = { 1: 9000, 2: 25000, 3: 52000, 4: 88000 };
const ROOT_CAP = { 1: 90, 2: 44, 3: 30, 4: 24 };

function sigmoid(score, scale = 135) { return 1 / (1 + Math.exp(-score / scale)); }
function now() { return globalThis.performance?.now?.() ?? Date.now(); }
function clampDepth(value) { return Math.max(1, Math.min(4, Math.floor(Number(value) || 2))); }
function cloneLogic(logic) { const copy = new ReversiGame(); copy.importState(logic.exportState()); return copy; }
function coordLabel(coord) { return `(${coord.join(',')})`; }
function dimensions(logic) { return [logic.topology.width, logic.topology.height, logic.topology.depth || 1]; }
function isBoundaryCoord(logic, coord) { const dims = dimensions(logic); return coord.some((v, axis) => v === 0 || v === dims[axis] - 1); }
function isAnchorCoord(logic, coord) { const dims = dimensions(logic); return coord.every((v, axis) => v === 0 || v === dims[axis] - 1); }
function frontierCoord(logic, coord) { return logic.topology.directionsFor(coord).some(d => { const n = logic.topology.step(coord, d); return n && !logic.get(n); }); }
function context(depth, analysis = false) { const d = clampDepth(depth); const start = now(); return { nodes: 0, deadline: start + (analysis ? 1.35 : 1) * (TIME_MS[d] || 300), nodeLimit: NODE_LIMIT[d] || 25000, tt: new Map(), truncated: false, timeUp(){ if (now() >= this.deadline || this.nodes >= this.nodeLimit) { this.truncated = true; return true; } return false; } }; }

function evaluate(logic, player = logic.currentPlayer) {
  if (logic.gameOver && logic.winner) {
    if (logic.winner === player) return 100000;
    if (logic.winner === 'draw') return 0;
    return -100000;
  }
  const opponent = otherReversiColor(player); const counts = logic.counts();
  const moves = logic.legalMoves(player).length; const oppMoves = logic.legalMoves(opponent).length;
  let anchors = 0; let oppAnchors = 0; let frontier = 0; let oppFrontier = 0; let topo = 0; let oppTopo = 0; let stable = 0; let oppStable = 0;
  for (const coord of logic.topology.allCoords()) {
    const stone = logic.get(coord); if (!stone) continue;
    const nearEdge = isBoundaryCoord(logic, coord);
    const emptyNeighbor = frontierCoord(logic, coord);
    const isAnchor = isAnchorCoord(logic, coord);
    const add = stone.color === player;
    if (add) { if (isAnchor) anchors++; if (emptyNeighbor) frontier++; if (nearEdge && topological(logic)) topo++; if (isAnchor || stableFromAnchor(logic, coord, player)) stable++; }
    else { if (isAnchor) oppAnchors++; if (emptyNeighbor) oppFrontier++; if (nearEdge && topological(logic)) oppTopo++; if (isAnchor || stableFromAnchor(logic, coord, opponent)) oppStable++; }
  }
  const discWeight = counts.empty < Math.max(16, logic.topology.totalVertices * 0.15) ? 6.5 : counts.empty < logic.topology.totalVertices * 0.45 ? 2.2 : 0.9;
  return discWeight * ((counts[player] || 0) - (counts[opponent] || 0)) + 12 * (moves - oppMoves) + 56 * (anchors - oppAnchors) - 5 * (frontier - oppFrontier) + 30 * (stable - oppStable) + 4 * (topo - oppTopo);
}
function topological(logic) { return ['t3','r3_random','t2','cylinder','sphere','klein','mobius','rp2'].includes(logic.topology.topology); }
function stableFromAnchor(logic, coord, player) {
  if (!isBoundaryCoord(logic, coord)) return false;
  let hits = 0;
  for (const d of logic.topology.directionsFor(coord).slice(0, 18)) {
    const n = logic.topology.step(coord, d);
    if (n && logic.get(n)?.color === player && isBoundaryCoord(logic, n)) hits += 1;
  }
  return hits >= 2;
}
function moveScoreFast(logic, move, player) {
  let score = 8 * (move.flips?.length || 0);
  if (isAnchorCoord(logic, move.coord)) score += 150;
  else if (isBoundaryCoord(logic, move.coord)) score += topological(logic) ? 16 : 7;
  if (frontierCoord(logic, move.coord)) score -= 8;
  const clone = cloneLogic(logic); const result = clone.play(move.coord, player);
  if (!result.ok) return -INF;
  score += evaluate(clone, player) - evaluate(logic, player);
  score -= 5 * clone.legalMoves(otherReversiColor(player)).length;
  return score;
}
function orderMoves(logic, moves, player) { return moves.slice().sort((a,b) => moveScoreFast(logic,b,player)-moveScoreFast(logic,a,player)); }
function hash(logic, player, depth) { return `${depth}:${player}:${logic.currentPlayer}:${[...logic.board.entries()].map(([k,v])=>`${k}:${v.color}`).sort().join('|')}`; }
function negamax(logic, depth, alpha, beta, player, root, ctx) {
  ctx.nodes += 1;
  if ((ctx.nodes & 127) === 0 && ctx.timeUp()) return evaluate(logic, root);
  if (logic.gameOver || depth <= 0) return evaluate(logic, root);
  const key = hash(logic, player, depth); const cached = ctx.tt.get(key); if (cached !== undefined) return cached;
  let moves = orderMoves(logic, logic.legalMoves(player), player);
  if (!moves.length) { const pass = cloneLogic(logic); const ok = pass.pass(); if (!ok.ok) return evaluate(logic, root); return -negamax(pass, depth - 1, -beta, -alpha, otherReversiColor(player), root, ctx); }
  if (moves.length > 30 && depth >= 3) moves = moves.slice(0, 30);
  let best = -INF;
  for (const move of moves) {
    const clone = cloneLogic(logic); clone.play(move.coord, player);
    const score = -negamax(clone, depth - 1, -beta, -alpha, otherReversiColor(player), root, ctx);
    if (score > best) best = score;
    alpha = Math.max(alpha, score);
    if (alpha >= beta || ctx.truncated) break;
  }
  ctx.tt.set(key, best); return best;
}
export function analyzeReversi3DPosition(logic, depth = 2) {
  depth = clampDepth(depth);
  const player = logic.currentPlayer; const before = evaluate(logic, player); const ctx = context(depth, true);
  const rootMoves = orderMoves(logic, logic.legalMoves(player), player).slice(0, ROOT_CAP[depth] || 30);
  const rows = [];
  let completedDepth = 0;
  let bestRows = [];
  for (let d = 1; d <= depth; d += 1) {
    rows.length = 0;
    for (const move of rootMoves) {
      if (ctx.timeUp()) break;
      const t = cloneLogic(logic); t.play(move.coord, player);
      const score = -negamax(t, d - 1, -INF, INF, otherReversiColor(player), player, ctx);
      rows.push({ move: { ...move }, score, winRate: sigmoid(score), reasons: reason(logic, move, before, score) });
    }
    if (rows.length) { bestRows = rows.slice().sort((a,b)=>b.score-a.score); completedDepth = d; }
    if (ctx.truncated) break;
  }
  return { player, currentScore: before, currentWinRate: sigmoid(before), topMoves: bestRows.slice(0,5), badMoves: bestRows.slice(-5).reverse(), counts: logic.counts(), topology: logic.topology.topology, lattice: logic.topology.lattice, searched: ctx.nodes, completedDepth, truncated: ctx.truncated };
}
function reason(logic, move, before, after) {
  const reasons = [`flips ${move.flips?.length || 0} discs`];
  const coord = move.coord;
  if (isAnchorCoord(logic, coord)) reasons.push('takes a generalized 3D anchor/corner');
  else if (isBoundaryCoord(logic, coord)) reasons.push('takes boundary/surface control');
  if (after > before + 10) reasons.push('improves mobility/position score');
  if (frontierCoord(logic, coord)) reasons.push('frontier/surface exposure is checked');
  if (logic.topology.topology === 't3' || logic.topology.topology === 't2') reasons.push('checks periodic bracket lines');
  if (logic.topology.topology === 'r3_random') reasons.push('uses fixed 3D RBC boundary map');
  if (logic.topology.lattice === 'hcp') reasons.push('uses HCP bracket directions');
  if (logic.topology.topology === 'sphere') reasons.push('uses sphere embedded graph');
  if (logic.topology.topology === 'klein') reasons.push('checks Klein bottle flipped wrap');
  if (logic.topology.topology === 'mobius') reasons.push('checks Mobius twisted seam');
  if (logic.topology.topology === 'rp2') reasons.push('checks RP2 antipodal boundary');
  return reasons;
}
function render(panel, a) {
  panel.innerHTML = `<h3>3D Reversi Robot Analysis</h3><p><strong>${a.player}</strong> to play · score ${a.currentScore.toFixed(1)} · win estimate ${(a.currentWinRate*100).toFixed(1)}% · ${a.topology}/${a.lattice} · nodes ${a.searched}${a.truncated ? ' (time-limited)' : ''}</p><p>Black ${a.counts.black}, White ${a.counts.white}, Empty ${a.counts.empty}; completed depth ${a.completedDepth}</p><h4>Top moves</h4><ol>${a.topMoves.map(r=>`<li><strong>${coordLabel(r.move.coord)}</strong> — ${r.score.toFixed(1)}, ${(r.winRate*100).toFixed(1)}%<br>${r.reasons.join('; ')}</li>`).join('')}</ol><h4>Bad moves</h4><ol>${a.badMoves.map(r=>`<li>${coordLabel(r.move.coord)} — ${r.score.toFixed(1)}<br>${r.reasons.join('; ')}</li>`).join('')}</ol>`;
}

export function chooseReversi3DRobotMove(logic, depth = 2) {
  const analysis = analyzeReversi3DPosition(logic, depth);
  const best = analysis.topMoves[0] || null;
  return {
    move: best?.move || null,
    score: best?.score ?? analysis.currentScore,
    nodes: analysis.nodes || 0,
    truncated: Boolean(analysis.truncated)
  };
}

export function installReversi3DRobot(app) {
  if (!app || app.__robot3dInstalled) return; app.__robot3dInstalled = true;
  const modeSelect = document.getElementById('gameModeSelect'); if (modeSelect && !modeSelect.querySelector('option[value="robot"]')) modeSelect.insertAdjacentHTML('beforeend','<option value="robot">Robot</option>');
  const sidebar = document.querySelector('.sidebar'); const panel = document.createElement('section'); panel.className='panel robot-panel';
  panel.innerHTML = `<h3>Robot & Analysis</h3><div class="robot-row"><label>Robot side</label><select id="reversiRobotSideSelect"><option value="white">White</option><option value="black">Black</option></select></div><div class="robot-row"><label>Strength</label><select id="reversiRobotDepthSelect"><option value="1">Depth 1</option><option value="2" selected>Depth 2</option><option value="3">Depth 3</option><option value="4">Depth 4</option></select></div><div class="control-grid robot-buttons"><button id="reversiRobotMoveBtn" type="button">Robot Move</button><button id="reversiRobotAnalyzeBtn" type="button">Analyze Position</button></div><div class="robot-analysis" id="reversiRobotAnalysisPanel">Choose Robot, or click Analyze Position.</div>`;
  const historyPanel = document.getElementById('moveHistoryList')?.closest('.panel');
  if (historyPanel?.parentElement) historyPanel.insertAdjacentElement('afterend', panel);
  else sidebar?.appendChild(panel); const side=panel.querySelector('#reversiRobotSideSelect'); const depth=panel.querySelector('#reversiRobotDepthSelect'); const out=panel.querySelector('#reversiRobotAnalysisPanel'); const isRobot=()=>modeSelect?.value==='robot';
  async function makeMove(){ if(!isRobot()||app.logic.gameOver||app.logic.currentPlayer!==side.value)return; out.textContent='Robot is thinking...'; await new Promise(r=>setTimeout(r,20)); const a=analyzeReversi3DPosition(app.logic,Number(depth.value)||2); render(out,a); const m=a.topMoves[0]?.move; if(m){ const actor = app.logic.currentPlayer; const result = app.logic.play(m.coord, actor); if (result.ok) { app.setStatus?.(`Robot ${actor} flipped ${result.flipped} ${result.flipped === 1 ? 'stone' : 'stones'}.`); app.updateUI?.(); app.broadcastState?.(); } }}
  function schedule(){ if(isRobot()) window.setTimeout(makeMove,180); }
  panel.querySelector('#reversiRobotMoveBtn')?.addEventListener('click',makeMove); panel.querySelector('#reversiRobotAnalyzeBtn')?.addEventListener('click',()=>render(out,analyzeReversi3DPosition(app.logic,Number(depth.value)||2)));
  side.addEventListener('change',schedule); modeSelect?.addEventListener('change',()=>{ app.updateOnlineControls?.(); schedule(); });
  const oldPlayAt = app.playAt?.bind(app); if (oldPlayAt) app.playAt = function(...args){ const before = app.logic.currentPlayer; const r = oldPlayAt(...args); if (app.logic.currentPlayer !== before || app.logic.gameOver) schedule(); return r; };
  const oldPassTurn = app.passTurn?.bind(app); if (oldPassTurn) app.passTurn = function(...args){ const before = app.logic.currentPlayer; const r = oldPassTurn(...args); if (app.logic.currentPlayer !== before || app.logic.gameOver) schedule(); return r; };
  const oldReset = app.resetGame?.bind(app); if (oldReset) app.resetGame = function(...args){ const r = oldReset(...args); schedule(); return r; };
  schedule();
}

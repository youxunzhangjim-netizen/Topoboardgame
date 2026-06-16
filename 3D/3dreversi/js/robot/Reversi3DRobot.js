import { ReversiGame, otherReversiColor } from '../../../../js/reversi/ReversiGame.js';
function sigmoid(score, scale = 120) { return 1 / (1 + Math.exp(-score / scale)); }
function cloneLogic(logic) { const copy = new ReversiGame(); copy.importState(logic.exportState()); return copy; }
function coordLabel(coord) { return `(${coord.join(',')})`; }
function evaluate(logic, player = logic.currentPlayer) {
  const opponent = otherReversiColor(player); const counts = logic.counts();
  const moves = logic.legalMoves(player).length; const oppMoves = logic.legalMoves(opponent).length;
  let anchors = 0; let oppAnchors = 0; let frontier = 0; let oppFrontier = 0; let topo = 0; let oppTopo = 0;
  for (const coord of logic.topology.allCoords()) {
    const stone = logic.get(coord); if (!stone) continue;
    const nearEdge = coord.some((v, axis) => v === 0 || v === [logic.topology.width, logic.topology.height, logic.topology.depth || 1][axis] - 1);
    const emptyNeighbor = logic.topology.directionsFor(coord).some(d => { const n = logic.topology.step(coord, d); return n && !logic.get(n); });
    const isAnchor = coord.every((v, axis) => v === 0 || v === [logic.topology.width, logic.topology.height, logic.topology.depth || 1][axis] - 1);
    if (stone.color === player) { if (isAnchor) anchors++; if (emptyNeighbor) frontier++; if (nearEdge && ['t3','r3_random','t2','sphere'].includes(logic.topology.topology)) topo++; }
    else { if (isAnchor) oppAnchors++; if (emptyNeighbor) oppFrontier++; if (nearEdge && ['t3','r3_random','t2','sphere'].includes(logic.topology.topology)) oppTopo++; }
  }
  const discWeight = counts.empty < Math.max(16, logic.topology.totalVertices * 0.15) ? 5.5 : 1.2;
  return discWeight * ((counts[player] || 0) - (counts[opponent] || 0)) + 10 * (moves - oppMoves) + 45 * (anchors - oppAnchors) - 4 * (frontier - oppFrontier) + 3 * (topo - oppTopo);
}
function reason(logic, move, before, after) {
  const reasons = [`flips ${move.flips?.length || 0} discs`];
  const coord = move.coord;
  const isAnchor = coord.every((v, axis) => v === 0 || v === [logic.topology.width, logic.topology.height, logic.topology.depth || 1][axis] - 1);
  if (isAnchor) reasons.push('takes a generalized 3D anchor/corner');
  if (after > before + 8) reasons.push('improves mobility/position score');
  if (logic.topology.topology === 't3' || logic.topology.topology === 't2') reasons.push('checks periodic bracket lines');
  if (logic.topology.topology === 'r3_random') reasons.push('uses fixed 3D RBC boundary map');
  if (logic.topology.lattice === 'hcp') reasons.push('uses HCP bracket directions');
  if (logic.topology.topology === 'sphere') reasons.push('uses sphere embedded graph');
  return reasons;
}
function analyzeLogic(logic, depth = 2) {
  const player = logic.currentPlayer; const before = evaluate(logic, player);
  const moves = logic.legalMoves(player).map(m => { const t = cloneLogic(logic); t.play(m.coord, player); return { ...m, one: evaluate(t, player) }; }).sort((a,b)=>b.one-a.one).slice(0, depth >= 4 ? 80 : 180);
  const rows = moves.map(m => {
    const t = cloneLogic(logic); t.play(m.coord, player); let score = evaluate(t, player);
    if (depth >= 2) { const replies = t.legalMoves(t.currentPlayer).slice(0, 80).map(r => { const rr = cloneLogic(t); rr.play(r.coord, t.currentPlayer); return evaluate(rr, player); }); if (replies.length) score = Math.min(...replies); }
    return { move: m, score, winRate: sigmoid(score), reasons: reason(logic, m, before, score) };
  }).sort((a,b)=>b.score-a.score);
  return { player, currentScore: before, currentWinRate: sigmoid(before), topMoves: rows.slice(0,5), badMoves: rows.slice(-5).reverse(), counts: logic.counts(), topology: logic.topology.topology, lattice: logic.topology.lattice, searched: moves.length };
}
function render(panel, a) {
  panel.innerHTML = `<h3>3D Reversi Robot Analysis</h3><p><strong>${a.player}</strong> to play · score ${a.currentScore.toFixed(1)} · win estimate ${(a.currentWinRate*100).toFixed(1)}% · ${a.topology}/${a.lattice} · candidates ${a.searched}</p><p>Black ${a.counts.black}, White ${a.counts.white}, Empty ${a.counts.empty}</p><h4>Top moves</h4><ol>${a.topMoves.map(r=>`<li><strong>${coordLabel(r.move.coord)}</strong> — ${r.score.toFixed(1)}, ${(r.winRate*100).toFixed(1)}%<br>${r.reasons.join('; ')}</li>`).join('')}</ol><h4>Bad moves</h4><ol>${a.badMoves.map(r=>`<li>${coordLabel(r.move.coord)} — ${r.score.toFixed(1)}<br>${r.reasons.join('; ')}</li>`).join('')}</ol>`;
}
export function installReversi3DRobot(app) {
  if (!app || app.__robot3dInstalled) return; app.__robot3dInstalled = true;
  const modeSelect = document.getElementById('gameModeSelect'); if (modeSelect && !modeSelect.querySelector('option[value="robot"]')) modeSelect.insertAdjacentHTML('beforeend','<option value="robot">Local Robot</option>');
  const sidebar = document.querySelector('.sidebar'); const panel = document.createElement('section'); panel.className='panel robot-panel';
  panel.innerHTML = `<h3>Local Robot & Analysis</h3><div class="robot-row"><label>Robot side</label><select id="reversiRobotSideSelect"><option value="white">White</option><option value="black">Black</option></select></div><div class="robot-row"><label>Strength</label><select id="reversiRobotDepthSelect"><option value="1">Depth 1</option><option value="2" selected>Depth 2</option><option value="3">Depth 3</option></select></div><div class="control-grid robot-buttons"><button id="reversiRobotMoveBtn" type="button">Robot Move</button><button id="reversiRobotAnalyzeBtn" type="button">Analyze Position</button></div><div class="robot-analysis" id="reversiRobotAnalysisPanel">Choose Local Robot, or click Analyze Position.</div>`;
  sidebar?.appendChild(panel); const side=panel.querySelector('#reversiRobotSideSelect'); const depth=panel.querySelector('#reversiRobotDepthSelect'); const out=panel.querySelector('#reversiRobotAnalysisPanel'); const isRobot=()=>modeSelect?.value==='robot';
  async function makeMove(){ if(!isRobot()||app.logic.gameOver||app.logic.currentPlayer!==side.value)return; out.textContent='Robot is thinking...'; await new Promise(r=>setTimeout(r,20)); const a=analyzeLogic(app.logic,Number(depth.value)||2); render(out,a); const m=a.topMoves[0]?.move; if(m){ const actor = app.logic.currentPlayer; const result = app.logic.play(m.coord, actor); if (result.ok) { app.setStatus?.(`Robot ${actor} flipped ${result.flipped} ${result.flipped === 1 ? 'stone' : 'stones'}.`); app.updateUI?.(); app.broadcastState?.(); } }}
  function schedule(){ if(isRobot()) window.setTimeout(makeMove,180); }
  panel.querySelector('#reversiRobotMoveBtn')?.addEventListener('click',makeMove); panel.querySelector('#reversiRobotAnalyzeBtn')?.addEventListener('click',()=>render(out,analyzeLogic(app.logic,Number(depth.value)||2)));
  side.addEventListener('change',schedule); modeSelect?.addEventListener('change',()=>{ app.updateOnlineControls?.(); schedule(); });
  const oldPlayAt = app.playAt?.bind(app); if (oldPlayAt) app.playAt = function(...args){ const before = app.logic.currentPlayer; const r = oldPlayAt(...args); if (app.logic.currentPlayer !== before || app.logic.gameOver) schedule(); return r; };
  const oldPassTurn = app.passTurn?.bind(app); if (oldPassTurn) app.passTurn = function(...args){ const before = app.logic.currentPlayer; const r = oldPassTurn(...args); if (app.logic.currentPlayer !== before || app.logic.gameOver) schedule(); return r; };
  const oldReset = app.resetGame?.bind(app); if (oldReset) app.resetGame = function(...args){ const r = oldReset(...args); schedule(); return r; };
  schedule();
}

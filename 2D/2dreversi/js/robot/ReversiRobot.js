import { ReversiGame, otherReversiColor } from '../../../../js/reversi/ReversiGame.js';

const INF = 1e9;
const NODE_LIMIT_BY_DEPTH = { 1: 9000, 2: 22000, 3: 52000, 4: 90000, 5: 130000 };
const TIME_BY_DEPTH_MS = { 1: 70, 2: 180, 3: 430, 4: 850, 5: 1400 };
const ROOT_CAP_BY_DEPTH = { 1: 80, 2: 42, 3: 30, 4: 24, 5: 20 };

export class ReversiRobotController {
    constructor(app) {
        this.app = app;
        this.side = 'white';
        this.depth = 3;
        this.thinking = false;
        this.pendingTimer = null;
    }

    attach() {
        this.sideSelect = document.getElementById('robotSideSelect');
        this.depthSelect = document.getElementById('robotDepthSelect');
        this.moveButton = document.getElementById('robotMoveBtn');
        this.analyzeButton = document.getElementById('robotAnalyzeBtn');
        this.output = document.getElementById('robotAnalysisOutput');
        this.sideSelect?.addEventListener('change', () => { this.side = this.sideSelect.value === 'black' ? 'black' : 'white'; this.clearAnalysis(); this.app.updateOnlineControls?.(); this.scheduleIfNeeded(); this.app.updateUI(); });
        this.depthSelect?.addEventListener('change', () => { this.depth = clampDepth(Number(this.depthSelect.value) || 3); });
        this.moveButton?.addEventListener('click', () => this.forceMove());
        this.analyzeButton?.addEventListener('click', () => this.renderAnalysis());
        this.updatePanelState();
        this.clearAnalysis();
    }

    isRobotMode() { return this.app.gameModeSelect?.value === 'robot'; }
    isRobotTurn() { return this.isRobotMode() && !this.app.logic.gameOver && this.app.logic.currentPlayer === this.side; }
    shouldBlockHumanInput(color = this.app.logic.currentPlayer) { return this.thinking || (this.isRobotMode() && color === this.side); }
    scheduleIfNeeded() { if (this.pendingTimer) window.clearTimeout(this.pendingTimer); if (!this.isRobotTurn()) return; this.pendingTimer = window.setTimeout(() => this.forceMove(), 160); }
    afterLocalAction() { this.clearAnalysis(); this.scheduleIfNeeded(); }

    async forceMove() {
        if (this.thinking || this.app.logic.gameOver) return;
        if (!this.isRobotMode() && !window.confirm('Robot mode is not selected. Let the robot move once for the current side?')) return;
        this.thinking = true;
        this.setMessage(`Robot is searching for ${this.app.logic.currentPlayer} at depth ${this.depth}...`);
        this.updatePanelState();
        await nextFrame();
        try {
            const result = chooseReversiRobotMove(this.app.logic, this.depth);
            if (!result.move) {
                const pass = this.app.logic.pass();
                if (pass.ok) this.app.afterLocalAction('Robot passed.');
                else this.setMessage('Robot found no move and pass was rejected.');
                return;
            }
            const played = this.app.logic.play(result.move.coord, this.app.logic.currentPlayer);
            if (!played.ok) { this.setMessage(`Robot move was rejected: ${played.reason || 'illegal'}`); return; }
            this.app.afterLocalAction(`Robot played ${coordLabel(result.move.coord)} and flipped ${played.flipped}.`);
            this.setMessage(`Robot played ${coordLabel(result.move.coord)}. Score ${formatScore(result.score)}. Nodes ${result.nodes}${result.truncated ? ' (time-limited)' : ''}.`);
        } catch (error) { console.error(error); this.setMessage(`Robot error: ${error.message}`); }
        finally { this.thinking = false; this.updatePanelState(); }
    }

    async renderAnalysis() {
        if (this.thinking) return;
        this.thinking = true;
        this.setMessage(`Analyzing ${this.app.logic.currentPlayer} at depth ${this.depth}...`);
        this.updatePanelState();
        await nextFrame();
        try { this.renderAnalysisResult(analyzeReversiPosition(this.app.logic, this.depth)); }
        catch (error) { console.error(error); this.setMessage(`Analysis error: ${error.message}`); }
        finally { this.thinking = false; this.updatePanelState(); }
    }

    renderAnalysisResult(analysis) {
        if (!this.output) return;
        const top = analysis.topMoves.map((item, index) => moveRow(index + 1, item)).join('');
        const bad = analysis.badMoves.map((item, index) => moveRow(index + 1, item)).join('');
        const features = analysis.features.map((item) => `<li><strong>${escapeHtml(item.name)}</strong>: ${escapeHtml(item.text)}</li>`).join('');
        this.output.innerHTML = `
            <div class="robot-summary-grid">
                <div><span class="robot-label">Side</span><strong>${escapeHtml(analysis.player)}</strong></div>
                <div><span class="robot-label">Boundary</span><strong>${escapeHtml(analysis.topology)} / ${escapeHtml(analysis.lattice)}</strong></div>
                <div><span class="robot-label">Score</span><strong>${formatScore(analysis.currentScore)}</strong></div>
                <div><span class="robot-label">Win rate</span><strong>${(100 * analysis.currentWinRate).toFixed(1)}%</strong></div>
            </div>
            <p class="robot-muted">Depth ${analysis.depth}; completed ${analysis.completedDepth}; ${analysis.nodes} searched nodes${analysis.truncated ? ', time/node limit reached' : ''}. Win rate is heuristic, not solved.</p>
            <h4>Top moves</h4>
            <ol class="robot-move-list">${top || '<li>No legal move. Pass is likely required.</li>'}</ol>
            <h4>Bad moves</h4>
            <ol class="robot-move-list robot-bad-list">${bad || '<li>No bad move list.</li>'}</ol>
            <h4>Position signals</h4>
            <ul class="robot-piece-list">${features || '<li>No signals.</li>'}</ul>`;
    }

    updatePanelState() {
        if (this.sideSelect) this.sideSelect.value = this.side;
        if (this.depthSelect) this.depthSelect.value = String(this.depth);
        if (this.moveButton) this.moveButton.disabled = this.thinking || this.app.logic.gameOver || this.app.gameModeSelect?.value === 'online';
        if (this.analyzeButton) this.analyzeButton.disabled = this.thinking || this.app.logic.gameOver;
    }
    clearAnalysis() { if (this.output) this.output.innerHTML = '<p class="robot-muted">Click Analyze Position to rank legal moves, estimate win rate, and show Reversi signals.</p>'; }
    setMessage(message) { if (this.output) this.output.innerHTML = `<p class="robot-muted">${escapeHtml(message)}</p>`; }
}

export function chooseReversiRobotMove(logic, depth = 3) {
    const search = searchRoot(logic, depth, false);
    return { move: search.best?.move || null, score: search.best?.score ?? search.currentScore, nodes: search.nodes, truncated: search.truncated };
}

export function analyzeReversiPosition(logic, depth = 3) {
    const search = searchRoot(logic, depth, true);
    const results = search.results.sort((a, b) => b.score - a.score);
    return {
        player: logic.currentPlayer,
        topology: logic.topology.topology,
        lattice: logic.topology.lattice,
        depth: clampDepth(depth),
        completedDepth: search.completedDepth,
        nodes: search.nodes,
        truncated: search.truncated,
        currentScore: search.currentScore,
        currentWinRate: scoreToWinRate(search.currentScore),
        topMoves: results.slice(0, 5),
        badMoves: results.slice(-5).reverse(),
        features: positionSignals(logic, logic.currentPlayer)
    };
}

function searchRoot(logic, depth = 3, analysisMode = false) {
    const player = logic.currentPlayer;
    const maxDepth = adjustedDepth(logic, depth);
    const currentScore = evaluateReversi(logic, player);
    const ordered = orderMoves(logic.legalMoves(player), logic, player).slice(0, ROOT_CAP_BY_DEPTH[clampDepth(depth)] || 28);
    const context = makeContext(depth, analysisMode);
    if (!ordered.length) return { best: null, results: [], currentScore, nodes: 0, completedDepth: 0, truncated: false };
    let best = null;
    let completedDepth = 0;
    let finalResults = [];
    for (let d = 1; d <= maxDepth; d += 1) {
        const rows = [];
        for (const move of ordered) {
            if (context.timeUp() || context.nodes >= context.nodeLimit) { context.truncated = true; break; }
            const clone = cloneReversi(logic);
            clone.play(move.coord, player);
            const score = -negamax(clone, d - 1, -INF, INF, otherReversiColor(player), player, context, 1);
            rows.push({ move: { coord: move.coord, flips: move.flips, label: coordLabel(move.coord) }, score, scoreText: formatScore(score), winRate: scoreToWinRate(score), reasons: explainReversiMove(logic, clone, move, player, score) });
        }
        if (rows.length) {
            rows.sort((a, b) => b.score - a.score);
            finalResults = rows;
            best = rows[0];
            completedDepth = d;
        }
        if (context.truncated || !analysisMode && context.timeUp()) break;
    }
    return { best, results: finalResults, currentScore, nodes: context.nodes, completedDepth, truncated: context.truncated || completedDepth < maxDepth };
}

function makeContext(depth, analysisMode) {
    const d = clampDepth(depth);
    const start = now();
    return { nodes: 0, nodeLimit: NODE_LIMIT_BY_DEPTH[d] || 52000, deadline: start + (analysisMode ? 1.35 : 1) * (TIME_BY_DEPTH_MS[d] || 430), truncated: false, tt: new Map(), timeUp() { return now() >= this.deadline; } };
}

function adjustedDepth(logic, depth) {
    const d = clampDepth(depth);
    const empty = logic.counts().empty || 0;
    if (empty <= 8) return Math.max(d, empty);
    if (empty <= 12) return Math.max(d, Math.min(6, empty));
    return d;
}

function negamax(logic, depth, alpha, beta, player, rootPlayer, context, ply = 0) {
    context.nodes += 1;
    if ((context.nodes & 127) === 0 && (context.nodes >= context.nodeLimit || context.timeUp())) { context.truncated = true; return evaluateReversi(logic, rootPlayer); }
    if (logic.gameOver || depth <= 0) return evaluateReversi(logic, rootPlayer);
    const hash = `${depth}:${player}:${logic.currentPlayer}:${hashBoard(logic)}`;
    const cached = context.tt.get(hash);
    if (cached !== undefined) return cached;
    let moves = orderMoves(logic.legalMoves(player), logic, player);
    if (!moves.length) {
        const passClone = cloneReversi(logic);
        const pass = passClone.pass();
        if (!pass.ok) return evaluateReversi(logic, rootPlayer);
        return -negamax(passClone, depth - 1, -beta, -alpha, otherReversiColor(player), rootPlayer, context, ply + 1);
    }
    if (moves.length > 28 && depth >= 3) moves = moves.slice(0, 28);
    let best = -INF;
    for (const move of moves) {
        const clone = cloneReversi(logic);
        clone.play(move.coord, player);
        const score = -negamax(clone, depth - 1, -beta, -alpha, otherReversiColor(player), rootPlayer, context, ply + 1);
        if (score > best) best = score;
        alpha = Math.max(alpha, score);
        if (alpha >= beta || context.truncated) break;
    }
    context.tt.set(hash, best);
    return best;
}

function orderMoves(moves, logic, player) { return moves.slice().sort((a, b) => quickMoveScore(b, logic, player) - quickMoveScore(a, logic, player)); }
function quickMoveScore(move, logic, player) {
    let score = 0;
    score += 7 * (move.flips?.length || 0);
    score += anchorBonus(logic, move.coord) * 2.4;
    if (isXSquareDanger(logic, move.coord)) score -= 55;
    if (isFrontierCoord(logic, move.coord)) score -= 10;
    const clone = cloneReversi(logic);
    const play = clone.play(move.coord, player);
    if (!play.ok) return -INF;
    score += 5 * (clone.legalMoves(player).length - logic.legalMoves(player).length);
    score -= 7 * clone.legalMoves(otherReversiColor(player)).length;
    return score;
}

function evaluateReversi(logic, player) {
    if (logic.gameOver && logic.winner) {
        if (logic.winner === player) return 100000;
        if (logic.winner === 'draw') return 0;
        return -100000;
    }
    const opponent = otherReversiColor(player);
    const counts = logic.counts();
    const discDiff = (counts[player] || 0) - (counts[opponent] || 0);
    const mobilityDiff = logic.legalMoves(player).length - logic.legalMoves(opponent).length;
    const anchorDiff = controlledAnchors(logic, player) - controlledAnchors(logic, opponent);
    const frontierDiff = frontierCount(logic, opponent) - frontierCount(logic, player);
    const topologyDiff = topologyControl(logic, player) - topologyControl(logic, opponent);
    const stabilityDiff = stableLikeCount(logic, player) - stableLikeCount(logic, opponent);
    const parity = (counts.empty % 2 === 0 ? -1 : 1) * (player === logic.currentPlayer ? 1 : -1);
    const late = counts.empty < logic.topology.totalVertices * 0.18;
    const mid = counts.empty < logic.topology.totalVertices * 0.55;
    return (late ? 7.5 : mid ? 2.2 : 0.8) * discDiff + 12 * mobilityDiff + 48 * anchorDiff + 6 * frontierDiff + 26 * stabilityDiff + topologyDiff + (late ? 10 * parity : 0);
}

function controlledAnchors(logic, player) { return anchorCoords(logic).filter((coord) => logic.get(coord)?.color === player).length; }
function anchorBonus(logic, coord) { return anchorCoords(logic).some((anchor) => logic.key(anchor) === logic.key(coord)) ? 40 : 0; }
function anchorCoords(logic) {
    const w = logic.topology.width; const h = logic.topology.height;
    if (logic.topology.topology === 'open2d' || logic.topology.topology === 'klein' || logic.topology.topology === 'random') return [[0, 0], [w - 1, 0], [0, h - 1], [w - 1, h - 1]];
    const midX = Math.floor(w / 2); const midY = Math.floor(h / 2);
    return [[0, midY], [w - 1, midY], [midX, 0], [midX, h - 1]];
}
function frontierCount(logic, player) {
    let count = 0;
    for (const [key, stone] of logic.board.entries()) {
        if (stone.color !== player) continue;
        const coord = key.split(',').map(Number);
        if (logic.topology.directionsFor(coord).some((direction) => { const next = logic.topology.step(coord, direction); return next && !logic.get(next); })) count += 1;
    }
    return count;
}
function isFrontierCoord(logic, coord) { return logic.topology.directionsFor(coord).some((direction) => { const next = logic.topology.step(coord, direction); return next && !logic.get(next); }); }
function stableLikeCount(logic, player) {
    let count = 0;
    for (const coord of anchorCoords(logic)) {
        if (logic.get(coord)?.color !== player) continue;
        count += 1;
        for (const direction of logic.topology.directionsFor(coord).slice(0, 8)) {
            let next = logic.topology.step(coord, direction);
            let guard = 0;
            while (next && logic.get(next)?.color === player && guard < Math.max(logic.topology.width, logic.topology.height)) { count += 0.35; next = logic.topology.step(next, direction); guard += 1; }
        }
    }
    return count;
}
function isXSquareDanger(logic, coord) {
    if (logic.topology.topology !== 'open2d') return false;
    const x = coord[0], y = coord[1], w = logic.topology.width, h = logic.topology.height;
    const xs = [[1, 1, 0, 0], [w - 2, 1, w - 1, 0], [1, h - 2, 0, h - 1], [w - 2, h - 2, w - 1, h - 1]];
    return xs.some(([xx, yy, cx, cy]) => x === xx && y === yy && !logic.get([cx, cy]));
}
function topologyControl(logic, player) {
    let score = 0;
    for (const [key, stone] of logic.board.entries()) {
        if (stone.color !== player) continue;
        const [x, y] = key.split(',').map(Number);
        if (x === 0 || y === 0 || x === logic.topology.width - 1 || y === logic.topology.height - 1) {
            if (logic.topology.topology === 'pbc') score += 7;
            else if (logic.topology.topology === 'klein') score += 5;
            else if (logic.topology.topology === 'random') score += 4;
            else score += 2;
        }
    }
    return score;
}
function positionSignals(logic, player) {
    const opponent = otherReversiColor(player); const counts = logic.counts();
    return [
        { name: 'Disc balance', text: `${player}: ${counts[player]}, ${opponent}: ${counts[opponent]}, empty ${counts.empty}` },
        { name: 'Mobility', text: `${player} has ${logic.legalMoves(player).length} legal moves; ${opponent} has ${logic.legalMoves(opponent).length}` },
        { name: 'Anchors/stability', text: `${player} anchors ${controlledAnchors(logic, player)}, stable-like ${stableLikeCount(logic, player).toFixed(1)}; ${opponent} anchors ${controlledAnchors(logic, opponent)}, stable-like ${stableLikeCount(logic, opponent).toFixed(1)}` },
        { name: 'Frontier', text: `${player} frontier discs: ${frontierCount(logic, player)}; ${opponent}: ${frontierCount(logic, opponent)}` },
        { name: 'Topology', text: topologyText(logic) }
    ];
}
function topologyText(logic) {
    if (logic.topology.topology === 'pbc') return 'periodic board: no ordinary corners; mobility/frontier and wrap-control anchors matter more';
    if (logic.topology.topology === 'klein') return 'Klein bottle: top/bottom crossing flips x, so stable lines are orientation-dependent';
    if (logic.topology.topology === 'random') return '2D RBC: search uses the fixed random boundary map through the rule engine';
    return 'standard board: corners, X-square danger, stable edges, and mobility dominate';
}
function explainReversiMove(before, after, move, player, score) {
    const reasons = [];
    if (move.flips?.length) reasons.push(`flips ${move.flips.length} disc${move.flips.length === 1 ? '' : 's'}`);
    if (anchorBonus(before, move.coord) > 0) reasons.push('takes a generalized anchor/corner');
    if (isXSquareDanger(before, move.coord)) reasons.push('danger: X-square before corner is secured');
    if (isFrontierCoord(before, move.coord)) reasons.push('touches frontier space, which may give opponent access');
    const beforeMob = before.legalMoves(player).length; const afterMob = after.legalMoves(player).length;
    if (afterMob > beforeMob) reasons.push('increases future mobility');
    if (afterMob < beforeMob) reasons.push('reduces future mobility');
    if (before.topology.topology === 'pbc') reasons.push('evaluated with periodic wrap control instead of ordinary corners');
    if (before.topology.topology === 'klein') reasons.push('evaluated with Klein-boundary orientation reversal');
    if (before.topology.topology === 'random') reasons.push('evaluated through the 2D RBC legal graph');
    if (score < -15) reasons.push('bad after opponent replies in search');
    if (!reasons.length) reasons.push('keeps a stable searched position');
    return reasons;
}
function cloneReversi(logic) { const clone = new ReversiGame({ topology: logic.topology.topology, lattice: logic.topology.lattice, size: logic.topology.size, width: logic.topology.width, height: logic.topology.height, randomBoundarySeed: logic.topology.randomBoundarySeed, randomBoundaryMap: [...logic.topology.randomBoundaryMap.entries()] }); clone.importState(logic.exportState()); return clone; }
function hashBoard(logic) { return [...logic.board.entries()].map(([k, v]) => `${k}:${v.color}`).sort().join('|') + ':' + logic.currentPlayer; }
function scoreToWinRate(score) { if (score >= 90000) return 0.999; if (score <= -90000) return 0.001; return 1 / (1 + Math.exp(-score / 95)); }
function formatScore(score) { if (score >= 90000) return '+W'; if (score <= -90000) return '-L'; return `${score >= 0 ? '+' : ''}${(score / 10).toFixed(1)}`; }
function coordLabel(coord) { return `(${coord.map((value) => value + 1).join(',')})`; }
function moveRow(rank, item) { const reasons = item.reasons.map((reason) => `<li>${escapeHtml(reason)}</li>`).join(''); return `<li><div><strong>${rank}. ${escapeHtml(item.move.label || coordLabel(item.move.coord))}</strong></div><div class="robot-muted">score ${escapeHtml(item.scoreText)} · win ${(100 * item.winRate).toFixed(1)}%</div><ul>${reasons}</ul></li>`; }
function clampDepth(value) { return Math.max(1, Math.min(5, Math.floor(Number(value) || 3))); }
function now() { return globalThis.performance?.now?.() ?? Date.now(); }
function escapeHtml(value) { return String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;'); }
function nextFrame() { return new Promise((resolve) => window.requestAnimationFrame(() => resolve())); }

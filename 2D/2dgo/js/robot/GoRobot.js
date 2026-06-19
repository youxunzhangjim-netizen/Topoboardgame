import { COLORS, GoGameLogic, otherColor, valueToColor } from '../GoGame.js';

const MCTS_BUDGET_BY_LEVEL = { 1: 90, 2: 220, 3: 520, 4: 900 };
const TIME_BY_LEVEL_MS = { 1: 180, 2: 430, 3: 850, 4: 1400 };
const CANDIDATE_LIMIT_BY_LEVEL = { 1: 18, 2: 24, 3: 32, 4: 42 };
const PLAYOUT_DEPTH_BY_LEVEL = { 1: 3, 2: 5, 3: 7, 4: 9 };
const UCB_C = 1.25;

export class GoRobotController {
    constructor(app) {
        this.app = app;
        this.side = 'white';
        this.depth = 2;
        this.thinking = false;
        this.pendingTimer = null;
        this.finalFlowKey = '';
    }

    attach() {
        this.sideSelect = document.getElementById('robotSideSelect');
        this.depthSelect = document.getElementById('robotDepthSelect');
        this.moveButton = document.getElementById('robotMoveBtn');
        this.analyzeButton = document.getElementById('robotAnalyzeBtn');
        this.output = document.getElementById('robotAnalysisOutput');
        this.sideSelect?.addEventListener('change', () => {
            this.side = this.sideSelect.value === 'black' ? 'black' : 'white';
            this.clearAnalysis();
            this.app.updateOnlineControls?.();
            this.scheduleIfNeeded();
            this.app.updateUI();
        });
        this.depthSelect?.addEventListener('change', () => { this.depth = clampLevel(Number(this.depthSelect.value) || 2); });
        this.moveButton?.addEventListener('click', () => this.forceMove());
        this.analyzeButton?.addEventListener('click', () => this.renderAnalysis());
        this.updatePanelState();
        this.clearAnalysis();
    }

    isRobotMode() { return this.app.gameModeSelect?.value === 'robot'; }
    isRobotTurn() { return this.isRobotMode() && !this.app.logic.gameOver && !this.app.logic.scoringPending && this.app.logic.currentPlayer === this.side; }
    shouldBlockHumanInput(color = this.app.logic.currentPlayer) { return this.thinking || (this.isRobotMode() && color === this.side); }
    scheduleIfNeeded() {
        if (this.pendingTimer) window.clearTimeout(this.pendingTimer);
        this.pendingTimer = null;
        if (!this.isRobotTurn()) return;
        this.pendingTimer = window.setTimeout(() => { this.pendingTimer = null; this.forceMove(); }, 180);
    }
    afterLocalAction() {
        if (this.pendingTimer) {
            window.clearTimeout(this.pendingTimer);
            this.pendingTimer = null;
        }
        if (this.app.logic.gameOver) { this.renderFinalWinRateFlow(); this.updatePanelState(); return; }
        if (this.app.logic.scoringPending) { this.finalFlowKey = ''; this.updatePanelState(); return; }
        this.finalFlowKey = '';
        this.clearAnalysis();
        this.scheduleIfNeeded();
    }

    async forceMove() {
        if (this.thinking || this.app.logic.gameOver || this.app.logic.scoringPending) return;
        if (!this.isRobotMode() && !window.confirm('Robot mode is not selected. Let the robot move once for the current side?')) return;
        this.thinking = true;
        this.setMessage(`Robot is searching for ${this.app.logic.currentPlayer} at search level ${this.depth}...`);
        this.updatePanelState();
        await nextFrame();
        try {
            const result = chooseGoRobotMove(this.app.logic, this.depth);
            const move = chooseSafeRobotMove(this.app.logic, result.move);
            if (!move) {
                this.setMessage('Robot found no legal play. Passing if the rule engine allows it.');
                const pass = this.app.logic.pass(this.app.logic.currentPlayer);
                if (pass.ok) this.app.afterLocalAction(this.afterRobotMoveMessage('Pass'));
                else this.setMessage(`Robot could not pass: ${pass.error || 'pass rejected'}`);
                return;
            }
            const before = this.app.logic.currentPlayer;
            const play = move.type === 'pass' ? this.app.logic.pass(before) : this.app.logic.tryPlay(move.coord, before);
            if (!play.ok) {
                const fallback = move.type === 'pass' ? null : this.app.logic.pass(before);
                if (fallback?.ok) {
                    this.app.afterLocalAction(this.afterRobotMoveMessage('Pass'));
                    return;
                }
                this.setMessage(`Robot move was rejected: ${play.error || fallback?.error || 'illegal move'}`);
                return;
            }
            const label = move.type === 'pass' ? 'Pass' : coordLabel(move.coord);
            this.app.afterLocalAction(this.afterRobotMoveMessage(label));
            if (!this.app.logic.gameOver) this.setMessage(`Robot played ${label}. Score ${formatScore(result.score)}. Sims ${result.nodes}${result.truncated ? ' (time-limited)' : ''}.`);
        } catch (error) {
            console.error(error);
            this.setMessage(`Robot error: ${error.message}`);
        } finally {
            this.thinking = false;
            this.updatePanelState();
        }
    }

    async renderAnalysis() {
        if (this.thinking) return;
        this.thinking = true;
        this.setMessage(`Analyzing ${this.app.logic.currentPlayer} at search level ${this.depth}...`);
        this.updatePanelState();
        await nextFrame();
        try { this.renderAnalysisResult(analyzeGoPosition(this.app.logic, this.depth)); }
        catch (error) { console.error(error); this.setMessage(`Analysis error: ${error.message}`); }
        finally { this.thinking = false; this.updatePanelState(); }
    }

    renderAnalysisResult(analysis) {
        if (!this.output) return;
        const top = analysis.topMoves.map((item, index) => moveRow(index + 1, item)).join('');
        const bad = analysis.badMoves.map((item, index) => moveRow(index + 1, item)).join('');
        const groups = analysis.groupValues.map((group) => `<li><strong>${escapeHtml(group.color)} group ${escapeHtml(group.anchor)}</strong>: value ${formatScore(group.value)}, stones ${group.size}, liberties ${group.liberties}<br><span class="robot-muted">${escapeHtml(group.reason)}</span></li>`).join('');
        this.output.innerHTML = `
            <div class="robot-summary-grid">
                <div><span class="robot-label">Side</span><strong>${escapeHtml(analysis.player)}</strong></div>
                <div><span class="robot-label">Boundary</span><strong>${escapeHtml(analysis.topology)} / ${escapeHtml(analysis.lattice)}</strong></div>
                <div><span class="robot-label">Score</span><strong>${formatScore(analysis.currentScore)}</strong></div>
                <div><span class="robot-label">Win rate</span><strong>${(100 * analysis.currentWinRate).toFixed(1)}%</strong></div>
            </div>
            <p class="robot-muted">MCTS level ${analysis.depth}; ${analysis.nodes} simulations${analysis.truncated ? ', time limit reached' : ''}. The win rate is heuristic, not a solved game proof.</p>
            <h4>Top moves</h4>
            <ol class="robot-move-list">${top || '<li>No legal play. Pass is likely required.</li>'}</ol>
            <h4>Bad moves</h4>
            <ol class="robot-move-list robot-bad-list">${bad || '<li>No bad move list.</li>'}</ol>
            <h4>Important groups</h4>
            <ul class="robot-piece-list">${groups || '<li>No groups yet.</li>'}</ul>
        `;
    }


    renderFinalWinRateFlow() {
        if (!this.output || !this.app.logic?.gameOver) return;
        const key = `${this.app.logic.moveNumber}:${this.app.logic.winner}:${this.app.logic.positionHistory?.length || 0}`;
        if (this.finalFlowKey === key) return;
        this.finalFlowKey = key;
        const flow = buildGoWinRateFlow(this.app.logic);
        this.output.innerHTML = renderWinRateFlowChart(flow, {
            title: 'Final win-rate flow',
            note: 'Robot heuristic from saved board history; it is an evaluation curve, not a solved-game proof.'
        });
    }

    updatePanelState() {
        if (this.sideSelect) this.sideSelect.value = this.side;
        if (this.depthSelect) this.depthSelect.value = String(this.depth);
        const closed = this.app.logic.gameOver || this.app.logic.scoringPending;
        if (this.moveButton) this.moveButton.disabled = this.thinking || closed || this.app.gameModeSelect?.value === 'online';
        if (this.analyzeButton) this.analyzeButton.disabled = this.thinking || closed;
    }
    clearAnalysis() { if (this.output) this.output.innerHTML = '<p class="robot-muted">Click Analyze Position to rank legal plays, estimate win rate, and show group values.</p>'; }
    setMessage(message) { if (this.output) this.output.innerHTML = `<p class="robot-muted">${escapeHtml(message)}</p>`; }
    afterRobotMoveMessage(label) {
        if (this.app.logic.scoringPending) return `Robot played ${label}. Two passes. Both players must agree to count.`;
        if (this.app.logic.gameOver) return `Robot played ${label}.`;
        return `Robot played ${label}. ${this.app.capitalize(this.app.logic.currentPlayer)} to play.`;
    }
}


export function estimateGoWinRates(logic) {
    const blackScore = evaluateGo(logic, 'black');
    const blackWinRate = scoreToWinRate(blackScore);
    return { blackWinRate, whiteWinRate: 1 - blackWinRate, score: blackScore };
}

export function chooseGoRobotMove(logic, depth = 2) {
    const analysis = analyzeGoPosition(logic, depth, { moveOnly: true });
    const best = analysis.topMoves[0] || null;
    return { move: best?.move || null, score: best?.score ?? analysis.currentScore, nodes: analysis.nodes, truncated: analysis.truncated };
}

export function analyzeGoPosition(logic, depth = 2) {
    const level = clampLevel(depth);
    const player = logic.currentPlayer;
    const baseScore = evaluateGo(logic, player);
    const start = now();
    const deadline = start + (TIME_BY_LEVEL_MS[level] || 430);
    const candidates = rankCandidateMoves(logic, player, level).slice(0, CANDIDATE_LIMIT_BY_LEVEL[level] || 24);
    if (!candidates.length) candidates.push({ type: 'pass', label: 'Pass', prior: -30 });

    const stats = candidates.map((move) => ({ move, visits: 0, total: 0, best: -Infinity, prior: quickMoveScore(logic, move, player) }));
    const budget = MCTS_BUDGET_BY_LEVEL[level] || 220;
    let simulations = 0;

    // Give every candidate at least one static/short rollout evaluation.
    for (const item of stats) {
        const score = evaluateCandidateByPlayout(logic, item.move, player, level);
        item.visits += 1; item.total += score; item.best = Math.max(item.best, score); simulations += 1;
        if (now() >= deadline) break;
    }

    while (simulations < budget && now() < deadline) {
        const totalVisits = stats.reduce((sum, item) => sum + item.visits, 0) + 1;
        let chosen = stats[0];
        let chosenValue = -Infinity;
        for (const item of stats) {
            const mean = item.total / Math.max(1, item.visits);
            const explore = UCB_C * Math.sqrt(Math.log(totalVisits + 1) / Math.max(1, item.visits));
            const prior = Math.tanh(item.prior / 35) * 6;
            const ucb = mean + explore * 18 + prior;
            if (ucb > chosenValue) { chosenValue = ucb; chosen = item; }
        }
        const score = evaluateCandidateByPlayout(logic, chosen.move, player, level);
        chosen.visits += 1; chosen.total += score; chosen.best = Math.max(chosen.best, score); simulations += 1;
    }

    const results = stats.map((item) => {
        const mean = item.total / Math.max(1, item.visits);
        const score = 0.82 * mean + 0.18 * item.best + 0.04 * item.prior;
        const after = previewAfterMove(logic, item.move, player);
        return { move: item.move, score, scoreText: formatScore(score), winRate: scoreToWinRate(score), visits: item.visits, reasons: explainGoMove(logic, after || logic, item.move, player, score) };
    }).sort((a, b) => b.score - a.score);

    return {
        player,
        topology: logic.topology,
        lattice: logic.lattice,
        depth: level,
        nodes: simulations,
        truncated: simulations < budget,
        currentScore: baseScore,
        currentWinRate: scoreToWinRate(baseScore),
        topMoves: results.slice(0, 5),
        badMoves: results.slice(-5).reverse(),
        groupValues: evaluateGroups(logic, player).slice(0, 8)
    };
}

function evaluateCandidateByPlayout(logic, move, rootPlayer, level) {
    const clone = cloneGoLogic(logic);
    const applied = applyGoMove(clone, move, rootPlayer);
    if (!applied?.ok && move.type !== 'pass') return -100000;
    let score = evaluateGo(clone, rootPlayer);
    const plies = PLAYOUT_DEPTH_BY_LEVEL[level] || 5;
    for (let ply = 0; ply < plies && !clone.gameOver && !clone.scoringPending; ply += 1) {
        const color = clone.currentPlayer;
        const moves = rankCandidateMoves(clone, color, Math.min(level, 2)).slice(0, 8);
        if (!moves.length) { clone.pass(color); continue; }
        const picked = weightedPick(moves, clone, color, ply);
        applyGoMove(clone, picked, color);
    }
    score = 0.55 * score + 0.45 * evaluateGo(clone, rootPlayer);
    return score;
}

function weightedPick(moves, logic, player, ply) {
    const sorted = moves.slice(0, Math.min(moves.length, 8));
    const temperature = 1.2 + 0.25 * ply;
    const weights = sorted.map((move) => Math.exp(Math.max(-20, Math.min(20, quickMoveScore(logic, move, player) / (10 * temperature)))));
    const total = weights.reduce((a, b) => a + b, 0) || 1;
    let r = Math.random() * total;
    for (let i = 0; i < sorted.length; i += 1) {
        r -= weights[i];
        if (r <= 0) return sorted[i];
    }
    return sorted[0];
}

function rankCandidateMoves(logic, player, depth = 2) {
    const legal = getLegalPlayCandidates(logic, player);
    const ranked = legal.map((move) => ({ ...move, prior: quickMoveScore(logic, move, player) })).sort((a, b) => b.prior - a.prior);
    const level = clampLevel(depth);
    const limit = Math.min(ranked.length, Math.max(10, CANDIDATE_LIMIT_BY_LEVEL[level] || 24));
    return ranked.slice(0, limit);
}

function playableCoords(logic) {
    if (typeof logic.playableCoords === 'function') return logic.playableCoords();
    if (typeof logic.allCoords === 'function') return logic.allCoords();
    return [];
}

function getLegalPlayCandidates(logic, player) {
    const moves = [];
    for (const coord of playableCoords(logic)) {
        const preview = previewLegalPlay(logic, coord, player);
        if (preview.ok) moves.push({ type: 'play', coord, captured: preview.captured, liberties: preview.liberties, label: coordLabel(coord) });
    }
    if (!moves.length || logic.passCount > 0) moves.push({ type: 'pass', label: 'Pass', captured: 0, liberties: 0 });
    return moves;
}

function chooseSafeRobotMove(logic, preferred) {
    if (logic.gameOver || logic.scoringPending) return null;
    const player = logic.currentPlayer;
    const legal = getLegalPlayCandidates(logic, player);
    const legalPlays = legal.filter((move) => move.type === 'play');
    if (preferred?.type === 'play') {
        const key = coordLabel(preferred.coord);
        const matched = legalPlays.find((move) => coordLabel(move.coord) === key);
        if (matched) return matched;
    }
    if (preferred?.type === 'pass' && legal.some((move) => move.type === 'pass')) return legal.find((move) => move.type === 'pass');
    return legalPlays[0] || legal.find((move) => move.type === 'pass') || null;
}

function previewLegalPlay(logic, coord, color) {
    if (logic.gameOver || logic.scoringPending) return { ok: false };
    if (color !== logic.currentPlayer) return { ok: false };
    if (!logic.containsCoord(coord)) return { ok: false };
    const index = logic.indexFromCoord(coord);
    if (index < 0 || logic.board[index] !== COLORS.empty) return { ok: false };
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

function quickMoveScore(logic, move, player) {
    if (move.type === 'pass') return logic.passCount > 0 ? -5 : -60;
    let score = 0;
    score += 16 * (move.captured || 0);
    score += 1.6 * (move.liberties || 0);
    score += topologyMoveBonus(logic, move.coord, player);
    const [x, y] = move.coord;
    const center = (logic.size - 1) / 2;
    const centerDistance = Math.abs(x - center) + Math.abs(y - center);
    if (logic.topology === 'open2d') score -= 0.18 * centerDistance;
    if (logic.lattice === 'honeycomb') score += 1.6 * (move.liberties || 0);
    if (logic.lattice === 'triangular') score += 0.7 * (move.captured || 0);
    let friendlyNeighbors = 0;
    let enemyNeighbors = 0;
    const index = logic.indexFromCoord(move.coord);
    for (const next of logic.neighborsFromIndex(index)) {
        const color = valueToColor(logic.board[next]);
        if (color === player) friendlyNeighbors += 1;
        if (color === otherColor(player)) enemyNeighbors += 1;
    }
    score += 1.0 * friendlyNeighbors + 1.4 * enemyNeighbors;
    return score;
}

function applyGoMove(logic, move, player) { return move.type === 'pass' ? logic.pass(player) : logic.tryPlay(move.coord, player); }
function previewAfterMove(logic, move, player) { const clone = cloneGoLogic(logic); const ok = applyGoMove(clone, move, player); return ok?.ok ? clone : null; }

function evaluateGo(logic, player) {
    if (logic.gameOver && logic.winner) {
        if (logic.winner === player) return 100000;
        if (logic.winner === 'draw') return 0;
        return -100000;
    }
    const opponent = otherColor(player);
    let area = { black: 0, white: logic.komi || 7.5 };
    try { area = logic.computeAreaScore(); } catch { /* keep fallback */ }
    const areaDiff = player === 'black' ? area.black - area.white : area.white - area.black;
    const captureDiff = (logic.captures[player] || 0) - (logic.captures[opponent] || 0);
    const groupDiff = groupScore(logic, player) - groupScore(logic, opponent);
    const topologyDiff = topologyScore(logic, player) - topologyScore(logic, opponent);
    const mobilityDiff = getLegalPlayCandidates(logic, player).length - getLegalPlayCandidates(logic, opponent).length;
    return 15 * areaDiff + 10 * captureDiff + groupDiff + topologyDiff + 1.8 * mobilityDiff;
}

function groupScore(logic, player) {
    let score = 0;
    for (const info of allGroups(logic)) {
        if (info.color !== player) continue;
        score += 2.4 * info.size + libertyWeight(logic) * info.liberties;
        if (info.liberties <= 1) score -= 34 + 3 * info.size;
        else if (info.liberties === 2) score -= logic.lattice === 'honeycomb' ? 18 : 10;
        if (info.size >= 4 && info.liberties >= 4) score += 12;
    }
    return score;
}
function libertyWeight(logic) { if (logic.lattice === 'honeycomb') return 2.2; if (logic.lattice === 'triangular') return 1.1; return 1.6; }

function topologyScore(logic, player) {
    const stones = [];
    for (let index = 0; index < logic.board.length; index += 1) if (valueToColor(logic.board[index]) === player) stones.push(logic.coordFromIndex(index));
    if (!stones.length) return 0;
    const edgeHits = new Set();
    const n = logic.size;
    for (const [x, y] of stones) {
        if (x === 0) edgeHits.add('left'); if (x === n - 1) edgeHits.add('right'); if (y === 0) edgeHits.add('top'); if (y === n - 1) edgeHits.add('bottom');
    }
    let score = 0;
    if (logic.topology === 'pbc') score += 10 * edgeHits.size + (edgeHits.has('left') && edgeHits.has('right') ? 18 : 0) + (edgeHits.has('top') && edgeHits.has('bottom') ? 18 : 0);
    if (logic.topology === 'klein') score += 6 * edgeHits.size + (edgeHits.has('top') && edgeHits.has('bottom') ? 18 : 0);
    if (logic.topology === 'random') score += 5 * edgeHits.size;
    if (logic.topology === 'polar') score += 4 * stones.filter(([r]) => r <= 1).length;
    if (logic.lattice === 'triangular') score += 0.35 * stones.length;
    if (logic.lattice === 'honeycomb') score -= 0.25 * stones.length;
    return score;
}

function topologyMoveBonus(logic, coord) {
    const [x, y] = coord; const n = logic.size; let bonus = 0;
    if (logic.topology === 'pbc' && (x === 0 || x === n - 1 || y === 0 || y === n - 1)) bonus += 10;
    if (logic.topology === 'klein' && (y === 0 || y === n - 1)) bonus += 12;
    if (logic.topology === 'random' && (x === 0 || x === n - 1 || y === 0 || y === n - 1)) bonus += 7;
    if (logic.topology === 'polar' && x <= 1) bonus += 6;
    return bonus;
}

function evaluateGroups(logic, perspective) {
    return allGroups(logic).map((info) => {
        const sign = info.color === perspective ? 1 : -1;
        const value = sign * (2.4 * info.size + libertyWeight(logic) * info.liberties - (info.liberties <= 1 ? 34 : info.liberties === 2 ? 10 : 0));
        return { color: info.color, anchor: coordLabel(info.anchor), size: info.size, liberties: info.liberties, value, reason: info.liberties <= 1 ? 'in atari / immediate capture risk' : info.liberties === 2 ? 'weak group with low liberties' : 'stable group with usable liberties' };
    }).sort((a, b) => Math.abs(b.value) - Math.abs(a.value));
}

function allGroups(logic) {
    const groups = []; const visited = new Set();
    for (let index = 0; index < logic.board.length; index += 1) {
        const color = valueToColor(logic.board[index]);
        if (!color || visited.has(index)) continue;
        const group = logic.getGroupAndLiberties(logic.board, index);
        for (const stone of group.group) visited.add(stone);
        groups.push({ color, anchor: logic.coordFromIndex(index), size: group.group.size, liberties: group.liberties.size });
    }
    return groups;
}

function explainGoMove(before, after, move, player, score) {
    const reasons = [];
    if (move.type === 'pass') { reasons.push('passes because no legal play is attractive or available'); return reasons; }
    const played = after.indexFromCoord(move.coord);
    if (played >= 0) {
        const group = after.getGroupAndLiberties(after.board, played);
        if (move.captured > 0) reasons.push(`captures ${move.captured} stone${move.captured === 1 ? '' : 's'}`);
        if (group.liberties.size <= 1) reasons.push('danger: the played group has only one liberty');
        if (group.liberties.size >= 4) reasons.push('creates a group with good liberties');
    }
    const beforeEval = evaluateGo(before, player); const afterEval = evaluateGo(after, player);
    if (afterEval > beforeEval + 10) reasons.push('improves area/group evaluation');
    if (afterEval < beforeEval - 10) reasons.push('looks worse after evaluation/search');
    if (before.topology === 'pbc' && topologyMoveBonus(after, move.coord) > 0) reasons.push('contests a periodic wrapping edge/cycle');
    if (before.topology === 'klein' && topologyMoveBonus(after, move.coord) > 0) reasons.push('uses a Klein-boundary strategic edge');
    if (before.topology === 'random') reasons.push('uses legal neighborhoods from the fixed 2D RBC map');
    if (before.lattice === 'honeycomb') reasons.push('honeycomb groups need extra liberty safety');
    if (before.lattice === 'triangular') reasons.push('triangular lattice gives higher local degree, so influence spreads faster');
    if (score < -15) reasons.push('bad because opponent replies reduce the searched value');
    if (!reasons.length) reasons.push('keeps the searched position stable');
    return reasons;
}


function buildGoWinRateFlow(logic) {
    const snapshots = Array.isArray(logic.positionHistory) && logic.positionHistory.length
        ? logic.positionHistory
        : [logic.serializeBoard(logic.board)];
    const maxPoints = 72;
    const stride = Math.max(1, Math.ceil(snapshots.length / maxPoints));
    const baseState = logic.exportState();
    const series = [];
    for (let i = 0; i < snapshots.length; i += stride) {
        const serialized = String(snapshots[i] || '');
        const clone = cloneGoLogic(logic);
        clone.importState({
            ...baseState,
            board: Array.from(serialized, (char) => Number(char) || 0),
            currentPlayer: i % 2 === 0 ? 'black' : 'white',
            gameOver: false,
            winner: '',
            moveHistory: [],
            positionHistory: [serialized]
        });
        const estimate = estimateGoWinRates(clone);
        series.push({ move: i, black: estimate.blackWinRate, white: estimate.whiteWinRate });
    }
    const finalEstimate = estimateGoWinRates(logic);
    let black = finalEstimate.blackWinRate;
    let white = finalEstimate.whiteWinRate;
    if (logic.gameOver && logic.winner === 'black') { black = 0.999; white = 0.001; }
    else if (logic.gameOver && logic.winner === 'white') { black = 0.001; white = 0.999; }
    else if (logic.gameOver && logic.winner === 'draw') { black = 0.5; white = 0.5; }
    const finalMove = Math.max(logic.moveNumber || snapshots.length - 1, series.at(-1)?.move || 0);
    if (!series.length || series.at(-1).move !== finalMove) series.push({ move: finalMove, black, white });
    else Object.assign(series[series.length - 1], { black, white });
    return series;
}

function renderWinRateFlowChart(series, { title, note }) {
    const safe = Array.isArray(series) && series.length ? series : [{ move: 0, black: 0.5, white: 0.5 }];
    const width = 680;
    const height = 210;
    const left = 42;
    const right = 18;
    const top = 18;
    const bottom = 34;
    const maxMove = Math.max(1, ...safe.map((item) => Number(item.move) || 0));
    const x = (move) => left + ((Number(move) || 0) / maxMove) * (width - left - right);
    const y = (rate) => top + (1 - Math.max(0.001, Math.min(0.999, Number(rate) || 0))) * (height - top - bottom);
    const toPoints = (key) => safe.map((item) => `${x(item.move).toFixed(1)},${y(item[key]).toFixed(1)}`).join(' ');
    const last = safe.at(-1);
    return `
        <section class="robot-final-flow">
            <h4>${escapeHtml(title)}</h4>
            <svg class="robot-flow-chart" viewBox="0 0 ${width} ${height}" role="img" aria-label="Final win-rate flow chart for both players">
                <line class="robot-flow-axis" x1="${left}" y1="${top}" x2="${left}" y2="${height - bottom}"></line>
                <line class="robot-flow-axis" x1="${left}" y1="${height - bottom}" x2="${width - right}" y2="${height - bottom}"></line>
                <line class="robot-flow-axis" x1="${left}" y1="${y(0.5).toFixed(1)}" x2="${width - right}" y2="${y(0.5).toFixed(1)}"></line>
                <polyline class="robot-flow-black" points="${toPoints('black')}"></polyline>
                <polyline class="robot-flow-white" points="${toPoints('white')}"></polyline>
                <text class="robot-flow-label" x="6" y="${y(1).toFixed(1) + 4}">100%</text>
                <text class="robot-flow-label" x="12" y="${y(0.5).toFixed(1) + 4}">50%</text>
                <text class="robot-flow-label" x="16" y="${y(0).toFixed(1)}">0%</text>
                <text class="robot-flow-label" x="${left}" y="${height - 8}">start</text>
                <text class="robot-flow-label" x="${width - 106}" y="${height - 8}">move ${Math.round(maxMove)}</text>
            </svg>
            <div class="robot-flow-legend">
                <span style="color:#e5e7eb"><i class="robot-flow-swatch"></i>Black ${(100 * last.black).toFixed(1)}%</span>
                <span style="color:#f2c464"><i class="robot-flow-swatch"></i>White ${(100 * last.white).toFixed(1)}%</span>
            </div>
            <p class="robot-muted">${escapeHtml(note)}</p>
        </section>`;
}

function cloneGoLogic(logic) {
    const clone = new GoGameLogic({ size: logic.size, topology: logic.topology, lattice: logic.lattice, dimension: logic.dimension, komi: logic.komi, randomBoundarySeed: logic.randomBoundarySeed, randomBoundaryMap: [...logic.randomBoundaryMap.entries()] });
    clone.importState(logic.exportState());
    return clone;
}
function scoreToWinRate(score) { if (score >= 100000) return 0.999; if (score <= -100000) return 0.001; return 1 / (1 + Math.exp(-score / 70)); }
function formatScore(score) { if (score >= 90000) return '+W'; if (score <= -90000) return '-L'; return `${score >= 0 ? '+' : ''}${(score / 18).toFixed(1)} pts`; }
function coordLabel(coord) { if (!Array.isArray(coord)) return 'pass'; return `(${coord.map((value) => value + 1).join(',')})`; }
function moveRow(rank, item) { const reasons = item.reasons.map((reason) => `<li>${escapeHtml(reason)}</li>`).join(''); return `<li><div><strong>${rank}. ${escapeHtml(item.move.label || coordLabel(item.move.coord))}</strong></div><div class="robot-muted">score ${escapeHtml(item.scoreText)} · win ${(100 * item.winRate).toFixed(1)}% · ${item.visits || 0} sims</div><ul>${reasons}</ul></li>`; }
function clampLevel(value) { return Math.max(1, Math.min(4, Math.floor(Number(value) || 2))); }
function now() { return globalThis.performance?.now?.() ?? Date.now(); }
function escapeHtml(value) { return String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;'); }
function nextFrame() { return new Promise((resolve) => window.requestAnimationFrame(() => resolve())); }

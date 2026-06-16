import { COLORS, GoGameLogic, otherColor, valueToColor } from '../GoGame.js';

const INF = 1e9;
const NODE_LIMIT_BY_DEPTH = { 1: 900, 2: 1800, 3: 2600, 4: 3600 };
const CANDIDATE_LIMIT_BY_DEPTH = { 1: 36, 2: 20, 3: 12, 4: 8 };

export class GoRobotController {
    constructor(app) {
        this.app = app;
        this.side = 'white';
        this.depth = 2;
        this.thinking = false;
        this.pendingTimer = null;
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
        this.depthSelect?.addEventListener('change', () => {
            this.depth = clampDepth(Number(this.depthSelect.value) || 2);
        });
        this.moveButton?.addEventListener('click', () => this.forceMove());
        this.analyzeButton?.addEventListener('click', () => this.renderAnalysis());
        this.updatePanelState();
        this.clearAnalysis();
    }

    isRobotMode() {
        return this.app.gameModeSelect?.value === 'robot';
    }

    isRobotTurn() {
        return this.isRobotMode() && !this.app.logic.gameOver && !this.app.logic.scoringPending && this.app.logic.currentPlayer === this.side;
    }

    shouldBlockHumanInput(color = this.app.logic.currentPlayer) {
        return this.thinking || (this.isRobotMode() && color === this.side);
    }

    scheduleIfNeeded() {
        if (this.pendingTimer) window.clearTimeout(this.pendingTimer);
        if (!this.isRobotTurn()) return;
        this.pendingTimer = window.setTimeout(() => this.forceMove(), 180);
    }

    afterLocalAction() {
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
            if (!result.move) {
                this.setMessage('Robot found no legal play. Passing if the rule engine allows it.');
                const pass = this.app.logic.pass(this.app.logic.currentPlayer);
                if (pass.ok) this.app.afterLocalAction(`${this.app.capitalize(this.app.logic.currentPlayer)} to play.`);
                return;
            }
            const before = this.app.logic.currentPlayer;
            const play = result.move.type === 'pass'
                ? this.app.logic.pass(before)
                : this.app.logic.tryPlay(result.move.coord, before);
            if (!play.ok) {
                this.setMessage(`Robot move was rejected: ${play.error || 'illegal move'}`);
                return;
            }
            const label = result.move.type === 'pass' ? 'Pass' : coordLabel(result.move.coord);
            this.app.afterLocalAction(`Robot played ${label}. ${this.app.capitalize(this.app.logic.currentPlayer)} to play.`);
            this.setMessage(`Robot played ${label}. Score ${formatScore(result.score)}. Nodes ${result.nodes}${result.truncated ? ' (limited)' : ''}.`);
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
        try {
            const analysis = analyzeGoPosition(this.app.logic, this.depth);
            this.renderAnalysisResult(analysis);
        } catch (error) {
            console.error(error);
            this.setMessage(`Analysis error: ${error.message}`);
        } finally {
            this.thinking = false;
            this.updatePanelState();
        }
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
            <p class="robot-muted">Search level ${analysis.depth}; ${analysis.nodes} nodes${analysis.truncated ? ', node limit reached' : ''}. The win rate is heuristic, not a solved game proof.</p>
            <h4>Top moves</h4>
            <ol class="robot-move-list">${top || '<li>No legal play. Pass is likely required.</li>'}</ol>
            <h4>Bad moves</h4>
            <ol class="robot-move-list robot-bad-list">${bad || '<li>No bad move list.</li>'}</ol>
            <h4>Important groups</h4>
            <ul class="robot-piece-list">${groups || '<li>No groups yet.</li>'}</ul>
        `;
    }

    updatePanelState() {
        if (this.sideSelect) this.sideSelect.value = this.side;
        if (this.depthSelect) this.depthSelect.value = String(this.depth);
        if (this.moveButton) this.moveButton.disabled = this.thinking || this.app.logic.gameOver || this.app.gameModeSelect?.value === 'online';
        if (this.analyzeButton) this.analyzeButton.disabled = this.thinking || this.app.logic.gameOver;
    }

    clearAnalysis() {
        if (this.output) this.output.innerHTML = '<p class="robot-muted">Click Analyze Position to rank legal plays, estimate win rate, and show group values.</p>';
    }

    setMessage(message) {
        if (this.output) this.output.innerHTML = `<p class="robot-muted">${escapeHtml(message)}</p>`;
    }
}

export function chooseGoRobotMove(logic, depth = 2) {
    const analysis = analyzeGoPosition(logic, depth);
    const best = analysis.topMoves[0] || null;
    return {
        move: best?.move || null,
        score: best?.score ?? analysis.currentScore,
        nodes: analysis.nodes,
        truncated: analysis.truncated
    };
}

export function analyzeGoPosition(logic, depth = 2) {
    const player = logic.currentPlayer;
    const baseScore = evaluateGo(logic, player);
    const candidates = rankCandidateMoves(logic, player, depth);
    const context = { nodes: 0, nodeLimit: NODE_LIMIT_BY_DEPTH[clampDepth(depth)], truncated: false };
    const results = [];

    for (const move of candidates) {
        if (context.nodes >= context.nodeLimit) {
            context.truncated = true;
            break;
        }
        const clone = cloneGoLogic(logic);
        applyGoMove(clone, move, player);
        const score = -goNegamax(clone, Math.max(0, clampDepth(depth) - 1), otherColor(player), -INF, INF, context);
        results.push({
            move,
            score,
            scoreText: formatScore(score),
            winRate: scoreToWinRate(score),
            reasons: explainGoMove(logic, clone, move, player, score)
        });
    }

    results.sort((a, b) => b.score - a.score);
    return {
        player,
        topology: logic.topology,
        lattice: logic.lattice,
        depth: clampDepth(depth),
        nodes: context.nodes,
        truncated: context.truncated,
        currentScore: baseScore,
        currentWinRate: scoreToWinRate(baseScore),
        topMoves: results.slice(0, 5),
        badMoves: results.slice(-5).reverse(),
        groupValues: evaluateGroups(logic, player).slice(0, 8)
    };
}

function goNegamax(logic, depth, player, alpha, beta, context) {
    context.nodes += 1;
    if (context.nodes >= context.nodeLimit) {
        context.truncated = true;
        return evaluateGo(logic, player);
    }
    if (depth <= 0 || logic.gameOver || logic.scoringPending) return evaluateGo(logic, player);

    const moves = rankCandidateMoves(logic, player, depth).slice(0, CANDIDATE_LIMIT_BY_DEPTH[clampDepth(depth)]);
    if (moves.length === 0) return evaluateGo(logic, player);

    let best = -INF;
    for (const move of moves) {
        const clone = cloneGoLogic(logic);
        applyGoMove(clone, move, player);
        const score = -goNegamax(clone, depth - 1, otherColor(player), -beta, -alpha, context);
        if (score > best) best = score;
        alpha = Math.max(alpha, score);
        if (alpha >= beta || context.truncated) break;
    }
    return best;
}

function rankCandidateMoves(logic, player, depth = 2) {
    const legal = getLegalMoves(logic, player);
    const limit = CANDIDATE_LIMIT_BY_DEPTH[clampDepth(depth)] * 3;
    return legal
        .map((move) => ({ move, score: quickMoveScore(logic, move, player) }))
        .sort((a, b) => b.score - a.score)
        .slice(0, Math.max(6, limit))
        .map((item) => item.move);
}

function getLegalMoves(logic, player = logic.currentPlayer) {
    if (logic.gameOver || logic.scoringPending) return [];
    const moves = [];
    for (let index = 0; index < logic.board.length; index += 1) {
        if (logic.board[index] !== COLORS.empty) continue;
        const coord = logic.coordFromIndex(index);
        const preview = previewLegalPlay(logic, coord, player);
        if (preview.ok) {
            moves.push({
                type: 'play',
                coord,
                captured: preview.captured,
                liberties: preview.liberties,
                label: coordLabel(coord)
            });
        }
    }
    if (!moves.length) moves.push({ type: 'pass', label: 'Pass' });
    return moves;
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
            for (const stone of enemy.group) {
                nextBoard[stone] = COLORS.empty;
                captured += 1;
            }
        }
    }

    const own = logic.getGroupAndLiberties(nextBoard, index);
    if (own.liberties.size === 0) return { ok: false };
    const serialized = logic.serializeBoard(nextBoard);
    if (logic.positionSet?.has(serialized)) return { ok: false };
    return { ok: true, captured, liberties: own.liberties.size };
}

function quickMoveScore(logic, move, player) {
    if (move.type === 'pass') return -50;
    let score = 0;
    score += 5 * (move.captured || 0);
    score += 0.6 * (move.liberties || 0);
    score += topologyMoveBonus(logic, move.coord, player);

    const [x, y] = move.coord;
    const center = (logic.size - 1) / 2;
    const centerDistance = Math.abs(x - center) + Math.abs(y - center);
    score += logic.topology === 'open2d' ? -0.12 * centerDistance : 0;

    let friendlyNeighbors = 0;
    let enemyNeighbors = 0;
    for (const next of logic.neighborsFromIndex(logic.indexFromCoord(move.coord))) {
        const color = valueToColor(logic.board[next]);
        if (color === player) friendlyNeighbors += 1;
        if (color === otherColor(player)) enemyNeighbors += 1;
    }
    score += 0.9 * friendlyNeighbors + 1.1 * enemyNeighbors;
    return score;
}

function applyGoMove(logic, move, player) {
    if (move.type === 'pass') return logic.pass(player);
    return logic.tryPlay(move.coord, player);
}

function evaluateGo(logic, player) {
    if (logic.gameOver && logic.winner) {
        if (logic.winner === player) return 100000;
        if (logic.winner === 'draw') return 0;
        return -100000;
    }
    const opponent = otherColor(player);
    let area = { black: 0, white: logic.komi || 7.5 };
    try {
        area = logic.computeAreaScore();
    } catch {
        // Keep simple score if count is unavailable.
    }
    const areaDiff = player === 'black' ? area.black - area.white : area.white - area.black;
    const captureDiff = (logic.captures[player] || 0) - (logic.captures[opponent] || 0);
    const groupDiff = groupScore(logic, player) - groupScore(logic, opponent);
    const topologyDiff = topologyScore(logic, player) - topologyScore(logic, opponent);
    return 18 * areaDiff + 9 * captureDiff + groupDiff + topologyDiff;
}

function groupScore(logic, player) {
    let score = 0;
    for (const info of allGroups(logic)) {
        if (info.color !== player) continue;
        score += 2.0 * info.size + 1.4 * info.liberties;
        if (info.liberties <= 1) score -= 25 + 2 * info.size;
        else if (info.liberties === 2) score -= 8;
        if (info.size >= 4 && info.liberties >= 4) score += 10;
    }
    return score;
}

function topologyScore(logic, player) {
    const stones = [];
    for (let index = 0; index < logic.board.length; index += 1) {
        if (valueToColor(logic.board[index]) === player) stones.push(logic.coordFromIndex(index));
    }
    if (!stones.length) return 0;
    const edgeHits = new Set();
    const n = logic.size;
    for (const [x, y] of stones) {
        if (x === 0) edgeHits.add('left');
        if (x === n - 1) edgeHits.add('right');
        if (y === 0) edgeHits.add('top');
        if (y === n - 1) edgeHits.add('bottom');
    }
    let score = 0;
    if (logic.topology === 'pbc') score += 7 * edgeHits.size;
    if (logic.topology === 'klein') score += 5 * edgeHits.size + (edgeHits.has('top') && edgeHits.has('bottom') ? 15 : 0);
    if (logic.topology === 'random') score += 4 * edgeHits.size;
    if (logic.lattice === 'triangular') score += 0.4 * stones.length;
    return score;
}

function topologyMoveBonus(logic, coord, player) {
    const [x, y] = coord;
    const n = logic.size;
    let bonus = 0;
    if (logic.topology === 'pbc' && (x === 0 || x === n - 1 || y === 0 || y === n - 1)) bonus += 8;
    if (logic.topology === 'klein' && (y === 0 || y === n - 1)) bonus += 10;
    if (logic.topology === 'random' && (x === 0 || x === n - 1 || y === 0 || y === n - 1)) bonus += 5;
    return bonus;
}

function evaluateGroups(logic, perspective) {
    return allGroups(logic).map((info) => {
        const sign = info.color === perspective ? 1 : -1;
        const value = sign * (2.0 * info.size + 1.4 * info.liberties - (info.liberties <= 1 ? 25 : info.liberties === 2 ? 8 : 0));
        return {
            color: info.color,
            anchor: coordLabel(info.anchor),
            size: info.size,
            liberties: info.liberties,
            value,
            reason: info.liberties <= 1 ? 'in atari / immediate capture risk' : info.liberties === 2 ? 'weak group with low liberties' : 'stable group with usable liberties'
        };
    }).sort((a, b) => Math.abs(b.value) - Math.abs(a.value));
}

function allGroups(logic) {
    const groups = [];
    const visited = new Set();
    for (let index = 0; index < logic.board.length; index += 1) {
        const color = valueToColor(logic.board[index]);
        if (!color || visited.has(index)) continue;
        const group = logic.getGroupAndLiberties(logic.board, index);
        for (const stone of group.group) visited.add(stone);
        groups.push({
            color,
            anchor: logic.coordFromIndex(index),
            size: group.group.size,
            liberties: group.liberties.size
        });
    }
    return groups;
}

function explainGoMove(before, after, move, player, score) {
    const reasons = [];
    if (move.type === 'pass') {
        reasons.push('passes because no legal play is attractive or available');
        return reasons;
    }
    const played = after.indexFromCoord(move.coord);
    const group = after.getGroupAndLiberties(after.board, played);
    if (move.captured > 0) reasons.push(`captures ${move.captured} stone${move.captured === 1 ? '' : 's'}`);
    if (group.liberties.size <= 1) reasons.push('danger: the played group has only one liberty');
    if (group.liberties.size >= 4) reasons.push('creates a group with good liberties');
    const beforeEval = evaluateGo(before, player);
    const afterEval = evaluateGo(after, player);
    if (afterEval > beforeEval + 10) reasons.push('improves area/group evaluation');
    if (afterEval < beforeEval - 10) reasons.push('looks worse after evaluation/search');
    if (before.topology === 'pbc' && topologyMoveBonus(after, move.coord, player) > 0) reasons.push('contests a periodic wrapping edge/cycle');
    if (before.topology === 'klein' && topologyMoveBonus(after, move.coord, player) > 0) reasons.push('uses a Klein-boundary strategic edge');
    if (before.topology === 'random') reasons.push('uses legal neighborhoods from the fixed 2D RBC map');
    if (score < -15) reasons.push('bad because opponent replies reduce the searched value');
    if (!reasons.length) reasons.push('keeps the searched position stable');
    return reasons;
}

function cloneGoLogic(logic) {
    const clone = new GoGameLogic({
        size: logic.size,
        topology: logic.topology,
        lattice: logic.lattice,
        dimension: logic.dimension,
        komi: logic.komi,
        randomBoundarySeed: logic.randomBoundarySeed,
        randomBoundaryMap: [...logic.randomBoundaryMap.entries()]
    });
    clone.importState(logic.exportState());
    return clone;
}

function scoreToWinRate(score) {
    if (score >= 100000) return 0.999;
    if (score <= -100000) return 0.001;
    return 1 / (1 + Math.exp(-score / 70));
}

function formatScore(score) {
    if (score >= 90000) return '+W';
    if (score <= -90000) return '-L';
    return `${score >= 0 ? '+' : ''}${(score / 18).toFixed(1)} pts`;
}

function coordLabel(coord) {
    if (!Array.isArray(coord)) return 'pass';
    return `(${coord.map((value) => value + 1).join(',')})`;
}

function moveRow(rank, item) {
    const reasons = item.reasons.map((reason) => `<li>${escapeHtml(reason)}</li>`).join('');
    return `<li><div><strong>${rank}. ${escapeHtml(item.move.label || coordLabel(item.move.coord))}</strong></div><div class="robot-muted">score ${escapeHtml(item.scoreText)} · win ${(100 * item.winRate).toFixed(1)}%</div><ul>${reasons}</ul></li>`;
}

function clampDepth(value) {
    return Math.max(1, Math.min(4, Math.floor(Number(value) || 2)));
}

function escapeHtml(value) {
    return String(value ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}

function nextFrame() {
    return new Promise((resolve) => window.requestAnimationFrame(() => resolve()));
}

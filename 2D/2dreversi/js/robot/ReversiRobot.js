import { ReversiGame, otherReversiColor } from '../../../../js/reversi/ReversiGame.js';

const INF = 1e9;
const NODE_LIMIT = 65000;

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
        this.sideSelect?.addEventListener('change', () => {
            this.side = this.sideSelect.value === 'black' ? 'black' : 'white';
            this.clearAnalysis();
            this.app.updateOnlineControls?.();
            this.scheduleIfNeeded();
            this.app.updateUI();
        });
        this.depthSelect?.addEventListener('change', () => {
            this.depth = clampDepth(Number(this.depthSelect.value) || 3);
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
        return this.isRobotMode() && !this.app.logic.gameOver && this.app.logic.currentPlayer === this.side;
    }

    shouldBlockHumanInput(color = this.app.logic.currentPlayer) {
        return this.thinking || (this.isRobotMode() && color === this.side);
    }

    scheduleIfNeeded() {
        if (this.pendingTimer) window.clearTimeout(this.pendingTimer);
        if (!this.isRobotTurn()) return;
        this.pendingTimer = window.setTimeout(() => this.forceMove(), 160);
    }

    afterLocalAction() {
        this.clearAnalysis();
        this.scheduleIfNeeded();
    }

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
            if (!played.ok) {
                this.setMessage(`Robot move was rejected: ${played.reason || 'illegal'}`);
                return;
            }
            this.app.afterLocalAction(`Robot played ${coordLabel(result.move.coord)} and flipped ${played.flipped}.`);
            this.setMessage(`Robot played ${coordLabel(result.move.coord)}. Score ${formatScore(result.score)}. Nodes ${result.nodes}${result.truncated ? ' (limited)' : ''}.`);
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
        this.setMessage(`Analyzing ${this.app.logic.currentPlayer} at depth ${this.depth}...`);
        this.updatePanelState();
        await nextFrame();
        try {
            const analysis = analyzeReversiPosition(this.app.logic, this.depth);
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
        const features = analysis.features.map((item) => `<li><strong>${escapeHtml(item.name)}</strong>: ${escapeHtml(item.text)}</li>`).join('');
        this.output.innerHTML = `
            <div class="robot-summary-grid">
                <div><span class="robot-label">Side</span><strong>${escapeHtml(analysis.player)}</strong></div>
                <div><span class="robot-label">Boundary</span><strong>${escapeHtml(analysis.topology)} / ${escapeHtml(analysis.lattice)}</strong></div>
                <div><span class="robot-label">Score</span><strong>${formatScore(analysis.currentScore)}</strong></div>
                <div><span class="robot-label">Win rate</span><strong>${(100 * analysis.currentWinRate).toFixed(1)}%</strong></div>
            </div>
            <p class="robot-muted">Depth ${analysis.depth}; ${analysis.nodes} searched nodes${analysis.truncated ? ', node limit reached' : ''}. Win rate is heuristic, not solved.</p>
            <h4>Top moves</h4>
            <ol class="robot-move-list">${top || '<li>No legal move. Pass is likely required.</li>'}</ol>
            <h4>Bad moves</h4>
            <ol class="robot-move-list robot-bad-list">${bad || '<li>No bad move list.</li>'}</ol>
            <h4>Position signals</h4>
            <ul class="robot-piece-list">${features || '<li>No signals.</li>'}</ul>
        `;
    }

    updatePanelState() {
        if (this.sideSelect) this.sideSelect.value = this.side;
        if (this.depthSelect) this.depthSelect.value = String(this.depth);
        if (this.moveButton) this.moveButton.disabled = this.thinking || this.app.logic.gameOver || this.app.gameModeSelect?.value === 'online';
        if (this.analyzeButton) this.analyzeButton.disabled = this.thinking || this.app.logic.gameOver;
    }

    clearAnalysis() {
        if (this.output) this.output.innerHTML = '<p class="robot-muted">Click Analyze Position to rank legal moves, estimate win rate, and show Reversi signals.</p>';
    }

    setMessage(message) {
        if (this.output) this.output.innerHTML = `<p class="robot-muted">${escapeHtml(message)}</p>`;
    }
}

export function chooseReversiRobotMove(logic, depth = 3) {
    const analysis = analyzeReversiPosition(logic, depth);
    const best = analysis.topMoves[0] || null;
    return {
        move: best?.move || null,
        score: best?.score ?? analysis.currentScore,
        nodes: analysis.nodes,
        truncated: analysis.truncated
    };
}

export function analyzeReversiPosition(logic, depth = 3) {
    const player = logic.currentPlayer;
    const currentScore = evaluateReversi(logic, player);
    const moves = orderMoves(logic.legalMoves(player), logic, player);
    const context = { nodes: 0, nodeLimit: NODE_LIMIT, truncated: false, tt: new Map() };
    const results = [];
    for (const move of moves) {
        if (context.nodes >= context.nodeLimit) {
            context.truncated = true;
            break;
        }
        const clone = cloneReversi(logic);
        clone.play(move.coord, player);
        const score = -negamax(clone, clampDepth(depth) - 1, -INF, INF, otherReversiColor(player), context);
        results.push({
            move: { coord: move.coord, flips: move.flips, label: coordLabel(move.coord) },
            score,
            scoreText: formatScore(score),
            winRate: scoreToWinRate(score),
            reasons: explainReversiMove(logic, clone, move, player, score)
        });
    }
    results.sort((a, b) => b.score - a.score);
    return {
        player,
        topology: logic.topology.topology,
        lattice: logic.topology.lattice,
        depth: clampDepth(depth),
        nodes: context.nodes,
        truncated: context.truncated,
        currentScore,
        currentWinRate: scoreToWinRate(currentScore),
        topMoves: results.slice(0, 5),
        badMoves: results.slice(-5).reverse(),
        features: positionSignals(logic, player)
    };
}

function negamax(logic, depth, alpha, beta, player, context) {
    context.nodes += 1;
    if (context.nodes >= context.nodeLimit) {
        context.truncated = true;
        return evaluateReversi(logic, player);
    }
    if (logic.gameOver || depth <= 0) return evaluateReversi(logic, player);
    const hash = `${depth}:${player}:${logic.currentPlayer}:${[...logic.board.entries()].map(([k, v]) => `${k}:${v.color}`).sort().join('|')}`;
    const cached = context.tt.get(hash);
    if (cached !== undefined) return cached;
    const moves = orderMoves(logic.legalMoves(player), logic, player);
    if (!moves.length) {
        const passClone = cloneReversi(logic);
        const pass = passClone.pass();
        if (!pass.ok) return evaluateReversi(logic, player);
        return -negamax(passClone, depth - 1, -beta, -alpha, otherReversiColor(player), context);
    }
    let best = -INF;
    for (const move of moves) {
        const clone = cloneReversi(logic);
        clone.play(move.coord, player);
        const score = -negamax(clone, depth - 1, -beta, -alpha, otherReversiColor(player), context);
        if (score > best) best = score;
        alpha = Math.max(alpha, score);
        if (alpha >= beta || context.truncated) break;
    }
    context.tt.set(hash, best);
    return best;
}

function orderMoves(moves, logic, player) {
    return moves.slice().sort((a, b) => quickMoveScore(b, logic, player) - quickMoveScore(a, logic, player));
}

function quickMoveScore(move, logic, player) {
    const clone = cloneReversi(logic);
    const before = evaluateReversi(logic, player);
    const play = clone.play(move.coord, player);
    if (!play.ok) return -INF;
    let score = evaluateReversi(clone, player) - before;
    score += 8 * (move.flips?.length || play.flipped || 0);
    score += anchorBonus(logic, move.coord) * 2;
    if (isFrontierCoord(logic, move.coord)) score -= 8;
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
    const late = counts.empty < logic.topology.totalVertices * 0.18;
    return (late ? 6 : 1.4) * discDiff + 9 * mobilityDiff + 35 * anchorDiff + 5 * frontierDiff + topologyDiff;
}

function controlledAnchors(logic, player) {
    return anchorCoords(logic).filter((coord) => logic.get(coord)?.color === player).length;
}

function anchorBonus(logic, coord) {
    return anchorCoords(logic).some((anchor) => logic.key(anchor) === logic.key(coord)) ? 40 : 0;
}

function anchorCoords(logic) {
    const w = logic.topology.width;
    const h = logic.topology.height;
    if (logic.topology.topology === 'open2d') return [[0, 0], [w - 1, 0], [0, h - 1], [w - 1, h - 1]];
    if (logic.topology.topology === 'klein') return [[0, 0], [w - 1, 0], [0, h - 1], [w - 1, h - 1]];
    if (logic.topology.topology === 'random') return [[0, 0], [w - 1, 0], [0, h - 1], [w - 1, h - 1]];
    const midX = Math.floor(w / 2);
    const midY = Math.floor(h / 2);
    return [[0, midY], [w - 1, midY], [midX, 0], [midX, h - 1]];
}

function frontierCount(logic, player) {
    let count = 0;
    for (const [key, stone] of logic.board.entries()) {
        if (stone.color !== player) continue;
        const coord = key.split(',').map(Number);
        if (logic.topology.directionsFor(coord).some((direction) => {
            const next = logic.topology.step(coord, direction);
            return next && !logic.get(next);
        })) count += 1;
    }
    return count;
}

function isFrontierCoord(logic, coord) {
    return logic.topology.directionsFor(coord).some((direction) => {
        const next = logic.topology.step(coord, direction);
        return next && !logic.get(next);
    });
}

function topologyControl(logic, player) {
    let score = 0;
    for (const [key, stone] of logic.board.entries()) {
        if (stone.color !== player) continue;
        const [x, y] = key.split(',').map(Number);
        if (x === 0 || y === 0 || x === logic.topology.width - 1 || y === logic.topology.height - 1) {
            if (logic.topology.topology === 'pbc') score += 5;
            else if (logic.topology.topology === 'klein') score += 4;
            else if (logic.topology.topology === 'random') score += 3;
            else score += 2;
        }
    }
    return score;
}

function positionSignals(logic, player) {
    const opponent = otherReversiColor(player);
    const counts = logic.counts();
    return [
        { name: 'Disc balance', text: `${player}: ${counts[player]}, ${opponent}: ${counts[opponent]}` },
        { name: 'Mobility', text: `${player} has ${logic.legalMoves(player).length} legal moves; ${opponent} has ${logic.legalMoves(opponent).length}` },
        { name: 'Anchors', text: `${player} controls ${controlledAnchors(logic, player)} generalized anchors; ${opponent} controls ${controlledAnchors(logic, opponent)}` },
        { name: 'Frontier', text: `${player} frontier discs: ${frontierCount(logic, player)}; ${opponent}: ${frontierCount(logic, opponent)}` },
        { name: 'Topology', text: topologyText(logic) }
    ];
}

function topologyText(logic) {
    if (logic.topology.topology === 'pbc') return 'periodic board: edge discs can interact through wrap cycles, so anchors are generalized to wrap-control points';
    if (logic.topology.topology === 'klein') return 'Klein bottle: top/bottom crossing flips x, so topological edge control can reverse attacks';
    if (logic.topology.topology === 'random') return '2D RBC: search uses the fixed random boundary map through the rule engine';
    return 'standard board: corners/edges are stable anchors';
}

function explainReversiMove(before, after, move, player, score) {
    const reasons = [];
    if (move.flips?.length) reasons.push(`flips ${move.flips.length} disc${move.flips.length === 1 ? '' : 's'}`);
    if (anchorBonus(before, move.coord) > 0) reasons.push('takes a generalized anchor/corner');
    if (isFrontierCoord(before, move.coord)) reasons.push('touches frontier space, which may give opponent access');
    const beforeMob = before.legalMoves(player).length;
    const afterMob = after.legalMoves(player).length;
    if (afterMob > beforeMob) reasons.push('increases future mobility');
    if (afterMob < beforeMob) reasons.push('reduces future mobility');
    if (before.topology.topology === 'pbc') reasons.push('evaluated with periodic wrap control');
    if (before.topology.topology === 'klein') reasons.push('evaluated with Klein-boundary orientation reversal');
    if (before.topology.topology === 'random') reasons.push('evaluated through the 2D RBC legal graph');
    if (score < -15) reasons.push('bad after opponent replies in search');
    if (!reasons.length) reasons.push('keeps a stable searched position');
    return reasons;
}

function cloneReversi(logic) {
    const clone = new ReversiGame({
        topology: logic.topology.topology,
        lattice: logic.topology.lattice,
        size: logic.topology.size,
        width: logic.topology.width,
        height: logic.topology.height,
        randomBoundarySeed: logic.topology.randomBoundarySeed,
        randomBoundaryMap: [...logic.topology.randomBoundaryMap.entries()]
    });
    clone.importState(logic.exportState());
    return clone;
}

function scoreToWinRate(score) {
    if (score >= 90000) return 0.999;
    if (score <= -90000) return 0.001;
    return 1 / (1 + Math.exp(-score / 90));
}

function formatScore(score) {
    if (score >= 90000) return '+W';
    if (score <= -90000) return '-L';
    return `${score >= 0 ? '+' : ''}${(score / 10).toFixed(1)}`;
}

function coordLabel(coord) {
    return `(${coord.map((value) => value + 1).join(',')})`;
}

function moveRow(rank, item) {
    const reasons = item.reasons.map((reason) => `<li>${escapeHtml(reason)}</li>`).join('');
    return `<li><div><strong>${rank}. ${escapeHtml(item.move.label || coordLabel(item.move.coord))}</strong></div><div class="robot-muted">score ${escapeHtml(item.scoreText)} · win ${(100 * item.winRate).toFixed(1)}%</div><ul>${reasons}</ul></li>`;
}

function clampDepth(value) {
    return Math.max(1, Math.min(5, Math.floor(Number(value) || 3)));
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

import { chooseRobotMove, analyzePosition } from './ChessSearch.js';
import { createAnalysisState, getAllLegalMoves, validateMoveStillLegal } from './ChessRobotAdapter.js';
import { formatScore } from './ChessEvaluator.js';

export class ChessRobotController {
    constructor(game) {
        this.game = game;
        this.enabled = false;
        this.side = 'black';
        this.depth = 2;
        this.thinking = false;
        this.pendingTimer = null;
    }

    attachEventListeners() {
        const side = document.getElementById('robotSideSelect');
        const depth = document.getElementById('robotDepthSelect');
        const moveBtn = document.getElementById('robotMoveBtn');
        const analyzeBtn = document.getElementById('robotAnalyzeBtn');


        side?.addEventListener('change', () => {
            this.side = side.value === 'white' ? 'white' : 'black';
            this.clearAnalysis();
            this.game.updateUI?.();
            this.scheduleRobotMoveIfNeeded();
        });

        depth?.addEventListener('change', () => {
            this.depth = Math.max(1, Math.min(4, Number(depth.value) || 2));
        });

        moveBtn?.addEventListener('click', () => this.forceRobotMove());
        analyzeBtn?.addEventListener('click', () => this.renderAnalysis());
        this.updatePanelState();
    }

    isRobotTurn() {
        return this.game.gameMode === 'robot' && !this.game.gameOver && this.game.currentPlayer === this.side;
    }

    shouldBlockHumanInput() {
        return this.thinking || this.isRobotTurn();
    }

    handlePostMove(options = {}) {
        if (options.remote || options.robot) return;
        this.clearAnalysis();
        this.scheduleRobotMoveIfNeeded();
    }

    scheduleRobotMoveIfNeeded() {
        if (this.pendingTimer) clearTimeout(this.pendingTimer);
        if (!this.isRobotTurn()) return;
        this.pendingTimer = window.setTimeout(() => this.forceRobotMove(), 180);
    }

    async forceRobotMove() {
        if (this.thinking || this.game.gameOver || !['local', 'robot'].includes(this.game.gameMode)) return;
        if (this.game.gameMode !== 'robot' && !confirm('Robot mode is not selected. Let the local robot move for the current side once?')) return;

        const currentSide = this.game.currentPlayer;
        this.thinking = true;
        this.setPanelMessage(`Robot is searching for ${currentSide} at depth ${this.depth}...`);
        this.updatePanelState();

        await nextFrame();

        try {
            const result = chooseRobotMove(this.game, this.depth);
            const legal = validateMoveStillLegal(this.game, result.move);
            if (!legal) {
                this.setPanelMessage('Robot found no legal move. Try Analyze Position to inspect the state.');
                return;
            }

            const ok = await this.game.applyMove({
                from: legal.from,
                to: legal.to,
                promotion: legal.promotion || 'Q'
            }, { robot: true });

            if (ok) {
                this.setPanelMessage(`Robot played ${legal.label}. Score ${formatScore(result.score)}. Nodes: ${result.nodes}${result.truncated ? ' (limited)' : ''}.`);
            } else {
                this.setPanelMessage('Robot move was rejected by the current legal-move validator.');
            }
        } catch (error) {
            console.error(error);
            this.setPanelMessage(`Robot error: ${error.message}`);
        } finally {
            this.thinking = false;
            this.updatePanelState();
        }
    }

    async renderAnalysis() {
        if (this.thinking) return;
        this.thinking = true;
        this.setPanelMessage(`Analyzing ${this.game.currentPlayer} at depth ${this.depth}...`);
        this.updatePanelState();
        await nextFrame();

        try {
            const state = createAnalysisState(this.game);
            const legal = getAllLegalMoves(state, state.currentPlayer);
            if (legal.length === 0) {
                this.setPanelMessage('No legal moves in the current position.');
                return;
            }
            const analysis = analyzePosition(this.game, this.depth);
            this.renderAnalysisResult(analysis);
        } catch (error) {
            console.error(error);
            this.setPanelMessage(`Analysis error: ${error.message}`);
        } finally {
            this.thinking = false;
            this.updatePanelState();
        }
    }

    renderAnalysisResult(analysis) {
        const output = document.getElementById('robotAnalysisOutput');
        if (!output) return;
        const winRate = (100 * analysis.currentWinRate).toFixed(1);
        const top = analysis.topMoves.map((item, index) => moveRow(index + 1, item)).join('');
        const bad = analysis.badMoves.map((item, index) => moveRow(index + 1, item)).join('');
        const pieces = analysis.pieceValues.map((item) => `
            <li><strong>${escapeHtml(item.piece)} ${escapeHtml(item.square)}</strong>: ${item.dynamicValue}
                <span class="robot-muted">base ${item.baseValue}, mobility ${item.mobility}; ${escapeHtml(item.reason)}</span>
            </li>`).join('');

        output.innerHTML = `
            <div class="robot-summary-grid">
                <div><span class="robot-label">Side</span><strong>${escapeHtml(analysis.player)}</strong></div>
                <div><span class="robot-label">Boundary</span><strong>${escapeHtml(analysis.boundaryCondition)}</strong></div>
                <div><span class="robot-label">Score</span><strong>${escapeHtml(analysis.currentScoreText)}</strong></div>
                <div><span class="robot-label">Win rate</span><strong>${winRate}%</strong></div>
            </div>
            <p class="robot-muted">Depth ${analysis.depth}, ${analysis.nodes} searched nodes${analysis.truncated ? ', node limit reached' : ''}. Win rate is a calibrated-looking heuristic, not a solved proof.</p>
            <h4>Top moves</h4>
            <ol class="robot-move-list">${top || '<li>No top moves.</li>'}</ol>
            <h4>Bad moves</h4>
            <ol class="robot-move-list robot-bad-list">${bad || '<li>No bad moves.</li>'}</ol>
            <h4>Current piece values</h4>
            <ul class="robot-piece-list">${pieces || '<li>No pieces found.</li>'}</ul>
        `;
    }

    clearAnalysis() {
        const output = document.getElementById('robotAnalysisOutput');
        if (output) output.innerHTML = '<p class="robot-muted">Click Analyze Position to rank legal moves and show dynamic piece values.</p>';
    }

    setPanelMessage(message) {
        const output = document.getElementById('robotAnalysisOutput');
        if (output) output.innerHTML = `<p class="robot-muted">${escapeHtml(message)}</p>`;
    }

    updatePanelState() {
        const moveBtn = document.getElementById('robotMoveBtn');
        const analyzeBtn = document.getElementById('robotAnalyzeBtn');
        const side = document.getElementById('robotSideSelect');
        const depth = document.getElementById('robotDepthSelect');

        this.enabled = this.game.gameMode === 'robot';
        if (side) side.value = this.side;
        if (depth) depth.value = String(this.depth);
        if (moveBtn) moveBtn.disabled = this.thinking || !['local', 'robot'].includes(this.game.gameMode) || this.game.gameOver;
        if (analyzeBtn) analyzeBtn.disabled = this.thinking || this.game.gameOver;
    }
}

function moveRow(rank, item) {
    const reasons = item.reasons.map((reason) => `<li>${escapeHtml(reason)}</li>`).join('');
    return `
        <li>
            <div><strong>${rank}. ${escapeHtml(item.move.label)}</strong></div>
            <div class="robot-muted">score ${escapeHtml(item.scoreText)} · win ${(100 * item.winRate).toFixed(1)}%</div>
            <ul>${reasons}</ul>
        </li>`;
}

function escapeHtml(value) {
    return String(value)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}

function nextFrame() {
    return new Promise((resolve) => window.requestAnimationFrame(() => resolve()));
}

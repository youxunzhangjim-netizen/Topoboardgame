import { chooseRobotMove, analyzePosition } from './ChessSearch.js';
import { createAnalysisState, getAllLegalMoves, validateMoveStillLegal } from './ChessRobotAdapter.js';
import { formatScore } from './ChessEvaluator.js';

export function robotPromotionForMove(legalMove) {
    return legalMove?.promotion || null;
}

export class ChessRobotController {
    constructor(game) {
        this.game = game;
        this.enabled = false;
        this.side = 'black';
        this.depth = 2;
        this.thinking = false;
        this.pendingTimer = null;
        this.worker = null;
        this.workerRequestId = 0;
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
            const result = await this.runSearch('move');
            const legal = validateMoveStillLegal(this.game, result.move);
            if (!legal) {
                this.setPanelMessage('Robot found no legal move. Try Analyze Position to inspect the state.');
                return;
            }

            const ok = await this.game.applyMove({
                from: legal.from,
                to: legal.to,
                promotion: robotPromotionForMove(legal)
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
            const analysis = await this.runSearch('analyze');
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

    async runSearch(type) {
        const state = createAnalysisState(this.game);
        if (type === 'move' && state.boundaryCondition === 'forbidden' && window.TopoboardgameLocalApp?.chooseStockfishMove) {
            const masterMove = await this.runDesktopStockfish(state);
            if (masterMove) return masterMove;
        }
        if (window.Worker) {
            try {
                return await this.runWorkerSearch(type, state);
            } catch (error) {
                console.warn('Robot worker unavailable; falling back to main-thread search.', error);
            }
        }
        await idleYield();
        return type === 'analyze'
            ? analyzePosition(this.game, this.depth)
            : chooseRobotMove(this.game, this.depth);
    }

    async runDesktopStockfish(state) {
        const legalMoves = getAllLegalMoves(state, state.currentPlayer);
        if (!legalMoves.length) return null;
        try {
            const response = await window.TopoboardgameLocalApp.chooseStockfishMove({
                fen: stateToFen(state),
                depth: 8 + this.depth * 2
            });
            if (!response?.available || !response.move) return null;
            const move = legalMoves.find((candidate) => moveToUci(candidate) === response.move)
                || legalMoves.find((candidate) => moveToUci(candidate).slice(0, 4) === response.move.slice(0, 4));
            if (!move) return null;
            return { move, score: 0, nodes: legalMoves.length, engine: response.engine || 'Stockfish', depth: response.depth };
        } catch (error) {
            console.warn('Stockfish unavailable; using the Topoboardgame local robot.', error);
            return null;
        }
    }

    runWorkerSearch(type, state) {
        return new Promise((resolve, reject) => {
            const worker = this.ensureWorker();
            const id = ++this.workerRequestId;
            const cleanup = () => {
                worker.removeEventListener('message', onMessage);
                worker.removeEventListener('error', onError);
            };
            const onMessage = (event) => {
                if (event.data?.id !== id) return;
                cleanup();
                if (event.data.ok) resolve(event.data.result);
                else reject(new Error(event.data.error || 'Robot search failed.'));
            };
            const onError = (event) => {
                cleanup();
                reject(event.error || new Error(event.message || 'Robot worker error.'));
            };
            worker.addEventListener('message', onMessage);
            worker.addEventListener('error', onError);
            worker.postMessage({ id, type, depth: this.depth, state });
        });
    }

    ensureWorker() {
        if (!this.worker) {
            this.worker = new Worker(new URL('./ChessRobotWorker.js', import.meta.url), { type: 'module' });
        }
        return this.worker;
    }
}

function stateToFen(state) {
    const rows = state.board.map((row) => {
        let text = '';
        let empty = 0;
        for (const piece of row) {
            if (!piece) {
                empty += 1;
                continue;
            }
            if (empty) {
                text += String(empty);
                empty = 0;
            }
            const symbol = piece.type === 'N' ? 'n' : piece.type.toLowerCase();
            text += piece.color === 'white' ? symbol.toUpperCase() : symbol;
        }
        return text + (empty ? String(empty) : '');
    });
    const active = state.currentPlayer === 'black' ? 'b' : 'w';
    const castling = castlingRights(state.board);
    const enPassant = enPassantFen(state);
    return rows.join('/') + ' ' + active + ' ' + castling + ' ' + enPassant + ' ' + (state.halfMoveClock || 0) + ' 1';
}

function castlingRights(board) {
    let rights = '';
    const whiteKing = board[7]?.[4];
    const blackKing = board[0]?.[4];
    if (whiteKing?.type === 'K' && whiteKing.color === 'white' && !whiteKing.hasMoved) {
        if (board[7]?.[7]?.type === 'R' && !board[7][7].hasMoved) rights += 'K';
        if (board[7]?.[0]?.type === 'R' && !board[7][0].hasMoved) rights += 'Q';
    }
    if (blackKing?.type === 'K' && blackKing.color === 'black' && !blackKing.hasMoved) {
        if (board[0]?.[7]?.type === 'R' && !board[0][7].hasMoved) rights += 'k';
        if (board[0]?.[0]?.type === 'R' && !board[0][0].hasMoved) rights += 'q';
    }
    return rights || '-';
}

function moveToUci(move) {
    const promotion = move.promotion ? String(move.promotion).toLowerCase()[0] : '';
    return coordToSquare(move.from) + coordToSquare(move.to) + promotion;
}

function coordToSquare(coord) {
    const row = Number(coord.r ?? coord.row);
    const col = Number(coord.c ?? coord.col);
    return 'abcdefgh'[col] + String(8 - row);
}

function enPassantFen(state) {
    if (!state.enPassantTarget) return '-';
    const destinationRow = Number(state.enPassantTarget.r ?? state.enPassantTarget.row);
    const col = Number(state.enPassantTarget.c ?? state.enPassantTarget.col);
    const crossedRow = state.currentPlayer === 'black' ? destinationRow + 1 : destinationRow - 1;
    return coordToSquare({ r: crossedRow, c: col });
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

function idleYield() {
    return new Promise((resolve) => window.setTimeout(resolve, 0));
}

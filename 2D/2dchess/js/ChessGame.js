import { BoardSetup, BOARD_THEMES, PIECE_GLYPHS, PROMOTION_TYPES, createPiece } from './BoardSetup.js';
import { PieceMovement, createRandomChessBoundaryState } from './PieceMovement.js';
import { FirebaseStateNetworkManager } from '../../../js/FirebaseStateNetworkManager.js';
import { buildOnlineMatchKey, currentSpaceTimeMatchFields } from '../../../js/shared/OnlineMatchKey.js';
import { applyLanguage, hasTranslation, setLanguage, t } from './i18n.js';
import { ChessRobotController } from './robot/ChessRobotController.js';

const SIZE = 8;

export class ChessGame {
    constructor() {
        this.board = [];
        this.selectedSquare = null;
        this.legalMoves = [];
        this.currentPlayer = 'white';
        this.moveHistory = [];
        this.boundaryCondition = 'forbidden';
        this.randomBoundarySeed = '';
        this.randomBoundaryMap = new Map();
        this.gameOver = false;
        this.showMoveHints = true;
        this.capturedPieces = { white: [], black: [] };
        this.timerEnabled = true;
        this.timeLimit = 600;
        this.timeRemaining = { white: 600, black: 600 };
        this.timerInterval = null;
        this.gameStarted = false;
        this.gameMode = 'local';
        this.myColor = null;
        this.themeIndex = 0;
        this.enPassantTarget = null;
        this.positionHistory = [];
        this.halfMoveClock = 0;
        this.statusKey = 'status.start';
        this.statusParams = {};
        this.promotionResolver = null;

        this.movement = new PieceMovement(this);
        this.network = new FirebaseStateNetworkManager(this, {
            gameKey: this.onlineGameKey(),
            matchKey: this.onlineMatchKey()
        });
        this.robot = new ChessRobotController(this);

        this.init();
    }

    init() {
        applyLanguage();
        this.setupBoard();
        this.attachEventListeners();
        this.setTheme(0);
        this.updateBoundaryInfo();
        this.network.refreshStatus();
        this.updateTimerDisplay();
        this.updateUI();
        if (!this.checkUrlForRoomId()) {
            window.setTimeout(() => this.network.reconnect(), 150);
        }
    }

    setupBoard() {
        this.board = BoardSetup.createInitialBoard();
        this.positionHistory = [this.getBoardHash()];
    }

    configureRandomBoundary({ fresh = false, seed = '', entries = null } = {}) {
        if (this.boundaryCondition !== 'random') {
            this.randomBoundarySeed = '';
            this.randomBoundaryMap = new Map();
            return;
        }

        if (!fresh && !entries && this.randomBoundaryMap instanceof Map && this.randomBoundaryMap.size > 0) return;

        const state = Array.isArray(entries)
            ? { seed: seed || this.randomBoundarySeed || 'imported-random-boundary', entries }
            : createRandomChessBoundaryState(seed || undefined);
        this.randomBoundarySeed = state.seed;
        this.randomBoundaryMap = new Map(state.entries);
    }

    randomBoundaryEntries() {
        return this.randomBoundaryMap instanceof Map ? [...this.randomBoundaryMap.entries()] : [];
    }

    checkUrlForRoomId() {
        const roomId = new URLSearchParams(window.location.search).get('room');
        if (!roomId) return false;

        this.gameMode = 'online';
        document.getElementById('gameModeSelect').value = 'online';
        document.getElementById('onlineControls').classList.add('active');
        document.getElementById('roomIdInput').value = roomId;
        this.network.setStatus('connecting', 'online.joiningShared');
        this.setStatus('online.joiningSharedGame');
        window.setTimeout(() => this.network.resumeOrJoinRoom(roomId), 150);
        this.updateUI();
        return true;
    }

    onlineGameKey() {
        return '2dchess';
    }

    onlineMatchKey() {
        return buildOnlineMatchKey({
            gameFamily: 'chess',
            dimension: 2,
            boardSpace: 'r2',
            topology: this.boundaryCondition,
            lattice: 'square',
            boundary: this.boundaryCondition,
            size: 8,
            ruleset: 'chess',
            rulesetVersion: 1,
            ...currentSpaceTimeMatchFields(this)
        });
    }

    getCurrentBoardState() {
        return {
            version: 1,
            board: this.board.map((row) => row.map((piece) => piece ? { ...piece } : null)),
            currentPlayer: this.currentPlayer,
            boundaryCondition: this.boundaryCondition,
            randomBoundarySeed: this.randomBoundarySeed || '',
            randomBoundaryMap: this.randomBoundaryEntries(),
            timerEnabled: this.timerEnabled,
            timeLimit: this.timeLimit,
            timeRemaining: { ...this.timeRemaining },
            gameStarted: this.gameStarted,
            gameOver: this.gameOver,
            moveHistory: [...this.moveHistory],
            capturedPieces: {
                white: [...this.capturedPieces.white],
                black: [...this.capturedPieces.black]
            },
            enPassantTarget: this.enPassantTarget ? { ...this.enPassantTarget } : null,
            halfMoveClock: this.halfMoveClock,
            positionHistory: [...this.positionHistory]
        };
    }

    loadBoardState(state) {
        if (!state || typeof state !== 'object') return;
        if (Array.isArray(state.board)) {
            this.board = state.board.map((row) => row.map((piece) =>
                piece ? createPiece(piece.color, piece.type, Boolean(piece.hasMoved)) : null));
        }
        this.currentPlayer = state.currentPlayer === 'black' ? 'black' : 'white';
        this.boundaryCondition = ['forbidden', 'open', 'reflection', 'periodic', 'random']
            .includes(state.boundaryCondition) ? state.boundaryCondition : 'forbidden';
        this.configureRandomBoundary({
            seed: String(state.randomBoundarySeed || ''),
            entries: Array.isArray(state.randomBoundaryMap) ? state.randomBoundaryMap : null
        });
        this.timerEnabled = Boolean(state.timerEnabled);
        this.timeLimit = Number(state.timeLimit) || 0;
        this.timeRemaining = {
            white: Number(state.timeRemaining?.white) || this.timeLimit,
            black: Number(state.timeRemaining?.black) || this.timeLimit
        };
        this.gameStarted = Boolean(state.gameStarted);
        this.gameOver = Boolean(state.gameOver);
        this.moveHistory = Array.isArray(state.moveHistory) ? [...state.moveHistory] : [];
        this.capturedPieces = {
            white: Array.isArray(state.capturedPieces?.white) ? [...state.capturedPieces.white] : [],
            black: Array.isArray(state.capturedPieces?.black) ? [...state.capturedPieces.black] : []
        };
        this.enPassantTarget = state.enPassantTarget ? { ...state.enPassantTarget } : null;
        this.halfMoveClock = Number(state.halfMoveClock) || 0;
        this.positionHistory = Array.isArray(state.positionHistory) ? [...state.positionHistory] : [];
        this.clearSelection();
        document.getElementById('boundarySelect').value = this.boundaryCondition;
        document.getElementById('timerSelect').value = String(this.timeLimit);
        this.updateBoundaryInfo();
        this.renderBoard();
        this.updateTimerDisplay();
        this.updateUI();
    }

    applyMoveToBoardState(boardState, move, playerColor) {
        if (!boardState || boardState.currentPlayer !== playerColor) return null;
        const from = move?.from;
        const sourcePiece = boardState.board?.[from?.r]?.[from?.c];
        if (!sourcePiece || sourcePiece.color !== playerColor) return null;
        const nextState = move.boardState;
        if (!nextState || nextState.currentPlayer !== this.opponentOf(playerColor)) return null;
        return structuredClone(nextState);
    }

    showOnlineStatus(text) {
        const connection = document.getElementById('connectionStatus');
        const colorStatus = document.getElementById('onlineColorStatus');
        if (connection) {
            const [primaryText, ...metaParts] = String(text || '').split('\n');
            if (metaParts.length) {
                const primary = document.createElement('div');
                primary.textContent = primaryText;
                const meta = document.createElement('div');
                meta.className = 'online-status-meta';
                meta.textContent = metaParts.join(' ');
                meta.style.fontSize = '0.72em';
                meta.style.lineHeight = '1.25';
                meta.style.opacity = '0.72';
                meta.style.marginTop = '0.25rem';
                connection.replaceChildren(primary, meta);
            } else {
                connection.textContent = text;
            }
        }
        if (colorStatus && this.gameMode === 'online') colorStatus.textContent = String(text || '').split('\n')[0];
    }

    updateOnlineRoomUI(roomId, color, room) {
        const roomInfo = document.getElementById('roomInfo');
        const roomDisplay = document.getElementById('roomIdDisplay');
        const shareInput = document.getElementById('shareLinkInput');
        if (roomInfo) roomInfo.hidden = !roomId;
        if (roomDisplay) roomDisplay.textContent = roomId || '';
        if (shareInput) {
            const url = new URL(window.location.href);
            if (roomId) url.searchParams.set('room', roomId);
            else url.searchParams.delete('room');
            shareInput.value = roomId ? url.toString() : '';
        }
        this.myColor = color;
        this.network.isConnected = room?.status === 'playing';
    }

    setTheme(index) {
        this.themeIndex = index;
        const theme = BOARD_THEMES[index] || BOARD_THEMES[0];
        document.documentElement.style.setProperty('--board-light', theme.light);
        document.documentElement.style.setProperty('--board-dark', theme.dark);
        this.renderBoard();
    }

    async handleSquareClick(row, col) {
        if (this.gameOver) return;

        if (this.robot?.shouldBlockHumanInput()) {
            this.setStatus(this.robot.thinking ? 'status.robotThinking' : 'status.robotTurn');
            return;
        }

        if (this.gameMode === 'online') {
            if (!this.network.isConnected) {
                this.setStatus('status.connectBeforeMove');
                return;
            }
            if (this.myColor !== this.currentPlayer) {
                this.setStatus('status.waitingForMove', { color: this.currentPlayer });
                return;
            }
        }

        const piece = this.getPiece(row, col);

        if (this.selectedSquare) {
            const legalMove = this.legalMoves.find((move) => move.r === row && move.c === col);
            if (legalMove) {
                const from = { ...this.selectedSquare };
                this.clearSelection();
                await this.applyMove({ from, to: { r: row, c: col } });
                return;
            }

            const castlingMove = this.getCastlingMoveForRook(row, col);
            if (castlingMove) {
                const from = { ...this.selectedSquare };
                this.clearSelection();
                await this.applyMove({ from, to: { r: castlingMove.r, c: castlingMove.c } });
                return;
            }

            if (piece && piece.color === this.currentPlayer) {
                this.selectSquare(row, col);
                return;
            }

            this.clearSelection();
            this.setStatus('status.selectionCleared');
            this.renderBoard();
            return;
        }

        if (!piece) {
            this.setStatus('status.choosePieceFirst');
            return;
        }

        if (piece.color !== this.currentPlayer) {
            this.setStatus('status.turnOnly', { color: this.currentPlayer });
            return;
        }

        this.selectSquare(row, col);
    }

    selectSquare(row, col) {
        const piece = this.getPiece(row, col);
        if (!piece || piece.color !== this.currentPlayer) return;

        this.selectedSquare = { r: row, c: col };
        this.legalMoves = this.getLegalMoves(row, col);
        this.setStatus('status.pieceSelected', {
            color: piece.color,
            type: piece.type,
            coord: this.formatCoord({ r: row, c: col }),
            count: this.legalMoves.length
        });
        this.renderBoard();
    }

    clearSelection() {
        this.selectedSquare = null;
        this.legalMoves = [];
    }

    async applyMove(move, options = {}) {
        const from = move.from;
        const to = move.to;
        const piece = this.getPiece(from.r, from.c);
        if (!piece || piece.color !== this.currentPlayer) return false;

        const legalMove = this.getLegalMoves(from.r, from.c).find((item) => item.r === to.r && item.c === to.c);
        if (!legalMove) return false;

        let promotion = move.promotion || null;
        const movedType = piece.type;
        if (piece.type === 'P' && this.isPromotionSquare(piece.color, to.r)) {
            promotion = promotion || await this.choosePromotion(piece.color);
        }

        this.startGameIfNeeded();
        if (legalMove.suicide) {
            return this.applySuicideMove(piece, from, legalMove, options);
        }

        const captured = this.getPiece(to.r, to.c);
        const enPassantCaptured = legalMove.enPassant && legalMove.capturePos
            ? this.getPiece(legalMove.capturePos.r, legalMove.capturePos.c)
            : null;

        this.board[from.r][from.c] = null;
        this.board[to.r][to.c] = piece;
        piece.hasMoved = true;

        if (legalMove.enPassant && legalMove.capturePos) {
            this.board[legalMove.capturePos.r][legalMove.capturePos.c] = null;
        }

        if (legalMove.castling) {
            const rook = this.getPiece(legalMove.castling.rookPos.r, legalMove.castling.rookPos.c);
            this.board[legalMove.castling.rookPos.r][legalMove.castling.rookPos.c] = null;
            this.board[legalMove.castling.newRookPos.r][legalMove.castling.newRookPos.c] = rook;
            if (rook) rook.hasMoved = true;
        }

        if (promotion && PROMOTION_TYPES.includes(promotion)) {
            piece.type = promotion;
            piece.display = PIECE_GLYPHS[piece.color][promotion];
        }

        const actualCaptured = captured || enPassantCaptured;
        if (actualCaptured) {
            this.capturedPieces[piece.color].push(this.normalizeCapturedPiece(actualCaptured));
        }

        this.halfMoveClock = actualCaptured || movedType === 'P'
            ? 0
            : this.halfMoveClock + 1;

        this.enPassantTarget = legalMove.pawnDoubleJump
            ? { row: to.r, col: to.c }
            : null;

        this.moveHistory.push(this.createMoveNotation(piece, from, to, actualCaptured, promotion, movedType, legalMove.castling));
        this.currentPlayer = this.opponentOf(this.currentPlayer);
        this.positionHistory.push(this.getBoardHash());

        this.clearSelection();
        this.renderBoard();
        this.updateUI();
        this.checkGameEnd();

        const sentMove = {
            from,
            to,
            promotion,
            castling: legalMove.castling ? legalMove.castling.side : null
        };

        if (this.gameMode === 'online') this.network.persistState();

        if (!options.remote && this.gameMode === 'online') {
            // Firebase hook: call sendMove(move) immediately after a legal
            // local move has updated the board. Server-side validation is
            // required later for serious anti-cheat protection.
            this.network.sendMove(sentMove);
        }

        this.robot?.handlePostMove(options);

        return true;
    }

    applySuicideMove(piece, from, legalMove, options = {}) {
        const movedType = piece.type;
        const opponent = this.opponentOf(piece.color);
        const edge = this.exitEdgeForMove(from, legalMove);

        this.board[from.r][from.c] = null;
        piece.hasMoved = true;
        this.capturedPieces[opponent].push(this.normalizeCapturedPiece(piece));
        this.halfMoveClock = 0;
        this.enPassantTarget = null;
        this.moveHistory.push({
            kind: 'suicide',
            color: piece.color,
            type: movedType,
            from: this.formatCoord(from),
            edge
        });
        this.currentPlayer = opponent;
        this.positionHistory.push(this.getBoardHash());
        this.clearSelection();

        if (movedType === 'K') {
            this.gameOver = true;
            if (this.timerInterval) clearInterval(this.timerInterval);
            this.setStatus('status.kingSuicideWin', { color: opponent });
        } else {
            this.setStatus('status.pieceSuicide', {
                color: piece.color,
                type: movedType,
                edge
            });
        }

        this.renderBoard();
        this.updateUI();
        if (!this.gameOver) this.checkGameEnd();

        const sentMove = {
            from,
            to: { r: legalMove.r, c: legalMove.c },
            suicide: true
        };
        if (this.gameMode === 'online') this.network.persistState();
        if (!options.remote && this.gameMode === 'online') {
            this.network.sendMove(sentMove);
        }

        this.robot?.handlePostMove(options);

        return true;
    }

    startGameIfNeeded() {
        if (this.gameStarted) return;
        this.gameStarted = true;
        this.lockGameSettings();
        if (this.timerEnabled) this.startTimer();
    }

    lockGameSettings() {
        for (const id of ['boundarySelect', 'timerSelect', 'gameModeSelect']) {
            const el = document.getElementById(id);
            if (el) el.disabled = true;
        }
    }

    hasActiveGame() {
        return this.gameStarted && !this.gameOver;
    }

    canChangeSettings() {
        if (this.gameOver) return true;
        return !this.hasActiveGame() && !this.network.isConnected;
    }

    unlockGameSettings() {
        const canUnlock = this.canChangeSettings();
        for (const id of ['boundarySelect', 'timerSelect', 'gameModeSelect']) {
            const el = document.getElementById(id);
            if (el) el.disabled = !canUnlock;
        }
    }

    getLegalMoves(row, col) {
        return this.movement.getLegalMoves(row, col);
    }

    isInCheck(color) {
        return this.movement.isInCheck(color);
    }

    hasLegalMoves(color) {
        return this.movement.hasLegalMoves(color);
    }

    checkGameEnd() {
        if (this.checkInsufficientMaterial()) {
            this.endGame('status.drawByInsufficientMaterial');
            return;
        }

        if (this.halfMoveClock >= 100) {
            this.endGame('status.drawBy50Move');
            return;
        }

        if (this.checkThreefoldRepetition()) {
            this.endGame('status.drawByRepetition');
            return;
        }

        if (!this.hasLegalMoves(this.currentPlayer)) {
            if (this.isInCheck(this.currentPlayer)) {
                this.endGame('status.checkmateWin', { color: this.opponentOf(this.currentPlayer) });
            } else {
                this.endGame('status.stalemate');
            }
            return;
        }

        if (this.isInCheck(this.currentPlayer)) {
            this.setStatus('status.inCheck', { color: this.currentPlayer });
        }
    }

    checkInsufficientMaterial() {
        const pieces = { white: [], black: [] };

        for (let row = 0; row < SIZE; row++) {
            for (let col = 0; col < SIZE; col++) {
                const piece = this.getPiece(row, col);
                if (piece) pieces[piece.color].push(piece.type);
            }
        }

        const all = [...pieces.white, ...pieces.black];
        if (all.every((type) => type === 'K')) return true;

        const minorOnly = (items) => items.length === 2 && items.includes('K') && (items.includes('B') || items.includes('N'));
        return (minorOnly(pieces.white) && pieces.black.length === 1) ||
            (minorOnly(pieces.black) && pieces.white.length === 1);
    }

    checkThreefoldRepetition() {
        const current = this.getBoardHash();
        return this.positionHistory.filter((position) => position === current).length >= 3;
    }

    getBoardHash() {
        const cells = [];
        for (let row = 0; row < SIZE; row++) {
            for (let col = 0; col < SIZE; col++) {
                const piece = this.getPiece(row, col);
                cells.push(piece ? `${piece.color[0]}${piece.type}${piece.hasMoved ? '1' : '0'}` : '..');
            }
        }
        return `${cells.join('')}:${this.currentPlayer}:${this.enPassantTarget?.row ?? '-'}:${this.enPassantTarget?.col ?? '-'}`;
    }

    renderBoard() {
        const boardEl = document.getElementById('chessboard');
        if (!boardEl) return;

        boardEl.innerHTML = '';
        const checkedKing = this.isInCheck(this.currentPlayer)
            ? this.movement.findKing(this.currentPlayer)
            : null;

        for (let row = 0; row < SIZE; row++) {
            for (let col = 0; col < SIZE; col++) {
                const square = document.createElement('button');
                square.type = 'button';
                square.className = `square ${(row + col) % 2 === 0 ? 'light' : 'dark'}`;
                square.setAttribute('aria-label', this.formatCoord({ r: row, c: col }));

                const piece = this.getPiece(row, col);
                if (piece) {
                    const span = document.createElement('span');
                    span.className = `piece-glyph piece-${piece.color} piece-${piece.type}`;
                    span.textContent = this.pieceIcon(piece);
                    square.appendChild(span);
                    square.setAttribute('aria-label', `${this.pieceName(piece)} ${this.formatCoord({ r: row, c: col })}`);
                }

                if (this.selectedSquare?.r === row && this.selectedSquare?.c === col) {
                    square.classList.add('selected');
                }

                const legalMove = this.legalMoves.find((move) => move.r === row && move.c === col);
                if (this.showMoveHints && legalMove) {
                    square.classList.add('legal-move');
                    if (legalMove.capture) square.classList.add('capture-move');
                }

                if (this.showMoveHints && this.isCastlingRookSquare(row, col)) {
                    square.classList.add('castle-move');
                }

                if (checkedKing?.r === row && checkedKing?.c === col) {
                    square.classList.add('check');
                }

                square.addEventListener('click', () => this.handleSquareClick(row, col));
                boardEl.appendChild(square);
            }
        }

        this.renderOpenBoundaryMoves();
    }

    renderOpenBoundaryMoves() {
        const layer = document.getElementById('openBoundaryMoves');
        if (!layer) return;
        layer.innerHTML = '';
        if (this.boundaryCondition !== 'open' || !this.selectedSquare || !this.showMoveHints) return;

        const exits = this.legalMoves.filter((move) => move.suicide);
        exits.forEach((move, index) => {
            const point = this.exitPointForMove(this.selectedSquare, move);
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'open-exit-move';
            button.style.left = `${point.x * 100}%`;
            button.style.top = `${point.y * 100}%`;
            button.style.setProperty('--exit-index', index);
            button.textContent = this.exitArrow(point.edge);
            button.setAttribute('aria-label', this.tr('boundary.exitMove', {
                edge: this.tr(`boundary.edges.${point.edge}`)
            }));
            button.addEventListener('click', async () => {
                const from = { ...this.selectedSquare };
                this.clearSelection();
                await this.applyMove({ from, to: { r: move.r, c: move.c }, suicide: true });
            });
            layer.appendChild(button);
        });
    }

    updateUI() {
        const playerTurn = document.getElementById('playerTurn');
        const whiteBox = document.getElementById('whiteTimerBox');
        const blackBox = document.getElementById('blackTimerBox');
        const boundaryMode = document.getElementById('boundaryMode');
        const whiteCaptured = document.getElementById('whiteCaptured');
        const blackCaptured = document.getElementById('blackCaptured');
        const onlineColorStatus = document.getElementById('onlineColorStatus');
        const gameModeSelect = document.getElementById('gameModeSelect');

        if (playerTurn) {
            playerTurn.style.color = '#38bdf8';
            playerTurn.textContent = this.gameOver
                ? this.tr('turn.gameOver')
                : this.tr('turn.toMove', { color: this.currentPlayer });

            if (!this.gameOver && this.isInCheck(this.currentPlayer)) {
                playerTurn.style.color = '#ef4444';
                playerTurn.textContent += this.tr('turn.check');
            }
        }

        if (whiteBox) whiteBox.classList.toggle('active', this.currentPlayer === 'white' && !this.gameOver);
        if (blackBox) blackBox.classList.toggle('active', this.currentPlayer === 'black' && !this.gameOver);
        if (boundaryMode) boundaryMode.textContent = this.tr(`boundary.names.${this.boundaryCondition}`);
        if (whiteCaptured) whiteCaptured.innerHTML = this.renderCapturedPieces(this.capturedPieces.white);
        if (blackCaptured) blackCaptured.innerHTML = this.renderCapturedPieces(this.capturedPieces.black);
        if (gameModeSelect) gameModeSelect.value = this.gameMode;

        if (onlineColorStatus) {
            if (this.gameMode === 'local') {
                onlineColorStatus.textContent = this.tr('online.localStatus');
            } else if (this.gameMode === 'robot') {
                onlineColorStatus.textContent = `Local robot opponent (${this.robot?.side || 'black'}).`;
            } else if (this.network.isConnected) {
                onlineColorStatus.textContent = this.tr('online.youAre', { color: this.myColor });
            } else {
                onlineColorStatus.textContent = this.tr('online.selectedStatus');
            }
        }

        this.renderStatus();
        this.renderHistory();
        this.updateTimerDisplay();
    }

    renderHistory() {
        const history = document.getElementById('moveHistory');
        if (!history) return;

        if (this.moveHistory.length === 0) {
            history.innerHTML = `<div class="move-history-item muted">${this.tr('history.started')}</div>`;
            return;
        }

        history.innerHTML = this.moveHistory
            .map((entry, index) => `<div class="move-history-item">${index + 1}. ${this.formatHistoryEntry(entry)}</div>`)
            .join('');
        history.scrollTop = history.scrollHeight;
    }

    updateBoundaryInfo() {
        const info = document.getElementById('boundaryInfo');
        if (info) info.innerHTML = this.tr(`boundary.info.${this.boundaryCondition}`);
    }

    setStatus(key, params = {}) {
        this.statusKey = key;
        this.statusParams = { ...params };
        this.renderStatus();
    }

    renderStatus() {
        const status = document.getElementById('gameStatus');
        if (status) status.textContent = this.resolveText(this.statusKey, this.statusParams);
    }

    endGame(key, params = {}) {
        this.gameOver = true;
        this.clearSelection();
        if (this.timerInterval) clearInterval(this.timerInterval);
        this.setStatus(key, params);
        this.unlockGameSettings();
        this.renderBoard();
        this.updateUI();
    }

    resetGame({ keepOnline = false, remote = false } = {}) {
        this.setupBoard();
        this.configureRandomBoundary({ fresh: this.boundaryCondition === 'random' });
        this.selectedSquare = null;
        this.legalMoves = [];
        this.currentPlayer = 'white';
        this.moveHistory = [];
        this.gameOver = false;
        this.capturedPieces = { white: [], black: [] };
        this.gameStarted = false;
        this.enPassantTarget = null;
        this.halfMoveClock = 0;
        this.timeRemaining = { white: this.timeLimit, black: this.timeLimit };

        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }

        const previousMode = this.gameMode;
        if (!keepOnline) {
            this.gameMode = previousMode === 'robot' ? 'robot' : 'local';
            this.myColor = null;
            this.network.close();
            document.getElementById('onlineControls').classList.remove('active');
        }

        if (keepOnline && !remote && this.network.isConnected) {
            this.network.sendMessage({ type: 'newGame' });
        }

        this.unlockGameSettings();
        if (keepOnline) this.lockGameSettings();
        this.setStatus('status.newGame');
        this.robot?.clearAnalysis();
        this.renderBoard();
        this.updateUI();
        this.robot?.scheduleRobotMoveIfNeeded();
        if (this.gameMode === 'online') this.network.persistState();
    }

    startTimer() {
        if (this.timerInterval) clearInterval(this.timerInterval);
        if (!this.timerEnabled || this.timeLimit <= 0) return;

        this.timerInterval = setInterval(() => {
            if (this.gameOver) {
                clearInterval(this.timerInterval);
                return;
            }

            this.timeRemaining[this.currentPlayer] = Math.max(0, this.timeRemaining[this.currentPlayer] - 1);
            if (this.timeRemaining[this.currentPlayer] <= 0) {
                this.endGame('status.timeWin', { color: this.opponentOf(this.currentPlayer) });
            }
            this.updateTimerDisplay();
        }, 1000);
    }

    updateTimerDisplay() {
        const whiteTimer = document.getElementById('whiteTimer');
        const blackTimer = document.getElementById('blackTimer');
        const text = (seconds) => {
            if (!this.timerEnabled || this.timeLimit <= 0) return '--';
            const h = Math.floor(seconds / 3600);
            const m = Math.floor((seconds % 3600) / 60);
            const s = seconds % 60;
            if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
            return `${m}:${String(s).padStart(2, '0')}`;
        };

        if (whiteTimer) whiteTimer.textContent = text(this.timeRemaining.white);
        if (blackTimer) blackTimer.textContent = text(this.timeRemaining.black);
    }

    attachEventListeners() {
        document.getElementById('gameModeSelect').addEventListener('change', (event) => {
            if (!this.canChangeSettings()) {
                event.target.value = this.gameMode;
                alert(this.tr('alerts.modeLocked'));
                return;
            }

            this.gameMode = event.target.value;
            document.getElementById('onlineControls').classList.toggle('active', this.gameMode === 'online');
            if (this.gameMode !== 'online') {
                this.myColor = null;
                this.network.close();
                this.network.setStatus('disconnected', 'online.disconnected');
            }
            this.robot?.updatePanelState();
            this.updateUI();
            this.robot?.scheduleRobotMoveIfNeeded();
        });

        document.getElementById('createRoomBtn').addEventListener('click', () => {
            this.gameMode = 'online';
            document.getElementById('gameModeSelect').value = 'online';
            document.getElementById('onlineControls').classList.add('active');
            this.network.createRoom();
        });

        document.getElementById('findMatchBtn')?.addEventListener('click', () => {
            this.gameMode = 'online';
            document.getElementById('gameModeSelect').value = 'online';
            document.getElementById('onlineControls').classList.add('active');
            this.network.findMatch();
        });

        document.getElementById('joinRoomBtn').addEventListener('click', () => {
            this.gameMode = 'online';
            document.getElementById('gameModeSelect').value = 'online';
            document.getElementById('onlineControls').classList.add('active');
            this.network.resumeOrJoinRoom(document.getElementById('roomIdInput').value);
        });

        document.getElementById('leaveRoomBtn').addEventListener('click', () => {
            this.network.close();
            this.gameMode = 'local';
            this.myColor = null;
            document.getElementById('gameModeSelect').value = 'local';
            document.getElementById('onlineControls').classList.remove('active');
            this.updateUI();
        });

        this.robot?.attachEventListeners();

        document.getElementById('copyLinkBtn').addEventListener('click', async () => {
            const input = document.getElementById('shareLinkInput');
            if (!input.value) return;
            try {
                await navigator.clipboard.writeText(input.value);
            } catch {
                input.select();
                document.execCommand('copy');
            }
            this.setStatus('status.roomLinkCopied');
        });

        document.getElementById('boundarySelect').addEventListener('change', (event) => {
            if (!this.canChangeSettings()) {
                event.target.value = this.boundaryCondition;
                alert(this.tr('alerts.boundaryLocked'));
                return;
            }
            this.boundaryCondition = event.target.value;
            this.configureRandomBoundary({ fresh: this.boundaryCondition === 'random' });
            this.positionHistory = [this.getBoardHash()];
            this.updateBoundaryInfo();
            this.renderBoard();
            this.updateUI();
        });

        document.getElementById('timerSelect').addEventListener('change', (event) => {
            if (!this.canChangeSettings()) {
                event.target.value = String(this.timeLimit);
                alert(this.tr('alerts.timerLocked'));
                return;
            }
            const value = Number(event.target.value);
            this.timerEnabled = value > 0;
            this.timeLimit = value;
            this.timeRemaining = { white: value, black: value };
            this.updateTimerDisplay();
            if (this.timerInterval) {
                clearInterval(this.timerInterval);
                this.timerInterval = null;
            }
        });

        document.getElementById('newGameBtn').addEventListener('click', () => {
            const keepOnline = this.gameMode === 'online' && this.network.isConnected;
            this.resetGame({ keepOnline });
        });

        document.getElementById('surrenderBtn').addEventListener('click', () => {
            if (this.gameOver) return;
            if (this.gameMode === 'online' && this.network.isConnected) {
                this.network.sendMessage({ type: 'surrender' });
            }
            this.endGame('status.resignationWin', { color: this.opponentOf(this.currentPlayer) });
        });

        document.getElementById('offerDrawBtn').addEventListener('click', () => {
            if (this.gameOver) return;
            if (this.gameMode === 'online' && this.network.isConnected) {
                if (confirm(this.tr('alerts.drawPrompt'))) {
                    this.network.sendMessage({ type: 'drawOffer' });
                    this.setStatus('status.drawOfferSent');
                }
                return;
            }
            if (confirm(this.tr('alerts.drawPrompt'))) {
                this.endGame('status.drawAgreed');
            }
        });

        const hintsToggle = document.getElementById('hintsToggleSwitch');
        hintsToggle.addEventListener('click', () => {
            this.showMoveHints = !this.showMoveHints;
            hintsToggle.classList.toggle('active', this.showMoveHints);
            hintsToggle.setAttribute('aria-pressed', String(this.showMoveHints));
            this.setStatus(this.showMoveHints ? 'status.hintsShown' : 'status.hintsHidden');
            this.renderBoard();
        });

        document.querySelectorAll('[data-lang-option]').forEach((button) => {
            button.addEventListener('click', () => setLanguage(button.dataset.langOption));
        });

        document.querySelectorAll('.color-pair').forEach((pair) => {
            pair.addEventListener('click', () => {
                const index = Number(pair.dataset.theme);
                this.setTheme(Number.isFinite(index) ? index : 0);
            });
        });

        window.addEventListener('languagechange', () => {
            this.renderPromotionButtons(this.currentPlayer);
            this.updateBoundaryInfo();
            this.network.refreshStatus();
            this.updateUI();
        });
    }

    choosePromotion(color) {
        const modal = document.getElementById('promotionModal');
        modal.classList.add('active');
        modal.setAttribute('aria-hidden', 'false');
        this.renderPromotionButtons(color);

        return new Promise((resolve) => {
            this.promotionResolver = resolve;
        });
    }

    renderPromotionButtons(color = this.currentPlayer) {
        document.querySelectorAll('.promotion-btn').forEach((button) => {
            const type = button.dataset.piece;
            button.textContent = PIECE_GLYPHS[color]?.[type] || type;
            button.onclick = () => {
                if (!this.promotionResolver) return;
                const modal = document.getElementById('promotionModal');
                modal.classList.remove('active');
                modal.setAttribute('aria-hidden', 'true');
                const resolve = this.promotionResolver;
                this.promotionResolver = null;
                resolve(type);
            };
        });
    }

    createMoveNotation(piece, from, to, captured, promotion, movedType = piece.type, castling = null) {
        if (castling) {
            return {
                kind: 'castle',
                color: piece.color,
                side: castling.side,
                from: this.formatCoord(from),
                to: this.formatCoord(to)
            };
        }

        return {
            kind: 'move',
            color: piece.color,
            type: movedType,
            from: this.formatCoord(from),
            to: this.formatCoord(to),
            capturedType: captured?.type || '',
            promotionType: promotion || ''
        };
    }

    formatHistoryEntry(entry) {
        if (typeof entry === 'string') return entry;
        if (!entry || typeof entry !== 'object') return '';
        if (entry.kind === 'castle') return this.tr('history.castle', entry);
        if (entry.kind === 'suicide') {
            return this.tr('history.suicide', {
                ...entry,
                edge: this.tr(`boundary.edges.${entry.edge}`)
            });
        }
        return this.tr('history.move', entry);
    }

    getCastlingMoveForRook(row, col) {
        if (!this.selectedSquare) return null;

        const king = this.getPiece(this.selectedSquare.r, this.selectedSquare.c);
        const rook = this.getPiece(row, col);
        if (!king || !rook || king.type !== 'K' || rook.type !== 'R') return null;
        if (king.color !== this.currentPlayer || rook.color !== king.color) return null;

        return this.legalMoves.find((move) =>
            move.castling &&
            move.castling.rookPos.r === row &&
            move.castling.rookPos.c === col
        ) || null;
    }

    isCastlingRookSquare(row, col) {
        return Boolean(this.getCastlingMoveForRook(row, col));
    }

    isPromotionSquare(color, row) {
        return (color === 'white' && row === 0) || (color === 'black' && row === 7);
    }

    getPiece(row, col) {
        if (row < 0 || row >= SIZE || col < 0 || col >= SIZE) return null;
        return this.board[row]?.[col] || null;
    }

    clonePiece(piece) {
        if (!piece) return null;
        return createPiece(piece.color, piece.type, Boolean(piece.hasMoved));
    }

    formatCoord({ r, c }) {
        return `${String.fromCharCode(97 + c)}${8 - r}`;
    }

    exitPointForMove(from, move) {
        const startX = from.c + 0.5;
        const startY = from.r + 0.5;
        const deltaX = move.c - from.c;
        const deltaY = move.r - from.r;
        const intersections = [];

        if (deltaX < 0) intersections.push({ t: (0 - startX) / deltaX, edge: 'left' });
        if (deltaX > 0) intersections.push({ t: (SIZE - startX) / deltaX, edge: 'right' });
        if (deltaY < 0) intersections.push({ t: (0 - startY) / deltaY, edge: 'top' });
        if (deltaY > 0) intersections.push({ t: (SIZE - startY) / deltaY, edge: 'bottom' });

        const crossing = intersections
            .filter(({ t }) => t >= 0 && t <= 1)
            .sort((a, b) => a.t - b.t)[0] || { t: 1, edge: this.exitEdgeForMove(from, move) };
        const x = Math.max(0, Math.min(SIZE, startX + deltaX * crossing.t)) / SIZE;
        const y = Math.max(0, Math.min(SIZE, startY + deltaY * crossing.t)) / SIZE;
        return { x, y, edge: crossing.edge };
    }

    exitEdgeForMove(from, move) {
        const point = this.exitPointForSimpleMove(from, move);
        return point.edge;
    }

    exitPointForSimpleMove(from, move) {
        const overflow = [
            { edge: 'top', amount: Math.max(0, -move.r) },
            { edge: 'bottom', amount: Math.max(0, move.r - (SIZE - 1)) },
            { edge: 'left', amount: Math.max(0, -move.c) },
            { edge: 'right', amount: Math.max(0, move.c - (SIZE - 1)) }
        ].sort((a, b) => b.amount - a.amount);
        return overflow[0].amount > 0 ? overflow[0] : {
            edge: Math.abs(move.r - from.r) >= Math.abs(move.c - from.c)
                ? (move.r < from.r ? 'top' : 'bottom')
                : (move.c < from.c ? 'left' : 'right')
        };
    }

    exitArrow(edge) {
        return { top: '\u2191', right: '\u2192', bottom: '\u2193', left: '\u2190' }[edge] || '\u2197';
    }

    opponentOf(color) {
        return color === 'white' ? 'black' : 'white';
    }

    pieceIcon(piece) {
        return PIECE_GLYPHS[piece.color]?.[piece.type] || piece.display || '?';
    }

    normalizeCapturedPiece(value) {
        if (value && typeof value === 'object') {
            const color = value.color === 'black' ? 'black' : 'white';
            const type = ['K', 'Q', 'R', 'B', 'N', 'P'].includes(value.type) ? value.type : 'P';
            return { color, type };
        }
        return String(value || '');
    }

    renderCapturedPieces(pieces = []) {
        if (!pieces.length) return this.emptyInline('captured.none');
        return pieces.map((value) => {
            const piece = this.normalizeCapturedPiece(value);
            if (typeof piece === 'string') return piece;
            const icon = this.pieceIcon(piece);
            const title = `${this.pieceName(piece)} (${piece.color})`;
            return `<span class="captured-piece piece-glyph piece-${piece.color} piece-${piece.type}" title="${title}" aria-label="${title}">${icon}</span>`;
        }).join(' ');
    }

    pieceName(piece) {
        return this.tr(`pieces.${piece?.type || 'P'}`);
    }

    tr(key, params = {}) {
        return t(key, params);
    }

    resolveText(key, params = {}) {
        return hasTranslation(key) ? this.tr(key, params) : key;
    }

    emptyInline(key) {
        return `<span class="muted">${this.tr(key)}</span>`;
    }
}

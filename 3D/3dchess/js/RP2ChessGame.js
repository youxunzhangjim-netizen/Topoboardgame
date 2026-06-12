import { RP2ThreeJSRenderer } from './RP2ThreeJSRenderer.js';
import { RP2NetworkManager } from './RP2NetworkManager.js';
import { applyLanguage, hasTranslation, t } from './i18n.js';
import { createPiece, PROMOTION_TYPES } from './BoardSetup.js';
import {
    RP2_BOARD_HEIGHT,
    RP2_BOARD_WIDTH,
    RP2_HOME_ROWS,
    RP2_KING_ROW_TYPES,
    RP2_PAWN_DIR,
    rp2Antipode,
    rp2CentralFiles,
    rp2PawnFiles,
    rp2SideSupportFiles
} from './RP2Config.js';

const CAPTURED_ICONS = {
    white: { K: '\u2654', Q: '\u2655', R: '\u2656', B: '\u2657', N: '\u2658', P: '\u2659' },
    black: { K: '\u265A', Q: '\u265B', R: '\u265C', B: '\u265D', N: '\u265E', P: '\u265F' }
};
const PICKER_ICONS = { K: 'K', Q: 'Q', R: 'R', B: 'B', N: 'N', P: 'P' };
const CAPTURED_ICON_LOOKUP = Object.entries(CAPTURED_ICONS).reduce((lookup, [color, pieces]) => {
    for (const [type, glyph] of Object.entries(pieces)) lookup[glyph] = { color, type };
    return lookup;
}, {});

export class RP2ChessGame {
    constructor() {
        this.board = this.createEmptyBoard();
        this.selectedSquare = null;
        this.legalMoves = [];
        this.currentPlayer = 'white';
        this.moveHistory = [];
        this.boundaryCondition = 'rp2';
        this.enPassantTarget = null;
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
        this.promotionResolver = null;
        this.promotionColor = null;
        this.pendingMoveTarget = null;
        this.statusKey = 'status.start';
        this.statusParams = {};

        this.renderer = new RP2ThreeJSRenderer(this);
        this.network = new RP2NetworkManager(this);

        this.init();
    }

    init() {
        applyLanguage();
        const boundarySelect = document.getElementById('boundarySelect');
        const timerSelect = document.getElementById('timerSelect');
        if (boundarySelect) {
            boundarySelect.value = this.boundaryCondition;
            boundarySelect.disabled = true;
        }
        if (timerSelect) timerSelect.value = String(this.timeLimit);
        this.renderer.init3D();
        this.setupBoard3D();
        this.attachEventListeners();
        this.updateBoundaryInfo();
        this.network.refreshStatus();
        this.renderPromotionButtons();
        this.updateTimerDisplay();
        this.updateUI();
        this.animate();

        const sharedRoom = new URLSearchParams(window.location.search).get('room');
        if (sharedRoom) {
            this.gameMode = 'online';
            document.getElementById('gameModeSelect').value = 'online';
            document.getElementById('onlineControls').classList.add('active');
            document.getElementById('roomIdInput').value = sharedRoom;
            this.network.setStatus('connecting', 'online.joiningShared');
            this.setStatus('online.joiningSharedGame');
            window.setTimeout(() => this.network.resumeOrJoinRoom(sharedRoom), 150);
            this.updateUI();
        }
    }

    createEmptyBoard() {
        return [Array.from({ length: this.boardHeight() }, () => Array(this.boardWidth()).fill(null))];
    }
    setupBoard3D() {
        this.board = this.createEmptyBoard();
        for (const { x, y, type } of this.createWhiteInitialPieces()) {
            this.setPiece(x, y, 0, this.createInitialPiece('white', type, y, 0));
            const mirror = this.antipodeCoord(x, y);
            this.setPiece(mirror.x, mirror.y, 0, this.createInitialPiece('black', type, mirror.y, 0));
        }
        this.enPassantTarget = null;
        this.renderer.renderPieces3D(this.board);
    }

    createWhiteInitialPieces() {
        const pieces = [];
        const homeRow = this.homeRow('white');

        for (const y of [homeRow - 1, homeRow + 1]) {
            for (const x of this.pawnFiles()) {
                pieces.push({ x, y, type: 'P' });
            }
        }

        for (const x of this.sideSupportFiles()) {
            pieces.push({ x, y: homeRow, type: 'P' });
        }

        this.centralPieceFiles().forEach((x, index) => {
            pieces.push({ x, y: homeRow, type: RP2_KING_ROW_TYPES[index] });
        });

        return pieces;
    }

    boardWidth() {
        return RP2_BOARD_WIDTH;
    }

    boardHeight() {
        return RP2_BOARD_HEIGHT;
    }

    homeRow(color) {
        return RP2_HOME_ROWS[color];
    }

    createInitialPiece(color, type, row, sheet = 0) {
        return type === 'P' ? this.createPawn(color, row, sheet) : createPiece(color, type);
    }

    createPawn(color, row, sheet = 0) {
        const pawn = createPiece(color, 'P');
        pawn.pawnDirection = this.pawnDirectionFromHome(color, row, sheet);
        return pawn;
    }

    pawnDirection(color) {
        return RP2_PAWN_DIR[color];
    }

    pawnDirectionFromHome(color, row, sheet = 0) {
        const homeRow = this.homeRow(color);
        if (row < homeRow) return -1;
        if (row > homeRow) return 1;
        return this.pawnDirection(color);
    }

    pawnForwardDirection(piece, y, sheet = 0) {
        return piece?.pawnDirection === 1 || piece?.pawnDirection === -1
            ? piece.pawnDirection
            : this.pawnDirectionFromHome(piece?.color || 'white', y, sheet);
    }

    centralPieceFiles() {
        return rp2CentralFiles(this.boardWidth());
    }

    sideSupportFiles() {
        return rp2SideSupportFiles(this.boardWidth());
    }

    pawnFiles() {
        return rp2PawnFiles(this.boardWidth());
    }

    antipodeCoord(x, y) {
        return rp2Antipode(x, y, this.boardWidth(), this.boardHeight());
    }

    animate = () => {
        requestAnimationFrame(this.animate);
        this.renderer.animate();
    };

    async handleSquareClick(x, y, sheet = 0) {
        if (this.gameOver) return;
        const square = this.canonicalCoord(x, y, sheet);

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

        const piece = this.getPiece(square.x, square.y, square.sheet);

        if (this.selectedSquare) {
            const legalMove = this.legalMoves.find((move) => this.sameCoord(move, square));
            if (legalMove) {
                if (this.pendingMoveTarget && this.sameCoord(this.pendingMoveTarget, legalMove)) {
                    const from = { ...this.selectedSquare };
                    this.clearSelection();
                    await this.applyMove({ from, to: { ...legalMove } });
                    return;
                }

                this.setPendingMoveTarget(legalMove);
                return;
            }

            if (piece && piece.color === this.currentPlayer) {
                this.selectSquare(square.x, square.y, square.sheet);
                return;
            }

            this.clearSelection();
            this.setStatus('status.selectionCleared');
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

        this.selectSquare(square.x, square.y, square.sheet);
    }

    selectSquare(x, y, sheet = 0) {
        const square = this.canonicalCoord(x, y, sheet);
        const piece = this.getPiece(square.x, square.y, square.sheet);
        if (!piece || piece.color !== this.currentPlayer) return;

        this.pendingMoveTarget = null;
        this.selectedSquare = { ...square };
        this.legalMoves = this.getLegalMoves(square.x, square.y, square.sheet);

        this.renderer.clearHighlights();
        this.renderer.showSelected(square.x, square.y, square.sheet);
        this.renderer.showLegalMoves(this.legalMoves);

        this.setStatus('status.pieceSelected', {
            color: piece.color,
            type: piece.type,
            coord: this.formatCoord(square),
            count: this.legalMoves.length
        });
        this.renderMovePicker();
    }

    clearSelection() {
        this.selectedSquare = null;
        this.legalMoves = [];
        this.pendingMoveTarget = null;
        this.renderer.clearHighlights();
        this.renderMovePicker();
    }

    setPendingMoveTarget(move) {
        this.pendingMoveTarget = { x: move.x, y: move.y, sheet: move.sheet || 0 };
        this.renderer.clearChosenMove();
        this.renderer.showChosenMove(move.x, move.y, move.sheet || 0);
        this.renderMovePicker();
        this.setStatus('status.targetSelected', { coord: this.formatCoord(move) });
    }

    async applyMove(move, options = {}) {
        const from = move.from;
        const to = move.to;
        const fromCoord = this.canonicalCoord(from.x, from.y, from.sheet || 0);
        const toCoord = this.canonicalCoord(to.x, to.y, to.sheet || 0);
        const piece = this.getPiece(fromCoord.x, fromCoord.y, fromCoord.sheet);
        if (!piece || piece.color !== this.currentPlayer) return false;

        const legalMoves = this.getLegalMoves(fromCoord.x, fromCoord.y, fromCoord.sheet);
        const legalMove = legalMoves.find((item) => this.sameCoord(item, toCoord));
        if (!legalMove) return false;

        const movedType = piece.type;
        const castling = legalMove.castling || null;
        const movingPawnDirection = piece.type === 'P'
            ? this.pawnForwardDirection(piece, fromCoord.y, fromCoord.sheet)
            : null;
        let promotion = move.promotion || null;
        if (piece.type === 'P' && this.isPromotionSquare(piece.color, toCoord.x, toCoord.y, toCoord.sheet)) {
            promotion = promotion || await this.choosePromotion(piece.color);
        }

        this.startGameIfNeeded();

        const captured = legalMove.enPassant && legalMove.capturePos
            ? this.getPiece(legalMove.capturePos.x, legalMove.capturePos.y, legalMove.capturePos.sheet || 0)
            : this.getPiece(toCoord.x, toCoord.y, toCoord.sheet);

        this.setPiece(toCoord.x, toCoord.y, toCoord.sheet, piece);
        this.setPiece(fromCoord.x, fromCoord.y, fromCoord.sheet, null);
        if (legalMove.enPassant && legalMove.capturePos) {
            this.setPiece(legalMove.capturePos.x, legalMove.capturePos.y, legalMove.capturePos.sheet || 0, null);
        }
        piece.hasMoved = true;

        if (castling) {
            const rook = this.getPiece(castling.rookFrom.x, castling.rookFrom.y, castling.rookFrom.sheet || 0);
            this.setPiece(castling.rookTo.x, castling.rookTo.y, castling.rookTo.sheet || 0, rook);
            this.setPiece(castling.rookFrom.x, castling.rookFrom.y, castling.rookFrom.sheet || 0, null);
            if (rook) rook.hasMoved = true;
        }

        if (promotion && PROMOTION_TYPES.includes(promotion)) {
            piece.type = promotion;
            piece.display = piece.color === 'white' ? promotion : promotion.toLowerCase();
            delete piece.pawnDirection;
        } else if (piece.type === 'P') {
            piece.pawnDirection = legalMove.dy === 1 || legalMove.dy === -1
                ? legalMove.dy
                : movingPawnDirection;
        }

        if (captured) {
            this.capturedPieces[piece.color].push(this.normalizeCapturedPiece(captured));
        }

        this.enPassantTarget = legalMove.pawnDoubleJump
            ? {
                x: legalMove.passThrough?.x ?? toCoord.x,
                y: legalMove.passThrough?.y ?? this.wrapY(fromCoord.y + (movingPawnDirection ?? this.pawnDirection(piece.color))),
                sheet: legalMove.passThrough?.sheet ?? toCoord.sheet,
                capturePos: { x: toCoord.x, y: toCoord.y, sheet: toCoord.sheet },
                color: piece.color
            }
            : null;

        const historyEntry = this.createMoveNotation(piece, fromCoord, toCoord, captured, promotion, movedType, castling);
        this.moveHistory.push(historyEntry);

        const sentMove = {
            from: fromCoord,
            to: toCoord,
            promotion,
            castling: castling ? castling.side : null
        };

        this.currentPlayer = this.opponentOf(this.currentPlayer);
        this.pendingMoveTarget = null;
        this.renderer.renderPieces3D(this.board);
        this.renderer.clearHighlights();
        this.setStatus('status.movePlayed', { color: this.currentPlayer });
        this.updateUI();
        this.checkGameEnd();
        if (this.gameMode === 'online') this.network.persistState();

        if (!options.remote && this.gameMode === 'online' && this.network.isConnected) {
            this.network.sendMove(sentMove);
        }

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

    unlockGameSettings() {
        const canUnlock = this.gameMode !== 'online' && !this.network.isConnected;
        for (const id of ['timerSelect', 'gameModeSelect']) {
            const el = document.getElementById(id);
            if (el) el.disabled = !canUnlock;
        }
        const boundary = document.getElementById('boundarySelect');
        if (boundary) boundary.disabled = true;
    }

    getLegalMoves(x, y, sheet = 0) {
        const square = this.canonicalCoord(x, y, sheet);
        const piece = this.getPiece(square.x, square.y, square.sheet);
        if (!piece) return [];

        const moves = this.getPseudoMoves(square.x, square.y, square.sheet, { forAttack: false });
        if (piece.type === 'K') {
            moves.push(...this.getCastlingMoves(square.x, square.y, square.sheet));
        }

        return this.uniqueMoves(moves).filter((candidate) =>
            !this.wouldLeaveKingInCheck(square.x, square.y, square.sheet, candidate)
        );
    }

    getPseudoMoves(x, y, sheet = 0, { forAttack = false } = {}) {
        const square = this.canonicalCoord(x, y, sheet);
        const piece = this.getPiece(square.x, square.y, square.sheet);
        if (!piece) return [];

        switch (piece.type) {
            case 'P':
                return this.getPawnMoves(square.x, square.y, square.sheet, forAttack);
            case 'R':
                return this.getLineMoves(square.x, square.y, square.sheet, [[1, 0], [-1, 0], [0, 1], [0, -1]], forAttack);
            case 'B':
                return this.getLineMoves(square.x, square.y, square.sheet, [[1, 1], [1, -1], [-1, 1], [-1, -1]], forAttack);
            case 'Q':
                return this.getLineMoves(square.x, square.y, square.sheet, [
                    [1, 0], [-1, 0], [0, 1], [0, -1],
                    [1, 1], [1, -1], [-1, 1], [-1, -1]
                ], forAttack);
            case 'N':
                return this.getKnightMoves(square.x, square.y, square.sheet, forAttack);
            case 'K':
                return this.getKingMoves(square.x, square.y, square.sheet, forAttack);
            default:
                return [];
        }
    }

    getPawnMoves(x, y, sheet, forAttack) {
        const piece = this.getPiece(x, y, sheet);
        const direction = this.pawnForwardDirection(piece, y, sheet);
        const moves = [];

        for (const dx of [-1, 1]) {
            for (const dy of [-1, 1]) {
                const target = this.resolveTarget(x + dx, y + dy, sheet, dx, dy);

                if (forAttack) {
                    moves.push({ ...target, capture: true });
                    continue;
                }

                const targetPiece = this.getPiece(target.x, target.y, target.sheet);
                if (targetPiece && targetPiece.color !== piece.color && targetPiece.type !== 'K') {
                    moves.push({ ...target, capture: true });
                }
            }
        }

        if (forAttack) return this.uniqueMoves(moves);

        const one = this.resolveTarget(x, y + direction, sheet, 0, direction);
        if (!this.sameCoord({ x, y, sheet }, one) && !this.getPiece(one.x, one.y, one.sheet)) {
            moves.push({ ...one, capture: false });

            const two = this.resolveTarget(one.x, one.y + direction, one.sheet, 0, direction);
            if (!piece.hasMoved && !this.sameCoord({ x, y, sheet }, two) && !this.getPiece(two.x, two.y, two.sheet)) {
                moves.push({
                    ...two,
                    capture: false,
                    pawnDoubleJump: true,
                    passThrough: { x: one.x, y: one.y, sheet: one.sheet }
                });
            }
        }

        if (this.enPassantTarget && this.enPassantTarget.color !== piece.color) {
            for (const dx of [-1, 1]) {
                const target = this.resolveTarget(x + dx, y + direction, sheet, dx, direction);
                if (!this.sameCoord(target, this.enPassantTarget)) continue;

                const capturePos = this.enPassantTarget.capturePos;
                const capturedPawn = capturePos ? this.getPiece(capturePos.x, capturePos.y, capturePos.sheet || 0) : null;
                if (capturedPawn?.color !== piece.color && capturedPawn?.type === 'P') {
                    moves.push({
                        ...target,
                        capture: true,
                        enPassant: true,
                        capturePos: { ...capturePos }
                    });
                }
            }
        }

        return this.uniqueMoves(moves);
    }

    getLineMoves(x, y, sheet, directions, forAttack) {
        const piece = this.getPiece(x, y, sheet);
        const moves = [];

        for (const direction of directions) {
            let [dx, dy] = direction;
            let cx = x;
            let cy = y;
            let currentSheet = sheet;
            const seenTargets = new Set();

            for (let step = 0; step < this.boardWidth() * this.boardHeight() * 2; step++) {
                const targetCoord = this.nextLineStep(cx, cy, currentSheet, dx, dy);
                cx = targetCoord.x;
                cy = targetCoord.y;
                currentSheet = targetCoord.sheet;
                dx = targetCoord.dx;
                dy = targetCoord.dy;

                if (this.sameCoord(targetCoord, { x, y, sheet })) break;

                const key = `${currentSheet},${cx},${cy},${dx},${dy}`;
                if (seenTargets.has(key)) break;
                seenTargets.add(key);

                const target = this.getPiece(cx, cy, currentSheet);
                if (!target) {
                    moves.push({ ...targetCoord, capture: false });
                    continue;
                }

                if (target.color !== piece.color) {
                    if (forAttack || target.type !== 'K') {
                        moves.push({ ...targetCoord, capture: true });
                    }
                }
                break;
            }
        }

        return this.uniqueMoves(moves);
    }

    getKnightMoves(x, y, sheet, forAttack) {
        const piece = this.getPiece(x, y, sheet);
        const offsets = [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]];
        const moves = [];

        for (const [dx, dy] of offsets) {
            const target = this.resolveTarget(x + dx, y + dy, sheet, dx, dy);
            if (this.sameCoord({ x, y, sheet }, target)) continue;
            this.addLeaperMove(moves, target, piece, forAttack);
        }

        return this.uniqueMoves(moves);
    }

    getKingMoves(x, y, sheet, forAttack) {
        const piece = this.getPiece(x, y, sheet);
        const moves = [];

        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                if (dx === 0 && dy === 0) continue;
                const target = this.resolveTarget(x + dx, y + dy, sheet, dx, dy);
                if (this.sameCoord({ x, y, sheet }, target)) continue;
                this.addLeaperMove(moves, target, piece, forAttack);
            }
        }

        return this.uniqueMoves(moves);
    }

    addLeaperMove(moves, target, piece, forAttack) {
        const targetPiece = this.getPiece(target.x, target.y, target.sheet);
        if (!targetPiece) {
            moves.push({ ...target, capture: false });
            return;
        }

        if (targetPiece.color !== piece.color && (forAttack || targetPiece.type !== 'K')) {
            moves.push({ ...target, capture: true });
        }
    }

    getCastlingMoves(x, y, sheet = 0) {
        const king = this.getPiece(x, y, sheet);
        if (!king || king.type !== 'K' || king.hasMoved || sheet !== 0) return [];

        const homeRow = this.homeRow(king.color);
        const kingX = this.homePieceFiles(king.color, 'K')[0];
        const queenX = this.homePieceFiles(king.color, 'Q')[0];
        if (kingX === undefined || queenX === undefined || y !== homeRow || x !== kingX || this.isInCheck(king.color)) return [];

        const moves = [];
        for (const rookX of this.homePieceFiles(king.color, 'R')) {
            const rook = this.getPiece(rookX, homeRow, 0);
            if (!rook || rook.color !== king.color || rook.type !== 'R' || rook.hasMoved) continue;

            const step = rookX > kingX ? 1 : -1;
            const kingToX = kingX + step * 2;
            const rookToX = kingX + step;
            if (!this.inBounds(kingToX, homeRow) || !this.inBounds(rookToX, homeRow)) continue;

            const clearX = this.filesBetween(kingX, rookX);
            if (!clearX.every((pathX) => !this.getPiece(pathX, homeRow, 0))) continue;

            const enemy = this.opponentOf(king.color);
            const kingPath = [kingX + step, kingToX].map((pathX) => ({ x: pathX, y: homeRow, sheet: 0 }));
            if (!kingPath.every((square) => !this.isSquareAttacked(square.x, square.y, square.sheet, enemy))) continue;

            const side = Math.sign(queenX - kingX) === Math.sign(rookX - kingX) ? 'queenside' : 'kingside';
            moves.push({
                x: kingToX,
                y: homeRow,
                sheet: 0,
                capture: false,
                castling: {
                    side,
                    rookFrom: { x: rookX, y: homeRow, sheet: 0 },
                    rookTo: { x: rookToX, y: homeRow, sheet: 0 }
                }
            });
        }

        return moves;
    }

    homePieceFiles(color, type) {
        const whiteFiles = this.centralPieceFiles()
            .filter((_, index) => RP2_KING_ROW_TYPES[index] === type);
        const files = color === 'white'
            ? whiteFiles
            : whiteFiles.map((file) => this.antipodeCoord(file, this.homeRow('white')).x);
        return files.sort((a, b) => a - b);
    }

    filesBetween(fromX, toX) {
        const step = toX > fromX ? 1 : -1;
        const files = [];
        for (let x = fromX + step; x !== toX; x += step) files.push(x);
        return files;
    }

    wouldLeaveKingInCheck(fromX, fromY, fromSheet, move) {
        const piece = this.getPiece(fromX, fromY, fromSheet);
        if (!piece) return true;

        const captured = this.getPiece(move.x, move.y, move.sheet || 0);
        const epCaptured = move.enPassant && move.capturePos
            ? this.getPiece(move.capturePos.x, move.capturePos.y, move.capturePos.sheet || 0)
            : null;
        const rook = move.castling
            ? this.getPiece(move.castling.rookFrom.x, move.castling.rookFrom.y, move.castling.rookFrom.sheet || 0)
            : null;

        this.setPiece(fromX, fromY, fromSheet, null);
        this.setPiece(move.x, move.y, move.sheet || 0, piece);
        if (move.enPassant && move.capturePos) {
            this.setPiece(move.capturePos.x, move.capturePos.y, move.capturePos.sheet || 0, null);
        }
        if (move.castling && rook) {
            this.setPiece(move.castling.rookFrom.x, move.castling.rookFrom.y, move.castling.rookFrom.sheet || 0, null);
            this.setPiece(move.castling.rookTo.x, move.castling.rookTo.y, move.castling.rookTo.sheet || 0, rook);
        }

        const king = this.findKing(piece.color);
        const inCheck = !king || this.isSquareAttacked(king.x, king.y, king.sheet, this.opponentOf(piece.color));

        if (move.castling && rook) {
            this.setPiece(move.castling.rookFrom.x, move.castling.rookFrom.y, move.castling.rookFrom.sheet || 0, rook);
            this.setPiece(move.castling.rookTo.x, move.castling.rookTo.y, move.castling.rookTo.sheet || 0, null);
        }
        if (move.enPassant && move.capturePos) {
            this.setPiece(move.capturePos.x, move.capturePos.y, move.capturePos.sheet || 0, epCaptured);
        }
        this.setPiece(fromX, fromY, fromSheet, piece);
        this.setPiece(move.x, move.y, move.sheet || 0, captured);

        return inCheck;
    }

    isInCheck(color) {
        const king = this.findKing(color);
        return Boolean(king && this.isSquareAttacked(king.x, king.y, king.sheet, this.opponentOf(color)));
    }

    isSquareAttacked(x, y, targetSheet, byColor) {
        for (const { x: col, y: row, sheet: cellSheet } of this.validCells()) {
            const piece = this.getPiece(col, row, cellSheet);
            if (!piece || piece.color !== byColor) continue;
            if (this.getPseudoMoves(col, row, cellSheet, { forAttack: true }).some((move) => this.sameCoord(move, { x, y, sheet: targetSheet }))) {
                return true;
            }
        }

        return false;
    }

    hasLegalMoves(color) {
        for (const { x, y, sheet } of this.validCells()) {
            const piece = this.getPiece(x, y, sheet);
            if (piece?.color === color && this.getLegalMoves(x, y, sheet).length > 0) {
                return true;
            }
        }

        return false;
    }

    findKing(color) {
        for (const { x, y, sheet } of this.validCells()) {
            const piece = this.getPiece(x, y, sheet);
            if (piece?.color === color && piece.type === 'K') return { x, y, sheet };
        }
        return null;
    }

    checkGameEnd() {
        if (this.gameOver) return;

        const inCheck = this.isInCheck(this.currentPlayer);
        const hasMoves = this.hasLegalMoves(this.currentPlayer);

        if (!hasMoves) {
            if (inCheck) {
                this.endGame('status.checkmateWin', { color: this.opponentOf(this.currentPlayer) });
            } else {
                this.endGame('status.stalemate');
            }
            return;
        }

        if (inCheck) {
            this.setStatus('status.inCheck', { color: this.currentPlayer });
        }
    }

    choosePromotion(color) {
        this.promotionColor = color;
        this.renderPromotionButtons();
        const modal = document.getElementById('promotionModal');
        modal.classList.add('active');
        modal.setAttribute('aria-hidden', 'false');

        return new Promise((resolve) => {
            this.promotionResolver = resolve;
        });
    }

    renderPromotionButtons() {
        const buttons = document.querySelectorAll('.promotion-btn');
        buttons.forEach((button) => {
            const type = button.dataset.piece;
            const color = this.promotionColor || this.currentPlayer || 'white';
            button.innerHTML = `
                <span class="promotion-icon ${color} ${type}">${this.pickerIcon({ type })}</span>
                <span class="promotion-name">${this.pieceName({ type })}</span>
            `;
        });
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

    updateUI() {
        const turn = document.getElementById('playerTurn');
        const whiteBox = document.getElementById('whiteTimerBox');
        const blackBox = document.getElementById('blackTimerBox');
        const boundaryMode = document.getElementById('boundaryMode');
        const whiteCaptured = document.getElementById('whiteCaptured');
        const blackCaptured = document.getElementById('blackCaptured');
        const onlineColorStatus = document.getElementById('onlineColorStatus');

        if (turn) turn.textContent = this.gameOver
            ? this.tr('turn.gameOver')
            : this.tr('turn.toMove', { color: this.currentPlayer });
        if (whiteBox) whiteBox.classList.toggle('active', this.currentPlayer === 'white' && !this.gameOver);
        if (blackBox) blackBox.classList.toggle('active', this.currentPlayer === 'black' && !this.gameOver);
        if (boundaryMode) boundaryMode.textContent = this.tr('topology.names.rp2');
        if (whiteCaptured) whiteCaptured.innerHTML = this.renderCapturedPieces(this.capturedPieces.white);
        if (blackCaptured) blackCaptured.innerHTML = this.renderCapturedPieces(this.capturedPieces.black);

        if (onlineColorStatus) {
            if (this.gameMode === 'local') {
                onlineColorStatus.textContent = this.tr('online.localStatus');
            } else if (this.network.isConnected) {
                onlineColorStatus.textContent = this.tr('online.youAre', { color: this.myColor });
            } else {
                onlineColorStatus.textContent = this.tr('online.selectedStatus');
            }
        }

        this.renderStatus();
        this.renderHistory();
        this.renderMovePicker();
        this.updateTimerDisplay();
    }

    renderMovePicker() {
        const piecesEl = document.getElementById('movablePiecesList');
        const movesEl = document.getElementById('moveOptionsList');
        const pickerSummary = document.getElementById('movePickerSummary');
        const movesSummary = document.getElementById('moveOptionsSummary');
        if (!piecesEl || !movesEl || !pickerSummary || !movesSummary) return;

        const canMove = this.canCurrentUserMove();
        const color = this.currentPlayer;
        const movablePieces = canMove ? this.getMovablePieces(color) : [];

        if (!canMove) {
            const text = this.gameOver
                ? this.tr('picker.gameOver')
                : this.gameMode === 'online' && !this.network.isConnected
                    ? this.tr('picker.connectOnline')
                    : this.tr('picker.waitingForColor', { color: this.currentPlayer });
            pickerSummary.textContent = text;
            piecesEl.innerHTML = `<span class="empty-row">${text}.</span>`;
            movesSummary.textContent = this.tr('picker.noActiveSelection');
            movesEl.innerHTML = this.emptyInline('picker.destinationsOnTurn');
            return;
        }

        pickerSummary.textContent = this.tr('picker.movableSummary', { color, count: movablePieces.length });
        piecesEl.innerHTML = movablePieces.length
            ? movablePieces.map(({ x, y, sheet, piece, moves }) => {
                const active = this.selectedSquare && this.sameCoord(this.selectedSquare, { x, y, sheet });
                return `
                    <button class="piece-button${active ? ' active' : ''}" type="button" data-piece-x="${x}" data-piece-y="${y}" data-piece-sheet="${sheet}" aria-pressed="${active}" aria-label="${this.pieceName(piece)} ${this.formatCoord({ x, y, sheet })}">
                        <span class="piece-icon ${piece.color} ${piece.type}" title="${this.pieceName(piece)}">${this.pickerIcon(piece)}</span>
                        <span class="piece-coord">${this.formatCoord({ x, y, sheet })}</span>
                        <span class="piece-count">${moves.length}</span>
                    </button>
                `;
            }).join('')
            : this.emptyInline('picker.noMovable');

        if (!this.selectedSquare) {
            movesSummary.textContent = this.tr('picker.selectPiece');
            movesEl.innerHTML = this.emptyInline('picker.selectPieceDestinations');
            return;
        }

        const piece = this.getPiece(this.selectedSquare.x, this.selectedSquare.y, this.selectedSquare.sheet);
        movesSummary.textContent = this.tr('picker.selectedSummary', {
            type: piece.type,
            coord: this.formatCoord(this.selectedSquare),
            count: this.legalMoves.length
        });
        movesEl.innerHTML = this.legalMoves.length
            ? this.legalMoves.map((move) => {
                const pending = this.pendingMoveTarget && this.sameCoord(this.pendingMoveTarget, move);
                return `
                    <button class="move-option${move.capture ? ' capture' : ''}${move.castling ? ' castle' : ''}${pending ? ' pending' : ''}" type="button" data-move-x="${move.x}" data-move-y="${move.y}" data-move-sheet="${move.sheet || 0}" aria-pressed="${pending}">
                        ${this.formatMoveOption(move)}
                    </button>
                `;
            }).join('')
            : this.emptyInline('picker.noDestinations');
    }

    getMovablePieces(color) {
        const pieces = [];

        for (const { x, y, sheet } of this.validCells()) {
            const piece = this.getPiece(x, y, sheet);
            if (!piece || piece.color !== color) continue;

            const moves = this.getLegalMoves(x, y, sheet);
            if (moves.length > 0) {
                pieces.push({ x, y, sheet, piece, moves });
            }
        }

        const order = { K: 0, Q: 1, R: 2, B: 3, N: 4, P: 5 };
        return pieces.sort((a, b) =>
            order[a.piece.type] - order[b.piece.type]
            || a.sheet - b.sheet
            || a.y - b.y
            || a.x - b.x
        );
    }

    canCurrentUserMove() {
        if (this.gameOver) return false;
        if (this.gameMode !== 'online') return true;
        return this.network.isConnected && this.myColor === this.currentPlayer;
    }

    renderHistory() {
        const history = document.getElementById('moveHistoryList');
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
        if (!info) return;

        info.textContent = this.tr('topology.info.rp2');
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
        this.updateUI();
    }

    resetGame({ keepOnline = false, remote = false } = {}) {
        this.setupBoard3D();
        this.selectedSquare = null;
        this.legalMoves = [];
        this.currentPlayer = 'white';
        this.moveHistory = [];
        this.gameOver = false;
        this.capturedPieces = { white: [], black: [] };
        this.gameStarted = false;
        this.pendingMoveTarget = null;
        this.enPassantTarget = null;
        this.timeRemaining = { white: this.timeLimit, black: this.timeLimit };

        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }

        if (!keepOnline) {
            this.gameMode = 'local';
            this.myColor = null;
            this.network.close();
            document.getElementById('gameModeSelect').value = 'local';
            document.getElementById('onlineControls').classList.remove('active');
        }

        if (keepOnline && !remote && this.network.isConnected) {
            this.network.sendMessage({ type: 'newGame' });
        }

        this.renderer.clearHighlights();
        this.unlockGameSettings();
        this.setStatus('status.newGame');
        this.updateUI();
        if (this.gameMode === 'online') this.network.persistState();
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

    attachEventListeners() {
        const canvas = document.getElementById('gameCanvas');
        canvas.addEventListener('click', (event) => this.renderer.onMouseClick(event));

        document.getElementById('movablePiecesList').addEventListener('click', (event) => {
            const button = event.target.closest('button[data-piece-x]');
            if (!button || !this.canCurrentUserMove()) return;

            this.selectSquare(
                Number(button.dataset.pieceX),
                Number(button.dataset.pieceY),
                Number(button.dataset.pieceSheet || 0)
            );
        });

        document.getElementById('moveOptionsList').addEventListener('click', async (event) => {
            const button = event.target.closest('button[data-move-x]');
            if (!button || !this.canCurrentUserMove()) return;

            await this.handleSquareClick(
                Number(button.dataset.moveX),
                Number(button.dataset.moveY),
                Number(button.dataset.moveSheet || 0)
            );
        });

        document.getElementById('cameraReset').addEventListener('click', () => this.renderer.resetCamera());

        document.getElementById('gameModeSelect').addEventListener('change', (event) => {
            if (this.gameStarted || this.network.isConnected) {
                event.target.value = this.gameMode;
                alert(this.tr('alerts.modeLocked'));
                return;
            }

            this.gameMode = event.target.value;
            document.getElementById('onlineControls').classList.toggle('active', this.gameMode === 'online');
            if (this.gameMode === 'local') {
                this.myColor = null;
                this.network.close();
                this.network.setStatus('disconnected', 'online.disconnected');
            }
            this.updateUI();
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
            event.target.value = 'rp2';
            this.boundaryCondition = 'rp2';
            this.updateBoundaryInfo();
            this.updateUI();
        });

        document.getElementById('timerSelect').addEventListener('change', (event) => {
            if (this.gameStarted || this.network.isConnected) {
                event.target.value = String(this.timeLimit);
                alert(this.tr('alerts.timerLocked'));
                return;
            }
            const value = Number(event.target.value);
            this.timerEnabled = value > 0;
            this.timeLimit = value;
            this.timeRemaining = { white: value, black: value };
            this.updateTimerDisplay();
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
                this.network.sendMessage({ type: 'drawOffer' });
                this.setStatus('status.drawOfferSent');
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

            if (!this.showMoveHints) {
                this.renderer.clearLegalMoveHints();
                this.setStatus('status.hintsHidden');
                return;
            }

            if (this.selectedSquare) {
                this.renderer.showLegalMoves(this.legalMoves);
                if (this.pendingMoveTarget) {
                    this.renderer.showChosenMove(this.pendingMoveTarget.x, this.pendingMoveTarget.y, this.pendingMoveTarget.sheet || 0);
                }
            }
            this.setStatus('status.hintsShown');
        });

        document.querySelector('.promotion-options').addEventListener('click', (event) => {
            const button = event.target.closest('button[data-piece]');
            if (!button || !this.promotionResolver) return;
            const type = button.dataset.piece;
            const modal = document.getElementById('promotionModal');
            modal.classList.remove('active');
            modal.setAttribute('aria-hidden', 'true');
            const resolve = this.promotionResolver;
            this.promotionResolver = null;
            this.promotionColor = null;
            resolve(type);
        });
    }

    getPiece(x, y, sheet = 0) {
        const coord = this.canonicalCoord(x, y, sheet);
        if (!this.isValidCell(coord.x, coord.y, coord.sheet)) return null;
        return this.board[coord.sheet]?.[coord.y]?.[coord.x] || null;
    }

    setPiece(x, y, sheet, piece) {
        const coord = this.canonicalCoord(x, y, sheet);
        if (!this.isValidCell(coord.x, coord.y, coord.sheet)) return;
        this.board[coord.sheet][coord.y][coord.x] = piece;
    }

    resolveTarget(x, y, sheet = 0, dx = 0, dy = 0) {
        return this.resolveRP2(x, y, sheet, dx, dy);
    }

    nextLineStep(x, y, sheet, dx, dy) {
        return this.resolveRP2(x + dx, y + dy, sheet, dx, dy);
    }

    resolveRP2(x, y, sheet = 0, dx = 0, dy = 0) {
        let nx = x;
        let ny = y;
        let ns = 0;
        let ndx = dx;
        let ndy = dy;
        const boundaryCrossings = [];
        let guard = 0;

        while ((nx < 0 || nx >= this.boardWidth() || ny < 0 || ny >= this.boardHeight()) && guard < this.boardWidth() + this.boardHeight()) {
            if (nx < 0) {
                const fromSheet = ns;
                boundaryCrossings.push(this.createBoundaryCrossing(fromSheet, 'left', this.wrapY(ny)));
                nx += this.boardWidth();
                ny = this.boardHeight() - 1 - ny;
                ndy = -ndy;
                ns = 0;
            } else if (nx >= this.boardWidth()) {
                const fromSheet = ns;
                boundaryCrossings.push(this.createBoundaryCrossing(fromSheet, 'right', this.wrapY(ny)));
                nx -= this.boardWidth();
                ny = this.boardHeight() - 1 - ny;
                ndy = -ndy;
                ns = 0;
            } else if (ny < 0) {
                const fromSheet = ns;
                boundaryCrossings.push(this.createBoundaryCrossing(fromSheet, 'top', this.wrapX(nx)));
                ny += this.boardHeight();
                nx = this.boardWidth() - 1 - nx;
                ndx = -ndx;
                ns = 0;
            } else if (ny >= this.boardHeight()) {
                const fromSheet = ns;
                boundaryCrossings.push(this.createBoundaryCrossing(fromSheet, 'bottom', this.wrapX(nx)));
                ny -= this.boardHeight();
                nx = this.boardWidth() - 1 - nx;
                ndx = -ndx;
                ns = 0;
            }
            guard++;
        }

        const coord = this.canonicalCoord(nx, ny, ns);
        return {
            x: coord.x,
            y: coord.y,
            sheet: coord.sheet,
            dx: ndx,
            dy: ndy,
            boundaryCrossings,
            valid: true
        };
    }

    inBounds(x, y) {
        return x >= 0 && x < this.boardWidth() && y >= 0 && y < this.boardHeight();
    }

    canonicalCoord(x, y, sheet = 0) {
        return {
            x: this.wrapX(x),
            y: this.wrapY(y),
            sheet: 0
        };
    }
    isBoundaryCell(x, y) {
        return x === 0 || x === this.boardWidth() - 1 || y === 0 || y === this.boardHeight() - 1;
    }

    isValidCell(x, y, sheet = 0) {
        return sheet === 0 && this.inBounds(x, y);
    }
    *validCells() {
        for (let y = 0; y < this.boardHeight(); y++) {
            for (let x = 0; x < this.boardWidth(); x++) {
                yield { x, y, sheet: 0 };
            }
        }
    }
    wrapX(value) {
        return ((value % this.boardWidth()) + this.boardWidth()) % this.boardWidth();
    }

    wrapY(value) {
        return ((value % this.boardHeight()) + this.boardHeight()) % this.boardHeight();
    }

    sameCoord(a, b) {
        const ca = this.canonicalCoord(a.x, a.y, a.sheet || 0);
        const cb = this.canonicalCoord(b.x, b.y, b.sheet || 0);
        return ca.x === cb.x && ca.y === cb.y && ca.sheet === cb.sheet;
    }

    uniqueMoves(moves) {
        const seen = new Set();
        return moves.filter((move) => {
            const coord = this.canonicalCoord(move.x, move.y, move.sheet || 0);
            move.x = coord.x;
            move.y = coord.y;
            move.sheet = coord.sheet;
            const key = `${move.sheet},${move.x},${move.y}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });
    }

    createBoundaryCrossing(fromSheet, side, index) {
        const normalized = side === 'left' || side === 'right'
            ? this.wrapY(index)
            : this.wrapX(index);
        return {
            key: this.boundaryCrossingKey(0, side, normalized),
            fromSheet: 0,
            toSheet: 0,
            side,
            index: normalized
        };
    }

    boundaryCrossingKey(sheet, side, index) {
        return `0:${side}:${index}`;
    }
    isPromotionSquare(color, x, y, sheet = 0) {
        const coord = this.canonicalCoord(x, y, sheet);
        return coord.sheet === 0
            && coord.y === this.homeRow(this.opponentOf(color))
            && this.centralPieceFiles().includes(coord.x);
    }

    tr(key, params = {}) {
        return t(key, params);
    }

    resolveText(key, params = {}) {
        return hasTranslation(key) ? this.tr(key, params) : key;
    }

    emptyInline(key) {
        return `<span class="empty-row">${this.tr(key)}</span>`;
    }

    renderCapturedPieces(pieces) {
        const groups = this.groupCapturedPieces(pieces);
        return groups.length
            ? groups.map((group) => this.capturedPieceGroupMarkup(group)).join('')
            : this.emptyInline('captured.none');
    }

    groupCapturedPieces(pieces = []) {
        const groups = [];
        const byType = new Map();

        for (const value of pieces || []) {
            const piece = this.normalizeCapturedPiece(value);
            const key = `${piece.color}:${piece.type}`;
            let group = byType.get(key);
            if (!group) {
                group = { piece, count: 0 };
                byType.set(key, group);
                groups.push(group);
            }
            group.count += 1;
        }

        return groups;
    }

    capturedPieceGroupMarkup({ piece, count }) {
        const title = `${this.tr(`colors.${piece.color}`)} ${this.pieceName(piece)}`;
        const icons = Array.from({ length: count }, (_, index) => this.capturedPieceMarkup(piece, index)).join('');
        return `<span class="captured-stack" title="${title} x${count}" aria-label="${title} x${count}">${icons}</span>`;
    }

    capturedPieceMarkup(piece, index = 0) {
        return `<span class="captured-icon piece-icon ${piece.color} ${piece.type}" style="--stack-index:${index}">${this.capturedIcon(piece)}</span>`;
    }

    normalizeCapturedPiece(value) {
        if (value && typeof value === 'object') {
            const type = ['K', 'Q', 'R', 'B', 'N', 'P'].includes(value.type) ? value.type : 'P';
            const color = value.color === 'black' ? 'black' : 'white';
            return { color, type };
        }

        const text = String(value || 'P').trim();
        const glyph = text[0] || 'P';
        if (CAPTURED_ICON_LOOKUP[glyph]) return { ...CAPTURED_ICON_LOOKUP[glyph] };

        const type = ['K', 'Q', 'R', 'B', 'N', 'P'].includes(glyph.toUpperCase()) ? glyph.toUpperCase() : 'P';
        const color = glyph === glyph.toLowerCase() ? 'black' : 'white';
        return { color, type };
    }

    formatMoveOption(move) {
        const capture = move.capture ? ' x' : '';
        const castling = move.castling ? ` ${this.tr('picker.castleMove', { side: move.castling.side })}` : '';
        const enPassant = move.enPassant ? ' e.p.' : '';
        return `${this.formatCoord(move)}${capture}${castling}${enPassant}`;
    }

    formatHistoryEntry(entry) {
        if (typeof entry === 'string') return entry;
        if (!entry || typeof entry !== 'object') return '';

        if (entry.kind === 'castle') {
            return this.tr('history.castle', entry);
        }

        return this.tr('history.move', entry);
    }

    formatCoord({ x, y, sheet = 0 }) {
        return `(${x},${y})`;
    }

    opponentOf(color) {
        return color === 'white' ? 'black' : 'white';
    }

    pieceName(piece) {
        return this.tr(`pieces.${piece?.type || 'piece'}`);
    }

    capturedIcon(piece) {
        return CAPTURED_ICONS[piece.color]?.[piece.type] || this.pickerIcon(piece);
    }

    pickerIcon(piece) {
        return PICKER_ICONS[piece?.type] || '?';
    }
}

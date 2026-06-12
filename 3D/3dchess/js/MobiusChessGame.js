import { TorusChessGame } from './TorusChessGame.js';
import { MobiusNetworkManager } from './MobiusNetworkManager.js';
import { MobiusThreeJSRenderer } from './MobiusThreeJSRenderer.js';
import {
    BOARD_HEIGHT,
    BOARD_WIDTH,
    createPiece,
    HOME_ROWS,
    MAIN_ROW,
    PAWN_DIR
} from './BoardSetup.js';

const HOME_SHEETS = { white: 0, black: 1 };
const MOBIUS_HOME_ROWS = { white: HOME_ROWS.white, black: HOME_ROWS.white };

export class MobiusChessGame extends TorusChessGame {
    defaultBoundaryCondition() {
        return 'mobius';
    }

    createRenderer() {
        return new MobiusThreeJSRenderer(this);
    }

    createNetwork() {
        return new MobiusNetworkManager(this);
    }

    topologyNameKey() {
        return 'topology.names.mobius';
    }

    topologyInfoKey() {
        return 'topology.info.mobius';
    }

    setupBoard3D() {
        this.board = this.createEmptyBoard();

        for (const color of ['white', 'black']) {
            const sheet = this.homeSheetFor(color);
            const homeRow = this.homeRowFor(color);
            const pawnRows = this.pawnRowsFor(color);

            for (let x = 0; x < BOARD_WIDTH; x++) {
                this.setPiece(x, homeRow, sheet, createPiece(color, MAIN_ROW[x]));
                for (const row of pawnRows) {
                    this.setPiece(x, row, sheet, this.createPawn(color, row, sheet));
                }
            }
        }

        this.enPassantTarget = null;
        this.renderer.renderPieces3D(this.board);
    }

    createEmptyBoard() {
        return Array.from({ length: 2 }, () =>
            Array.from({ length: BOARD_HEIGHT }, () => Array(BOARD_WIDTH).fill(null))
        );
    }

    homeSheetFor(color) {
        return HOME_SHEETS[color] ?? 0;
    }

    homeRowFor(color) {
        return MOBIUS_HOME_ROWS[color] ?? HOME_ROWS[color];
    }

    pawnRowsFor(color) {
        const homeRow = this.homeRowFor(color);
        return [homeRow + PAWN_DIR[color], homeRow - PAWN_DIR[color]]
            .filter((row) => row >= 0 && row < BOARD_HEIGHT);
    }

    getPawnMoves(x, y, sheet, forAttack) {
        const piece = this.getPiece(x, y, sheet);
        const direction = this.pawnForwardDirection(piece, y, sheet);
        const moves = [];

        for (const dx of [-1, 1]) {
            for (const dy of [-1, 1]) {
                const target = this.resolveTarget(x + dx, y + dy, sheet, dx, dy);
                if (!target.valid) continue;

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
        if (one.valid && !this.sameCoord({ x, y, sheet }, one) && !this.getPiece(one.x, one.y, one.sheet)) {
            moves.push({ ...one, capture: false });

            const two = this.resolveTarget(one.x, one.y + direction, one.sheet, 0, direction);
            if (two.valid && !piece.hasMoved && !this.sameCoord({ x, y, sheet }, two) && !this.getPiece(two.x, two.y, two.sheet)) {
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
                if (!target.valid || !this.sameCoord(target, this.enPassantTarget)) continue;

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

        for (const [startDx, startDy] of directions) {
            let dx = startDx;
            let dy = startDy;
            let cx = x;
            let cy = y;
            let currentSheet = sheet;
            const seenTargets = new Set();

            for (let step = 0; step < BOARD_WIDTH * BOARD_HEIGHT * 2; step++) {
                const targetCoord = this.resolveTarget(cx + dx, cy + dy, currentSheet, dx, dy);
                if (!targetCoord.valid) break;

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

                if (target.color !== piece.color && (forAttack || target.type !== 'K')) {
                    moves.push({ ...targetCoord, capture: true });
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
            if (!target.valid || this.sameCoord({ x, y, sheet }, target)) continue;
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
                if (!target.valid || this.sameCoord({ x, y, sheet }, target)) continue;
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
        if (!king || king.type !== 'K' || king.hasMoved || sheet !== this.homeSheetFor(king.color)) return [];

        const homeRow = this.homeRowFor(king.color);
        if (y !== homeRow || x !== 4 || this.isInCheck(king.color)) return [];

        const options = [
            {
                side: 'kingside',
                rookFrom: { x: 7, y: homeRow, sheet },
                rookTo: { x: 5, y: homeRow, sheet },
                kingTo: { x: 6, y: homeRow, sheet },
                clearX: [5, 6],
                kingPath: [{ x: 5, y: homeRow, sheet }, { x: 6, y: homeRow, sheet }]
            },
            {
                side: 'queenside',
                rookFrom: { x: 0, y: homeRow, sheet },
                rookTo: { x: 3, y: homeRow, sheet },
                kingTo: { x: 2, y: homeRow, sheet },
                clearX: [1, 2, 3],
                kingPath: [{ x: 3, y: homeRow, sheet }, { x: 2, y: homeRow, sheet }]
            }
        ];
        const moves = [];

        for (const option of options) {
            const rook = this.getPiece(option.rookFrom.x, option.rookFrom.y, option.rookFrom.sheet);
            if (!rook || rook.color !== king.color || rook.type !== 'R' || rook.hasMoved) continue;
            if (!option.clearX.every((pathX) => !this.getPiece(pathX, homeRow, sheet))) continue;

            const enemy = this.opponentOf(king.color);
            if (!option.kingPath.every((square) => !this.isSquareAttacked(square.x, square.y, square.sheet, enemy))) continue;

            moves.push({
                ...option.kingTo,
                capture: false,
                castling: {
                    side: option.side,
                    rookFrom: option.rookFrom,
                    rookTo: option.rookTo
                }
            });
        }

        return moves;
    }

    resolveTarget(x, y, sheet = 0, dx = 0, dy = 0) {
        if (x < 0 || x >= BOARD_WIDTH) {
            return { x, y, sheet, dx, dy, boundaryCrossings: [], valid: false };
        }

        let nx = x;
        let ny = y;
        let ns = Number(sheet) === 1 ? 1 : 0;
        let ndx = dx;
        const boundaryCrossings = [];
        let guard = 0;

        while ((ny < 0 || ny >= BOARD_HEIGHT) && guard < 4) {
            if (ny < 0) {
                boundaryCrossings.push(this.createBoundaryCrossing(ns, 'top', nx));
                ny += BOARD_HEIGHT;
                nx = BOARD_WIDTH - 1 - nx;
                ns = 1 - ns;
                ndx = -ndx;
            } else if (ny >= BOARD_HEIGHT) {
                boundaryCrossings.push(this.createBoundaryCrossing(ns, 'bottom', nx));
                ny -= BOARD_HEIGHT;
                nx = BOARD_WIDTH - 1 - nx;
                ns = 1 - ns;
                ndx = -ndx;
            }
            guard++;
        }

        const coord = this.canonicalCoord(nx, ny, ns);
        return {
            x: coord.x,
            y: coord.y,
            sheet: coord.sheet,
            dx: ndx,
            dy,
            boundaryCrossings,
            valid: this.isValidCell(coord.x, coord.y, coord.sheet)
        };
    }

    canonicalCoord(x, y, sheet = 0) {
        return {
            x: Number(x),
            y: Number(y),
            sheet: Number(sheet) === 1 ? 1 : 0
        };
    }

    isValidCell(x, y, sheet = 0) {
        return Number(sheet) >= 0
            && Number(sheet) <= 1
            && x >= 0
            && x < BOARD_WIDTH
            && y >= 0
            && y < BOARD_HEIGHT;
    }

    *validCells() {
        for (let sheet = 0; sheet < 2; sheet++) {
            for (let y = 0; y < BOARD_HEIGHT; y++) {
                for (let x = 0; x < BOARD_WIDTH; x++) {
                    yield { x, y, sheet };
                }
            }
        }
    }

    originSheetsFor(x, y, sheet = 0) {
        return [Number(sheet) === 1 ? 1 : 0];
    }

    createBoundaryCrossing(fromSheet, side, index) {
        return {
            key: this.boundaryCrossingKey(fromSheet, side, index),
            fromSheet,
            toSheet: 1 - fromSheet,
            side,
            index
        };
    }

    boundaryCrossingKey(sheet, side, index) {
        return `${sheet}:${side}:${index}`;
    }

    isPromotionSquare(color, x, y, sheet = 0) {
        const opponent = this.opponentOf(color);
        return sheet === this.homeSheetFor(opponent) && y === this.homeRowFor(opponent);
    }
}

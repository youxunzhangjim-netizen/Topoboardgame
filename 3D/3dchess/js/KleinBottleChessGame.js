import { createPiece } from './BoardSetup.js';
import {
    KLEIN_BOARD_HEIGHT,
    KLEIN_BOARD_WIDTH,
    KLEIN_CENTRAL_FILES,
    KLEIN_HOME_ROWS,
    KLEIN_PAWN_DIR,
    KLEIN_TOPOLOGY,
    createKleinInitialPieces,
    kleinIsPromotionSquare,
    normalizeKlein
} from './KleinBottleConfig.js';
import { KleinBottleNetworkManager } from './KleinBottleNetworkManager.js';
import { KleinBottleThreeJSRenderer } from './KleinBottleThreeJSRenderer.js';
import { TorusChessGame } from './TorusChessGame.js';

export class KleinBottleChessGame extends TorusChessGame {
    defaultBoundaryCondition() {
        return KLEIN_TOPOLOGY;
    }

    createRenderer() {
        return new KleinBottleThreeJSRenderer(this);
    }

    createNetwork() {
        return new KleinBottleNetworkManager(this);
    }

    topologyNameKey() {
        return 'topology.names.klein';
    }

    topologyInfoKey() {
        return 'topology.info.klein';
    }

    boardWidth() {
        return KLEIN_BOARD_WIDTH;
    }

    boardHeight() {
        return KLEIN_BOARD_HEIGHT;
    }

    createEmptyBoard() {
        return [Array.from(
            { length: this.boardHeight() },
            () => Array(this.boardWidth()).fill(null)
        )];
    }

    setupBoard3D() {
        this.board = this.createEmptyBoard();
        for (const { color, type, x, y } of createKleinInitialPieces(
            this.boardWidth(),
            this.boardHeight()
        )) {
            const piece = type === 'P' ? this.createPawn(color, y) : createPiece(color, type);
            this.setPiece(x, y, 0, piece);
        }
        this.enPassantTarget = null;
        this.renderer.renderPieces3D(this.board);
    }

    createPawn(color, row) {
        const pawn = createPiece(color, 'P');
        pawn.pawnDirection = KLEIN_PAWN_DIR[color];
        pawn.originY = row;
        return pawn;
    }

    homeRowFor(color) {
        return KLEIN_HOME_ROWS[color] ?? KLEIN_HOME_ROWS.white;
    }

    pawnRowsFor(color) {
        const homeRow = this.homeRowFor(color);
        return [homeRow - 1, homeRow, homeRow + 1];
    }

    pawnDirectionFromHome(color) {
        return KLEIN_PAWN_DIR[color] ?? 1;
    }

    homeRow(color) {
        return this.homeRowFor(color);
    }

    pawnDirection(color) {
        return KLEIN_PAWN_DIR[color] ?? 1;
    }

    centralPieceFiles() {
        return [...KLEIN_CENTRAL_FILES];
    }

    getPawnMoves(x, y, sheet, forAttack) {
        const piece = this.getPiece(x, y, sheet);
        const direction = KLEIN_PAWN_DIR[piece.color];
        const moves = [];

        for (const dx of [-1, 1]) {
            const target = this.resolveTarget(x + dx, y + direction, sheet, dx, direction);
            if (forAttack) {
                moves.push({ ...target, capture: true });
                continue;
            }

            const targetPiece = this.getPiece(target.x, target.y, target.sheet);
            if (targetPiece && targetPiece.color !== piece.color && targetPiece.type !== 'K') {
                moves.push({ ...target, capture: true });
            }
        }

        if (!forAttack) {
            const forward = this.resolveTarget(x, y + direction, sheet, 0, direction);
            if (!this.sameCoord({ x, y, sheet }, forward)
                && !this.getPiece(forward.x, forward.y, forward.sheet)) {
                moves.push({ ...forward, capture: false });
            }
        }

        return this.uniqueMoves(moves);
    }

    getLineMoves(x, y, sheet, directions, forAttack) {
        const piece = this.getPiece(x, y, sheet);
        const moves = [];
        const limit = this.boardWidth() * this.boardHeight();

        for (const [dx, dy] of directions) {
            let cx = x;
            let cy = y;
            let currentSheet = sheet;
            let currentDx = dx;
            let currentDy = dy;
            const seenTargets = new Set();
            for (let step = 0; step < limit; step++) {
                const targetCoord = this.nextLineStep(cx, cy, currentSheet, currentDx, currentDy);
                cx = targetCoord.x;
                cy = targetCoord.y;
                currentSheet = targetCoord.sheet;
                currentDx = targetCoord.dx;
                currentDy = targetCoord.dy;

                if (this.sameCoord(targetCoord, { x, y, sheet })) break;

                const key = `${currentSheet},${cx},${cy},${currentDx},${currentDy}`;
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

    getCastlingMoves() {
        return [];
    }

    nextLineStep(x, y, sheet, dx, dy) {
        return this.resolveTarget(x + dx, y + dy, sheet, dx, dy);
    }

    resolveTarget(x, y, sheet = 0, dx = 0, dy = 0) {
        let nx = x;
        let ny = y;
        let ndx = dx;
        const boundaryCrossings = [];
        let guard = 0;

        while ((nx < 0 || nx >= this.boardWidth() || ny < 0 || ny >= this.boardHeight())
            && guard < this.boardWidth() + this.boardHeight()) {
            if (nx < 0) {
                boundaryCrossings.push(this.createBoundaryCrossing('left', this.wrapY(ny)));
                nx += this.boardWidth();
            } else if (nx >= this.boardWidth()) {
                boundaryCrossings.push(this.createBoundaryCrossing('right', this.wrapY(ny)));
                nx -= this.boardWidth();
            } else if (ny < 0) {
                boundaryCrossings.push(this.createBoundaryCrossing('top', this.wrapX(nx)));
                ny += this.boardHeight();
                nx = this.boardWidth() - 1 - nx;
                ndx = -ndx;
            } else if (ny >= this.boardHeight()) {
                boundaryCrossings.push(this.createBoundaryCrossing('bottom', this.wrapX(nx)));
                ny -= this.boardHeight();
                nx = this.boardWidth() - 1 - nx;
                ndx = -ndx;
            }
            guard++;
        }

        const coord = this.canonicalCoord(nx, ny, sheet);
        return {
            x: coord.x,
            y: coord.y,
            sheet: coord.sheet,
            dx: ndx,
            dy,
            boundaryCrossings,
            valid: true
        };
    }

    canonicalCoord(x, y) {
        return normalizeKlein(x, y, this.boardWidth(), this.boardHeight());
    }

    inBounds(x, y) {
        return x >= 0 && x < this.boardWidth() && y >= 0 && y < this.boardHeight();
    }

    isValidCell(x, y, sheet = 0) {
        return Number(sheet) === 0 && this.inBounds(x, y);
    }

    *validCells() {
        for (let y = 0; y < this.boardHeight(); y++) {
            for (let x = 0; x < this.boardWidth(); x++) {
                yield { x, y, sheet: 0 };
            }
        }
    }

    wrapX(value) {
        return normalizeKlein(value, 0, this.boardWidth(), this.boardHeight()).x;
    }

    wrapY(value) {
        return normalizeKlein(0, value, this.boardWidth(), this.boardHeight()).y;
    }

    isPromotionSquare(color, x, y, sheet = 0) {
        return Number(sheet) === 0 && kleinIsPromotionSquare(color, x, y);
    }

    createBoundaryCrossing(side, index) {
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
}

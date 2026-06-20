import { createPiece } from './BoardSetup.js';
import { SphereNetworkManager } from './SphereNetworkManager.js';
import { SphereThreeJSRenderer } from './SphereThreeJSRenderer.js';
import { TorusChessGame } from './TorusChessGame.js';
import {
    SPHERE_BOARD_HEIGHT,
    SPHERE_BOARD_WIDTH,
    SPHERE_HOME_ROWS,
    SPHERE_PAWN_DIR,
    SPHERE_PLAYABLE_MAX_Y,
    SPHERE_PLAYABLE_MIN_Y,
    createSphereInitialPieces,
    createSphereWhiteInitialPieces,
    sphereIsPlayable,
    sphereIsPromotionSquare,
    sphereResolveTarget,
    sphereWrapX
} from './SphereConfig.js';

export class SphereChessGame extends TorusChessGame {
    defaultBoundaryCondition() {
        return 'sphere';
    }

    createRenderer() {
        return new SphereThreeJSRenderer(this);
    }

    createNetwork() {
        return new SphereNetworkManager(this);
    }

    topologyNameKey() {
        return 'topology.names.sphere';
    }

    topologyInfoKey() {
        return 'topology.info.sphere';
    }

    createEmptyBoard() {
        return [Array.from({ length: this.boardHeight() }, () => Array(this.boardWidth()).fill(null))];
    }

    setupBoard3D() {
        this.board = this.createEmptyBoard();
        for (const { color, type, x, y } of createSphereInitialPieces(this.boardWidth(), this.boardHeight())) {
            this.setPiece(x, y, 0, this.createInitialPiece(color, type, y, 0));
        }
        this.enPassantTarget = null;
        this.renderer.renderPieces3D(this.board);
    }

    createInitialPiece(color, type, row, sheet = 0) {
        return type === 'P' ? this.createPawn(color, row, sheet) : createPiece(color, type);
    }

    createPawn(color, row, sheet = 0) {
        const pawn = createPiece(color, 'P');
        pawn.pawnDirection = SPHERE_PAWN_DIR[color];
        pawn.originY = row;
        pawn.originSheet = sheet;
        return pawn;
    }

    boardWidth() {
        return SPHERE_BOARD_WIDTH;
    }

    boardHeight() {
        return SPHERE_BOARD_HEIGHT;
    }

    homeRowFor(color) {
        return SPHERE_HOME_ROWS[color] ?? SPHERE_HOME_ROWS.white;
    }

    pawnRowsFor(color) {
        const rows = createSphereInitialPieces(this.boardWidth(), this.boardHeight())
            .filter((piece) => piece.color === color && piece.type === 'P')
            .map((piece) => piece.y);
        return [...new Set(rows)].sort((a, b) => a - b);
    }

    pawnDirectionFromHome(color) {
        return SPHERE_PAWN_DIR[color] ?? 1;
    }

    getPawnMoves(x, y, sheet, forAttack) {
        const piece = this.getPiece(x, y, sheet);
        const direction = this.pawnForwardDirection(piece, y, sheet);
        const moves = [];

        for (const dx of [-1, 1]) {
            const target = this.resolveTarget(x + dx, y + direction, sheet, dx, direction);
            if (!target.valid) continue;
            if (target.poleCrossings % 2 === 1) target.flipPawnDirection = true;

            if (forAttack) {
                moves.push({ ...target, capture: true });
                continue;
            }

            const targetPiece = this.getPiece(target.x, target.y, target.sheet);
            if (targetPiece && targetPiece.color !== piece.color && targetPiece.type !== 'K') {
                moves.push({ ...target, capture: true });
            }
        }

        if (forAttack) return this.uniqueMoves(moves);

        const one = this.resolveTarget(x, y + direction, sheet, 0, direction);
        if (one.valid && !this.getPiece(one.x, one.y, one.sheet)) {
            if (one.poleCrossings % 2 === 1) one.flipPawnDirection = true;
            moves.push({ ...one, capture: false });

            const nextDirection = one.flipPawnDirection ? -direction : direction;
            const two = this.resolveTarget(one.x, one.y + nextDirection, one.sheet, 0, nextDirection);
            const onOrigin = piece.originY === undefined
                ? !piece.hasMoved
                : piece.originY === y && (piece.originSheet ?? 0) === sheet;
            if (!piece.hasMoved && onOrigin && two.valid && !this.getPiece(two.x, two.y, two.sheet)) {
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

        for (const [dx, dy] of directions) {
            let cx = x;
            let cy = y;
            let currentDy = dy;
            const seenTargets = new Set();

            for (let step = 0; step < this.boardWidth() * this.boardHeight() * 2; step++) {
                const targetCoord = this.resolveTarget(cx + dx, cy + currentDy, sheet, dx, currentDy);
                if (!targetCoord.valid) break;

                cx = targetCoord.x;
                cy = targetCoord.y;
                if (targetCoord.poleCrossings % 2 === 1) currentDy *= -1;

                if (this.sameCoord(targetCoord, { x, y, sheet })) break;

                const key = `${targetCoord.sheet},${cx},${cy}`;
                if (seenTargets.has(key)) break;
                seenTargets.add(key);

                const target = this.getPiece(cx, cy, targetCoord.sheet);
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

    getCastlingMoves() {
        return [];
    }

    resolveTarget(x, y, sheet = 0) {
        return sphereResolveTarget(x, y, this.boardWidth(), this.boardHeight());
    }

    inBounds(x, y) {
        return x >= 0 && x < this.boardWidth() && y >= 0 && y < this.boardHeight();
    }

    canonicalCoord(x, y, sheet = 0) {
        return sphereResolveTarget(x, y, this.boardWidth(), this.boardHeight());
    }

    isValidCell(x, y, sheet = 0) {
        return Number(sheet) === 0 && sphereIsPlayable(x, y, this.boardWidth(), this.boardHeight());
    }

    *validCells() {
        for (let y = SPHERE_PLAYABLE_MIN_Y; y <= Math.min(this.boardHeight() - 1, SPHERE_PLAYABLE_MAX_Y); y++) {
            for (let x = 0; x < this.boardWidth(); x++) {
                yield { x, y, sheet: 0 };
            }
        }
    }

    wrapX(value) {
        return sphereWrapX(value, this.boardWidth());
    }

    wrapY(value) {
        return value;
    }

    isPromotionSquare(color, x, y, sheet = 0) {
        return Number(sheet) === 0 && sphereIsPromotionSquare(color, x, y, this.boardWidth(), this.boardHeight());
    }

    createWhiteInitialPieces() {
        return createSphereWhiteInitialPieces(this.boardWidth());
    }
}

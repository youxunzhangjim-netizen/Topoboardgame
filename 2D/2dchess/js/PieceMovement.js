const SIZE = 8;

export class PieceMovement {
    constructor(game) {
        this.game = game;
    }

    getLegalMoves(row, col) {
        const piece = this.game.getPiece(row, col);
        if (!piece || piece.color !== this.game.currentPlayer) return [];

        const moves = this.getPseudoMoves(row, col);
        if (piece.type === 'K') {
            moves.push(...this.getCastlingMoves(row, col));
        }

        return this.uniqueMoves(moves).filter((move) =>
            !this.wouldLeaveKingInCheck(row, col, move)
        );
    }

    getPseudoMoves(row, col, { forAttack = false } = {}) {
        const piece = this.game.getPiece(row, col);
        if (!piece) return [];

        switch (piece.type) {
            case 'P':
                return this.getPawnMoves(row, col, forAttack);
            case 'R':
                return this.getLineMoves(row, col, [[0, 1], [0, -1], [1, 0], [-1, 0]], forAttack);
            case 'N':
                return this.getKnightMoves(row, col, forAttack);
            case 'B':
                return this.getLineMoves(row, col, [[1, 1], [1, -1], [-1, 1], [-1, -1]], forAttack);
            case 'Q':
                return this.getLineMoves(row, col, [
                    [0, 1], [0, -1], [1, 0], [-1, 0],
                    [1, 1], [1, -1], [-1, 1], [-1, -1]
                ], forAttack);
            case 'K':
                return this.getKingMoves(row, col, forAttack);
            default:
                return [];
        }
    }

    getPawnMoves(row, col, forAttack) {
        const piece = this.game.getPiece(row, col);
        const direction = piece.color === 'white' ? -1 : 1;
        const moves = [];

        for (const dc of [-1, 1]) {
            const targetRow = row + direction;
            const targetCol = col + dc;
            if (!this.inBounds(targetRow, targetCol)) continue;

            if (forAttack) {
                moves.push({ r: targetRow, c: targetCol, capture: true });
                continue;
            }

            const target = this.game.getPiece(targetRow, targetCol);
            if (target && target.color !== piece.color && target.type !== 'K') {
                moves.push({ r: targetRow, c: targetCol, capture: true });
            }
        }

        if (forAttack) return moves;

        const oneRow = row + direction;
        if (this.inBounds(oneRow, col) && !this.game.getPiece(oneRow, col)) {
            moves.push({ r: oneRow, c: col, capture: false });

            const startRow = piece.color === 'white' ? 6 : 1;
            const twoRow = row + direction * 2;
            if (row === startRow && this.inBounds(twoRow, col) && !this.game.getPiece(twoRow, col)) {
                moves.push({ r: twoRow, c: col, capture: false, pawnDoubleJump: true });
            }
        }

        if (this.game.enPassantTarget) {
            const enPassantRow = piece.color === 'white' ? 3 : 4;
            const targetCol = this.game.enPassantTarget.col;
            if (row === enPassantRow && Math.abs(col - targetCol) === 1) {
                moves.push({
                    r: row + direction,
                    c: targetCol,
                    capture: true,
                    enPassant: true,
                    capturePos: { r: row, c: targetCol }
                });
            }
        }

        return moves;
    }

    getLineMoves(row, col, directions, forAttack) {
        const piece = this.game.getPiece(row, col);
        const moves = [];

        for (const [dr, dc] of directions) {
            const seenTargets = new Set();

            for (let step = 1; step <= SIZE * 2; step++) {
                const resolved = this.applyBoundary(row + dr * step, col + dc * step);
                if (!resolved.valid) break;
                if (resolved.r === row && resolved.c === col) break;

                const key = `${resolved.r},${resolved.c}`;
                if (seenTargets.has(key)) break;
                seenTargets.add(key);

                const target = this.game.getPiece(resolved.r, resolved.c);
                if (!target) {
                    moves.push({ r: resolved.r, c: resolved.c, capture: false });
                    continue;
                }

                if (target.color !== piece.color) {
                    if (forAttack || target.type !== 'K') {
                        moves.push({ r: resolved.r, c: resolved.c, capture: true });
                    }
                }
                break;
            }
        }

        return moves;
    }

    getKnightMoves(row, col, forAttack) {
        const piece = this.game.getPiece(row, col);
        const offsets = [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]];
        const moves = [];

        for (const [dr, dc] of offsets) {
            const target = this.applyBoundary(row + dr, col + dc);
            if (!target.valid || (target.r === row && target.c === col)) continue;
            this.addLeaperMove(moves, target, piece, forAttack);
        }

        return this.uniqueMoves(moves);
    }

    getKingMoves(row, col, forAttack) {
        const piece = this.game.getPiece(row, col);
        const moves = [];

        for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
                if (dr === 0 && dc === 0) continue;
                const target = this.applyBoundary(row + dr, col + dc);
                if (!target.valid || (target.r === row && target.c === col)) continue;
                this.addLeaperMove(moves, target, piece, forAttack);
            }
        }

        return this.uniqueMoves(moves);
    }

    addLeaperMove(moves, target, piece, forAttack) {
        const targetPiece = this.game.getPiece(target.r, target.c);
        if (!targetPiece) {
            moves.push({ r: target.r, c: target.c, capture: false });
            return;
        }

        if (targetPiece.color !== piece.color && (forAttack || targetPiece.type !== 'K')) {
            moves.push({ r: target.r, c: target.c, capture: true });
        }
    }

    getCastlingMoves(row, col) {
        const king = this.game.getPiece(row, col);
        if (!king || king.type !== 'K' || king.hasMoved) return [];

        const homeRow = king.color === 'white' ? 7 : 0;
        if (row !== homeRow || col !== 4 || this.isInCheck(king.color)) return [];

        const options = [
            { side: 'kingside', rookCol: 7, kingToCol: 6, rookToCol: 5 },
            { side: 'queenside', rookCol: 0, kingToCol: 2, rookToCol: 3 }
        ];
        const moves = [];

        for (const option of options) {
            if (!this.canCastleWithRook(king, homeRow, col, option)) continue;

            moves.push({
                r: homeRow,
                c: option.kingToCol,
                capture: false,
                castling: {
                    side: option.side,
                    rookPos: { r: homeRow, c: option.rookCol },
                    newRookPos: { r: homeRow, c: option.rookToCol }
                }
            });
        }

        return moves;
    }

    canCastleWithRook(king, homeRow, kingCol, option) {
        const rook = this.game.getPiece(homeRow, option.rookCol);
        if (!rook || rook.color !== king.color || rook.type !== 'R' || rook.hasMoved) return false;
        if (!this.isCastlingPathClear(homeRow, kingCol, option.rookCol)) return false;
        return this.isCastlingKingPathSafe(king.color, homeRow, kingCol, option.kingToCol);
    }

    isCastlingPathClear(row, kingCol, rookCol) {
        const min = Math.min(kingCol, rookCol);
        const max = Math.max(kingCol, rookCol);

        for (let col = min + 1; col < max; col++) {
            if (this.game.getPiece(row, col)) return false;
        }

        return true;
    }

    isCastlingKingPathSafe(color, row, kingCol, kingToCol) {
        const enemy = this.opponentOf(color);
        const start = Math.min(kingCol, kingToCol);
        const end = Math.max(kingCol, kingToCol);

        for (let col = start; col <= end; col++) {
            if (this.isSquareAttacked(row, col, enemy)) return false;
        }

        return true;
    }

    wouldLeaveKingInCheck(fromRow, fromCol, move) {
        const piece = this.game.getPiece(fromRow, fromCol);
        if (!piece) return true;

        const captured = this.game.getPiece(move.r, move.c);
        const epCaptured = move.enPassant && move.capturePos
            ? this.game.getPiece(move.capturePos.r, move.capturePos.c)
            : null;
        const rook = move.castling
            ? this.game.getPiece(move.castling.rookPos.r, move.castling.rookPos.c)
            : null;

        this.game.board[fromRow][fromCol] = null;
        this.game.board[move.r][move.c] = piece;
        if (move.enPassant && move.capturePos) {
            this.game.board[move.capturePos.r][move.capturePos.c] = null;
        }
        if (move.castling && rook) {
            this.game.board[move.castling.rookPos.r][move.castling.rookPos.c] = null;
            this.game.board[move.castling.newRookPos.r][move.castling.newRookPos.c] = rook;
        }

        const king = this.findKing(piece.color);
        const inCheck = !king || this.isSquareAttacked(king.r, king.c, this.opponentOf(piece.color));

        if (move.castling && rook) {
            this.game.board[move.castling.rookPos.r][move.castling.rookPos.c] = rook;
            this.game.board[move.castling.newRookPos.r][move.castling.newRookPos.c] = null;
        }
        if (move.enPassant && move.capturePos) {
            this.game.board[move.capturePos.r][move.capturePos.c] = epCaptured;
        }
        this.game.board[fromRow][fromCol] = piece;
        this.game.board[move.r][move.c] = captured;

        return inCheck;
    }

    isInCheck(color) {
        const king = this.findKing(color);
        return Boolean(king && this.isSquareAttacked(king.r, king.c, this.opponentOf(color)));
    }

    isSquareAttacked(row, col, byColor) {
        for (let r = 0; r < SIZE; r++) {
            for (let c = 0; c < SIZE; c++) {
                const piece = this.game.getPiece(r, c);
                if (!piece || piece.color !== byColor) continue;
                if (this.getPseudoMoves(r, c, { forAttack: true }).some((move) => move.r === row && move.c === col)) {
                    return true;
                }
            }
        }

        return false;
    }

    hasLegalMoves(color) {
        const original = this.game.currentPlayer;
        this.game.currentPlayer = color;

        for (let row = 0; row < SIZE; row++) {
            for (let col = 0; col < SIZE; col++) {
                const piece = this.game.getPiece(row, col);
                if (piece?.color === color && this.getLegalMoves(row, col).length > 0) {
                    this.game.currentPlayer = original;
                    return true;
                }
            }
        }

        this.game.currentPlayer = original;
        return false;
    }

    findKing(color) {
        for (let row = 0; row < SIZE; row++) {
            for (let col = 0; col < SIZE; col++) {
                const piece = this.game.getPiece(row, col);
                if (piece?.color === color && piece.type === 'K') return { r: row, c: col };
            }
        }
        return null;
    }

    applyBoundary(row, col) {
        if (row < 0 || row >= SIZE) return { valid: false, r: row, c: col };

        if (this.game.boundaryCondition === 'forbidden') {
            return { valid: col >= 0 && col < SIZE, r: row, c: col };
        }

        if (this.game.boundaryCondition === 'periodic') {
            return { valid: true, r: row, c: this.wrap(col) };
        }

        return { valid: true, r: row, c: this.reflect(col) };
    }

    inBounds(row, col) {
        return row >= 0 && row < SIZE && col >= 0 && col < SIZE;
    }

    wrap(value) {
        return ((value % SIZE) + SIZE) % SIZE;
    }

    reflect(value) {
        let reflected = value;
        while (reflected < 0 || reflected >= SIZE) {
            // Reflect around the center of the edge square so diagonals keep their square color.
            if (reflected < 0) reflected = -reflected;
            if (reflected >= SIZE) reflected = (SIZE - 1) * 2 - reflected;
        }
        return reflected;
    }

    uniqueMoves(moves) {
        const seen = new Set();
        return moves.filter((move) => {
            const key = `${move.r},${move.c}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });
    }

    opponentOf(color) {
        return color === 'white' ? 'black' : 'white';
    }
}

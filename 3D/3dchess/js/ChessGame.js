import { CubeChessGame } from './CubeChessGame.js';
import { MobiusChessGame } from './MobiusChessGame.js';
import { RP2ChessGame } from './RP2ChessGame.js';
import { TorusChessGame } from './TorusChessGame.js';

const VARIANTS = {
    torus: {
        label: 'T2',
        title: 'T2 Torus Chess',
        tagline: '2D chess on a longer 3D torus: 8 cells around the short side and a 14-row route through the extended direction.',
        canvasLabel: '3D torus chess board',
        rulesTitle: 'Torus Rules',
        rulesText: 'Rooks, bishops, queens, knights, kings, castling, en passant, check, and mate use 2D chess movement on 112 torus blocks. The board is 8 columns by 14 periodic rows, with the six extra blank rows placed between the initial armies so the king rows start opposite each other. Pawns promote when they reach the opponent home row.',
        boundaryValue: 'periodic',
        controller: TorusChessGame
    },
    cube: {
        label: 'R3',
        title: 'R3 3D Chess',
        tagline: 'Local and online cubic chess with full 3D movement.',
        canvasLabel: '3D chess board',
        rulesTitle: '3D Movement',
        rulesText: "Rook: axes. Bishop: plane and body diagonals. Queen: all straight 3D lines. Knight: 2-1 jumps on any plane. King: one cell in any direction. Pawn: forward on X, Y, or Z, captures forward diagonals, and promotes only on the opponent's Y or Z home face inside the bottom three rows.",
        boundaryValue: 'forbidden',
        controller: CubeChessGame
    },
    rp2: {
        label: 'RP2',
        title: 'RP2 Chess',
        tagline: '2D chess on one 12x14 RP2 fundamental board with antipodal edge gluing.',
        canvasLabel: '3D RP2 chess board',
        rulesTitle: 'RP2 Rules',
        rulesText: 'Pieces use 2D chess movement on one 12x14 RP2 board. Crossing left or right lands on the opposite edge with y reversed; crossing top or bottom lands on the opposite edge with x reversed. Move hints that cross a boundary light the raised cage arrow green.',
        boundaryValue: 'rp2',
        controller: RP2ChessGame
    },
    mobius: {
        label: 'M',
        title: 'Mobius Chess',
        tagline: '2D chess on a rotatable Mobius band with open lateral edges and two playable surface sides.',
        canvasLabel: '3D Mobius chess board',
        rulesTitle: 'Mobius Rules',
        rulesText: 'Pieces use 2D chess movement on both sides of the Mobius band. The lateral x edges are open. Crossing the winding y edge goes through the twist, reverses x, and lands on the opposite surface side. White and Black start on the same board coordinates on opposite surface sides, with two pawn rows around the king row. Pawns promote on the opposite side at the opponent king row.',
        boundaryValue: 'mobius',
        controller: MobiusChessGame
    }
};

const DEFAULT_VARIANT = 'torus';
const STORAGE_KEY = '3dchess:selectedVariant';

export class ChessGame {
    constructor() {
        this.variant = this.resolveVariant();
        this.activeGame = null;

        this.prepareVariantControls();
        this.activeGame = new VARIANTS[this.variant].controller();
        this.applyVariantText();
        this.installBoardGameSwitch();
        this.syncVariantLock();
        this.variantLockTimer = window.setInterval(() => this.syncVariantLock(), 400);
    }

    resolveVariant() {
        const params = new URLSearchParams(window.location.search);
        const fromUrl = params.get('variant') || params.get('game') || '';
        if (this.isVariant(fromUrl)) {
            window.localStorage.setItem(STORAGE_KEY, fromUrl);
            return fromUrl;
        }

        const stored = window.localStorage.getItem(STORAGE_KEY) || '';
        return this.isVariant(stored) ? stored : DEFAULT_VARIANT;
    }

    isVariant(value) {
        return Object.prototype.hasOwnProperty.call(VARIANTS, value);
    }

    prepareVariantControls() {
        document.body.dataset.activeBoardGame = this.variant;

        const boardGameSelect = document.getElementById('boardGameSelect');
        if (boardGameSelect) boardGameSelect.value = this.variant;

        const title = document.querySelector('[data-board-game-title]');
        if (title) title.textContent = VARIANTS[this.variant].title;

        const boundarySelect = document.getElementById('boundarySelect');
        if (boundarySelect) {
            boundarySelect.querySelectorAll('option').forEach((option) => {
                const variantBoundary = VARIANTS[this.variant].boundaryValue;
                const sharedCubeOption = ['forbidden', 'reflection', 'periodic'].includes(option.value);
                option.hidden = this.variant === 'cube'
                    ? !sharedCubeOption
                    : option.value !== variantBoundary;
                option.disabled = option.hidden;
            });
            boundarySelect.disabled = this.variant !== 'cube';
            boundarySelect.value = VARIANTS[this.variant].boundaryValue;
        }

        const timerSelect = document.getElementById('timerSelect');
        if (timerSelect) timerSelect.value = '600';
    }

    installBoardGameSwitch() {
        const boardGameSelect = document.getElementById('boardGameSelect');
        if (!boardGameSelect) return;

        boardGameSelect.addEventListener('change', () => {
            const nextVariant = boardGameSelect.value;
            this.switchVariant(nextVariant);
            if (nextVariant !== this.variant) boardGameSelect.value = this.variant;
        });
    }

    syncVariantLock() {
        const locked = Boolean(this.activeGame?.gameStarted && !this.activeGame?.gameOver);
        const boardGameSelect = document.getElementById('boardGameSelect');
        if (boardGameSelect) {
            boardGameSelect.value = this.variant;
            boardGameSelect.disabled = locked;
        }
    }

    applyVariantText() {
        const variant = VARIANTS[this.variant];
        document.title = variant.title;

        const heading = document.querySelector('.top-bar h1');
        const tagline = document.querySelector('.top-bar p');
        const canvas = document.getElementById('gameCanvas');
        const rulesTitle = document.querySelector('.panel:last-of-type h3');
        const rulesText = document.querySelector('.rules-text');

        if (heading) heading.textContent = variant.title;
        if (tagline) tagline.textContent = variant.tagline;
        if (canvas) canvas.setAttribute('aria-label', variant.canvasLabel);
        if (rulesTitle) rulesTitle.textContent = variant.rulesTitle;
        if (rulesText) rulesText.textContent = variant.rulesText;

        this.prepareVariantControls();
    }

    switchVariant(nextVariant) {
        if (!this.isVariant(nextVariant) || nextVariant === this.variant) return;

        if (this.activeGame?.gameStarted && !this.activeGame?.gameOver) {
            alert('Board game mode is locked until the current game ends.');
            this.syncVariantLock();
            return;
        }

        if (this.activeGame?.network?.isConnected) {
            const ok = confirm('Switching board games starts a fresh board and disconnects the current room. Continue?');
            if (!ok) return;
        }

        window.localStorage.setItem(STORAGE_KEY, nextVariant);
        const url = new URL(window.location.href);
        url.searchParams.set('variant', nextVariant);
        url.searchParams.delete('game');
        url.searchParams.delete('room');
        window.location.href = url.toString();
    }
}

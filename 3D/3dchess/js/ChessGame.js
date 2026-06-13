import { CubeChessGame } from './CubeChessGame.js';
import { KleinBottleChessGame } from './KleinBottleChessGame.js';
import { MobiusChessGame } from './MobiusChessGame.js';
import { RP2ChessGame } from './RP2ChessGame.js';
import { SphereChessGame } from './SphereChessGame.js';
import { TorusChessGame } from './TorusChessGame.js';
import { I18N, setLanguage } from './i18n.js';

const VARIANTS = {
    torus: {
        label: 'T2',
        title: 'T2 Torus Chess',
        tagline: '2D chess on a longer 3D torus: 8 cells around the short side and a 14-row route through the extended direction.',
        canvasLabel: '3D torus chess board',
        rulesTitle: 'Torus Rules',
        rulesText: 'Rooks, bishops, queens, knights, kings, castling, en passant, check, and mate use 2D chess movement on 112 torus blocks. The board is 8 columns by 14 periodic rows, with the six extra blank rows placed between the initial armies so the king rows start opposite each other. Pawns promote when they reach the opponent home row.',
        boundaryValue: 'periodic',
        controller: TorusChessGame,
        zh: {
                  "title": "T2 環面棋",
                  "tagline": "在加長三維環面上的二維國際象棋：短方向 8 格，長方向 14 行。",
                  "canvasLabel": "三維環面棋盤",
                  "rulesTitle": "環面規則",
                  "rulesText": "車、象、后、馬、王、易位、吃過路兵、將軍與將死都使用 112 個環面格上的二維國際象棋走法。棋盤為 8 列 x 14 個週期行，雙方初始陣之間有六行空格。兵到達對方底線時升變。"
        }
    },
    cube: {
        label: 'R3',
        title: 'R3 3D Chess',
        tagline: 'Local and online cubic chess with full 3D movement.',
        canvasLabel: '3D chess board',
        rulesTitle: '3D Movement',
        rulesText: "Rook: axes. Bishop: plane and body diagonals. Queen: all straight 3D lines. Knight: 2-1 jumps on any plane. King: one cell in any direction. Pawn: forward on X, Y, or Z, captures forward diagonals, and promotes only on the opponent's Y or Z home face inside the bottom three rows.",
        boundaryValue: 'forbidden',
        controller: CubeChessGame,
        zh: {
                  "title": "R3 三維棋",
                  "tagline": "支援本地與線上的立方體國際象棋，使用完整三維走法。",
                  "canvasLabel": "三維棋盤",
                  "rulesTitle": "三維走法",
                  "rulesText": "車沿座標軸走，象沿平面與空間對角線走，后可走所有三維直線，馬在任意平面跳 2-1，王向任意方向走一格。兵沿 X、Y 或 Z 前進並斜向吃子。"
        }
    },
    rp2: {
        label: 'RP2',
        title: 'RP2 Chess',
        tagline: '2D chess on one 12x14 RP2 fundamental board with antipodal edge gluing.',
        canvasLabel: '3D RP2 chess board',
        rulesTitle: 'RP2 Rules',
        rulesText: 'Pieces use 2D chess movement on one 12x14 RP2 board. Crossing left or right lands on the opposite edge with y reversed; crossing top or bottom lands on the opposite edge with x reversed. Move hints that cross a boundary light the raised cage arrow green.',
        boundaryValue: 'rp2',
        controller: RP2ChessGame,
        zh: {
                  "title": "RP2 棋",
                  "tagline": "在一個 12x14 RP2 基本棋盤上進行二維國際象棋，並使用對映邊界黏合。",
                  "canvasLabel": "三維 RP2 棋盤",
                  "rulesTitle": "RP2 規則",
                  "rulesText": "棋子在一個 12x14 RP2 棋盤上使用二維國際象棋走法。穿過左右邊界會到達對邊並反轉 y；穿過上下邊界會到達對邊並反轉 x。越界提示會點亮升起的綠色映射箭頭。"
        }
    },
    mobius: {
        label: 'M',
        title: 'Mobius Chess',
        tagline: '2D chess on a rotatable Mobius band with open lateral edges and two playable surface sides.',
        canvasLabel: '3D Mobius chess board',
        rulesTitle: 'Mobius Rules',
        rulesText: 'Pieces use 2D chess movement on both sides of the Mobius band. The lateral x edges are open. Crossing the winding y edge goes through the twist, reverses x, and lands on the opposite surface side. White and Black start on the same board coordinates on opposite surface sides, with two pawn rows around the king row. Pawns promote on the opposite side at the opponent king row.',
        boundaryValue: 'mobius',
        controller: MobiusChessGame,
        zh: {
                  "title": "Mobius 棋",
                  "tagline": "在可旋轉 Mobius 帶上進行二維國際象棋，橫向邊界開放且兩面皆可走。",
                  "canvasLabel": "三維 Mobius 棋盤",
                  "rulesTitle": "Mobius 規則",
                  "rulesText": "棋子在 Mobius 帶兩面使用二維國際象棋走法。橫向 x 邊界開放；穿過纏繞 y 邊界會經過扭轉、反轉 x 並到達另一面。雙方從相同座標的相反表面出發。"
        }
    },
    sphere: {
        label: 'S2',
        title: 'Sphere Chess',
        tagline: '2D chess on a latitude-longitude sphere with periodic longitude and antipodal pole crossing.',
        canvasLabel: '3D sphere chess board',
        rulesTitle: 'Sphere Rules',
        rulesText: 'Sphere chess uses 16 longitudes and 16 latitude rows. Longitude wraps periodically. Polar cap rows remain empty, but legal movement can cross a pole and emerge on the antipodal longitude. Each army has four extra corner-support pawns. Pawns promote only by entering the opponent\'s original 8-piece king-row block.',
        boundaryValue: 'sphere',
        controller: SphereChessGame,
        zh: {
            title: '球面棋',
            tagline: '在經緯度球面上進行二維國際象棋，經度方向週期連接，並可從兩極穿越到對蹠經度。',
            canvasLabel: '三維球面棋盤',
            rulesTitle: '球面規則',
            rulesText: '球面棋使用 16 條經度與 16 列緯度。經度方向週期連接；兩極帽列保持空白，但合法走法可穿越極點並從對蹠經度出現。每方增加四枚角落支援兵。兵只有進入對手原始八枚主棋所在列時才能升變。'
        }
    },
    klein: {
        label: 'K',
        title: 'Klein Bottle Chess',
        tagline: '2D chess on a 12x16 cut-open Klein bottle board with flipped top-bottom gluing.',
        canvasLabel: 'Klein bottle chess board',
        rulesTitle: 'Klein Bottle Rules',
        rulesText: 'The 12x16 board has normal horizontal wrap and flipped vertical wrap. White starts on rows 2-4; Black is generated by an eight-row translation. Pawns move one step, cannot use en passant or double-step, and promote only on the opponent original central king row.',
        boundaryValue: 'klein_bottle',
        controller: KleinBottleChessGame,
        zh: {
            title: '克萊因瓶西洋棋',
            tagline: '在 12x16 切開的克萊因瓶棋盤上進行二維西洋棋，上下邊界以反向方式黏合。',
            canvasLabel: '克萊因瓶西洋棋棋盤',
            rulesTitle: '克萊因瓶規則',
            rulesText: '12x16 棋盤的左右邊界直接循環，上下邊界循環時會反轉 x。白方位於第 2 至 4 列，黑方由向上平移八列產生。兵只能前進一步，不使用吃過路兵或起始兩步，且只可在對方原始中央八格主棋列升變。'
        }
    }
};

const DEFAULT_VARIANT = 'cube';
const STORAGE_KEY = '3dchess:selectedVariant';

function normalizeVariant(value) {
    return value === 's2' ? 'sphere' : value;
}

export class ChessGame {
    constructor() {
        this.variant = this.resolveVariant();
        this.activeGame = null;

        this.prepareVariantControls();
        this.installLanguageSwitch();
        this.activeGame = new VARIANTS[this.variant].controller();
        this.applyVariantText();
        this.installBoardGameSwitch();
        this.syncVariantLock();
        this.variantLockTimer = window.setInterval(() => this.syncVariantLock(), 400);
    }

    resolveVariant() {
        const params = new URLSearchParams(window.location.search);
        const fromUrl = normalizeVariant(params.get('variant') || params.get('game') || '');
        if (this.isVariant(fromUrl)) {
            window.localStorage.setItem(STORAGE_KEY, fromUrl);
            return fromUrl;
        }

        const stored = normalizeVariant(window.localStorage.getItem(STORAGE_KEY) || '');
        return this.isVariant(stored) ? stored : DEFAULT_VARIANT;
    }

    isVariant(value) {
        return Object.prototype.hasOwnProperty.call(VARIANTS, normalizeVariant(value));
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
                const sharedCubeOption = ['forbidden', 'periodic', 'random', 'reflection'].includes(option.value);
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
            const nextVariant = normalizeVariant(boardGameSelect.value);
            this.switchVariant(nextVariant);
            if (nextVariant !== this.variant) boardGameSelect.value = this.variant;
        });
    }

    installLanguageSwitch() {
        document.querySelectorAll('[data-lang-option]').forEach((button) => {
            button.addEventListener('click', () => setLanguage(button.dataset.langOption));
        });

        window.addEventListener('languagechange', () => {
            this.applyVariantText();
            this.activeGame?.updateBoundaryInfo?.();
            this.activeGame?.renderPromotionButtons?.();
            this.activeGame?.network?.refreshStatus?.();
            this.activeGame?.updateTimerDisplay?.();
            this.activeGame?.updateUI?.();
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

    variantText(variant, key) {
        return variant.zh && I18N.current === 'zh' ? variant.zh[key] || variant[key] : variant[key];
    }

    applyVariantText() {
        const variant = VARIANTS[this.variant];
        document.title = this.variantText(variant, 'title');

        const heading = document.querySelector('.top-bar h1');
        const tagline = document.querySelector('.top-bar p');
        const canvas = document.getElementById('gameCanvas');
        const rulesTitle = document.querySelector('.panel:last-of-type h3');
        const rulesText = document.querySelector('.rules-text');

        if (heading) heading.textContent = this.variantText(variant, 'title');
        if (tagline) tagline.textContent = this.variantText(variant, 'tagline');
        if (canvas) canvas.setAttribute('aria-label', this.variantText(variant, 'canvasLabel'));
        if (rulesTitle) rulesTitle.textContent = this.variantText(variant, 'rulesTitle');
        if (rulesText) rulesText.textContent = this.variantText(variant, 'rulesText');

        this.prepareVariantControls();
    }

    switchVariant(nextVariant) {
        nextVariant = normalizeVariant(nextVariant);
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

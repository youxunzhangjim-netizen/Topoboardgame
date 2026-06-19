import { CubeChessGame } from './CubeChessGame.js';
import { KleinBottleChessGame } from './KleinBottleChessGame.js';
import { MobiusChessGame } from './MobiusChessGame.js';
import { RP2ChessGame } from './RP2ChessGame.js';
import { SphereChessGame } from './SphereChessGame.js';
import { TorusChessGame } from './TorusChessGame.js';
import { I18N, setLanguage } from './i18n.js';
import { selectedBoardThemeIndex, setBoardThemeIndex } from './BoardAppearance.js';

const VARIANTS = {
    torus: {
        label: 'T2',
        title: 'T2 Torus Chess',
        tagline: '2D chess on a longer 3D torus: 8 cells around the short side and a 14-row route through the extended direction.',
        canvasLabel: '3D torus chess board',
        rulesTitle: 'Torus Rules',
        rulesText: 'Rooks, bishops, queens, knights, kings, castling, check, and mate use 2D chess movement on 112 torus blocks. The board is 8 columns by 14 periodic rows, with the six extra blank rows placed between the initial armies so the king rows start opposite each other. Pawns move one step only, cannot double-step or use en passant, and promote when they reach the opponent home row.',
        boundaryValue: 'periodic',
        controller: TorusChessGame,
        zh: {
                  "title": "T2 環面棋",
                  "tagline": "在加長三維環面上的二維國際象棋：短方向 8 格，長方向 14 行。",
                  "canvasLabel": "三維環面棋盤",
                  "rulesTitle": "環面規則",
                  "rulesText": "車、象、后、馬、王、易位、將軍與將死都使用 112 個環面格上的二維國際象棋走法。棋盤為 8 列 x 14 個週期行，雙方初始陣之間有六行空格。兵只能前進一步，不使用起始兩步或吃過路兵，到達對方底線時升變。"
        }
    },
    cube: {
        label: 'R3',
        title: 'R3 3D Chess',
        tagline: 'Local and online cubic chess with full 3D movement.',
        canvasLabel: '3D chess board',
        rulesTitle: '3D Movement',
        rulesText: "Rook: axes. Bishop: plane and body diagonals. Queen: all straight 3D lines. Knight: 2-1 jumps on any plane. King: one cell in any direction except true cube-corner steps on the R3 and T3 PBC boards. Pawn: forward on X, Y, or Z, captures forward diagonals, and promotes only on the opponent's Y or Z home face inside the bottom three rows.",
        boundaryValue: 'forbidden',
        controller: CubeChessGame,
        zh: {
                  "title": "R3 三維棋",
                  "tagline": "支援本地與線上的立方體國際象棋，使用完整三維走法。",
                  "canvasLabel": "三維棋盤",
                  "rulesTitle": "三維走法",
                  "rulesText": "車沿座標軸走，象沿平面與空間對角線走，后可走所有三維直線，馬在任意平面跳 2-1；R3 與 T3 週期棋盤的王可走一格，但不能走真正的立方體角落方向。兵沿 X、Y 或 Z 前進並斜向吃子。"
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
        label: 'Cyl',
        title: 'Cylinder Chess',
        tagline: '2D chess on a cylinder: files wrap around the circumference while the top and bottom stay open.',
        canvasLabel: '3D cylinder chess board',
        rulesTitle: 'Cylinder Rules',
        rulesText: 'Cylinder chess uses 16 files around the circumference and 14 playable ranks along the open height. Moving left or right wraps around the cylinder; moving past the top or bottom edge is illegal. Each army has four extra side-support pawns. Pawns promote only by entering the opponent\'s original 8-piece king-row block.',
        boundaryValue: 'sphere',
        controller: SphereChessGame,
        urlValue: 'cylinder',
        zh: {
            title: '圓柱棋',
            tagline: '在圓柱面上進行二維西洋棋：左右沿圓周週期連接，上下邊界保持開放。',
            canvasLabel: '三維圓柱棋盤',
            rulesTitle: '圓柱規則',
            rulesText: '圓柱棋使用 16 個沿圓周排列的檔與 14 個可走的高度列。左右移動會繞回圓柱另一側；超出上方或下方邊界的走法不合法。每方增加四枚側翼支援兵，兵只有進入對手原始八枚主棋所在列時才能升變。'
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
    return value === 's2' || value === 'cylinder' ? 'sphere' : value;
}

export class ChessGame {
    constructor() {
        this.variant = this.resolveVariant();
        this.activeGame = null;
        this.focusOwnPieces = false;

        this.prepareVariantControls();
        this.installLanguageSwitch();
        this.activeGame = new VARIANTS[this.variant].controller();
        this.applyVariantText();
        this.installBoardGameSwitch();
        this.installBoardAppearanceControl();
        this.installPieceFocusControl();
        this.installR3SliceControl();
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
        if (timerSelect) timerSelect.value = '0';
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

    installBoardAppearanceControl() {
        const select = document.getElementById('boardAppearanceSelect');
        if (!select) return;
        select.value = String(selectedBoardThemeIndex());
        select.addEventListener('change', () => {
            setBoardThemeIndex(select.value);
            this.activeGame?.renderer?.updateBoardAppearance?.();
            this.activeGame?.renderer?.render?.();
        });
    }

    syncVariantLock() {
        if (this.focusOwnPieces) this.applyPieceFocus();
        this.updateR3SliceControlVisibility?.();
        const locked = Boolean(this.activeGame?.gameStarted && !this.activeGame?.gameOver);
        const boardGameSelect = document.getElementById('boardGameSelect');
        if (boardGameSelect) {
            boardGameSelect.value = this.variant;
            boardGameSelect.disabled = locked;
        }
    }

    installPieceFocusControl() {
        const button = document.getElementById('focusOwnPiecesBtn');
        if (!button) return;
        this.focusOwnPiecesButton = button;
        button.addEventListener('click', () => {
            this.focusOwnPieces = !this.focusOwnPieces;
            button.setAttribute('aria-pressed', String(this.focusOwnPieces));
            this.applyPieceFocus();
        });
    }


    installR3SliceControl() {
        this.r3FilterControl = document.getElementById('r3FilterControl');
        this.r3FilterInputs = {
            x: document.getElementById('r3FilterX'),
            y: document.getElementById('r3FilterY'),
            z: document.getElementById('r3FilterZ')
        };
        if (!this.r3FilterControl) return;
        const apply = () => this.applyR3SliceFilter();
        for (const input of Object.values(this.r3FilterInputs)) {
            input?.addEventListener('input', apply);
            input?.addEventListener('change', apply);
        }
        document.getElementById('cameraReset')?.addEventListener('click', () => this.clearR3SliceFilter(false));
        this.updateR3SliceControlVisibility();
        this.applyR3SliceFilter();
    }

    updateR3SliceControlVisibility() {
        if (!this.r3FilterControl) return;
        const visible = this.variant === 'cube';
        this.r3FilterControl.hidden = !visible;
        if (!visible) this.clearR3SliceFilter(false);
    }

    readR3SliceFilter() {
        const filter = {};
        for (const axis of ['x', 'y', 'z']) {
            const input = this.r3FilterInputs?.[axis];
            const text = String(input?.value || '').trim();
            if (text === '') {
                filter[axis] = null;
                continue;
            }
            const parsed = Math.floor(Number(text));
            filter[axis] = Number.isFinite(parsed) ? Math.max(0, Math.min(7, parsed)) : null;
            if (input && filter[axis] !== null && String(filter[axis]) !== text) input.value = String(filter[axis]);
        }
        return filter;
    }

    applyR3SliceFilter() {
        if (this.variant !== 'cube') return;
        this.activeGame?.renderer?.setSliceFilter?.(this.readR3SliceFilter());
    }

    clearR3SliceFilter(apply = true) {
        for (const input of Object.values(this.r3FilterInputs || {})) {
            if (input) input.value = '';
        }
        if (apply && this.variant === 'cube') this.activeGame?.renderer?.setSliceFilter?.(null);
    }

    currentFocusColor() {
        const game = this.activeGame;
        if (!game) return 'white';
        return game.gameMode === 'online' && game.myColor ? game.myColor : (game.currentPlayer || 'white');
    }

    applyPieceFocus() {
        const group = this.activeGame?.renderer?.piecesGroup;
        const focusColor = this.focusOwnPieces ? this.currentFocusColor() : null;
        this.focusOwnPiecesButton?.setAttribute('aria-pressed', String(this.focusOwnPieces));
        if (!group) return;
        group.traverse((object) => {
            const pieceColor = object.userData?.piece?.color || object.parent?.userData?.piece?.color || null;
            if (!pieceColor || !object.material) return;
            const materials = Array.isArray(object.material) ? object.material : [object.material];
            for (const material of materials) {
                if (!material) continue;
                if (material.userData.baseOpacity == null) material.userData.baseOpacity = material.opacity ?? 1;
                const baseOpacity = material.userData.baseOpacity;
                const dim = Boolean(focusColor && pieceColor !== focusColor);
                material.transparent = baseOpacity < 1 || dim;
                material.opacity = dim ? 0.5 : baseOpacity;
                material.needsUpdate = true;
            }
        });
        this.activeGame?.renderer?.renderer?.render?.(this.activeGame.renderer.scene, this.activeGame.renderer.camera);
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
        url.searchParams.set('variant', VARIANTS[nextVariant].urlValue || nextVariant);
        url.searchParams.delete('game');
        url.searchParams.delete('room');
        window.location.href = url.toString();
    }
}

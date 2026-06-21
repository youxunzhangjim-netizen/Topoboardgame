import { installGameUILocalizer } from './GameUILocalizer.js';
import './RobotLearningRecorder.js';

const GUIDE_STYLE_ID = 'topoboardgame-control-guide-style';

const GUIDES = Object.freeze({
    chess: {
        title: 'Controls',
        zhTitle: '操作指南',
        items: [
            'Choose Local, Online, or Robot before starting a game. Online shows room and matchmaking controls.',
            'Click one of your pieces, then click a highlighted destination to move. Captures, check, promotion, and special topology rules are judged by the board.',
            'On 3D or 4D views, drag or one-finger drag to rotate, pinch or use the wheel/zoom slider to zoom, and use layer/focus controls to inspect hidden pieces.',
            'When Time schedule is enabled, click the piece and target, then choose the acting time for that scheduled move.'
        ],
        zhItems: [
            '開局前先選 Local、Online 或 Robot。選 Online 時會顯示房間與配對控制。',
            '點自己的棋子，再點亮起的目標格移動。吃子、將軍、升變與拓撲規則都由棋盤判定。',
            '在 3D 或 4D 視圖中可拖曳或單指拖曳旋轉，雙指縮放或用滾輪/縮放控制放大縮小，並用層/聚焦控制查看被遮住的棋子。',
            '啟用 Time schedule 時，先點棋子與目標，再選這步實際作用的時間。'
        ]
    },
    go: {
        title: 'Controls',
        zhTitle: '操作指南',
        items: [
            'Choose Local, Online, or Robot first. Online room controls appear only for online play.',
            'Click an empty legal site to place a stone. Use Pass when you do not want to play.',
            'After both players pass, use Agree Count to finish scoring when both sides accept the count.',
            'On 3D or 4D boards, drag or one-finger drag to rotate, pinch or use the wheel/slider to zoom, and use layer/focus filters to inspect coordinates.'
        ],
        zhItems: [
            '先選 Local、Online 或 Robot。只有 Online 對局會顯示連線房間控制。',
            '點合法的空點落子。不想落子時用 Pass。',
            '雙方都 Pass 後，雙方同意時按 Agree Count 完成數目。',
            '在 3D 或 4D 棋盤中可拖曳或單指拖曳旋轉、雙指縮放或用滾輪/滑桿縮放，並用層/聚焦篩選查看座標。'
        ]
    },
    reversi: {
        title: 'Controls',
        zhTitle: '操作指南',
        items: [
            'Choose Local, Online, or Robot before the new game. Online controls appear only when Online is selected.',
            'Click a highlighted legal empty site to place a disc. Bracketed opponent chains flip immediately.',
            'Use New Game to rebuild the board after changing topology, lattice, size, or variant settings.',
            'On 3D or 4D boards, drag or one-finger drag to rotate, pinch or use the wheel/slider to zoom, and use layer controls to inspect slices.'
        ],
        zhItems: [
            '新局前先選 Local、Online 或 Robot。只有選 Online 時會顯示連線控制。',
            '點亮起的合法空位落子，被夾住的對手棋鏈會立即翻轉。',
            '改變拓撲、晶格、尺寸或變體設定後，用 New Game 重建棋盤。',
            '在 3D 或 4D 棋盤中可拖曳或單指拖曳旋轉、雙指縮放或用滾輪/滑桿縮放，並用層控制查看切片。'
        ]
    },
    jump: {
        title: 'Controls',
        zhTitle: '操作指南',
        items: [
            'Choose Local, Online, or Robot before starting. Online room controls appear only for online Jump.',
            'Click one of your pieces, then click a highlighted step or jump target. After a jump chain starts, click the same piece or Stop Jump to end the turn there.',
            'Focus Own lists your movable pieces and their coordinates. Selecting one highlights its available moves.',
            'For 3D and 4D Jump, drag or one-finger drag to rotate, pinch or use the wheel/slider to zoom, and use layer/coordinate filters to inspect the board.',
            'When Time schedule is enabled, choose the piece or site, select a legal action, and set the acting time from instant to the configured maximum.'
        ],
        zhItems: [
            '開始前先選 Local、Online 或 Robot。只有 Online 跳棋會顯示房間連線控制。',
            '點自己的棋子，再點亮起的步行或跳躍目標。連跳開始後，可再點同一枚棋子或 Stop Jump 在該處停下並結束回合。',
            'Focus Own 會列出可動己方棋子與座標；選一枚會顯示可走位置。',
            '3D 與 4D 跳棋可拖曳或單指拖曳旋轉、雙指縮放或用滾輪/滑桿縮放，並用層/座標篩選查看棋盤。',
            '啟用 Time schedule 時，點棋子或位置，選合法動作，再把作用時間設為 instant 到最大時間之間。'
        ]
    },
    life: {
        title: 'Controls',
        zhTitle: '操作指南',
        items: [
            'Use Draw, Erase, and Inspect to edit the board. Click or drag cells; zoom in when you need to edit the smallest blocks.',
            'Use Start, Step, Reset, and Random seed to run or rebuild the world. Grid On/Off changes only the guide grid view.',
            'Choose zero-player, one-player, or two-player mode. In two-player mode, choose Local, Online, or Robot; online room controls appear only for Online.',
            'Advanced settings change topology, lattice, dimension, rule preset, noise, mutation, and age before or during exploration.'
        ],
        zhItems: [
            '用 Draw、Erase、Inspect 編輯棋盤。可點擊或拖曳細胞；需要畫最小格時可放大。',
            '用 Start、Step、Reset、Random seed 運行或重建世界。Grid On/Off 只切換輔助格線。',
            '選 zero-player、one-player 或 two-player。two-player 中再選 Local、Online 或 Robot；只有 Online 會顯示房間控制。',
            'Advanced settings 可調整拓撲、晶格、維度、規則、噪聲、突變與年齡。'
        ]
    },
    labs: {
        title: 'Controls',
        zhTitle: '操作指南',
        items: [
            'Choose the lab, topology, lattice, size, and physical problem first, then press New Game when a structural setting changes.',
            'Click board sites or 3D vertices to place, move, measure, braid, flip, or edit the selected excitation/operator. When a site palette appears, choose the local action there.',
            'Use the action selectors for Clifford, Anyon, CFT, spin, gauge, cluster, and time-evolution controls. Logs and move history are below the game controls.',
            'For custom Pauli recovery, choose Custom Setup, click sites to set I/X/Y/Z and sign, then press Start to begin recovery from that designed board.',
            'On 3D boards, drag or one-finger drag to rotate, pinch or wheel to zoom, and use coordinate/layer filters to avoid clicking through dense boards.'
        ],
        zhItems: [
            '先選 Lab、拓撲、晶格、尺寸與物理問題；改變結構設定後按 New Game。',
            '點棋盤位置或 3D 頂點來放置、移動、測量、編織、翻轉或編輯選定的激發/算符。出現位置選單時，就在該處選局部動作。',
            '用各 action selector 控制 Clifford、Anyon、CFT、自旋、規範、團簇與時間演化。Logs 與 Move History 位在 Game Controls 下方。',
            '自訂 Pauli recovery 時，選 Custom Setup，點位置設定 I/X/Y/Z 與正負號，再按 Start 從設計好的初態開始 recovery。',
            '3D 棋盤可拖曳或單指拖曳旋轉、雙指縮放或滾輪縮放，並用座標/層篩選避免在密集棋盤中點穿。'
        ]
    }
});

function detectGuideType() {
    const path = window.location.pathname.toLowerCase();
    if (path.includes('/jump/')) return 'jump';
    if (path.includes('/life/')) return 'life';
    if (path.includes('/algebraic')) return 'labs';
    if (path.includes('chess')) return 'chess';
    if (path.includes('reversi')) return 'reversi';
    if (path.includes('go')) return 'go';
    return 'labs';
}

function pageLanguage() {
    const saved = localStorage.getItem('topoboardgame-language')
        || localStorage.getItem('topoboardgame.lang')
        || localStorage.getItem('life-language')
        || '';
    const lang = saved || document.documentElement.lang || navigator.language || 'en';
    return String(lang).toLowerCase().startsWith('zh') ? 'zh' : 'en';
}

function installStyles() {
    if (document.getElementById(GUIDE_STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = GUIDE_STYLE_ID;
    style.textContent = `
.game-control-guide {
  margin-top: 14px;
  padding: 14px 16px;
  border: 1px solid rgba(148, 163, 184, 0.28);
  border-radius: 8px;
  background: rgba(15, 23, 42, 0.52);
  color: inherit;
}
.game-control-guide h3 {
  margin: 0 0 8px;
  font-size: 1rem;
  letter-spacing: 0;
}
.game-control-guide ul {
  margin: 0;
  padding-left: 1.15rem;
}
.game-control-guide li {
  margin: 0.35rem 0;
  line-height: 1.45;
}
`;
    document.head.append(style);
}

function createGuide(type) {
    const guide = GUIDES[type] || GUIDES.labs;
    const lang = pageLanguage();
    const section = document.createElement('section');
    section.className = 'game-control-guide';
    section.dataset.controlGuide = type;
    const title = document.createElement('h3');
    title.textContent = lang === 'zh' ? guide.zhTitle : guide.title;
    const list = document.createElement('ul');
    for (const text of (lang === 'zh' ? guide.zhItems : guide.items)) {
        const item = document.createElement('li');
        item.textContent = text;
        list.append(item);
    }
    section.append(title, list);
    return section;
}

function targetForGuide(type) {
    if (type === 'labs') return document.querySelector('#rulesIntroPanel .rules-intro-content');
    if (type === 'jump') return document.querySelector('#jumpInfo')?.closest('section');
    if (type === 'life') {
        return document.querySelector('.life-play-invite')
            || document.querySelector('.life-hero')
            || document.querySelector('#lifeInfoDialog article');
    }
    const rulesText = document.querySelector('.rules-text');
    if (rulesText) return rulesText.parentElement || rulesText;
    return document.querySelector('main') || document.body;
}

export function installGameControlGuide() {
    installGameUILocalizer();
    if (document.querySelector('.game-control-guide[data-control-guide]')) return;
    const type = detectGuideType();
    const target = targetForGuide(type);
    if (!target) return;
    installStyles();
    target.append(createGuide(type));
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', installGameControlGuide, { once: true });
} else {
    installGameControlGuide();
}

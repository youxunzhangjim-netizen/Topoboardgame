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

const GAME_GUIDE_BOOKS = Object.freeze({
    chess: {
        title: 'Game Guide Book',
        zhTitle: '遊戲指南書',
        subtitle: 'Chess: basic play, piece movement, rules, and win conditions',
        zhSubtitle: 'Chess：基本玩法、棋子走法、規則與勝利條件',
        sections: [
            {
                heading: 'Basic play',
                zhHeading: '基本玩法',
                items: [
                    'Two players take turns moving one piece of their own color. White normally moves first.',
                    'A move must follow that piece movement rule and must leave your own king safe from check.',
                    'Topological, 3D, 4D, and spacetime boards change which squares or sites are connected, but the selected board still judges legal movement, check, capture, and promotion.'
                ],
                zhItems: [
                    '兩位玩家輪流移動自己顏色的一枚棋子。通常由白方先行。',
                    '每一步必須符合該棋子的走法，並且不能讓自己的王處在被將軍的位置。',
                    '拓撲、3D、4D 與時空棋盤會改變格點的連接方式；合法走法、將軍、吃子與升變仍由當前棋盤判定。'
                ]
            },
            {
                heading: 'How the pieces move',
                zhHeading: '棋子怎麼走',
                items: [
                    'King: one step in any connected direction. The king may never move into check.',
                    'Queen: any distance along a connected straight or diagonal line until blocked.',
                    'Rook: any distance along a connected rank, file, layer, or straight board direction until blocked.',
                    'Bishop: any distance along a connected diagonal direction until blocked.',
                    'Knight: an L-shaped jump. It may jump over occupied pieces; only the destination matters.',
                    'Pawn: moves forward into an empty site, captures one forward-diagonal site, promotes at the far target rank or zone, and uses special pawn rules only when that mode enables them.'
                ],
                zhItems: [
                    'King：沿任意相連方向走一步。King 不能走到會被將軍的位置。',
                    'Queen：沿相連的直線或斜線方向走任意距離，直到被棋子阻擋。',
                    'Rook：沿相連的橫、直、層或直線棋盤方向走任意距離，直到被阻擋。',
                    'Bishop：沿相連的斜線方向走任意距離，直到被阻擋。',
                    'Knight：走 L 形跳躍。可以跳過中間棋子，只看終點是否合法。',
                    'Pawn：向前走到空位，向前斜方吃子，到達最遠目標線或目標區時升變；雙步、王車易位相關限制等特殊規則只在該模式啟用時使用。'
                ]
            },
            {
                heading: 'Rules and winning',
                zhHeading: '規則與勝利條件',
                items: [
                    'Capture by moving onto an opponent piece, except pawns capture diagonally.',
                    'Check means the king is under attack. If your king is in check, the next move must remove that check.',
                    'Checkmate wins immediately: the opponent king is in check and has no legal escape.',
                    'A game can draw by stalemate, repeated position, no legal progress, agreement, or any draw rule enabled by the current mode.'
                ],
                zhItems: [
                    '除 Pawn 斜吃外，棋子走到對方棋子所在位置即可吃掉該棋子。',
                    '將軍表示 King 正被攻擊。若自己的 King 被將軍，下一步必須解除將軍。',
                    '將死立即獲勝：對方 King 被將軍，且沒有任何合法方式逃脫。',
                    '和局可能來自逼和、局面重複、無法推進、雙方同意，或目前模式啟用的其他和局規則。'
                ]
            },
            {
                heading: 'Controls',
                zhHeading: '操作',
                items: [
                    'Choose Local, Online, or Robot before starting. Click one of your pieces, then click a highlighted destination.',
                    'On 3D or 4D boards, drag to rotate, pinch or use the wheel or zoom slider to zoom, and use layer or focus controls to inspect hidden pieces.',
                    'When Time schedule is enabled, choose the piece and destination, then choose when that move acts.'
                ],
                zhItems: [
                    '開局前先選 Local、Online 或 Robot。點自己的棋子，再點亮起的目的地。',
                    '在 3D 或 4D 棋盤中，可拖曳旋轉、用雙指或滾輪或縮放滑桿縮放，並用層或聚焦控制查看被遮住的棋子。',
                    '啟用 Time schedule 時，先選棋子與目的地，再選這步實際作用的時間。'
                ]
            }
        ]
    },
    go: {
        title: 'Game Guide Book',
        zhTitle: '遊戲指南書',
        subtitle: 'Go: liberties, capture, ko, scoring, and win conditions',
        zhSubtitle: 'Go：氣、吃子、ko、計分與勝利條件',
        sections: [
            {
                heading: 'Basic play',
                zhHeading: '基本玩法',
                items: [
                    'Two players take turns placing one stone on an empty legal point. Black normally moves first.',
                    'A stone does not move after placement. Stones connect into a group through adjacent connected points.',
                    'Topological, 3D, 4D, and spacetime boards change adjacency; the current board decides which stones share liberties.'
                ],
                zhItems: [
                    '兩位玩家輪流在合法空點落一子。通常由黑方先行。',
                    '棋子落下後不再移動。相鄰連接點上的同色棋子形成一個棋串。',
                    '拓撲、3D、4D 與時空棋盤會改變相鄰關係；哪些棋串共享氣由目前棋盤決定。'
                ]
            },
            {
                heading: 'Liberties and capture',
                zhHeading: '氣與吃子',
                items: [
                    'A liberty is an empty point adjacent to a stone or group.',
                    'When a group has no liberties after a move, that group is captured and removed.',
                    'You may not play a suicide move unless it captures opposing stones and leaves your new group with liberties.',
                    'Ko or superko rules prevent repeating a previous board position when that rule is enabled.'
                ],
                zhItems: [
                    '氣是棋子或棋串相鄰的空點。',
                    '一步落下後，若某個棋串沒有氣，該棋串會被吃掉並移出棋盤。',
                    '不能下自殺手，除非該手同時吃掉對方棋子，讓新形成的己方棋串重新有氣。',
                    'ko 或 superko 規則會在啟用時禁止重複先前局面。'
                ]
            },
            {
                heading: 'Passing, scoring, and winning',
                zhHeading: '停手、計分與勝利',
                items: [
                    'Use Pass when you have no useful move or want to end the game.',
                    'After both players pass, use Agree Count when both sides accept the dead stones and territory count.',
                    'Area scoring counts your stones plus the empty territory you surround, with komi added when the mode uses komi.',
                    'The player with the higher final score wins.'
                ],
                zhItems: [
                    '沒有好手或想結束棋局時可用 Pass。',
                    '雙方都 Pass 後，若雙方同意死子與地的計算，就用 Agree Count 完成數目。',
                    '面積計分會計算己方棋子加上圍住的空地；模式使用 komi 時會加入貼目。',
                    '最終分數較高的一方獲勝。'
                ]
            },
            {
                heading: 'Controls',
                zhHeading: '操作',
                items: [
                    'Choose Local, Online, or Robot first. Click an empty legal point to place a stone.',
                    'On 3D or 4D boards, drag to rotate, pinch or use the wheel or slider to zoom, and use layer or focus filters to inspect coordinates.'
                ],
                zhItems: [
                    '先選 Local、Online 或 Robot。點合法空點即可落子。',
                    '在 3D 或 4D 棋盤中，可拖曳旋轉、用雙指或滾輪或滑桿縮放，並用層或聚焦篩選查看座標。'
                ]
            }
        ]
    },
    reversi: {
        title: 'Game Guide Book',
        zhTitle: '遊戲指南書',
        subtitle: 'Reversi: legal placement, flipping lines, passing, and win conditions',
        zhSubtitle: 'Reversi：合法落子、翻轉線、停手與勝利條件',
        sections: [
            {
                heading: 'Basic play',
                zhHeading: '基本玩法',
                items: [
                    'Two players take turns placing one disc of their color on an empty legal site.',
                    'Discs do not move after placement. Instead, legal moves flip opponent discs.',
                    'A legal move must bracket one or more opponent discs between the new disc and another disc of your color along a connected board line.'
                ],
                zhItems: [
                    '兩位玩家輪流在合法空位放下一枚自己的圓片。',
                    '圓片放下後不再移動；合法落子會翻轉對方圓片。',
                    '合法落子必須沿相連棋盤線，把一枚或多枚對方圓片夾在新圓片與另一枚己方圓片之間。'
                ]
            },
            {
                heading: 'Flipping and movement',
                zhHeading: '翻轉與走法',
                items: [
                    'After placement, every bracketed opponent chain in every legal direction flips to your color.',
                    'Straight, diagonal, layer, and topology-wrapped rays are available only when the current board geometry connects those sites.',
                    'If you have no legal move, you pass. If you do have a legal move, you must play one.'
                ],
                zhItems: [
                    '落子後，所有合法方向中被夾住的對方棋鏈都會翻成你的顏色。',
                    '直線、斜線、層方向與拓撲包裹方向，只有在目前棋盤幾何連接那些位置時才可用。',
                    '若你沒有合法步，必須停手。若有合法步，必須下一步。'
                ]
            },
            {
                heading: 'Game end and winning',
                zhHeading: '終局與勝利',
                items: [
                    'The game ends when the board is full or neither player has a legal move.',
                    'Count discs of each color. The player with more discs wins.',
                    'A tie is possible when both players finish with the same number of discs.'
                ],
                zhItems: [
                    '棋盤填滿，或雙方都沒有合法步時，棋局結束。',
                    '計算雙方顏色的圓片數。圓片較多的一方獲勝。',
                    '若雙方圓片數相同，棋局為平手。'
                ]
            },
            {
                heading: 'Controls',
                zhHeading: '操作',
                items: [
                    'Choose Local, Online, or Robot before the new game. Click a highlighted legal empty site to place a disc.',
                    'Use New Game after changing topology, lattice, size, or variant settings.',
                    'On 3D or 4D boards, drag to rotate, pinch or use the wheel or slider to zoom, and use layer controls to inspect slices.'
                ],
                zhItems: [
                    '新局前先選 Local、Online 或 Robot。點亮起的合法空位即可落子。',
                    '改變拓撲、晶格、尺寸或變體設定後，用 New Game 重建棋盤。',
                    '在 3D 或 4D 棋盤中，可拖曳旋轉、用雙指或滾輪或滑桿縮放，並用層控制查看切片。'
                ]
            }
        ]
    },
    jump: {
        title: 'Game Guide Book',
        zhTitle: '遊戲指南書',
        subtitle: 'Chinese Checkers: step moves, chain jumps, targets, and win conditions',
        zhSubtitle: '中國跳棋：一步移動、連跳、目標區與勝利條件',
        sections: [
            {
                heading: 'Basic play',
                zhHeading: '基本玩法',
                items: [
                    'Chinese Checkers is a race game. Move your pieces from your home zone toward the opposite target zone.',
                    'Players take turns moving one piece. The selected topology decides which sites are adjacent and which target zone belongs to each player.',
                    'Pieces are not captured in Chinese Checkers; occupied pieces become bridges that other pieces can jump over.'
                ],
                zhItems: [
                    '中國跳棋是競速遊戲。把自己的棋子從起始區移向對面的目標區。',
                    '玩家輪流移動一枚棋子。相鄰點與每位玩家的目標區由目前選擇的拓撲決定。',
                    '中國跳棋不吃子；已佔位置會成為其他棋子可跳過的橋。'
                ]
            },
            {
                heading: 'How pieces move',
                zhHeading: '棋子怎麼走',
                items: [
                    'Step: move one piece to an adjacent empty site.',
                    'Jump: jump over one occupied adjacent site and land on the empty site directly beyond it along the same connected line.',
                    'Chain jump: after a jump, the same piece may keep jumping through additional legal jump targets.',
                    'A piece may not land on an occupied site. Ending a chain jump ends that player turn.'
                ],
                zhItems: [
                    '一步移動：把一枚棋子移到相鄰空點。',
                    '跳躍：跳過一個相鄰已佔點，落到同一條相連線後方的空點。',
                    '連跳：一次跳躍後，同一枚棋子可以繼續跳到其他合法跳躍目標。',
                    '棋子不能落在已佔點。結束連跳時，該玩家回合結束。'
                ]
            },
            {
                heading: 'Winning',
                zhHeading: '勝利條件',
                items: [
                    'The usual goal is to be the first player to occupy or fill the opposite target zone with your pieces.',
                    'Some topology, team, spacetime, or timed variants may compare target progress or scheduled arrival according to the mode settings.',
                    'Use the target markers and Focus Own list to check which pieces still need to advance.'
                ],
                zhItems: [
                    '通常目標是最先用自己的棋子佔住或填滿對面的目標區。',
                    '某些拓撲、隊伍、時空或計時變體，會依模式設定比較目標推進度或排程到達時間。',
                    '可用目標標記與 Focus Own 清單確認哪些棋子還需要前進。'
                ]
            },
            {
                heading: 'Controls',
                zhHeading: '操作',
                items: [
                    'Choose Local, Online, or Robot before starting. Click one of your pieces, then click a highlighted step or jump target.',
                    'After a jump chain starts, click the same piece or Stop Jump to end the turn there.',
                    'For 3D and 4D Chinese Checkers, drag to rotate, pinch or use the wheel or slider to zoom, and use layer or coordinate filters to inspect the board.',
                    'When Time schedule is enabled, choose the piece or site, select a legal action, and set the acting time.'
                ],
                zhItems: [
                    '開始前先選 Local、Online 或 Robot。點自己的棋子，再點亮起的一步移動或跳躍目標。',
                    '連跳開始後，可再點同一枚棋子或 Stop Jump，在該處停止並結束回合。',
                    '3D 與 4D 中國跳棋可拖曳旋轉、用雙指或滾輪或滑桿縮放，並用層或座標篩選查看棋盤。',
                    '啟用 Time schedule 時，選棋子或位置，選合法動作，再設定作用時間。'
                ]
            }
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
    const saved = localStorage.getItem('topological-boardgame:language')
        || localStorage.getItem('topoboardgame-language')
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
.game-guide-subtitle {
  margin: -2px 0 10px;
  color: rgba(226, 232, 240, 0.78);
  font-size: 0.9rem;
  line-height: 1.4;
}
.game-guide-section {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid rgba(148, 163, 184, 0.18);
}
.game-guide-section summary {
  cursor: pointer;
  font-weight: 800;
  line-height: 1.35;
}
.game-guide-section summary:focus-visible {
  outline: 2px solid rgba(125, 211, 252, 0.82);
  outline-offset: 3px;
  border-radius: 4px;
}
.game-control-guide ul {
  margin: 8px 0 0;
  padding-left: 1.15rem;
}
.game-control-guide li {
  margin: 0.35rem 0;
  line-height: 1.45;
}
@media (max-width: 640px) {
  .game-control-guide {
    padding: 12px 13px;
  }
  .game-guide-subtitle {
    font-size: 0.86rem;
  }
}
`;
    document.head.append(style);
}

function createGuide(type) {
    const guide = GAME_GUIDE_BOOKS[type] || GUIDES[type] || GUIDES.labs;
    const lang = pageLanguage();
    const section = document.createElement('section');
    section.className = `game-control-guide${guide.sections ? ' game-guide-book' : ''}`;
    section.dataset.controlGuide = type;
    section.dataset.noLocalize = 'true';
    const title = document.createElement('h3');
    title.textContent = lang === 'zh' ? guide.zhTitle : guide.title;
    section.append(title);

    const subtitleText = lang === 'zh' ? guide.zhSubtitle : guide.subtitle;
    if (subtitleText) {
        const subtitle = document.createElement('p');
        subtitle.className = 'game-guide-subtitle';
        subtitle.textContent = subtitleText;
        section.append(subtitle);
    }

    if (Array.isArray(guide.sections)) {
        for (const guideSection of guide.sections) {
            const details = document.createElement('details');
            details.className = 'game-guide-section';
            details.open = true;
            const summary = document.createElement('summary');
            summary.textContent = lang === 'zh'
                ? (guideSection.zhHeading || guideSection.heading)
                : guideSection.heading;
            const list = document.createElement('ul');
            const items = lang === 'zh'
                ? (guideSection.zhItems || guideSection.items || [])
                : (guideSection.items || []);
            for (const text of items) {
                const item = document.createElement('li');
                item.textContent = String(text);
                list.append(item);
            }
            details.append(summary, list);
            section.append(details);
        }
    } else {
        const list = document.createElement('ul');
        for (const text of (lang === 'zh' ? guide.zhItems : guide.items)) {
            const item = document.createElement('li');
            item.textContent = guideText(text, lang);
            list.append(item);
        }
        section.append(list);
    }
    return section;
}

function guideText(text, lang) {
    if (lang !== 'zh') return text;
    return text
        .replace(/\bLocal\b/g, '本機')
        .replace(/\bOnline\b/g, '線上')
        .replace(/\bRobot\b/g, '機器人')
        .replace(/\bPass\b/g, '停手')
        .replace(/\bAgree Count\b/g, '同意計分')
        .replace(/\bTime schedule\b/g, '時間排程')
        .replace(/\bStop Jump\b/g, '停止連跳')
        .replace(/\bFocus Own\b/g, '聚焦己方')
        .replace(/\bNew Game\b/g, '新局')
        .replace(/\bDraw\b/g, '繪製')
        .replace(/\bErase\b/g, '擦除')
        .replace(/\bInspect\b/g, '檢查')
        .replace(/\bStart\b/g, '開始')
        .replace(/\bStep\b/g, '單步')
        .replace(/\bReset\b/g, '重設')
        .replace(/\bRandom seed\b/g, '隨機種子')
        .replace(/\bGrid On\/Off\b/g, '格線開關')
        .replace(/\bAdvanced settings\b/g, '進階設定')
        .replace(/\bGame Controls\b/g, '遊戲控制')
        .replace(/\bMove History\b/g, '走法記錄')
        .replace(/\bLogs\b/g, '紀錄')
        .replace(/\bCustom Setup\b/g, '自訂初態')
        .replace(/\bStart\b/g, '開始')
        .replace(/\binstant\b/g, '立即');
}

function targetForGuide(type) {
    if (type === 'labs') return null;
    if (type === 'jump') return document.querySelector('#jumpInfo')?.closest('section');
    if (type === 'life') {
        return document.querySelector('.life-play-invite')
            || document.querySelector('.life-hero')
            || document.querySelector('#lifeInfoDialog article');
    }
    const rulesText = document.querySelector('.rules-text');
    if (rulesText) return rulesText.parentElement || rulesText;
    const sidebar = document.querySelector('.sidebar, aside.sidebar, aside, .jump-side');
    if (sidebar) return sidebar;
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

function refreshGameControlGuide() {
    const current = document.querySelector('.game-control-guide[data-control-guide]');
    if (!current) return installGameControlGuide();
    const type = current.dataset.controlGuide || detectGuideType();
    current.replaceWith(createGuide(type));
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', installGameControlGuide, { once: true });
} else {
    installGameControlGuide();
}

window.addEventListener('languagechange', refreshGameControlGuide);

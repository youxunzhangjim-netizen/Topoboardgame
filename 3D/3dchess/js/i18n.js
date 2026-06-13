const DEFAULT_LANGUAGE = 'en';

const DICTIONARY = {
    en: {
        language: {
            label: 'Language',
            english: 'English',
            chinese: 'Chinese'
        },
        navigation: {
            home: 'Home'
        },
        app: {
            title: 'Torus Chess',
            tagline: '2D chess on a longer 3D torus: 8 cells around the short side and a 14-row route through the extended direction.',
            canvasLabel: '3D torus chess board',
            movePickerLabel: 'Move picker'
        },
        colors: {
            white: 'White',
            black: 'Black'
        },
        pieces: {
            K: 'King',
            Q: 'Queen',
            R: 'Rook',
            B: 'Bishop',
            N: 'Knight',
            P: 'Pawn',
            piece: 'Piece'
        },
        sides: {
            kingside: 'kingside',
            queenside: 'queenside'
        },
        turn: {
            gameOver: 'Game over',
            toMove: ({ color }, lang) => `${label(lang, `colors.${color}`)} to move`
        },
        captured: {
            byWhite: 'Captured by White',
            byBlack: 'Captured by Black',
            none: 'none'
        },
        picker: {
            movablePieces: 'Movable Pieces',
            availableMoves: 'Available Moves',
            initialSummary: 'White pieces with legal moves',
            selectPiece: 'Select a piece',
            noActiveSelection: 'No active selection',
            destinationsOnTurn: 'Destinations appear on your turn.',
            selectPieceDestinations: 'Select a movable piece to list destinations.',
            gameOver: 'Game over',
            connectOnline: 'Connect online to move',
            waitingForColor: ({ color }, lang) => `Waiting for ${label(lang, `colors.${color}`)}`,
            movableSummary: ({ color, count }, lang) => `${label(lang, `colors.${color}`)} has ${count} movable piece${count === 1 ? '' : 's'}`,
            noMovable: 'No movable pieces.',
            selectedSummary: ({ type, coord, count }, lang) => `${label(lang, `pieces.${type}`)} ${coord} -> ${count} destination${count === 1 ? '' : 's'}`,
            noDestinations: 'This piece has no legal destinations.',
            castleMove: ({ side }) => `castle ${side === 'kingside' ? 'K' : 'Q'}`
        },
        controls: {
            title: 'Game Controls',
            gameMode: 'Game Mode',
            local: 'Local Pass and Play',
            online: 'Online Multiplayer',
            boardGame: 'Board Game',
            boundary: 'Boundary Condition',
            topology: 'Topology',
            timer: 'Timer per Player',
            resetCamera: 'Reset Camera',
            newGame: 'New Game',
            offerDraw: 'Offer Draw',
            surrender: 'Surrender'
        },
        online: {
            localStatus: 'Local pass and play',
            selectedStatus: 'Online mode selected.',
            youAre: ({ color }, lang) => `You are ${label(lang, `colors.${color}`)}.`,
            disconnected: 'Disconnected',
            connectingRoom: 'Creating online room...',
            roomCodeRetry: 'That room code is busy. Trying another 5-digit code...',
            roomReadyConnection: 'Room ready. Share the link with Black.',
            roomReadyGame: 'Room ready. You are White. Waiting for Black to join.',
            resumingRoom: 'Resuming the same room...',
            holdingRoom: ({ room }) => `Connection lost. Keeping room ${room || ''} open for reconnect.`,
            reconnecting: 'Reconnecting signaling...',
            enterRoom: 'Enter a room ID or shared room link.',
            joiningRoom: 'Joining room...',
            joiningAsWhite: 'Joining online room as White...',
            joiningAsBlack: 'Joining online room as Black...',
            joiningShared: 'Joining shared room...',
            joiningSharedGame: 'Joining shared online room...',
            matchmakingSearch: 'Searching shared match space...',
            matchmakingWaiting: 'Waiting in shared match space...',
            matchmakingRetry: 'That match slot is busy. Trying another...',
            matchmakingTimeout: 'No opponent answered yet. Searching another slot...',
            timeoutJoin: 'Could not open that room. Keep White on the room page and try again.',
            timeoutAccept: 'Opponent opened the room but did not finish connecting.',
            webrtcChecking: 'Finding an internet path between both players...',
            webrtcFailed: 'WebRTC could not connect these two networks. Keep White open and try another network if needed.',
            connectedWhite: 'Connected as White',
            connectedBlack: 'Connected as Black',
            opponentJoined: 'Opponent joined. Continue the same game.',
            playerRejoined: 'Opponent rejoined. Game restored.',
            connectedGame: ({ color }, lang) => `Connected. You are ${label(lang, `colors.${color}`)}.`,
            opponentDisconnected: 'Opponent disconnected',
            opponentDisconnectedGame: 'Opponent disconnected. Create or join a new room to continue online.',
            moveSyncFailed: 'Move sync failed',
            moveSyncFailedGame: 'Move sync failed. Start a new online room.',
            opponentSurrendered: 'Opponent surrendered. You win.',
            drawOfferPrompt: 'Opponent offers a draw. Accept?',
            drawDeclined: 'Draw offer declined.',
            wrongGame: 'That room is for another board game mode.',
            wrongGameMatch: 'Matched with another board mode. Searching again...',
            roomFull: 'Room already has two players',
            roomFullGame: 'That room already has two players.',
            peerUnavailable: 'Room not found. Ask White to create a new room link.',
            networkError: 'Network error. Check internet connection and try again.',
            browserIncompatible: 'This browser cannot use WebRTC online play.',
            sslUnavailable: 'Online play needs HTTPS.',
            serverError: 'Peer server error. Try creating a new room.',
            peerMissing: 'PeerJS did not load. Check your internet connection and reload the page.',
            roomCodeUnavailable: 'Could not reserve a 5-digit room code. Try Create Room again.',
            signalClosed: 'Signaling connection closed. Reload both pages and create a new room.',
            connectionError: ({ detail }) => `Connection error: ${detail || 'unknown error'}`,
            findMatch: 'Find Match',
            privateRoom: 'PRIVATE ROOM',
            createRoom: 'Create Room',
            joinRoom: 'Join Room',
            or: 'OR',
            roomInput: '5-digit room code or shared link',
            roomId: 'Room Code',
            copy: 'Copy'
        },
        chat: {
            title: 'Online Chat',
            empty: 'Connect online to chat.',
            placeholder: 'Message online opponent',
            send: 'Send',
            player: 'Player',
            connectFirst: 'Connect online before chatting.'
        },
        topology: {
            names: {
                periodic: 'T2 periodic',
                rp2: 'RP2 antipodal',
                mobius: 'Mobius twist',
                sphere: 'S2 sphere',
                klein: 'Klein bottle'
            },
            info: {
                periodic: 'T2 uses 112 playable blocks shown as an 8-cell short winding and a 14-row long direction. The six extra blank rows sit between the initial armies, and both directions wrap periodically.',
                rp2: 'RP2 uses one 12x14 fundamental board. Crossing a boundary lands on the opposite edge with the matched coordinate reversed, and the raised cage arrows show the antipodal gluing.',
                mobius: 'Mobius uses two full 8x8 surface sides. The lateral x edges are open; crossing the winding y edge reverses x and lands on the opposite side. The armies start on matching coordinates on opposite normals.',
                sphere: 'Sphere chess uses 16 longitudes and 16 latitude rows. Longitude wraps periodically. Polar cap rows stay empty, while legal movement crosses a pole to the antipodal longitude. Each army has four extra corner-support pawns. Pawns promote only on the opponent\'s original 8-piece king-row block.',
                klein: 'Klein bottle chess uses a 12x16 board with no boundary. Left and right wrap normally; crossing the top or bottom reverses x. Pawns promote only on the opponent original central 8-piece king row.'
            }
        },
        boundary: {
            names: {
                forbidden: 'Standard',
                random: '3D RBC',
                reflection: 'Reflection',
                periodic: 'T3 PBC',
                rp2: 'RP2 antipodal',
                mobius: 'Mobius twist',
                sphere: 'S2 sphere',
                klein: 'Klein bottle'
            },
            info: {
                forbidden: 'Standard: pieces cannot move outside the 8x8x8 cube.',
                random: '3D RBC: each cube-boundary exit direction maps to one fixed random boundary cell for this game.',
                reflection: 'Reflection: a move that reaches an edge bounces back into the cube.',
                periodic: 'T3 PBC: leaving one cube face wraps to the opposite face in x, y, and z.'
            }
        },
        timer: {
            noTimer: 'No Timer',
            fiveMinutes: '5 Minutes',
            tenMinutes: '10 Minutes',
            thirtyMinutes: '30 Minutes',
            oneHour: '1 Hour',
            oneDay: '1 Day'
        },
        history: {
            title: 'Move History',
            started: 'Game started.',
            castle: ({ color, side, from, to }, lang) =>
                `${label(lang, `colors.${color}`)} ${label(lang, 'pieces.K')} castles ${label(lang, `sides.${side}`)} ${from} -> ${to}`,
            move: ({ color, type, from, to, capturedType, promotionType }, lang) => {
                const capture = capturedType ? ` captures ${label(lang, `pieces.${capturedType}`)}` : '';
                const promotion = promotionType ? ` promotes to ${label(lang, `pieces.${promotionType}`)}` : '';
                return `${label(lang, `colors.${color}`)} ${label(lang, `pieces.${type}`)} ${from} -> ${to}${capture}${promotion}`;
            }
        },
        rules: {
            title: 'Torus Rules',
            text: 'Rooks, bishops, queens, knights, kings, castling, en passant, check, and mate use 2D chess movement on 112 torus blocks. The board is 8 columns by 14 periodic rows, with the six extra blank rows placed between the initial armies so the king rows start opposite each other. Pawns promote when they reach the opponent home row.'
        },
        hints: {
            label: 'Move Hints'
        },
        promotion: {
            title: 'Promote Pawn To'
        },
        status: {
            start: 'Select a white piece to begin.',
            connectBeforeMove: 'Connect to an opponent before moving online.',
            waitingForMove: ({ color }, lang) => `Waiting for ${label(lang, `colors.${color}`)} to move.`,
            selectionCleared: 'Selection cleared.',
            choosePieceFirst: 'Choose one of your pieces first.',
            turnOnly: ({ color }, lang) => `It is ${label(lang, `colors.${color}`)}'s turn.`,
            pieceSelected: ({ color, type, coord, count }, lang) =>
                `${label(lang, `colors.${color}`)} ${label(lang, `pieces.${type}`)} selected at ${coord}. ${count} legal move${count === 1 ? '' : 's'}.`,
            targetSelected: ({ coord }) => `${coord} selected. Click the same yellow destination again to move.`,
            movePlayed: ({ color }, lang) => `Move played. ${label(lang, `colors.${color}`)} to move.`,
            checkmateWin: ({ color }, lang) => `${label(lang, `colors.${color}`)} wins by checkmate.`,
            stalemate: 'Stalemate. Game drawn.',
            inCheck: ({ color }, lang) => `${label(lang, `colors.${color}`)} is in check.`,
            timeWin: ({ color }, lang) => `${label(lang, `colors.${color}`)} wins on time.`,
            newGame: 'New game started. Select a white piece.',
            roomLinkCopied: 'Room link copied.',
            resignationWin: ({ color }, lang) => `${label(lang, `colors.${color}`)} wins by resignation.`,
            drawOfferSent: 'Draw offer sent.',
            drawAgreed: 'Game drawn by agreement.',
            drawAccepted: 'Draw accepted.',
            hintsHidden: 'Move hints hidden.',
            hintsShown: 'Move hints shown.'
        },
        alerts: {
            modeLocked: 'Game mode cannot change after the game starts or after online connection.',
            boundaryLocked: 'Boundary cannot change after the game starts or after online connection.',
            topologyLocked: 'Topology cannot change after the game starts or after online connection.',
            timerLocked: 'Timer cannot change after the game starts or after online connection.',
            drawPrompt: 'Agree to a draw?'
        }
    },
    zh: {
        language: {
            label: '語言',
            english: 'English',
            chinese: '繁體中文'
        },
        navigation: {
            home: '首頁'
        },
        app: {
            title: 'T2 環面棋',
            tagline: '在加長三維環面上的二維國際象棋：短方向 8 格，長方向 14 行。',
            canvasLabel: '三維環面棋盤',
            movePickerLabel: '走法選擇器'
        },
        colors: {
            white: '白方',
            black: '黑方'
        },
        pieces: {
            K: '王',
            Q: '后',
            R: '車',
            B: '象',
            N: '馬',
            P: '兵',
            piece: '棋子'
        },
        sides: {
            kingside: '王翼',
            queenside: '后翼'
        },
        turn: {
            gameOver: '遊戲結束',
            toMove: ({ color }, lang) => label(lang, 'colors.' + color) + '走棋'
        },
        captured: {
            byWhite: '白方吃子',
            byBlack: '黑方吃子',
            none: '無'
        },
        picker: {
            movablePieces: '可移動棋子',
            availableMoves: '可用走法',
            initialSummary: '白方有合法走法的棋子',
            selectPiece: '選擇棋子',
            noActiveSelection: '未選擇棋子',
            destinationsOnTurn: '輪到你時顯示目標格。',
            selectPieceDestinations: '選擇一個可移動棋子來列出目標格。',
            gameOver: '遊戲結束',
            connectOnline: '連線至線上對手後才能移動',
            waitingForColor: ({ color }, lang) => '等待' + label(lang, 'colors.' + color),
            movableSummary: ({ color, count }, lang) => label(lang, 'colors.' + color) + '有 ' + count + ' 個可移動棋子',
            noMovable: '沒有可移動棋子。',
            selectedSummary: ({ type, coord, count }, lang) => label(lang, 'pieces.' + type) + ' ' + coord + ' -> ' + count + ' 個目標格',
            noDestinations: '這個棋子沒有合法目標格。',
            castleMove: ({ side }) => '易位 ' + (side === 'kingside' ? '王翼' : '后翼')
        },
        controls: {
            title: '遊戲控制',
            gameMode: '遊戲模式',
            local: '本地輪流',
            online: '線上多人',
            boardGame: '棋盤模式',
            boundary: '邊界條件',
            topology: '拓撲',
            timer: '每方時間',
            resetCamera: '重設視角',
            newGame: '新遊戲',
            offerDraw: '提和',
            surrender: '認輸'
        },
        online: {
            localStatus: '本地輪流',
            selectedStatus: '已選擇線上模式。',
            youAre: ({ color }, lang) => '你是' + label(lang, 'colors.' + color) + '。',
            disconnected: '未連線',
            connectingRoom: '正在建立線上房間...',
            roomCodeRetry: '房間碼已被使用，正在重試...',
            roomReadyConnection: '房間已準備好，請分享連結。',
            roomReadyGame: '房間已準備好。你是白方，等待黑方加入。',
            resumingRoom: '正在恢復同一房間...',
            holdingRoom: ({ room }) => '連線中斷。繼續保留房間 ' + (room || '') + ' 等待重連。',
            reconnecting: '正在重新連接信令...',
            enterRoom: '請輸入房間 ID 或分享連結。',
            joiningRoom: '正在加入房間...',
            joiningAsWhite: '以白方身分加入房間...',
            joiningAsBlack: '以黑方身分加入房間...',
            joiningShared: '正在加入分享房間...',
            joiningSharedGame: '正在加入分享的線上房間...',
            matchmakingSearch: '正在搜尋配對空間...',
            matchmakingWaiting: '正在配對空間等待...',
            matchmakingRetry: '此配對槽忙碌，正在嘗試另一個...',
            matchmakingTimeout: '尚無對手回應，繼續搜尋...',
            webrtcChecking: '正在尋找兩位玩家之間的網路路徑...',
            webrtcFailed: 'WebRTC 無法連接這兩個網路。請保持白方房間開啟，必要時更換網路。',
            connectedWhite: '已連線為白方',
            connectedBlack: '已連線為黑方',
            connectedGame: ({ color }, lang) => '已連線。你是' + label(lang, 'colors.' + color) + '。',
            opponentDisconnected: '對手已斷線',
            opponentDisconnectedGame: '對手已斷線。請建立或加入新房間繼續。',
            wrongGame: '此房間屬於另一個棋盤模式。',
            wrongGameMatch: '配對到不同棋盤模式，繼續搜尋...',
            roomFull: '房間已滿',
            roomFullGame: '此房間已有兩名玩家。',
            peerUnavailable: '找不到房間。請讓白方重新建立連結。',
            networkError: '網路錯誤，請檢查連線後重試。',
            peerMissing: 'PeerJS 未載入，請檢查網路並重新整理。',
            findMatch: '尋找配對',
            privateRoom: '私人房間',
            createRoom: '建立房間',
            joinRoom: '加入房間',
            or: '或',
            roomInput: '5 位房間碼或分享連結',
            roomId: '房間碼',
            copy: '複製'
        },
        topology: {
            names: {
                periodic: 'T2 週期',
                rp2: 'RP2 对映',
                mobius: 'Mobius 扭轉',
                sphere: 'S2 球面'
            },
            info: {
                periodic: 'T2 使用 112 個可用格：短方向 8 格、長方向 14 行。初始雙方之間加入六行空格，兩個方向皆為週期連接。',
                rp2: 'RP2 使用一個 12x14 基本棋盤。越過邊界會到達對邊並反轉對應座標，升起的箭頭顯示對映黏合。',
                mobius: 'Mobius 使用兩個完整 8x8 表面。橫向 x 邊界開放；穿過纏繞 y 邊界會反轉 x 並到達另一面。',
                sphere: '球面棋使用 16 條經度與 16 列緯度。經度方向週期連接；兩極帽列保持空白，但合法走法可穿越極點並從對蹠經度出現。每方增加四枚角落支援兵。'
            }
        },
        boundary: {
            names: {
                forbidden: '禁止越界',
                reflection: '反射',
                periodic: '週期',
                rp2: 'RP2 对映',
                mobius: 'Mobius 扭轉',
                sphere: 'S2 球面'
            },
            info: {
                forbidden: '禁止越界：棋子不能走出 8x8x8 立方體。',
                reflection: '反射：到達邊界的走法會反彈回棋盤。',
                periodic: '週期：從一側離開會從相對側進入。'
            }
        },
        timer: {
            noTimer: '無計時',
            fiveMinutes: '5 分鐘',
            tenMinutes: '10 分鐘',
            thirtyMinutes: '30 分鐘',
            oneHour: '1 小時',
            oneDay: '1 天'
        },
        history: {
            title: '走法記錄',
            started: '遊戲開始。',
            castle: ({ color, side, from, to }, lang) => label(lang, 'colors.' + color) + label(lang, 'pieces.K') + ' ' + label(lang, 'sides.' + side) + '易位 ' + from + ' -> ' + to,
            move: ({ color, type, from, to, capturedType, promotionType }, lang) => {
                const capture = capturedType ? ' 吃 ' + label(lang, 'pieces.' + capturedType) : '';
                const promotion = promotionType ? ' 升變為 ' + label(lang, 'pieces.' + promotionType) : '';
                return label(lang, 'colors.' + color) + label(lang, 'pieces.' + type) + ' ' + from + ' -> ' + to + capture + promotion;
            }
        },
        rules: {
            title: '環面規則',
            text: '車、象、后、馬、王、易位、吃過路兵、將軍與將死都使用 112 個環面格上的二維國際象棋走法。棋盤為 8 列 x 14 個週期行，雙方初始陣之間有六行空格。兵到達對方底線時升變。'
        },
        hints: {
            label: '走法提示'
        },
        promotion: {
            title: '兵升變為'
        },
        status: {
            start: '請選擇一個白方棋子開始。',
            connectBeforeMove: '線上模式需要先連接對手。',
            waitingForMove: ({ color }, lang) => '等待' + label(lang, 'colors.' + color) + '走棋。',
            selectionCleared: '選擇已清除。',
            choosePieceFirst: '請先選擇你的棋子。',
            turnOnly: ({ color }, lang) => '現在是' + label(lang, 'colors.' + color) + '回合。',
            pieceSelected: ({ color, type, coord, count }, lang) => label(lang, 'colors.' + color) + label(lang, 'pieces.' + type) + '已選中於 ' + coord + '，有 ' + count + ' 個合法走法。',
            targetSelected: ({ coord }) => '已選擇 ' + coord + '。再次點擊同一黃色目標格以移動。',
            movePlayed: ({ color }, lang) => '已走棋。輪到' + label(lang, 'colors.' + color) + '。',
            checkmateWin: ({ color }, lang) => label(lang, 'colors.' + color) + '將死獲勝。',
            stalemate: '逼和，遊戲和局。',
            inCheck: ({ color }, lang) => label(lang, 'colors.' + color) + '被將軍。',
            timeWin: ({ color }, lang) => label(lang, 'colors.' + color) + '逾時獲勝。',
            newGame: '新遊戲開始。請選擇白方棋子。',
            roomLinkCopied: '房間連結已複製。',
            resignationWin: ({ color }, lang) => label(lang, 'colors.' + color) + '因對手認輸獲勝。',
            drawOfferSent: '已傳送和棋請求。',
            drawAgreed: '雙方同意和棋。',
            drawAccepted: '已接受和棋。',
            hintsHidden: '已隱藏走法提示。',
            hintsShown: '已顯示走法提示。'
        },
        alerts: {
            modeLocked: '遊戲開始或線上連線後不能更改模式。',
            boundaryLocked: '遊戲開始或線上連線後不能更改邊界。',
            topologyLocked: '遊戲開始或線上連線後不能更改拓撲。',
            timerLocked: '遊戲開始或線上連線後不能更改計時。',
            drawPrompt: '同意和棋嗎？'
        }
    }
};

Object.assign(DICTIONARY.zh.boundary.names, {
    forbidden: '標準',
    random: '3D RBC',
    periodic: 'T3 週期'
});
Object.assign(DICTIONARY.zh.boundary.info, {
    forbidden: '標準：棋子不能走出 8x8x8 立方體。',
    random: '3D RBC：每個立方體邊界出口方向會固定映射到一個隨機邊界格。',
    periodic: 'T3 週期：從任一立方體面離開會從相對面進入。'
});

export const I18N = {
    current: DEFAULT_LANGUAGE,
    languages: Object.keys(DICTIONARY)
};

function read(lang, key) {
    return key.split('.').reduce((node, part) => node?.[part], DICTIONARY[lang]);
}

function label(lang, key) {
    const value = read(lang, key) ?? read(DEFAULT_LANGUAGE, key);
    return typeof value === 'function' ? value({}, lang) : value ?? key;
}

function formatString(text, params) {
    return text.replace(/\{(\w+)\}/g, (_, key) => params[key] ?? '');
}

export function hasTranslation(key) {
    return read(I18N.current, key) !== undefined || read(DEFAULT_LANGUAGE, key) !== undefined;
}

export function t(key, params = {}) {
    const lang = I18N.current;
    const value = read(lang, key) ?? read(DEFAULT_LANGUAGE, key);

    if (typeof value === 'function') return value(params, lang);
    if (typeof value === 'string') return formatString(value, params);
    return key;
}

export function applyLanguage(root = document) {
    document.documentElement.lang = I18N.current === 'zh' ? 'zh-Hant' : 'en';
    document.title = t('app.title');

    root.querySelectorAll('[data-i18n]').forEach((element) => {
        element.textContent = t(element.dataset.i18n);
    });

    root.querySelectorAll('[data-i18n-placeholder]').forEach((element) => {
        element.setAttribute('placeholder', t(element.dataset.i18nPlaceholder));
    });

    root.querySelectorAll('[data-i18n-aria-label]').forEach((element) => {
        element.setAttribute('aria-label', t(element.dataset.i18nAriaLabel));
    });

    root.querySelectorAll('[data-i18n-title]').forEach((element) => {
        element.setAttribute('title', t(element.dataset.i18nTitle));
    });

    root.querySelectorAll('[data-lang-option]').forEach((button) => {
        const active = button.dataset.langOption === I18N.current;
        button.classList.toggle('active', active);
        button.setAttribute('aria-pressed', String(active));
    });
}

export function setLanguage(language) {
    if (!I18N.languages.includes(language) || language === I18N.current) return;
    I18N.current = language;
    applyLanguage();
    window.dispatchEvent(new CustomEvent('languagechange', { detail: { language } }));
}

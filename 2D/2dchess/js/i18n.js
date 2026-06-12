const DEFAULT_LANGUAGE = 'en';

const DICTIONARY = {
    en: {
        language: {
            label: 'Language',
            english: 'English',
            chinese: 'Chinese'
        },
        app: {
            title: '2D Chess with Boundary Conditions',
            subtitle: 'Local and online multiplayer with forbidden, reflection, and periodic boundaries.'
        },
        colors: {
            white: 'White',
            black: 'Black',
            whiteLabel: 'White:',
            blackLabel: 'Black:'
        },
        captured: {
            white: 'White Captured:',
            black: 'Black Captured:',
            none: '(none)'
        },
        controls: {
            title: 'Game Controls',
            gameMode: 'Game Mode:',
            local: 'Local (Pass & Play)',
            online: 'Online (Multiplayer)',
            boundary: 'Boundary Condition:',
            timer: 'Timer per Player:',
            newGame: 'New Game',
            surrender: 'Surrender',
            offerDraw: 'Offer Draw'
        },
        online: {
            localStatus: 'Local pass and play',
            selectedStatus: 'Online mode selected.',
            youAre: ({ color }, lang) => `You are ${label(lang, `colors.${color}`)}.`,
            disconnected: 'Status: Disconnected',
            connectingRoom: 'Creating online room...',
            roomCodeRetry: 'That room code is busy. Trying another code...',
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
            timeoutJoin: 'Could not open that room. Keep White on the room page, then try again.',
            timeoutAccept: 'Opponent opened the room but did not finish connecting.',
            webrtcChecking: 'Finding an internet path between both players...',
            webrtcFailed: 'WebRTC could not connect these two networks. Try another network or recreate the room.',
            connectedWhite: 'Connected as White',
            connectedBlack: 'Connected as Black',
            opponentJoined: 'Opponent joined. Continue the same game.',
            playerRejoined: 'Opponent rejoined. Game restored.',
            connectedGame: ({ color }, lang) => `Connected. You are ${label(lang, `colors.${color}`)}.`,
            opponentDisconnected: 'Opponent disconnected',
            opponentDisconnectedGame: 'Opponent disconnected. Create or join a new room to continue online.',
            matchmakingSearch: 'Searching shared match space...',
            matchmakingWaiting: 'Waiting in shared match space...',
            matchmakingRetry: 'That match slot is busy. Trying another...',
            matchmakingTimeout: 'No opponent answered yet. Searching another slot...',
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
            sslUnavailable: 'Online play needs HTTPS or localhost.',
            serverError: 'Peer server error. Try creating a new room.',
            peerMissing: 'PeerJS did not load. Check the local vendor file and reload.',
            roomCodeUnavailable: 'Could not reserve a room code. Try Create Room again.',
            signalClosed: 'Signaling connection closed. Reload both pages and create a new room.',
            connectionError: ({ detail }) => `Connection error: ${detail || 'unknown error'}`,
            findMatch: 'Find Match',
            privateRoom: 'PRIVATE ROOM',
            createRoom: 'Create Room',
            joinRoom: 'Join Room',
            or: '- OR -',
            roomInput: 'Enter Room ID to join...',
            roomId: 'Room ID:',
            copy: 'Copy'
        },
        boundary: {
            names: {
                forbidden: 'Forbidden',
                reflection: 'Reflection',
                periodic: 'Periodic'
            },
            info: {
                forbidden: '<strong>Forbidden:</strong> Pieces cannot move outside the board.',
                reflection: '<strong>Reflection:</strong> Pieces reflect around the left/right edge-square centers.',
                periodic: '<strong>Periodic:</strong> Board wraps around left/right edges.'
            }
        },
        timer: {
            none: 'No Timer',
            three: '3 Minutes',
            five: '5 Minutes',
            ten: '10 Minutes',
            thirty: '30 Minutes',
            sixty: '60 Minutes'
        },
        history: {
            title: 'Move History',
            started: 'Game started...',
            castle: ({ color, side, from, to }, lang) =>
                `${label(lang, `colors.${color}`)} castles ${side} ${from} -> ${to}`,
            move: ({ color, type, from, to, capturedType, promotionType }, lang) => {
                const capture = capturedType ? ` captures ${pieceName(lang, capturedType)}` : '';
                const promotion = promotionType ? ` promotes to ${pieceName(lang, promotionType)}` : '';
                return `${label(lang, `colors.${color}`)} ${pieceName(lang, type)} ${from} -> ${to}${capture}${promotion}`;
            }
        },
        pieces: {
            K: 'King',
            Q: 'Queen',
            R: 'Rook',
            B: 'Bishop',
            N: 'Knight',
            P: 'Pawn',
            legendTitle: 'Piece Symbols:',
            legendHtml: '\u2654/\u265A = King | \u2655/\u265B = Queen<br>\u2656/\u265C = Rook | \u2657/\u265D = Bishop<br>\u2658/\u265E = Knight | \u2659/\u265F = Pawn'
        },
        hints: {
            label: 'Move Hints'
        },
        promotion: {
            title: 'Promote Pawn To:'
        },
        turn: {
            gameOver: 'Game over',
            toMove: ({ color }, lang) => `${label(lang, `colors.${color}`)}'s Turn`,
            check: ' - CHECK!'
        },
        status: {
            start: 'Select a white piece to begin.',
            connectBeforeMove: 'Connect to an opponent before moving online.',
            waitingForMove: ({ color }, lang) => `Waiting for ${label(lang, `colors.${color}`)} to move.`,
            selectionCleared: 'Selection cleared.',
            choosePieceFirst: 'Choose one of your pieces first.',
            turnOnly: ({ color }, lang) => `It is ${label(lang, `colors.${color}`)}'s turn.`,
            pieceSelected: ({ color, type, coord, count }, lang) =>
                `${label(lang, `colors.${color}`)} ${pieceName(lang, type)} selected at ${coord}. ${count} legal move${count === 1 ? '' : 's'}.`,
            moved: 'Move played.',
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
            drawByInsufficientMaterial: 'Draw by insufficient material.',
            drawBy50Move: 'Draw by 50-move rule.',
            drawByRepetition: 'Draw by threefold repetition.',
            hintsHidden: 'Move hints hidden.',
            hintsShown: 'Move hints shown.'
        },
        alerts: {
            modeLocked: 'Game mode cannot change after the game starts or after online connection.',
            boundaryLocked: 'Boundary cannot change after the game starts or after online connection.',
            timerLocked: 'Timer cannot change after the game starts or after online connection.',
            drawPrompt: 'Offer draw to opponent?'
        }
    },
    zh: {
        language: {
            label: '語言',
            english: '英文',
            chinese: '中文'
        },
        app: {
            title: '2D 邊界條件西洋棋',
            subtitle: '本機與線上對戰，支援禁止、反射與週期邊界。'
        },
        colors: {
            white: '白方',
            black: '黑方',
            whiteLabel: '白方：',
            blackLabel: '黑方：'
        },
        captured: {
            white: '白方吃子：',
            black: '黑方吃子：',
            none: '（無）'
        },
        controls: {
            title: '遊戲控制',
            gameMode: '遊戲模式：',
            local: '本機（輪流操作）',
            online: '線上對戰',
            boundary: '邊界條件：',
            timer: '每方時間：',
            newGame: '新局',
            surrender: '認輸',
            offerDraw: '提和'
        },
        online: {
            localStatus: '本機輪流操作',
            selectedStatus: '已選線上模式。',
            youAre: ({ color }, lang) => `你是${label(lang, `colors.${color}`)}。`,
            disconnected: '狀態：未連線',
            connectingRoom: '正在建立房間...',
            roomCodeRetry: '房間代碼已被使用，正在重試...',
            roomReadyConnection: '房間已建立，請分享連結給黑方。',
            roomReadyGame: '房間已建立，你是白方，等待黑方加入。',
            resumingRoom: '正在恢復房間...',
            holdingRoom: ({ room }) => `連線中斷，保留房間 ${room || ''} 等待重連。`,
            reconnecting: '正在重連訊號伺服器...',
            enterRoom: '請輸入房間 ID 或分享連結。',
            joiningRoom: '正在加入房間...',
            joiningAsWhite: '正在以白方加入...',
            joiningAsBlack: '正在以黑方加入...',
            joiningShared: '正在加入分享房間...',
            joiningSharedGame: '正在加入線上房間...',
            timeoutJoin: '無法開啟房間，請確認白方頁面仍開啟後再試。',
            timeoutAccept: '對手開啟房間但未完成連線。',
            webrtcChecking: '正在尋找雙方網路連線路徑...',
            webrtcFailed: 'WebRTC 無法連線，請換網路或重新建立房間。',
            connectedWhite: '已連線：白方',
            connectedBlack: '已連線：黑方',
            opponentJoined: '對手已加入，繼續本局。',
            playerRejoined: '對手已重連，棋局已恢復。',
            connectedGame: ({ color }, lang) => `已連線，你是${label(lang, `colors.${color}`)}。`,
            opponentDisconnected: '對手已斷線',
            opponentDisconnectedGame: '對手已斷線，請建立或加入新房間繼續。',
            moveSyncFailed: '走法同步失敗',
            moveSyncFailedGame: '走法同步失敗，請開新房間。',
            opponentSurrendered: '對手認輸，你獲勝。',
            drawOfferPrompt: '對手提和，接受嗎？',
            drawDeclined: '和棋被拒絕。',
            roomFull: '房間已有兩名玩家',
            roomFullGame: '這個房間已有兩名玩家。',
            peerUnavailable: '找不到房間，請白方重新建立連結。',
            networkError: '網路錯誤，請稍後再試。',
            browserIncompatible: '此瀏覽器不支援線上對戰。',
            sslUnavailable: '線上對戰需要 HTTPS 或 localhost。',
            serverError: 'Peer 伺服器錯誤，請重開房間。',
            peerMissing: 'PeerJS 未載入，請檢查本機檔案後重整。',
            roomCodeUnavailable: '無法保留房間代碼，請再試一次。',
            signalClosed: '訊號連線已關閉，請重新整理並開新房間。',
            connectionError: ({ detail }) => `連線錯誤：${detail || '未知錯誤'}`,
            createRoom: '建立房間',
            joinRoom: '加入房間',
            or: '- 或 -',
            roomInput: '輸入房間 ID...',
            roomId: '房間 ID：',
            copy: '複製'
        },
        boundary: {
            names: {
                forbidden: '禁止',
                reflection: '反射',
                periodic: '週期'
            },
            info: {
                forbidden: '<strong>禁止：</strong>棋子不能移出棋盤。',
                reflection: '<strong>反射：</strong>棋子會以左右邊界格的中心反射。',
                periodic: '<strong>週期：</strong>左右邊界相接並循環。'
            }
        },
        timer: {
            none: '不計時',
            three: '3 分鐘',
            five: '5 分鐘',
            ten: '10 分鐘',
            thirty: '30 分鐘',
            sixty: '60 分鐘'
        },
        history: {
            title: '走法紀錄',
            started: '遊戲開始...',
            castle: ({ color, side, from, to }, lang) =>
                `${label(lang, `colors.${color}`)}王車易位 ${side} ${from} -> ${to}`,
            move: ({ color, type, from, to, capturedType, promotionType }, lang) => {
                const capture = capturedType ? ` 吃 ${pieceName(lang, capturedType)}` : '';
                const promotion = promotionType ? ` 升變為 ${pieceName(lang, promotionType)}` : '';
                return `${label(lang, `colors.${color}`)} ${pieceName(lang, type)} ${from} -> ${to}${capture}${promotion}`;
            }
        },
        pieces: {
            K: '王',
            Q: '后',
            R: '車',
            B: '象',
            N: '馬',
            P: '兵',
            legendTitle: '棋子符號：',
            legendHtml: '\u2654/\u265A = 王 | \u2655/\u265B = 后<br>\u2656/\u265C = 車 | \u2657/\u265D = 象<br>\u2658/\u265E = 馬 | \u2659/\u265F = 兵'
        },
        hints: {
            label: '走法提示'
        },
        promotion: {
            title: '兵升變為：'
        },
        turn: {
            gameOver: '遊戲結束',
            toMove: ({ color }, lang) => `${label(lang, `colors.${color}`)}回合`,
            check: ' - 將軍！'
        },
        status: {
            start: '請選擇白方棋子開始。',
            connectBeforeMove: '線上模式請先連線再走棋。',
            waitingForMove: ({ color }, lang) => `等待${label(lang, `colors.${color}`)}走棋。`,
            selectionCleared: '已取消選取。',
            choosePieceFirst: '請先選擇自己的棋子。',
            turnOnly: ({ color }, lang) => `現在是${label(lang, `colors.${color}`)}回合。`,
            pieceSelected: ({ color, type, coord, count }, lang) =>
                `已選${label(lang, `colors.${color}`)} ${pieceName(lang, type)} ${coord}，有 ${count} 個合法走法。`,
            moved: '已走棋。',
            checkmateWin: ({ color }, lang) => `${label(lang, `colors.${color}`)}將死獲勝。`,
            stalemate: '逼和，和棋。',
            inCheck: ({ color }, lang) => `${label(lang, `colors.${color}`)}被將軍。`,
            timeWin: ({ color }, lang) => `${label(lang, `colors.${color}`)}時間勝。`,
            newGame: '新局開始，請選擇白方棋子。',
            roomLinkCopied: '房間連結已複製。',
            resignationWin: ({ color }, lang) => `${label(lang, `colors.${color}`)}因對手認輸獲勝。`,
            drawOfferSent: '已送出和棋提議。',
            drawAgreed: '雙方同意和棋。',
            drawAccepted: '和棋已接受。',
            drawByInsufficientMaterial: '子力不足，和棋。',
            drawBy50Move: '50 步規則，和棋。',
            drawByRepetition: '三次重複，和棋。',
            hintsHidden: '已隱藏走法提示。',
            hintsShown: '已顯示走法提示。'
        },
        alerts: {
            modeLocked: '遊戲開始或連線後不能更改模式。',
            boundaryLocked: '遊戲開始或連線後不能更改邊界。',
            timerLocked: '遊戲開始或連線後不能更改計時。',
            drawPrompt: '要向對手提和嗎？'
        }
    }
};

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

function pieceName(lang, type) {
    return label(lang, `pieces.${type}`);
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

    const legend = document.getElementById('pieceLegendLines');
    if (legend) legend.innerHTML = t('pieces.legendHtml');
}

export function setLanguage(language) {
    if (!I18N.languages.includes(language) || language === I18N.current) return;
    I18N.current = language;
    applyLanguage();
    window.dispatchEvent(new CustomEvent('languagechange', { detail: { language } }));
}

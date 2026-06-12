const DEFAULT_LANGUAGE = 'en';

const DICTIONARY = {
    en: {
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
        topology: {
            names: {
                periodic: 'T2 periodic',
                rp2: 'RP2 antipodal',
                mobius: 'Mobius twist'
            },
            info: {
                periodic: 'T2 uses 112 playable blocks shown as an 8-cell short winding and a 14-row long direction. The six extra blank rows sit between the initial armies, and both directions wrap periodically.',
                rp2: 'RP2 uses one 12x14 fundamental board. Crossing a boundary lands on the opposite edge with the matched coordinate reversed, and the raised cage arrows show the antipodal gluing.',
                mobius: 'Mobius uses two full 8x8 surface sides. The lateral x edges are open; crossing the winding y edge reverses x and lands on the opposite side. The armies start on matching coordinates on opposite normals.'
            }
        },
        boundary: {
            names: {
                forbidden: 'Forbidden',
                reflection: 'Reflection',
                periodic: 'Periodic',
                rp2: 'RP2 antipodal',
                mobius: 'Mobius twist'
            },
            info: {
                forbidden: 'Forbidden: pieces cannot move outside the 8x8x8 cube.',
                reflection: 'Reflection: a move that reaches an edge bounces back into the cube.',
                periodic: 'Periodic: leaving one side wraps the move to the opposite side.'
            }
        },
        timer: {
            noTimer: 'No Timer',
            fiveMinutes: '5 Minutes',
            tenMinutes: '10 Minutes',
            fifteenMinutes: '15 Minutes',
            thirtyMinutes: '30 Minutes',
            oneHour: '1 Hour',
            twoHours: '2 Hours',
            threeHours: '3 Hours',
            twentyFourHours: '24 Hours'
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
    document.documentElement.lang = I18N.current;
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
}

export function setLanguage(language) {
    if (!I18N.languages.includes(language) || language === I18N.current) return;
    I18N.current = language;
    applyLanguage();
    window.dispatchEvent(new CustomEvent('languagechange', { detail: { language } }));
}

import { hasTranslation, t } from './i18n.js';

const CONNECTION_TIMEOUT_MS = 45000;
const ROOM_CODE_RETRIES = 10;
const OPEN_RELAY_CREDENTIALS = {
    username: 'openrelayproject',
    credential: 'openrelayproject'
};
const PUBLIC_GAME_URL = 'https://youxunzhangjim-netizen.github.io/3dchess/';
const ROOM_STORAGE_PREFIX = '3dchess:room:';
const PEER_OPTIONS = {
    host: '0.peerjs.com',
    port: 443,
    path: '/',
    secure: true,
    pingInterval: 5000,
    debug: 2,
    config: {
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:global.stun.twilio.com:3478' },
            { urls: 'stun:stun.cloudflare.com:3478' },
            { urls: 'turn:openrelay.metered.ca:80', ...OPEN_RELAY_CREDENTIALS },
            { urls: 'turn:openrelay.metered.ca:443', ...OPEN_RELAY_CREDENTIALS },
            { urls: 'turn:openrelay.metered.ca:443?transport=tcp', ...OPEN_RELAY_CREDENTIALS }
        ],
        iceCandidatePoolSize: 10
    }
};

export class NetworkManager {
    constructor(game) {
        this.game = game;
        this.peer = null;
        this.connection = null;
        this.isConnected = false;
        this.myColor = null;
        this.isHost = false;
        this.roomId = '';
        this.connectionTimer = null;
        this.statusKind = 'disconnected';
        this.statusKey = 'online.disconnected';
        this.statusParams = {};
    }

    createRoom() {
        this.close({ silent: true });
        this.clearRoomInfo();

        this.isHost = true;
        this.myColor = 'white';
        this.game.myColor = 'white';
        this.game.gameMode = 'online';
        this.setStatus('connecting', 'online.connectingRoom');
        this.game.setStatus('online.connectingRoom');

        this.createHostPeer(0);
    }

    createHostPeer(attempt, fixedRoomCode = '', options = {}) {
        const roomCode = fixedRoomCode || this.generateRoomCode();
        let peer;
        try {
            peer = this.createPeer(roomCode);
        } catch (err) {
            this.handlePeerError(err);
            return;
        }
        this.peer = peer;

        peer.on('open', (id) => {
            if (this.peer !== peer) return;
            this.roomId = id;
            this.isHost = true;
            this.rememberRoomSession(id, this.myColor);
            this.persistState();
            this.setRoomInfo(id, this.buildShareUrl(id));
            this.setStatus('connecting', options.holding ? 'online.holdingRoom' : 'online.roomReadyConnection', { room: id });
            this.game.setStatus(options.holding ? 'online.holdingRoom' : 'online.roomReadyGame', { room: id });
            this.game.updateUI();
        });

        peer.on('connection', (conn) => {
            if (this.peer !== peer) return;
            this.acceptIncomingConnection(conn);
        });

        peer.on('disconnected', () => {
            if (this.peer !== peer || peer.destroyed) return;
            this.setStatus('connecting', 'online.reconnecting');
            this.game.setStatus('online.reconnecting');
            peer.reconnect();
        });

        peer.on('error', (err) => {
            if (this.peer !== peer) return;
            if (err?.type === 'unavailable-id' && options.fallbackJoin) {
                if (!peer.destroyed) peer.destroy();
                if (this.peer === peer) this.peer = null;
                this.joinRoom(roomCode, { color: this.myColor || 'black', reconnect: true });
                return;
            }

            if (err?.type === 'unavailable-id' && !fixedRoomCode && attempt < ROOM_CODE_RETRIES - 1) {
                if (!peer.destroyed) peer.destroy();
                if (this.peer === peer) this.peer = null;
                this.setStatus('connecting', 'online.roomCodeRetry');
                this.game.setStatus('online.roomCodeRetry');
                window.setTimeout(() => this.createHostPeer(attempt + 1), 180);
                return;
            }

            this.handlePeerError(err);
        });
    }

    resumeOrJoinRoom(rawRoomId) {
        const roomId = this.extractRoomId(rawRoomId);
        const stored = this.getStoredRoomSession(roomId);

        if (stored?.color) {
            this.reconnectRoom(roomId, stored.color);
            return;
        }

        this.joinRoom(roomId, { color: 'black', reconnect: false });
    }

    reconnectRoom(rawRoomId, color = 'black') {
        const roomId = this.extractRoomId(rawRoomId);
        if (!roomId) {
            alert(t('online.enterRoom'));
            return;
        }

        this.close({ silent: true, forget: false });
        this.isHost = true;
        this.myColor = color;
        this.roomId = roomId;
        this.game.myColor = color;
        this.game.gameMode = 'online';
        this.setRoomInfo(roomId, this.buildShareUrl(roomId));
        this.restoreStoredRoomState(roomId);
        this.setStatus('connecting', 'online.resumingRoom');
        this.game.setStatus('online.resumingRoom');
        this.createHostPeer(0, roomId, { holding: true, fallbackJoin: true });
        this.game.updateUI();
    }

    joinRoom(rawRoomId, { color = 'black', reconnect = false } = {}) {
        const roomId = this.extractRoomId(rawRoomId);
        if (!roomId) {
            alert(t('online.enterRoom'));
            return;
        }

        this.close({ silent: true, forget: false });
        this.isHost = false;
        this.myColor = color;
        this.roomId = roomId;
        this.game.myColor = color;
        this.game.gameMode = 'online';
        this.setRoomInfo(roomId, this.buildShareUrl(roomId));
        this.setStatus('connecting', reconnect ? 'online.resumingRoom' : 'online.joiningRoom');
        this.game.setStatus(reconnect ? 'online.resumingRoom' : color === 'white' ? 'online.joiningAsWhite' : 'online.joiningAsBlack');

        let peer;
        try {
            peer = this.createPeer();
        } catch (err) {
            this.handlePeerError(err);
            return;
        }
        this.peer = peer;

        peer.on('open', () => {
            if (this.peer !== peer) return;
            this.connection = peer.connect(roomId, {
                serialization: 'json',
                metadata: { game: '3dchess', roomId, color, reconnect }
            });
            this.setupConnection(this.connection);
            this.startConnectionTimer('online.timeoutJoin');
        });

        peer.on('disconnected', () => {
            if (this.peer !== peer || peer.destroyed) return;
            this.setStatus('connecting', 'online.reconnecting');
            this.game.setStatus('online.reconnecting');
            peer.reconnect();
        });

        peer.on('error', (err) => {
            if (this.peer !== peer) return;
            this.handlePeerError(err);
        });
    }

    acceptIncomingConnection(conn) {
        if (this.connection) {
            const reconnecting = conn.metadata?.reconnect === true;
            const existingOpen = this.connection.open && this.isConnected;

            if (existingOpen && !reconnecting) {
                conn.on('open', () => {
                    conn.send({ type: 'roomFull' });
                    conn.close();
                });
                return;
            }

            this.replaceConnection(conn);
            return;
        }

        this.connection = conn;
        this.setupConnection(conn);
        this.startConnectionTimer('online.timeoutAccept');
    }

    replaceConnection(conn) {
        const previous = this.connection;
        this.connection = null;
        this.isConnected = false;

        if (previous) {
            try {
                previous.close();
            } catch {
                // PeerJS may already have closed the old data channel.
            }
        }

        this.connection = conn;
        this.setupConnection(conn);
        this.startConnectionTimer('online.timeoutAccept');
    }

    setupConnection(conn) {
        if (!conn) return;

        this.watchIceState(conn);

        conn.on('open', () => {
            if (this.connection !== conn) return;

            this.clearConnectionTimer();
            this.isConnected = true;
            this.game.gameMode = 'online';
            this.game.myColor = this.myColor;
            this.game.lockGameSettings();
            this.rememberRoomSession(this.roomId, this.myColor);
            this.persistState();
            this.setRoomInfo(this.roomId, this.buildShareUrl(this.roomId));
            this.setStatus('connected', this.myColor === 'white' ? 'online.connectedWhite' : 'online.connectedBlack');
            this.game.setStatus(conn.metadata?.reconnect ? 'online.playerRejoined' : this.isHost ? 'online.opponentJoined' : 'online.connectedGame', { color: this.myColor });
            this.game.updateUI();

            if (this.isHost) {
                this.sendSync();
            } else {
                this.sendMessage({ type: 'ready' });
            }
        });

        conn.on('data', (data) => {
            this.handleRemoteMessage(data);
        });

        conn.on('close', () => {
            if (this.connection !== conn) return;
            this.connection = null;
            this.isConnected = false;
            this.clearConnectionTimer();
            this.setStatus('disconnected', 'online.opponentDisconnected');
            this.game.setStatus('online.opponentDisconnectedGame');
            this.game.updateUI();
            this.persistState();
            this.holdRoomAfterDisconnect();
        });

        conn.on('error', (err) => {
            if (this.connection !== conn) return;
            this.handlePeerError(err);
        });
    }

    watchIceState(conn) {
        const attach = () => {
            if (this.connection !== conn) return;
            const pc = conn.peerConnection || conn._peerConnection;
            if (!pc || pc.__chessWatchAttached) return;

            pc.__chessWatchAttached = true;
            pc.addEventListener('iceconnectionstatechange', () => {
                if (this.connection !== conn || this.isConnected) return;

                if (pc.iceConnectionState === 'checking') {
                    this.setStatus('connecting', 'online.webrtcChecking');
                    this.game.setStatus('online.webrtcChecking');
                    return;
                }

                if (pc.iceConnectionState === 'failed' || pc.iceConnectionState === 'disconnected') {
                    this.clearConnectionTimer();
                    this.setStatus('disconnected', 'online.webrtcFailed');
                    this.game.setStatus('online.webrtcFailed');
                    this.game.updateUI();
                }
            });
        };

        window.setTimeout(attach, 0);
        window.setTimeout(attach, 500);
        window.setTimeout(attach, 1500);
    }

    holdRoomAfterDisconnect() {
        if (this.isHost || !this.roomId || this.game.gameMode !== 'online' || this.game.gameOver) return;

        const roomId = this.roomId;
        const color = this.myColor || this.game.myColor || 'black';
        this.setStatus('connecting', 'online.holdingRoom', { room: roomId });
        this.game.setStatus('online.holdingRoom', { room: roomId });

        if (this.peer && !this.peer.destroyed) {
            try {
                this.peer.destroy();
            } catch {
                // The peer can already be closed after a browser/network drop.
            }
        }

        this.peer = null;
        this.isHost = true;
        this.myColor = color;
        this.game.myColor = color;
        window.setTimeout(() => this.createHostPeer(0, roomId, { holding: true, fallbackJoin: true }), 400);
    }

    sendMove(move) {
        this.sendMessage({
            type: 'move',
            move,
            timeRemaining: { ...this.game.timeRemaining }
        });
    }

    sendSync() {
        this.sendMessage({
            type: 'sync',
            state: this.createSyncState()
        });
    }

    sendMessage(data) {
        if (this.connection && this.isConnected) {
            this.connection.send(data);
        }
    }

    async handleRemoteMessage(data) {
        if (!data || typeof data !== 'object') return;

        switch (data.type) {
            case 'ready':
                if (this.isHost) this.sendSync();
                break;

            case 'sync':
                this.applySyncState(data.state || data);
                break;

            case 'move': {
                const moved = await this.game.applyMove(data.move, { remote: true });
                if (moved && data.timeRemaining) {
                    this.syncClocks(data.timeRemaining);
                }
                if (moved) this.persistState();
                if (!moved) {
                    this.setStatus('disconnected', 'online.moveSyncFailed');
                    this.game.setStatus('online.moveSyncFailedGame');
                }
                break;
            }

            case 'newGame':
                this.game.resetGame({ keepOnline: true, remote: true });
                this.persistState();
                if (this.isHost) this.sendSync();
                break;

            case 'surrender':
                this.game.endGame('online.opponentSurrendered');
                break;

            case 'drawOffer':
                if (confirm(t('online.drawOfferPrompt'))) {
                    this.sendMessage({ type: 'drawAccepted' });
                    this.game.endGame('status.drawAgreed');
                } else {
                    this.sendMessage({ type: 'drawDeclined' });
                }
                break;

            case 'drawAccepted':
                this.game.endGame('status.drawAccepted');
                break;

            case 'drawDeclined':
                this.game.setStatus('online.drawDeclined');
                break;

            case 'roomFull':
                this.setStatus('disconnected', 'online.roomFull');
                this.game.setStatus('online.roomFullGame');
                this.close({ silent: true });
                this.clearRoomInfo();
                break;

            default:
                break;
        }
    }

    createSyncState() {
        return {
            version: 1,
            board: this.cloneBoard(this.game.board),
            currentPlayer: this.game.currentPlayer,
            boundaryCondition: this.game.boundaryCondition,
            timerEnabled: this.game.timerEnabled,
            timeLimit: this.game.timeLimit,
            timeRemaining: { ...this.game.timeRemaining },
            gameStarted: this.game.gameStarted,
            gameOver: this.game.gameOver,
            moveHistory: [...this.game.moveHistory],
            capturedPieces: {
                white: [...this.game.capturedPieces.white],
                black: [...this.game.capturedPieces.black]
            }
        };
    }

    applySyncState(state, { persist = true } = {}) {
        if (!state || typeof state !== 'object') return;

        if (Array.isArray(state.board)) {
            this.game.board = this.cloneBoard(state.board);
        }

        this.game.currentPlayer = state.currentPlayer === 'black' ? 'black' : 'white';
        this.game.boundaryCondition = ['forbidden', 'reflection', 'periodic'].includes(state.boundaryCondition)
            ? state.boundaryCondition
            : 'forbidden';
        this.game.timerEnabled = Boolean(state.timerEnabled);
        this.game.timeLimit = Number(state.timeLimit) || 0;
        this.syncClocks(state.timeRemaining || { white: this.game.timeLimit, black: this.game.timeLimit });
        this.game.gameStarted = Boolean(state.gameStarted);
        this.game.gameOver = Boolean(state.gameOver);
        this.game.moveHistory = Array.isArray(state.moveHistory) ? [...state.moveHistory] : [];
        this.game.capturedPieces = {
            white: Array.isArray(state.capturedPieces?.white) ? [...state.capturedPieces.white] : [],
            black: Array.isArray(state.capturedPieces?.black) ? [...state.capturedPieces.black] : []
        };
        this.game.selectedSquare = null;
        this.game.legalMoves = [];
        this.game.pendingMoveTarget = null;

        if (this.game.timerInterval) {
            clearInterval(this.game.timerInterval);
            this.game.timerInterval = null;
        }
        if (this.game.gameStarted && this.game.timerEnabled && !this.game.gameOver) {
            this.game.startTimer();
        }

        this.game.renderer.renderPieces3D(this.game.board);
        this.game.renderer.clearHighlights();
        this.game.lockGameSettings();
        this.game.updateBoundaryInfo();
        this.game.updateTimerDisplay();
        this.game.updateUI();
        if (persist) this.persistState();
    }

    syncClocks(timeRemaining) {
        const white = Number(timeRemaining?.white);
        const black = Number(timeRemaining?.black);
        this.game.timeRemaining = {
            white: Number.isFinite(white) ? white : this.game.timeLimit,
            black: Number.isFinite(black) ? black : this.game.timeLimit
        };
        this.game.updateTimerDisplay();
        this.persistState();
    }

    storageKey(roomId = this.roomId) {
        return `${ROOM_STORAGE_PREFIX}${roomId}`;
    }

    getStoredRoomSession(roomId = this.roomId) {
        if (!roomId) return null;

        try {
            const raw = window.localStorage.getItem(this.storageKey(roomId));
            return raw ? JSON.parse(raw) : null;
        } catch {
            return null;
        }
    }

    rememberRoomSession(roomId = this.roomId, color = this.myColor) {
        if (!roomId || !color) return;

        const stored = this.getStoredRoomSession(roomId) || {};
        this.saveRoomSession({
            ...stored,
            roomId,
            color,
            updatedAt: Date.now()
        });
    }

    saveRoomSession(session) {
        if (!session?.roomId) return;

        try {
            window.localStorage.setItem(this.storageKey(session.roomId), JSON.stringify(session));
        } catch {
            // Some browsers block storage in private contexts; reconnect still works while the page is open.
        }
    }

    persistState() {
        if (!this.roomId || !this.myColor || this.game.gameMode !== 'online') return;

        const stored = this.getStoredRoomSession(this.roomId) || {};
        this.saveRoomSession({
            ...stored,
            roomId: this.roomId,
            color: this.myColor,
            updatedAt: Date.now(),
            state: this.createSyncState()
        });
    }

    restoreStoredRoomState(roomId = this.roomId) {
        const stored = this.getStoredRoomSession(roomId);
        if (!stored?.state) return false;

        this.applySyncState(stored.state, { persist: false });
        this.roomId = roomId;
        this.myColor = stored.color || this.myColor;
        this.game.myColor = this.myColor;
        this.game.gameMode = 'online';
        this.setRoomInfo(roomId, this.buildShareUrl(roomId));
        return true;
    }

    cloneBoard(board) {
        return board.map((layer) =>
            layer.map((row) =>
                row.map((piece) => this.clonePiece(piece))
            )
        );
    }

    clonePiece(piece) {
        if (!piece) return null;
        const type = ['K', 'Q', 'R', 'B', 'N', 'P'].includes(piece.type) ? piece.type : 'P';
        const color = piece.color === 'black' ? 'black' : 'white';
        return {
            color,
            type,
            display: color === 'white' ? type : type.toLowerCase(),
            hasMoved: Boolean(piece.hasMoved)
        };
    }

    generateRoomCode() {
        return String(Math.floor(10000 + Math.random() * 90000));
    }

    createPeer(id) {
        if (!window.Peer) {
            const err = new Error('PeerJS unavailable');
            err.type = 'peer-missing';
            throw err;
        }
        return new window.Peer(id, PEER_OPTIONS);
    }

    close({ silent = false, forget = false } = {}) {
        this.clearConnectionTimer();

        if (this.connection) {
            this.connection.close();
            this.connection = null;
        }

        if (this.peer && !this.peer.destroyed) {
            this.peer.destroy();
        }

        this.peer = null;
        this.isConnected = false;
        this.myColor = null;
        this.roomId = '';

        if (forget) {
            // Stored online sessions are normally kept so players can resume by room code.
        }

        if (!silent) {
            this.clearRoomInfo();
            this.setStatus('disconnected', 'online.disconnected');
        }
    }

    startConnectionTimer(key, params = {}) {
        this.clearConnectionTimer();
        this.connectionTimer = window.setTimeout(() => {
            if (this.isConnected) return;
            this.setStatus('disconnected', key, params);
            this.game.setStatus(key, params);
        }, CONNECTION_TIMEOUT_MS);
    }

    clearConnectionTimer() {
        if (!this.connectionTimer) return;
        window.clearTimeout(this.connectionTimer);
        this.connectionTimer = null;
    }

    buildShareUrl(roomId) {
        const isLocalPage = ['127.0.0.1', 'localhost'].includes(window.location.hostname) || window.location.protocol === 'file:';
        const url = new URL(isLocalPage ? PUBLIC_GAME_URL : window.location.href);
        url.searchParams.set('room', roomId);
        url.hash = '';
        return url.toString();
    }

    setRoomInfo(roomId, shareUrl) {
        const roomInfo = document.getElementById('roomInfo');
        const roomIdDisplay = document.getElementById('roomIdDisplay');
        const shareInput = document.getElementById('shareLinkInput');

        if (roomInfo) roomInfo.hidden = !roomId;
        if (roomIdDisplay) roomIdDisplay.textContent = roomId || '';
        if (shareInput) shareInput.value = shareUrl || '';
    }

    clearRoomInfo() {
        this.setRoomInfo('', '');
    }

    setStatus(kind, key, params = {}) {
        this.statusKind = kind;
        this.statusKey = key;
        this.statusParams = { ...params };
        this.renderStatus();
    }

    refreshStatus() {
        this.renderStatus();
    }

    renderStatus() {
        const el = document.getElementById('connectionStatus');
        if (!el) return;

        el.classList.remove('connected', 'connecting', 'disconnected');
        el.classList.add(this.statusKind);
        el.textContent = this.resolveText(this.statusKey, this.statusParams);
    }

    resolveText(key, params = {}) {
        return hasTranslation(key) ? t(key, params) : key;
    }

    handlePeerError(err) {
        this.clearConnectionTimer();
        const error = this.describePeerError(err);
        this.setStatus('disconnected', error.key, error.params);
        this.game.setStatus(error.key, error.params);
        this.game.updateUI();
    }

    describePeerError(err) {
        const type = err?.type || '';
        if (type === 'peer-unavailable') return { key: 'online.peerUnavailable', params: {} };
        if (type === 'network') return { key: 'online.networkError', params: {} };
        if (type === 'browser-incompatible') return { key: 'online.browserIncompatible', params: {} };
        if (type === 'ssl-unavailable') return { key: 'online.sslUnavailable', params: {} };
        if (type === 'server-error') return { key: 'online.serverError', params: {} };
        if (type === 'peer-missing') return { key: 'online.peerMissing', params: {} };
        if (type === 'unavailable-id') return { key: 'online.roomCodeUnavailable', params: {} };
        if (type === 'webrtc') return { key: 'online.webrtcFailed', params: {} };
        if (type === 'socket-error' || type === 'socket-closed' || type === 'disconnected') {
            return { key: 'online.signalClosed', params: {} };
        }
        return { key: 'online.connectionError', params: { detail: type || err?.message || 'unknown error' } };
    }

    extractRoomId(value) {
        const text = String(value || '').trim();
        if (!text) return '';

        try {
            const url = new URL(text, window.location.href);
            const hashParams = new URLSearchParams(url.hash.replace(/^#\/?\??/, ''));
            return this.normalizeRoomCode(url.searchParams.get('room') || hashParams.get('room') || text);
        } catch {
            return this.normalizeRoomCode(text.replace(/^room=/i, ''));
        }
    }

    normalizeRoomCode(value) {
        const match = String(value || '').match(/\b\d{5}\b/);
        return match ? match[0] : '';
    }
}

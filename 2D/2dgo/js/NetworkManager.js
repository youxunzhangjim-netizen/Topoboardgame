const CONNECTION_TIMEOUT_MS = 45000;
const MATCHMAKING_BUCKET_MS = 60000;
const MATCHMAKING_HOST_WAIT_MS = 25000;
const MATCHMAKING_JOIN_TIMEOUT_MS = 12000;
const MATCHMAKING_RETRY_MS = 900;
const MATCHMAKING_SLOT_COUNT = 12;
const ROOM_CODE_RETRIES = 10;
const OPEN_RELAY_CREDENTIALS = {
    username: 'openrelayproject',
    credential: 'openrelayproject'
};
const PEER_OPTIONS = {
    host: '0.peerjs.com',
    port: 443,
    path: '/',
    secure: true,
    pingInterval: 5000,
    debug: 1,
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

export class GoNetworkManager {
    constructor(app, options = {}) {
        this.app = app;
        this.publicGameUrl = options.publicGameUrl || window.location.href;
        this.storagePrefix = options.storagePrefix || 'go:room:';
        this.peer = null;
        this.connection = null;
        this.isConnected = false;
        this.isHost = false;
        this.myColor = null;
        this.roomId = '';
        this.connectionTimer = null;
        this.matchmakingTimer = null;
        this.matchmakingIndex = 0;
        this.isMatchmaking = false;
    }

    createRoom() {
        this.close({ silent: true });
        this.isHost = true;
        this.myColor = 'black';
        this.app.setOnlineColor('black');
        this.app.setStatus('Creating online room...');
        this.createHostPeer(0);
    }

    findMatch() {
        if (this.isConnected) return;
        this.close({ silent: true });
        this.isMatchmaking = true;
        this.matchmakingIndex = 0;
        this.myColor = null;
        this.app.setOnlineColor(null);
        this.app.setStatus('Searching for a matching board, mode, and timer...');
        this.tryMatchSlot(0);
    }

    tryMatchSlot(index = 0) {
        if (!this.isMatchmaking) return;
        this.clearMatchmakingTimer();
        const slots = this.matchmakingRoomIds();
        if (index >= slots.length) {
            this.matchmakingIndex = 0;
            this.app.setStatus('No match yet. Searching again...');
            this.matchmakingTimer = window.setTimeout(() => this.tryMatchSlot(0), MATCHMAKING_RETRY_MS);
            return;
        }

        this.close({ silent: true, stopMatchmaking: false });
        this.isMatchmaking = true;
        this.matchmakingIndex = index;
        const roomId = slots[index];
        this.isHost = true;
        this.myColor = 'black';
        this.roomId = roomId;
        this.app.setOnlineColor('black');

        let peer;
        try {
            peer = this.createPeer(roomId);
        } catch (err) {
            this.handleError(err);
            return;
        }
        this.peer = peer;

        peer.on('open', (id) => {
            if (this.peer !== peer || !this.isMatchmaking) return;
            this.roomId = id;
            this.setRoomInfo(id, '');
            this.app.setStatus('Waiting for a matching opponent...');
            this.matchmakingTimer = window.setTimeout(() => {
                if (this.peer === peer && this.isMatchmaking && !this.isConnected) {
                    this.retryMatchmaking(index + 1);
                }
            }, MATCHMAKING_HOST_WAIT_MS);
        });

        peer.on('connection', (conn) => {
            if (this.peer !== peer || !this.isMatchmaking) return;
            this.clearMatchmakingTimer();
            this.acceptIncomingConnection(conn);
        });

        peer.on('error', (err) => {
            if (this.peer !== peer) return;
            if (err?.type === 'unavailable-id' && this.isMatchmaking) {
                if (!peer.destroyed) peer.destroy();
                if (this.peer === peer) this.peer = null;
                this.joinMatchSlot(roomId, index);
                return;
            }
            this.handleError(err);
        });

        peer.on('disconnected', () => {
            if (this.peer !== peer || peer.destroyed) return;
            this.app.setStatus('Reconnecting to PeerJS...');
            peer.reconnect();
        });
    }

    joinMatchSlot(roomId, index) {
        if (!this.isMatchmaking) return;
        this.close({ silent: true, stopMatchmaking: false });
        this.isMatchmaking = true;
        this.matchmakingIndex = index;
        this.isHost = false;
        this.myColor = 'white';
        this.roomId = roomId;
        this.app.setOnlineColor('white');
        this.setRoomInfo(roomId, '');
        this.app.setStatus('Joining matching opponent...');

        let peer;
        try {
            peer = this.createPeer();
        } catch (err) {
            this.handleError(err);
            return;
        }
        this.peer = peer;
        peer.on('open', () => {
            if (this.peer !== peer || !this.isMatchmaking) return;
            this.connection = peer.connect(roomId, {
                serialization: 'json',
                metadata: {
                    game: this.gameKey(),
                    roomId,
                    color: 'white',
                    matchmaking: true
                }
            });
            this.setupConnection(this.connection);
            this.startConnectionTimer(() => this.retryMatchmaking(index + 1));
        });
        peer.on('error', (err) => {
            if (this.peer !== peer) return;
            this.handleError(err);
        });
    }

    retryMatchmaking(nextIndex = this.matchmakingIndex + 1) {
        if (!this.isMatchmaking) return;
        this.clearConnectionTimer();
        this.clearMatchmakingTimer();
        this.close({ silent: true, stopMatchmaking: false });
        this.isMatchmaking = true;
        this.matchmakingTimer = window.setTimeout(() => this.tryMatchSlot(nextIndex), MATCHMAKING_RETRY_MS);
    }

    createHostPeer(attempt, fixedRoomCode = '') {
        const roomCode = fixedRoomCode || this.generateRoomCode();
        let peer;
        try {
            peer = this.createPeer(roomCode);
        } catch (err) {
            this.handleError(err);
            return;
        }
        this.peer = peer;
        peer.on('open', (id) => {
            if (this.peer !== peer) return;
            this.roomId = id;
            this.isHost = true;
            this.rememberRoomSession(id, this.myColor);
            this.setRoomInfo(id, this.buildShareUrl(id));
            this.app.setStatus(`Room ${id} ready. Black waits for White.`);
            this.app.updateUI();
        });
        peer.on('connection', (conn) => {
            if (this.peer !== peer) return;
            this.acceptIncomingConnection(conn);
        });
        peer.on('error', (err) => {
            if (this.peer !== peer) return;
            if (err?.type === 'unavailable-id' && !fixedRoomCode && attempt < ROOM_CODE_RETRIES - 1) {
                if (!peer.destroyed) peer.destroy();
                if (this.peer === peer) this.peer = null;
                window.setTimeout(() => this.createHostPeer(attempt + 1), 160);
                return;
            }
            this.handleError(err);
        });
    }

    resumeOrJoinRoom(rawRoomId) {
        const roomId = this.extractRoomId(rawRoomId);
        if (!roomId) {
            window.alert('Enter a room code or shared link.');
            return;
        }
        const stored = this.getStoredRoomSession(roomId);
        if (stored?.color === 'black') {
            this.resumeHostRoom(roomId);
            return;
        }
        this.joinRoom(roomId);
    }

    resumeHostRoom(roomId) {
        this.close({ silent: true });
        this.isHost = true;
        this.myColor = 'black';
        this.roomId = roomId;
        this.app.setOnlineColor('black');
        this.setRoomInfo(roomId, this.buildShareUrl(roomId));
        this.app.setStatus(`Room ${roomId} ready again. Black waits for White.`);
        this.createHostPeer(0, roomId);
        this.app.updateUI();
    }

    joinRoom(rawRoomId) {
        const roomId = this.extractRoomId(rawRoomId);
        if (!roomId) {
            window.alert('Enter a room code or shared link.');
            return;
        }
        this.close({ silent: true });
        this.isHost = false;
        this.myColor = 'white';
        this.roomId = roomId;
        this.app.setOnlineColor('white');
        this.setRoomInfo(roomId, this.buildShareUrl(roomId));
        this.app.setStatus(`Joining room ${roomId} as White...`);

        let peer;
        try {
            peer = this.createPeer();
        } catch (err) {
            this.handleError(err);
            return;
        }
        this.peer = peer;
        peer.on('open', () => {
            if (this.peer !== peer) return;
            this.connection = peer.connect(roomId, {
                serialization: 'json',
                metadata: { game: this.gameKey(), roomId, color: 'white' }
            });
            this.setupConnection(this.connection);
            this.startConnectionTimer(() => {
                this.app.setStatus('Connection timed out. Check the room code.');
            });
        });
        peer.on('error', (err) => {
            if (this.peer !== peer) return;
            this.handleError(err);
        });
    }

    acceptIncomingConnection(conn) {
        if (conn.metadata?.game && conn.metadata.game !== this.gameKey()) {
            conn.on('open', () => {
                conn.send({ type: 'wrongGame' });
                conn.close();
            });
            return;
        }
        if (this.connection && this.isConnected) {
            conn.on('open', () => {
                conn.send({ type: 'roomFull' });
                conn.close();
            });
            return;
        }
        this.connection = conn;
        this.setupConnection(conn);
        this.startConnectionTimer(() => this.app.setStatus('Connection timed out.'));
    }

    setupConnection(conn) {
        if (!conn) return;
        conn.on('open', () => {
            if (this.connection !== conn) return;
            this.clearConnectionTimer();
            this.isConnected = true;
            this.stopMatchmaking();
            this.app.setOnlineColor(this.myColor);
            this.app.lockSettings();
            this.rememberRoomSession(this.roomId, this.myColor);
            this.setRoomInfo(this.roomId, this.buildShareUrl(this.roomId));
            this.app.setStatus(this.myColor === 'black' ? 'Connected. You are Black.' : 'Connected. You are White.');
            this.app.updateUI();
            if (this.isHost) {
                this.sendState();
            } else {
                this.sendMessage({ type: 'ready' });
            }
        });
        conn.on('data', (data) => this.handleRemoteMessage(data));
        conn.on('close', () => {
            if (this.connection !== conn) return;
            this.connection = null;
            this.isConnected = false;
            this.clearConnectionTimer();
            this.app.setStatus('Opponent disconnected.');
            this.app.updateUI();
        });
        conn.on('error', (err) => this.handleError(err));
    }

    handleRemoteMessage(data) {
        if (!data || typeof data !== 'object') return;
        if (data.type === 'ready') {
            if (this.isHost) this.sendState();
            return;
        }
        if (data.type === 'state') {
            this.app.importNetworkState(data.state);
            return;
        }
        if (data.type === 'roomFull') {
            this.app.setStatus('Room is full.');
            this.close({ silent: true });
            return;
        }
        if (data.type === 'wrongGame') {
            this.app.setStatus('That room was created for a different Go game.');
            this.close({ silent: true });
        }
    }

    sendState() {
        this.sendMessage({ type: 'state', state: this.app.exportNetworkState() });
    }

    sendMessage(message) {
        if (this.connection && this.isConnected) {
            this.connection.send(message);
        }
    }

    matchmakingRoomIds() {
        const bucket = Math.floor(Date.now() / MATCHMAKING_BUCKET_MS);
        const buckets = [bucket, bucket - 1, bucket + 1];
        const key = this.matchSettingsKey();
        const ids = [];
        for (const currentBucket of buckets) {
            for (let slot = 0; slot < MATCHMAKING_SLOT_COUNT; slot++) {
                ids.push(`tc-${key}-m-${currentBucket}-${slot}`);
            }
        }
        return ids;
    }

    matchSettingsKey() {
        const settings = this.app.getNetworkSettings();
        return [
            this.safeSetting(settings.variant),
            this.safeSetting(settings.mode),
            `s${settings.size}`,
            `t${settings.timer}`
        ].join('-');
    }

    gameKey() {
        return '2dgo';
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

    safeSetting(value) {
        return String(value || 'x').toLowerCase().replace(/[^a-z0-9]+/g, '').slice(0, 28) || 'x';
    }

    buildShareUrl(roomId) {
        const isLocalPage = ['127.0.0.1', 'localhost'].includes(window.location.hostname) || window.location.protocol === 'file:';
        const url = new URL(isLocalPage ? this.publicGameUrl : window.location.href);
        const settings = this.app.getNetworkSettings();
        url.searchParams.set('room', roomId);
        url.searchParams.set('mode', settings.mode);
        url.searchParams.set('size', String(settings.size));
        url.searchParams.set('timer', String(settings.timer || 0));
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

    rememberRoomSession(roomId, color) {
        if (!roomId || !color) return;
        try {
            window.localStorage.setItem(`${this.storagePrefix}${roomId}`, JSON.stringify({ roomId, color, updatedAt: Date.now() }));
        } catch {
            // Local storage is optional for reconnect convenience.
        }
    }

    getStoredRoomSession(roomId) {
        if (!roomId) return null;
        try {
            const raw = window.localStorage.getItem(`${this.storagePrefix}${roomId}`);
            return raw ? JSON.parse(raw) : null;
        } catch {
            return null;
        }
    }

    extractRoomId(value) {
        const text = String(value || '').trim();
        if (!text) return '';
        try {
            const url = new URL(text, window.location.href);
            return this.normalizeRoomCode(url.searchParams.get('room') || text);
        } catch {
            return this.normalizeRoomCode(text);
        }
    }

    normalizeRoomCode(value) {
        const text = String(value || '');
        const simple = text.match(/\b\d{5}\b/);
        if (simple) return simple[0];
        const matchId = text.match(/\btc-[a-z0-9-]+-m-\d+-\d+\b/i);
        return matchId ? matchId[0].toLowerCase() : '';
    }

    startConnectionTimer(onTimeout) {
        this.clearConnectionTimer();
        this.connectionTimer = window.setTimeout(() => {
            if (this.isConnected) return;
            onTimeout?.();
        }, CONNECTION_TIMEOUT_MS);
    }

    clearConnectionTimer() {
        if (!this.connectionTimer) return;
        window.clearTimeout(this.connectionTimer);
        this.connectionTimer = null;
    }

    clearMatchmakingTimer() {
        if (!this.matchmakingTimer) return;
        window.clearTimeout(this.matchmakingTimer);
        this.matchmakingTimer = null;
    }

    stopMatchmaking() {
        this.isMatchmaking = false;
        this.clearMatchmakingTimer();
    }

    close({ silent = false, stopMatchmaking = true } = {}) {
        if (stopMatchmaking) this.stopMatchmaking();
        this.clearConnectionTimer();
        if (this.connection) {
            try { this.connection.close(); } catch {}
            this.connection = null;
        }
        if (this.peer && !this.peer.destroyed) {
            try { this.peer.destroy(); } catch {}
        }
        this.peer = null;
        this.isConnected = false;
        this.isHost = false;
        this.myColor = null;
        this.roomId = '';
        if (!silent) {
            this.setRoomInfo('', '');
            this.app.setOnlineColor(null);
            this.app.setStatus('Local pass and play.');
            this.app.updateUI();
        }
    }

    handleError(err) {
        this.clearConnectionTimer();
        const type = err?.type || err?.message || 'unknown';
        if (this.isMatchmaking && ['peer-unavailable', 'network', 'socket-error', 'socket-closed', 'disconnected', 'server-error', 'webrtc'].includes(type)) {
            this.retryMatchmaking(this.matchmakingIndex + 1);
            return;
        }
        this.stopMatchmaking();
        const message = type === 'webrtc'
            ? 'WebRTC could not connect these two networks. Keep the host room open, try another network, or use a reliable TURN relay.'
            : `Online connection error: ${type}`;
        this.app.setStatus(message);
        this.app.updateUI();
    }
}
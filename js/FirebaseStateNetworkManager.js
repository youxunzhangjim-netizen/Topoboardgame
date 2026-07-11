import { getOnlineClientMetadata } from './shared/OnlineConfig.js';
import { canJoinRoom, formatOnlineStatusMetadata } from './shared/OnlineCompatibility.js';

let onlineApiPromise = null;

function loadOnlineApi() {
    if (!onlineApiPromise) onlineApiPromise = import('../online.js');
    return onlineApiPromise;
}

function cloneState(value) {
    return value == null ? value : JSON.parse(JSON.stringify(value));
}

function defaultTurnFromState(state, app) {
    const turn = state?.currentPlayer
        || state?.logic?.currentPlayer
        || app?.logic?.currentPlayer
        || 'black';
    if (turn === 'A') return 'black';
    if (turn === 'B') return 'white';
    if (turn === 'C') return 'black';
    return turn;
}

function currentUiLanguage() {
    try {
        const stored = localStorage.getItem('topoboardgame-language')
            || localStorage.getItem('language')
            || document.documentElement.lang
            || navigator.language
            || 'en';
        return String(stored).toLowerCase().startsWith('zh') ? 'zh' : 'en';
    } catch {
        return 'en';
    }
}

function setConnectionText(el, message, room) {
    const metadata = getOnlineClientMetadata();
    const compatibility = room
        ? canJoinRoom({
            roomProtocolVersion: metadata.roomProtocolVersion,
            onlinePool: metadata.onlinePool
        }, room)
        : { ok: false, problems: [] };
    const primary = document.createElement('div');
    primary.textContent = message;
    const meta = document.createElement('div');
    meta.className = 'online-status-meta';
    meta.textContent = formatOnlineStatusMetadata({
        ...metadata,
        includeRoomStatus: Boolean(room),
        compatible: compatibility.ok,
        versionMismatch: compatibility.problems.includes('Online protocol version mismatch.')
    }, currentUiLanguage());
    meta.style.fontSize = '0.72em';
    meta.style.lineHeight = '1.25';
    meta.style.opacity = '0.72';
    meta.style.marginTop = '0.25rem';
    el.replaceChildren(primary, meta);
}

function setConnectionStatus(roomId, room) {
    const el = document.getElementById('connectionStatus');
    if (!el) return;
    const status = room?.status || (roomId ? 'waiting' : 'disconnected');
    el.classList.remove('disconnected', 'connecting', 'connected');
    if (status === 'playing') {
        el.classList.add('connected');
        setConnectionText(el, 'Connected', room);
    } else if (roomId || status === 'waiting') {
        el.classList.add('connecting');
        setConnectionText(el, 'Waiting for opponent', room);
    } else {
        el.classList.add('disconnected');
        setConnectionText(el, 'Disconnected', room);
    }
}

function setRoomInfo(roomId) {
    const roomInfo = document.getElementById('roomInfo');
    const roomIdDisplay = document.getElementById('roomIdDisplay');
    const shareLinkInput = document.getElementById('shareLinkInput');
    if (roomInfo) roomInfo.hidden = !roomId;
    if (roomIdDisplay) roomIdDisplay.textContent = roomId || '';
    if (shareLinkInput) {
        if (roomId) {
            const url = new URL(window.location.href);
            url.searchParams.set('room', roomId);
            shareLinkInput.value = url.href;
        } else {
            shareLinkInput.value = '';
        }
    }
}

export class FirebaseStateNetworkManager {
    constructor(app, options = {}) {
        this.app = app;
        this.gameKey = options.gameKey || app.onlineGameKey?.() || 'topoboardgame';
        this.matchKey = options.matchKey || app.onlineMatchKey?.() || this.gameKey;
        this.isConnected = false;
        this.roomId = '';
        this.myColor = null;
        this.peer = { id: '' };
        this.onlineApi = null;

        this.ready = null;
    }

    hooks(api = this.onlineApi) {
        this.gameKey = this.app.onlineGameKey?.() || this.gameKey || 'topoboardgame';
        this.matchKey = this.app.onlineMatchKey?.() || this.matchKey || this.gameKey;
        const app = this.app;
        return {
            gameKey: this.gameKey,
            matchKey: this.matchKey,
            getCurrentBoardState: () => cloneState(app.exportNetworkState?.() || app.exportState?.() || app.getCurrentBoardState?.()),
            loadBoardState: (state) => app.importNetworkState?.(cloneState(state))
                || app.importState?.(cloneState(state))
                || app.loadBoardState?.(cloneState(state)),
            applyMove: (state, move, color) => {
                if (typeof app.applyMoveToBoardState === 'function') {
                    return cloneState(app.applyMoveToBoardState(cloneState(state), move, color));
                }
                if (!state || !move?.boardState) return null;
                const expectedTurn = defaultTurnFromState(state, app);
                if (expectedTurn !== color) return null;
                return cloneState(move.boardState);
            },
            renderBoard: () => app.renderBoard?.() || app.updateUI?.() || app.render?.(),
            showOnlineStatus: (text) => app.showOnlineStatus?.(text) || app.setStatus?.(text),
            getCurrentTurn: (state) => defaultTurnFromState(state, app),
            getTurnFromBoard: (state) => defaultTurnFromState(state, app),
            onRoomChanged: ({ roomId, playerColor, room }) => {
                const online = api?.getOnlineState?.() || {};
                this.roomId = roomId || '';
                this.myColor = playerColor || null;
                this.peer.id = online.uid || '';
                this.isConnected = room?.status === 'playing';
                app.myColor = this.myColor;
                setConnectionStatus(roomId, room);
                setRoomInfo(roomId);
                if (room?.status === 'waiting' && app.onlineColorEl) {
                    app.onlineColorEl.textContent = 'Waiting for opponent';
                } else {
                    app.setOnlineColor?.(this.myColor, roomId, room);
                }
                app.updateOnlineRoomUI?.(roomId, this.myColor, room);
                app.updateUI?.();
            },
            onChatMessages: (messages) => {
                if (typeof app.renderOnlineChatMessages === 'function') {
                    app.renderOnlineChatMessages(messages || []);
                } else if (typeof app.receiveChatMessage === 'function') {
                    (messages || []).forEach((message) => app.receiveChatMessage({
                        id: message.id,
                        sender: message.uid === (api?.getOnlineState?.().uid || '') ? 'me' : 'opponent',
                        player: message.player,
                        author: message.displayName || message.player,
                        displayName: message.displayName || '',
                        text: message.text
                    }));
                }
            }
        };
    }

    async init() {
        this.onlineApi = await loadOnlineApi();
        this.ready = this.onlineApi.initOnline(this.hooks(this.onlineApi));
        return this.ready;
    }

    setOnlineMessage(text) {
        this.app.setStatus?.(text);
        if (this.app.onlineColorEl) this.app.onlineColorEl.textContent = text;
        setConnectionStatus(this.roomId, null);
    }

    async ensureReady() {
        try {
            const ready = await this.init();
            if (ready && !ready.ok) {
                this.setOnlineMessage(ready.error || 'Online rooms are not available yet.');
            }
            return ready?.ok ? ready : null;
        } catch (error) {
            this.setOnlineMessage(`Online rooms are not available yet: ${error.message}`);
            return null;
        }
    }

    async createRoom() {
        try {
            const ready = await this.ensureReady();
            if (!ready) return null;
            return await this.onlineApi.createPrivateRoom(this.app.exportNetworkState?.() || this.app.exportState?.());
        } catch (error) {
            this.setOnlineMessage(`Could not create room: ${error.message}`);
            return null;
        }
    }

    async findMatch() {
        try {
            const ready = await this.ensureReady();
            if (!ready) return null;
            return await this.onlineApi.findMatch(this.app.exportNetworkState?.() || this.app.exportState?.());
        } catch (error) {
            this.setOnlineMessage(`Matchmaking failed: ${error.message}`);
            return null;
        }
    }

    async joinRoom(roomId) {
        return this.resumeOrJoinRoom(roomId);
    }

    async resumeOrJoinRoom(roomId) {
        try {
            const ready = await this.ensureReady();
            if (!ready) return null;
            return await this.onlineApi.joinPrivateRoom(roomId);
        } catch (error) {
            this.setOnlineMessage(`Could not join room: ${error.message}`);
            return null;
        }
    }

    async reconnect() {
        try {
            const ready = await this.ensureReady();
            if (!ready) return false;
            const result = await this.onlineApi.reconnectRoom();
            return Boolean(result.ok);
        } catch (error) {
            this.setOnlineMessage(`Reconnect failed: ${error.message}`);
            return false;
        }
    }

    async sendState(move = {}) {
        if (!this.isConnected) return false;
        try {
            if (!this.onlineApi) return false;
            await this.onlineApi.sendMove({
                type: move.type || 'state_update',
                boardState: this.app.exportNetworkState?.() || this.app.exportState?.() || this.app.getCurrentBoardState?.()
            });
            return true;
        } catch (error) {
            this.setOnlineMessage(`Move was not synchronized: ${error.message}`);
            return false;
        }
    }

    async sendChat(message) {
        const text = typeof message === 'string' ? message : message?.text;
        try {
            if (!this.onlineApi) return false;
            return await this.onlineApi.sendChatMessage(text);
        } catch (error) {
            this.setOnlineMessage(`Chat failed: ${error.message}`);
            return false;
        }
    }

    async close(options = {}) {
        if (this.onlineApi) {
            await this.onlineApi.leaveRoom({ updateRemote: options.silent ? false : true });
        }
        this.isConnected = false;
        this.roomId = '';
        this.myColor = null;
        setConnectionStatus('', null);
        setRoomInfo('');
    }

    persistState() {
        return this.sendState({ type: 'state_update' });
    }

    sendMove(move = {}) {
        return this.sendState({
            ...move,
            type: move.type || 'move'
        });
    }

    sendMessage(message = {}) {
        if (message?.type === 'chat') return this.sendChat(message);
        if (message?.type === 'newGame') {
            this.setOnlineMessage('Start a new online room for a rematch.');
            return false;
        }
        return this.sendState(message);
    }

    refreshStatus() {
        if (this.isConnected) {
            this.setOnlineMessage(`Connected${this.myColor ? ` as ${this.myColor}` : ''}.`);
            return;
        }
        this.setOnlineMessage('Offline. Local play is available.');
    }

    setStatus(_state, text) {
        this.setOnlineMessage(text || 'Offline. Local play is available.');
    }
}

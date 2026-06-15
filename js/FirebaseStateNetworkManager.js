import {
    createPrivateRoom,
    findMatch,
    getOnlineState,
    initOnline,
    joinPrivateRoom,
    leaveRoom,
    reconnectRoom,
    sendChatMessage,
    sendMove
} from '../online.js';

function cloneState(value) {
    return value == null ? value : JSON.parse(JSON.stringify(value));
}

function defaultTurnFromState(state, app) {
    return state?.currentPlayer
        || state?.logic?.currentPlayer
        || app?.logic?.currentPlayer
        || 'black';
}

function setConnectionStatus(roomId, room) {
    const el = document.getElementById('connectionStatus');
    if (!el) return;
    const status = room?.status || (roomId ? 'waiting' : 'disconnected');
    el.classList.remove('disconnected', 'connecting', 'connected');
    if (status === 'playing') {
        el.classList.add('connected');
        el.textContent = 'Connected';
    } else if (roomId || status === 'waiting') {
        el.classList.add('connecting');
        el.textContent = 'Waiting for opponent';
    } else {
        el.classList.add('disconnected');
        el.textContent = 'Disconnected';
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

        this.ready = this.init();
    }

    hooks() {
        this.gameKey = this.app.onlineGameKey?.() || this.gameKey || 'topoboardgame';
        this.matchKey = this.app.onlineMatchKey?.() || this.matchKey || this.gameKey;
        const app = this.app;
        return {
            gameKey: this.gameKey,
            matchKey: this.matchKey,
            getCurrentBoardState: () => cloneState(app.exportNetworkState?.() || app.exportState?.()),
            loadBoardState: (state) => app.importNetworkState?.(cloneState(state)) || app.importState?.(cloneState(state)),
            applyMove: (state, move, color) => {
                if (!state || !move?.boardState) return null;
                const expectedTurn = defaultTurnFromState(state, app);
                if (expectedTurn !== color) return null;
                return cloneState(move.boardState);
            },
            renderBoard: () => app.updateUI?.() || app.render?.(),
            showOnlineStatus: (text) => app.setStatus?.(text),
            getCurrentTurn: (state) => defaultTurnFromState(state, app),
            getTurnFromBoard: (state) => defaultTurnFromState(state, app),
            onRoomChanged: ({ roomId, playerColor, room }) => {
                const online = getOnlineState();
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
                        sender: message.uid === getOnlineState().uid ? 'me' : 'opponent',
                        player: message.player,
                        text: message.text
                    }));
                }
            }
        };
    }

    init() {
        this.ready = initOnline(this.hooks());
        return this.ready;
    }

    setOnlineMessage(text) {
        this.app.setStatus?.(text);
        if (this.app.onlineColorEl) this.app.onlineColorEl.textContent = text;
        setConnectionStatus(this.roomId, null);
    }

    async ensureReady() {
        const ready = await this.init();
        if (ready && !ready.ok) {
            this.setOnlineMessage(ready.error || 'Online rooms are not available yet.');
        }
        return ready?.ok ? ready : null;
    }

    async createRoom() {
        try {
            const ready = await this.ensureReady();
            if (!ready) return null;
            return await createPrivateRoom(this.app.exportNetworkState?.() || this.app.exportState?.());
        } catch (error) {
            this.setOnlineMessage(`Could not create room: ${error.message}`);
            return null;
        }
    }

    async findMatch() {
        try {
            const ready = await this.ensureReady();
            if (!ready) return null;
            return await findMatch(this.app.exportNetworkState?.() || this.app.exportState?.());
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
            return await joinPrivateRoom(roomId);
        } catch (error) {
            this.setOnlineMessage(`Could not join room: ${error.message}`);
            return null;
        }
    }

    async reconnect() {
        try {
            const ready = await this.ensureReady();
            if (!ready) return false;
            const result = await reconnectRoom();
            return Boolean(result.ok);
        } catch (error) {
            this.setOnlineMessage(`Reconnect failed: ${error.message}`);
            return false;
        }
    }

    async sendState(move = {}) {
        if (!this.isConnected) return false;
        try {
            await sendMove({
                type: move.type || 'state_update',
                boardState: this.app.exportNetworkState?.() || this.app.exportState?.()
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
            return await sendChatMessage(text);
        } catch (error) {
            this.setOnlineMessage(`Chat failed: ${error.message}`);
            return false;
        }
    }

    async close(options = {}) {
        await leaveRoom({ updateRemote: options.silent ? false : true });
        this.isConnected = false;
        this.roomId = '';
        this.myColor = null;
        setConnectionStatus('', null);
        setRoomInfo('');
    }
}

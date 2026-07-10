import { FirebaseStateNetworkManager } from '../FirebaseStateNetworkManager.js';
import { getOnlineClientMetadata } from '../shared/OnlineConfig.js';
import { canJoinRoom, formatOnlineStatusMetadata } from '../shared/OnlineCompatibility.js';

function fallbackText(key, values = {}) {
    const dictionary = {
        black: 'Black',
        white: 'White',
        connectOnline: 'Connect or join an Online room before placing.',
        waitingFor: 'Waiting for {color}.',
        onlineAs: 'Online as {color}',
        waitingOpponent: 'Waiting for opponent',
        disconnected: 'Disconnected',
        syncedOnline: 'Online board synchronized.',
        chatEmpty: 'Connect online to chat.',
        you: 'You'
    };
    return String(dictionary[key] || key).replace(/\{(\w+)\}/g, (_, name) => values[name] ?? '');
}

function makeText(app) {
    return (key, values = {}) => {
        if (typeof app.text === 'function') return app.text(key, values);
        return fallbackText(key, values);
    };
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

function setConnectionText(element, className, message, room = null) {
    if (!element) return;
    element.classList.remove('disconnected', 'connecting', 'connected');
    element.classList.add(className);
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
    element.replaceChildren(primary, meta);
}

export function createHexOnlineController(app, options = {}) {
    const elements = app.onlineElements || {};
    const text = makeText(app);
    const network = new FirebaseStateNetworkManager(app, {
        gameKey: options.gameKey || app.onlineGameKey?.(),
        matchKey: options.matchKey || app.onlineMatchKey?.()
    });

    function colorName(color) {
        return color === 'white' ? text('white') : text('black');
    }

    function isOnlineMode() {
        return app.getMode?.() === 'online';
    }

    function setStatus(message) {
        if (typeof app.setStatus === 'function') app.setStatus(message);
    }

    function setOnlineColor(color, roomId = network.roomId, room = null) {
        app.myColor = color || null;
        if (room?.status === 'waiting' || (roomId && !network.isConnected)) {
            setConnectionText(elements.connectionStatus, 'connecting', text('waitingOpponent'), room);
            return;
        }
        if (color) {
            setConnectionText(elements.connectionStatus, 'connected', text('onlineAs', { color: colorName(color) }), room);
        } else {
            setConnectionText(elements.connectionStatus, 'disconnected', text('disconnected'));
        }
    }

    function updateOnlineRoomUI(roomId, color, room) {
        if (roomId && elements.mode) elements.mode.value = 'online';
        updateMode({ closeWhenLocal: false });
        setOnlineColor(color, roomId, room);
    }

    function canActFor(color) {
        if (!isOnlineMode()) return true;
        if (!network.isConnected || !app.myColor) {
            setStatus(text('connectOnline'));
            return false;
        }
        if (app.myColor !== color) {
            setStatus(text('waitingFor', { color: colorName(color) }));
            return false;
        }
        return true;
    }

    function broadcastState() {
        if (isOnlineMode() && network.isConnected) {
            network.sendState({ type: 'hex_move' });
        }
    }

    function updateMode({ closeWhenLocal = true } = {}) {
        const online = isOnlineMode();
        if (elements.onlineControls) elements.onlineControls.hidden = !online;
        if (!online) {
            app.myColor = null;
            setOnlineColor(null);
            if (closeWhenLocal && (network.isConnected || network.roomId)) network.close({ silent: true });
        }
    }

    function enterOnlineMode() {
        if (elements.mode) elements.mode.value = 'online';
        updateMode({ closeWhenLocal: false });
    }

    function renderOnlineChatMessages(messages = []) {
        if (!elements.chatMessages) return;
        elements.chatMessages.replaceChildren();
        if (!messages.length) {
            const empty = document.createElement('div');
            empty.className = 'chat-empty';
            empty.textContent = text('chatEmpty');
            elements.chatMessages.append(empty);
            return;
        }
        const ownUid = network.onlineApi?.getOnlineState?.().uid || '';
        for (const message of messages) {
            const row = document.createElement('div');
            row.className = 'chat-message';
            const author = message.uid === ownUid
                ? text('you')
                : (message.displayName || message.player || text('opponent'));
            row.textContent = `${author}: ${message.text || ''}`;
            elements.chatMessages.append(row);
        }
        elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;
    }

    function sendChat() {
        const message = elements.chatInput?.value.trim();
        if (!message) return;
        if (!isOnlineMode() || !network.isConnected) {
            setStatus(text('connectOnline'));
            return;
        }
        network.sendChat({ text: message });
        elements.chatInput.value = '';
    }

    function joinRoomFromInput() {
        const roomId = elements.roomId?.value.trim();
        if (roomId) {
            enterOnlineMode();
            network.joinRoom(roomId);
        }
    }

    function tryJoinSharedRoomFromUrl() {
        const roomId = new URLSearchParams(window.location.search).get('room');
        if (!roomId) return;
        if (elements.mode) elements.mode.value = 'online';
        updateMode({ closeWhenLocal: false });
        window.setTimeout(() => network.resumeOrJoinRoom(roomId), 150);
    }

    function refreshLabels() {
        if (!isOnlineMode()) {
            setOnlineColor(null);
            return;
        }
        setOnlineColor(app.myColor, network.roomId);
    }

    elements.mode?.addEventListener('change', () => updateMode());
    elements.findMatch?.addEventListener('click', () => { enterOnlineMode(); network.findMatch(); });
    elements.createRoom?.addEventListener('click', () => { enterOnlineMode(); network.createRoom(); });
    elements.joinRoom?.addEventListener('click', joinRoomFromInput);
    elements.chatSend?.addEventListener('click', sendChat);
    elements.chatInput?.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') sendChat();
    });

    app.network = network;
    app.myColor = null;
    app.canActForOnline = canActFor;
    app.broadcastOnlineState = broadcastState;
    app.setOnlineColor = setOnlineColor;
    app.updateOnlineRoomUI = updateOnlineRoomUI;
    app.renderOnlineChatMessages = renderOnlineChatMessages;

    updateMode({ closeWhenLocal: false });
    tryJoinSharedRoomFromUrl();

    return {
        network,
        canActFor,
        broadcastState,
        updateMode,
        refreshLabels,
        renderOnlineChatMessages
    };
}

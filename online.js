import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.14.0/firebase-app.js';
import {
    getAuth,
    onAuthStateChanged,
    signInAnonymously
} from 'https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js';
import {
    addDoc,
    collection,
    doc,
    getDocs,
    initializeFirestore,
    limit,
    onSnapshot,
    orderBy,
    query,
    runTransaction,
    serverTimestamp,
    setDoc,
    updateDoc,
    where
} from 'https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js';
import { firebaseConfig, hasFirebaseConfig } from './firebaseConfig.js';

const roomsPath = 'rooms';

let auth = null;
let db = null;
let user = null;
let roomId = '';
let playerColor = null;
let unsubscribeRoom = null;
let unsubscribeChat = null;
let initialized = false;
let initializationPromise = null;
let hooks = {};
let latestRoom = null;
let lastLoadedMoveNumber = -1;
let firestoreReady = false;
let firestoreInitError = '';
const reconnectStorageKey = 'topoboardgame:firebase-room';
const operationTimeoutMs = 10000;
const matchmakingBucketMs = 60000;
const matchmakingSlotCount = 8;

function opposite(color) {
    return color === 'white' ? 'black' : 'white';
}

function randomPlayerColor() {
    return Math.random() < 0.5 ? 'white' : 'black';
}

function firestoreValue(value) {
    return value == null ? value : JSON.parse(JSON.stringify(value));
}

function stableHash(text) {
    let hash = 2166136261;
    const value = String(text || '');
    for (let index = 0; index < value.length; index += 1) {
        hash ^= value.charCodeAt(index);
        hash = Math.imul(hash, 16777619);
    }
    return (hash >>> 0).toString(36);
}

function encodeBoardForFirestore(value) {
    return JSON.stringify(firestoreValue(value ?? null));
}

function decodeBoardFromFirestore(value) {
    if (typeof value !== 'string') return value;
    try {
        return JSON.parse(value);
    } catch {
        return null;
    }
}

function normalizeRoomId(value) {
    const text = String(value || '').trim();
    try {
        const url = new URL(text, window.location.href);
        return String(url.searchParams.get('room') || text).trim();
    } catch {
        return text.replace(/^room=/i, '').trim();
    }
}

function roomMatchesCurrentBucket(room) {
    return room?.status === 'waiting'
        && room?.public === true
        && room?.matchKey === hooks.matchKey
        && room?.gameKey === hooks.gameKey
        && room?.players?.white !== user?.uid
        && room?.players?.black !== user?.uid;
}

function publicMatchRoomIds() {
    const bucket = Math.floor(Date.now() / matchmakingBucketMs);
    const key = stableHash(`${hooks.gameKey}:${hooks.matchKey}`);
    const buckets = [bucket - 1, bucket];
    const ids = [];
    for (const currentBucket of buckets) {
        for (let slot = 0; slot < matchmakingSlotCount; slot += 1) {
            ids.push(`match_${key}_${currentBucket}_${slot}`);
        }
    }
    return ids;
}

function status(text) {
    hooks.showOnlineStatus?.(text);
}

function requireReady() {
    if (firestoreInitError) {
        throw new Error(firestoreInitError);
    }
    if (!initialized || !db || !user || !firestoreReady) {
        throw new Error('Firebase online multiplayer is not initialized.');
    }
}

function withTimeout(promise, label = 'Firebase operation') {
    let timer = null;
    return Promise.race([
        promise,
        new Promise((_, reject) => {
            timer = window.setTimeout(() => {
                reject(new Error(`${label} timed out. Check that Cloud Firestore exists and the deployed rules allow this request.`));
            }, operationTimeoutMs);
        })
    ]).finally(() => window.clearTimeout(timer));
}

function roomReference(id = roomId) {
    return doc(db, roomsPath, id);
}

function waitForAuth(authInstance) {
    return new Promise((resolve, reject) => {
        const stop = onAuthStateChanged(authInstance, (nextUser) => {
            if (!nextUser) return;
            stop();
            resolve(nextUser);
        }, reject);
    });
}

async function verifyFirestoreService() {
    const token = await user.getIdToken();
    const url = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents/${roomsPath}?pageSize=1`;
    const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
    });
    if (response.ok) return true;
    const text = await response.text();
    if (/SERVICE_DISABLED|firestore.googleapis.com|disabled/i.test(text)) {
        throw new Error('Firebase rooms are unavailable because Cloud Firestore is disabled for this project. Enable Cloud Firestore / Firestore API in Firebase Console, then deploy firestore.rules. The older 3D Chess WebRTC rooms can still work because they do not use Firestore.');
    }
    if (/NOT_FOUND|database.*not.*found|Database does not exist/i.test(text)) {
        throw new Error('Firebase rooms are unavailable because the default Cloud Firestore database does not exist yet. Create the default Firestore database in Firebase Console, then deploy firestore.rules. The older 3D Chess WebRTC rooms can still work because they do not use Firestore.');
    }
    if (/PERMISSION_DENIED|Missing or insufficient permissions/i.test(text)) {
        throw new Error('Firebase rooms are unavailable because Cloud Firestore rules are blocking online rooms. Deploy the repository firestore.rules to the Topoboardgame Firebase project.');
    }
    throw new Error(`Cloud Firestore check failed (${response.status}).`);
}

export async function initOnline(options = {}) {
    hooks = {
        getCurrentBoardState: options.getCurrentBoardState,
        loadBoardState: options.loadBoardState,
        applyMove: options.applyMove,
        renderBoard: options.renderBoard,
        showOnlineStatus: options.showOnlineStatus,
        onRoomChanged: options.onRoomChanged,
        gameKey: String(options.gameKey || 'topological-boardgame'),
        matchKey: String(options.matchKey || options.gameKey || 'topological-boardgame'),
        getCurrentTurn: options.getCurrentTurn,
        getTurnFromBoard: options.getTurnFromBoard,
        onChatMessages: options.onChatMessages
    };

    if (!hasFirebaseConfig()) {
        status('Firebase config needed: fill in firebaseConfig.js.');
        return { ok: false, configured: false };
    }
    if (initializationPromise) return initializationPromise;
    if (initialized) {
        if (firestoreInitError) {
            status(firestoreInitError);
            return { ok: false, configured: true, error: firestoreInitError };
        }
        return { ok: true, user, roomId, playerColor };
    }

    initializationPromise = (async () => {
    const app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = initializeFirestore(app, {
        experimentalAutoDetectLongPolling: true
    });
    status('Signing in anonymously...');
    if (!auth.currentUser) await signInAnonymously(auth);
    user = auth.currentUser || await waitForAuth(auth);
    initialized = true;
    try {
        await verifyFirestoreService();
        firestoreReady = true;
        firestoreInitError = '';
    } catch (error) {
        firestoreReady = false;
        firestoreInitError = error.message;
        status(firestoreInitError);
        return { ok: false, configured: true, error: firestoreInitError };
    }
    status('Online ready.');
    return { ok: true, user, roomId, playerColor };
    })();
    return initializationPromise;
}

export async function createPrivateRoom(initialBoard) {
    requireReady();
    await leaveRoom({ updateRemote: false });

    const ref = doc(collection(db, roomsPath));
    const board = firestoreValue(initialBoard ?? hooks.getCurrentBoardState?.());
    const initialTurn = hooks.getCurrentTurn?.(board) || board?.currentPlayer || 'white';
    await withTimeout(setDoc(ref, {
        status: 'waiting',
        public: false,
        players: {
            white: initialTurn === 'white' ? user.uid : null,
            black: initialTurn === 'black' ? user.uid : null
        },
        turn: initialTurn,
        gameKey: hooks.gameKey,
        matchKey: hooks.matchKey,
        board: encodeBoardForFirestore(board),
        moveNumber: 0,
        lastMove: null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
    }), 'Create room');

    roomId = ref.id;
    playerColor = initialTurn;
    lastLoadedMoveNumber = 0;
    localStorage.setItem(reconnectStorageKey, roomId);
    status(`Private room ${roomId} created. Waiting for ${opposite(playerColor)}.`);
    listenToRoom(roomId);
    listenToChat(roomId);
    return { roomId, playerColor };
}

export async function joinPrivateRoom(rawRoomId) {
    requireReady();
    const requestedRoom = normalizeRoomId(rawRoomId);
    if (!requestedRoom) throw new Error('Enter a room code.');
    await leaveRoom({ updateRemote: false });

    const ref = roomReference(requestedRoom);
    const joined = await withTimeout(runTransaction(db, async (transaction) => {
        const snapshot = await transaction.get(ref);
        if (!snapshot.exists()) throw new Error('Room not found.');
        const room = snapshot.data();
        if (room.gameKey && room.gameKey !== hooks.gameKey) {
            throw new Error('This room belongs to a different game.');
        }
        if (room.public && room.matchKey && room.matchKey !== hooks.matchKey) {
            throw new Error('This room uses different match settings.');
        }
        const existingColor = room.players?.white === user.uid
            ? 'white'
            : room.players?.black === user.uid ? 'black' : null;
        if (existingColor) return { room, color: existingColor };
        const openColor = room.players?.white == null
            ? 'white'
            : room.players?.black == null ? 'black' : null;
        if (room.status !== 'waiting' || !openColor) {
            throw new Error('Room is full or already finished.');
        }
        transaction.update(ref, {
            [`players.${openColor}`]: user.uid,
            status: 'playing',
            updatedAt: serverTimestamp()
        });
        return {
            room: {
                ...room,
                status: 'playing',
                players: { ...room.players, [openColor]: user.uid }
            },
            color: openColor
        };
    }), 'Join room');

    roomId = requestedRoom;
    playerColor = joined.color;
    lastLoadedMoveNumber = Number(joined.room.moveNumber) || 0;
    localStorage.setItem(reconnectStorageKey, roomId);
    if (joined.room.board) {
        hooks.loadBoardState?.(decodeBoardFromFirestore(joined.room.board));
        hooks.renderBoard?.();
    }
    status(`Joined room ${roomId} as ${playerColor}.`);
    listenToRoom(roomId);
    listenToChat(roomId);
    return { roomId, playerColor };
}

async function findWaitingMatchCandidate() {
    const exactQuery = query(
        collection(db, roomsPath),
        where('status', '==', 'waiting'),
        where('public', '==', true),
        where('matchKey', '==', hooks.matchKey),
        limit(20)
    );
    try {
        const exactCandidates = await withTimeout(getDocs(exactQuery), 'Find match');
        const exact = exactCandidates.docs.find((candidate) => roomMatchesCurrentBucket(candidate.data()));
        if (exact) return exact.id;
    } catch (error) {
        if (!/index|requires an index|FAILED_PRECONDITION/i.test(error?.message || '')) {
            throw error;
        }
        status('Match index is not ready yet; using compatibility search.');
    }

    const fallbackQuery = query(
        collection(db, roomsPath),
        where('status', '==', 'waiting'),
        limit(80)
    );
    const candidates = await withTimeout(getDocs(fallbackQuery), 'Find match');
    const match = candidates.docs.find((candidate) => roomMatchesCurrentBucket(candidate.data()));
    return match?.id || '';
}

export async function findMatch(initialBoard) {
    requireReady();
    await leaveRoom({ updateRemote: false });
    status(`Looking for a public match (${hooks.matchKey})...`);

    const board = firestoreValue(initialBoard ?? hooks.getCurrentBoardState?.());
    const initialTurn = hooks.getCurrentTurn?.(board) || board?.currentPlayer || 'white';
    const firstPlayerColor = randomPlayerColor();
    const roomTemplate = {
        status: 'waiting',
        public: true,
        players: {
            white: firstPlayerColor === 'white' ? user.uid : null,
            black: firstPlayerColor === 'black' ? user.uid : null
        },
        turn: initialTurn,
        gameKey: hooks.gameKey,
        matchKey: hooks.matchKey,
        board: encodeBoardForFirestore(board),
        moveNumber: 0,
        lastMove: null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
    };

    for (const id of publicMatchRoomIds()) {
        const ref = roomReference(id);
        try {
            const result = await withTimeout(runTransaction(db, async (transaction) => {
                const snapshot = await transaction.get(ref);
                if (!snapshot.exists()) {
                    transaction.set(ref, roomTemplate);
                    return { action: 'created', roomId: id, color: firstPlayerColor, room: roomTemplate };
                }
                const room = snapshot.data();
                if (room.gameKey !== hooks.gameKey || room.matchKey !== hooks.matchKey) return null;
                const existingColor = room.players?.white === user.uid
                    ? 'white'
                    : room.players?.black === user.uid ? 'black' : null;
                if (existingColor && room.status === 'waiting') {
                    return { action: 'waiting', roomId: id, color: existingColor, room };
                }
                if (!roomMatchesCurrentBucket(room)) return null;
                const openColor = room.players?.white == null
                    ? 'white'
                    : room.players?.black == null ? 'black' : null;
                if (!openColor) return null;
                transaction.update(ref, {
                    [`players.${openColor}`]: user.uid,
                    status: 'playing',
                    updatedAt: serverTimestamp()
                });
                return {
                    action: 'joined',
                    roomId: id,
                    color: openColor,
                    room: {
                        ...room,
                        status: 'playing',
                        players: { ...room.players, [openColor]: user.uid }
                    }
                };
            }), 'Find match');
            if (!result) continue;
            roomId = result.roomId;
            playerColor = result.color;
            lastLoadedMoveNumber = Number(result.room?.moveNumber) || 0;
            localStorage.setItem(reconnectStorageKey, roomId);
            if (result.room?.board && result.action === 'joined') {
                hooks.loadBoardState?.(decodeBoardFromFirestore(result.room.board));
                hooks.renderBoard?.();
            }
            status(result.action === 'joined'
                ? `Matched in room ${roomId} as ${playerColor}.`
                : `Room ${roomId}: waiting for an opponent.`);
            listenToRoom(roomId);
            listenToChat(roomId);
            return { roomId, playerColor };
        } catch {
            // Try the next deterministic slot if this one races or fails.
        }
    }

    const existingRoomId = await findWaitingMatchCandidate();
    if (existingRoomId) return joinPrivateRoom(existingRoomId);
    throw new Error('Could not reserve a matchmaking slot. Try Find Match again.');
}

export function listenToRoom(id = roomId) {
    requireReady();
    const normalized = normalizeRoomId(id);
    if (!normalized) throw new Error('A room code is required.');
    unsubscribeRoom?.();
    roomId = normalized;

    unsubscribeRoom = onSnapshot(roomReference(normalized), (snapshot) => {
        if (!snapshot.exists()) {
            status('Room no longer exists.');
            return;
        }
        const room = snapshot.data();
        latestRoom = room;
        const color = room.players?.white === user.uid
            ? 'white'
            : room.players?.black === user.uid ? 'black' : null;
        if (color) playerColor = color;

        const remoteMoveNumber = Number(room.moveNumber) || 0;
        if (room.board && remoteMoveNumber > lastLoadedMoveNumber) {
            lastLoadedMoveNumber = remoteMoveNumber;
            hooks.loadBoardState?.(decodeBoardFromFirestore(room.board));
            hooks.renderBoard?.();
        }
        const hookRoom = room.board
            ? { ...room, board: decodeBoardFromFirestore(room.board) }
            : room;
        hooks.onRoomChanged?.({
            roomId,
            playerColor,
            room: hookRoom
        });

        if (room.status === 'waiting') {
            status(`Room ${roomId}: waiting for an opponent.`);
        } else if (room.status === 'playing') {
            status(`Connected as ${playerColor}. ${room.turn} to move.`);
        } else {
            status(`Room ${roomId} finished.`);
        }
    }, (error) => {
        status(`Room connection failed: ${error.message}`);
    });
    return unsubscribeRoom;
}

export async function sendMove(move) {
    requireReady();
    if (!roomId || !playerColor) throw new Error('Join a room before moving.');
    const ref = roomReference();

    await withTimeout(runTransaction(db, async (transaction) => {
        const snapshot = await transaction.get(ref);
        if (!snapshot.exists()) throw new Error('Room not found.');
        const room = snapshot.data();
        if (room.status !== 'playing') throw new Error('The game is not ready.');
        if (room.players?.[playerColor] !== user.uid) throw new Error('You are not a player in this room.');
        if (room.turn !== playerColor) throw new Error(`It is ${room.turn}'s turn.`);

        // Client-side validation is acceptable for this prototype. A commercial
        // game needs server-authoritative validation (for example Cloud
        // Functions or a trusted game server) because clients can be modified.
        const currentBoard = decodeBoardFromFirestore(room.board);
        const nextBoard = firestoreValue(await hooks.applyMove?.(currentBoard, move, playerColor));
        if (!nextBoard) throw new Error('Illegal move.');
        const { boardState: _clientSnapshot, ...lastMove } = move;

        const nextTurn = hooks.getTurnFromBoard?.(nextBoard)
            || nextBoard?.currentPlayer
            || opposite(playerColor);
        transaction.update(ref, {
            board: encodeBoardForFirestore(nextBoard),
            turn: nextTurn,
            moveNumber: (Number(room.moveNumber) || 0) + 1,
            lastMove: {
                ...lastMove,
                player: playerColor,
                uid: user.uid
            },
            updatedAt: serverTimestamp()
        });
    }), 'Send move');
}

export function listenToChat(id = roomId) {
    requireReady();
    const normalized = normalizeRoomId(id);
    if (!normalized) return null;
    unsubscribeChat?.();
    const messagesQuery = query(
        collection(db, roomsPath, normalized, 'messages'),
        orderBy('createdAt', 'asc'),
        limit(100)
    );
    unsubscribeChat = onSnapshot(messagesQuery, (snapshot) => {
        hooks.onChatMessages?.(snapshot.docs.map((message) => ({
            id: message.id,
            ...message.data()
        })));
    }, (error) => {
        status(`Chat connection failed: ${error.message}`);
    });
    return unsubscribeChat;
}

export async function sendChatMessage(text) {
    requireReady();
    const message = String(text || '').trim().slice(0, 240);
    if (!roomId || !playerColor) throw new Error('Join a room before chatting.');
    if (!message) return false;
    await withTimeout(addDoc(collection(db, roomsPath, roomId, 'messages'), {
        text: message,
        uid: user.uid,
        player: playerColor,
        createdAt: serverTimestamp()
    }), 'Send chat');
    return true;
}

export function subscribeWaitingRooms(callback) {
    requireReady();
    const waitingQuery = query(
        collection(db, roomsPath),
        where('status', 'in', ['waiting', 'playing']),
        limit(200)
    );
    return onSnapshot(waitingQuery, (snapshot) => {
        callback(snapshot.docs.map((room) => ({ id: room.id, ...room.data() })));
    }, (error) => {
        callback([], error);
    });
}

export async function leaveRoom({ updateRemote = true, forget = true } = {}) {
    unsubscribeRoom?.();
    unsubscribeRoom = null;
    unsubscribeChat?.();
    unsubscribeChat = null;

    if (updateRemote && initialized && roomId && user) {
        const ref = roomReference();
        try {
            await runTransaction(db, async (transaction) => {
                const snapshot = await transaction.get(ref);
                if (!snapshot.exists()) return;
                const room = snapshot.data();
                const color = room.players?.white === user.uid
                    ? 'white'
                    : room.players?.black === user.uid ? 'black' : null;
                if (!color) return;
                transaction.update(ref, {
                    [`players.${color}`]: null,
                    status: 'finished',
                    updatedAt: serverTimestamp()
                });
            });
        } catch {
            // Leaving should still clean up local state if the network is gone.
        }
    }

    roomId = '';
    playerColor = null;
    latestRoom = null;
    lastLoadedMoveNumber = -1;
    if (forget) localStorage.removeItem(reconnectStorageKey);
    hooks.onRoomChanged?.({ roomId: '', playerColor: null, room: null });
    hooks.onChatMessages?.([]);
    status('Offline.');
}

export async function reconnectRoom() {
    requireReady();
    const urlRoom = new URLSearchParams(window.location.search).get('room');
    const rememberedRoom = localStorage.getItem(reconnectStorageKey);
    const target = normalizeRoomId(urlRoom || rememberedRoom);
    if (!target) return { ok: false, error: 'No remembered room.' };
    try {
        const result = await joinPrivateRoom(target);
        return { ok: true, ...result };
    } catch (error) {
        localStorage.removeItem(reconnectStorageKey);
        throw error;
    }
}

export function getOnlineState() {
    return {
        initialized,
        configured: hasFirebaseConfig(),
        uid: user?.uid || null,
        roomId,
        playerColor,
        room: latestRoom
    };
}

export class FirebaseOnlineAdapter {
    constructor(game) {
        this.game = game;
        this.isConnected = false;
        this.roomId = '';
        this.myColor = null;
        this.ready = initOnline({
            getCurrentBoardState: () => game.getCurrentBoardState(),
            loadBoardState: (state) => game.loadBoardState(state),
            applyMove: (state, move, color) => game.applyMoveToBoardState(state, move, color),
            renderBoard: () => {
                game.renderBoard();
                game.updateUI();
            },
            showOnlineStatus: (text) => game.showOnlineStatus(text),
            onRoomChanged: ({ roomId: nextRoomId, playerColor: color, room }) => {
                this.roomId = nextRoomId;
                this.myColor = color;
                this.isConnected = room?.status === 'playing';
                game.myColor = color;
                game.updateOnlineRoomUI(nextRoomId, color, room);
                game.updateUI();
            },
            gameKey: game.onlineGameKey?.() || '2dchess',
            matchKey: game.onlineMatchKey?.() || game.onlineGameKey?.() || '2dchess',
            getCurrentTurn: (state) => state?.currentPlayer || game.currentPlayer,
            getTurnFromBoard: (state) => state?.currentPlayer
        });
    }

    async createRoom() {
        try {
            const ready = await this.ready;
            if (!ready.ok) return;
            const result = await createPrivateRoom(this.game.getCurrentBoardState());
            this.roomId = result.roomId;
            this.myColor = result.playerColor;
            this.game.myColor = result.playerColor;
            this.game.updateOnlineRoomUI(this.roomId, this.myColor, latestRoom);
        } catch (error) {
            this.game.showOnlineStatus(`Could not create room: ${error.message}`);
        }
    }

    async resumeOrJoinRoom(id) {
        try {
            const ready = await this.ready;
            if (!ready.ok) return;
            const result = await joinPrivateRoom(id);
            this.roomId = result.roomId;
            this.myColor = result.playerColor;
            this.game.myColor = result.playerColor;
        } catch (error) {
            this.game.showOnlineStatus(`Could not join room: ${error.message}`);
        }
    }

    async findMatch() {
        try {
            const ready = await this.ready;
            if (!ready.ok) return;
            const result = await findMatch(this.game.getCurrentBoardState());
            this.roomId = result.roomId;
            this.myColor = result.playerColor;
            this.game.myColor = result.playerColor;
        } catch (error) {
            this.game.showOnlineStatus(`Matchmaking failed: ${error.message}`);
        }
    }

    async sendMove(move) {
        // ChessGame.applyMove calls this immediately after a successful local
        // move. The current complete state accompanies the move so Firestore
        // becomes the shared authoritative snapshot for both browsers.
        try {
            return await sendMove({
                ...move,
                boardState: this.game.getCurrentBoardState()
            });
        } catch (error) {
            this.game.showOnlineStatus(`Move was not synchronized: ${error.message}`);
            return false;
        }
    }

    async close() {
        try {
            await leaveRoom();
        } catch (error) {
            this.game.showOnlineStatus(`Left locally: ${error.message}`);
        }
        this.isConnected = false;
        this.roomId = '';
        this.myColor = null;
    }

    async reconnect() {
        try {
            const ready = await this.ready;
            if (!ready.ok) return false;
            const result = await reconnectRoom();
            return Boolean(result.ok);
        } catch (error) {
            this.game.showOnlineStatus(`Reconnect failed: ${error.message}`);
            return false;
        }
    }

    persistState() {}

    refreshStatus() {
        const state = getOnlineState();
        if (!state.configured) this.game.showOnlineStatus('Firebase config needed: fill in firebaseConfig.js.');
    }

    setStatus(_state, text) {
        this.game.showOnlineStatus(text);
    }

    sendMessage(data) {
        if (data?.type === 'newGame') {
            this.game.showOnlineStatus('Start a new Firebase room for a rematch.');
        }
    }
}

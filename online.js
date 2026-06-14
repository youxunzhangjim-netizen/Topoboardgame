import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.14.0/firebase-app.js';
import {
    getAuth,
    onAuthStateChanged,
    signInAnonymously
} from 'https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js';
import {
    collection,
    doc,
    getDocs,
    getFirestore,
    limit,
    onSnapshot,
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
let initialized = false;
let hooks = {};
let latestRoom = null;
let lastLoadedMoveNumber = -1;

function opposite(color) {
    return color === 'white' ? 'black' : 'white';
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

function status(text) {
    hooks.showOnlineStatus?.(text);
}

function requireReady() {
    if (!initialized || !db || !user) {
        throw new Error('Firebase online multiplayer is not initialized.');
    }
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

export async function initOnline(options = {}) {
    hooks = {
        getCurrentBoardState: options.getCurrentBoardState,
        loadBoardState: options.loadBoardState,
        applyMove: options.applyMove,
        renderBoard: options.renderBoard,
        showOnlineStatus: options.showOnlineStatus,
        onRoomChanged: options.onRoomChanged
    };

    if (!hasFirebaseConfig()) {
        status('Firebase config needed: fill in firebaseConfig.js.');
        return { ok: false, configured: false };
    }
    if (initialized) return { ok: true, user, roomId, playerColor };

    const app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    status('Signing in anonymously...');
    if (!auth.currentUser) await signInAnonymously(auth);
    user = auth.currentUser || await waitForAuth(auth);
    initialized = true;
    status('Online ready.');
    return { ok: true, user, roomId, playerColor };
}

export async function createPrivateRoom(initialBoard) {
    requireReady();
    await leaveRoom({ updateRemote: false });

    const ref = doc(collection(db, roomsPath));
    const board = initialBoard ?? hooks.getCurrentBoardState?.();
    await setDoc(ref, {
        status: 'waiting',
        public: false,
        players: { white: user.uid, black: null },
        turn: 'white',
        board,
        moveNumber: 0,
        lastMove: null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
    });

    roomId = ref.id;
    playerColor = 'white';
    lastLoadedMoveNumber = 0;
    status(`Private room ${roomId} created. Waiting for Black.`);
    listenToRoom(roomId);
    return { roomId, playerColor };
}

export async function joinPrivateRoom(rawRoomId) {
    requireReady();
    const requestedRoom = normalizeRoomId(rawRoomId);
    if (!requestedRoom) throw new Error('Enter a room code.');
    await leaveRoom({ updateRemote: false });

    const ref = roomReference(requestedRoom);
    const joined = await runTransaction(db, async (transaction) => {
        const snapshot = await transaction.get(ref);
        if (!snapshot.exists()) throw new Error('Room not found.');
        const room = snapshot.data();
        const existingColor = room.players?.white === user.uid
            ? 'white'
            : room.players?.black === user.uid ? 'black' : null;
        if (existingColor) return { room, color: existingColor };
        if (room.status !== 'waiting' || room.players?.black) {
            throw new Error('Room is full or already finished.');
        }
        transaction.update(ref, {
            'players.black': user.uid,
            status: 'playing',
            updatedAt: serverTimestamp()
        });
        return {
            room: {
                ...room,
                status: 'playing',
                players: { ...room.players, black: user.uid }
            },
            color: 'black'
        };
    });

    roomId = requestedRoom;
    playerColor = joined.color;
    lastLoadedMoveNumber = Number(joined.room.moveNumber) || 0;
    if (joined.room.board) {
        hooks.loadBoardState?.(joined.room.board);
        hooks.renderBoard?.();
    }
    status(`Joined room ${roomId} as ${playerColor}.`);
    listenToRoom(roomId);
    return { roomId, playerColor };
}

export async function findMatch(initialBoard) {
    requireReady();
    await leaveRoom({ updateRemote: false });
    status('Looking for a public match...');

    const waitingQuery = query(
        collection(db, roomsPath),
        where('status', '==', 'waiting'),
        limit(20)
    );
    const candidates = await getDocs(waitingQuery);
    for (const candidate of candidates.docs) {
        if (!candidate.data().public || candidate.data().players?.white === user.uid) continue;
        try {
            return await joinPrivateRoom(candidate.id);
        } catch {
            // Another player may have claimed this room first; try the next one.
        }
    }

    const ref = doc(collection(db, roomsPath));
    const board = initialBoard ?? hooks.getCurrentBoardState?.();
    await setDoc(ref, {
        status: 'waiting',
        public: true,
        players: { white: user.uid, black: null },
        turn: 'white',
        board,
        moveNumber: 0,
        lastMove: null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
    });
    roomId = ref.id;
    playerColor = 'white';
    lastLoadedMoveNumber = 0;
    status('Public match created. Waiting for another player...');
    listenToRoom(roomId);
    return { roomId, playerColor };
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
            hooks.loadBoardState?.(room.board);
            hooks.renderBoard?.();
        }
        hooks.onRoomChanged?.({
            roomId,
            playerColor,
            room
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

    await runTransaction(db, async (transaction) => {
        const snapshot = await transaction.get(ref);
        if (!snapshot.exists()) throw new Error('Room not found.');
        const room = snapshot.data();
        if (room.status !== 'playing') throw new Error('The game is not ready.');
        if (room.players?.[playerColor] !== user.uid) throw new Error('You are not a player in this room.');
        if (room.turn !== playerColor) throw new Error(`It is ${room.turn}'s turn.`);

        // Client-side validation is acceptable for this prototype. A commercial
        // game needs server-authoritative validation (for example Cloud
        // Functions or a trusted game server) because clients can be modified.
        const nextBoard = await hooks.applyMove?.(room.board, move, playerColor);
        if (!nextBoard) throw new Error('Illegal move.');
        const { boardState: _clientSnapshot, ...lastMove } = move;

        transaction.update(ref, {
            board: nextBoard,
            turn: opposite(playerColor),
            moveNumber: (Number(room.moveNumber) || 0) + 1,
            lastMove: {
                ...lastMove,
                player: playerColor,
                uid: user.uid
            },
            updatedAt: serverTimestamp()
        });
    });
}

export async function leaveRoom({ updateRemote = true } = {}) {
    unsubscribeRoom?.();
    unsubscribeRoom = null;

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
    hooks.onRoomChanged?.({ roomId: '', playerColor: null, room: null });
    status('Offline.');
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
            }
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

import { getApp, getApps, initializeApp } from 'https://www.gstatic.com/firebasejs/12.14.0/firebase-app.js';
import {
    browserSessionPersistence,
    browserPopupRedirectResolver,
    getAuth,
    getRedirectResult,
    GoogleAuthProvider,
    initializeAuth,
    onAuthStateChanged,
    setPersistence,
    signInAnonymously,
    signInWithPopup,
    signInWithRedirect,
    signOut,
    updateProfile
} from 'https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js';
import {
    addDoc,
    collection,
    doc,
    getDoc,
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
const usersPath = 'users';
const authLogPrefix = '[Topoboardgame Firebase/Auth]';

function authLog(step, payload = undefined) {
    try {
        if (payload === undefined) console.log(authLogPrefix, step);
        else console.log(authLogPrefix, step, payload);
    } catch {
        // Ignore console failures in embedded browsers.
    }
}

function authWarn(step, payload = undefined) {
    try {
        if (payload === undefined) console.warn(authLogPrefix, step);
        else console.warn(authLogPrefix, step, payload);
    } catch {
        // Ignore console failures in embedded browsers.
    }
}

function authError(step, payload = undefined) {
    try {
        if (payload === undefined) console.error(authLogPrefix, step);
        else console.error(authLogPrefix, step, payload);
    } catch {
        // Ignore console failures in embedded browsers.
    }
}

function authErrorSummary(error) {
    return {
        code: error?.code || '',
        name: error?.name || '',
        message: String(error?.message || error || ''),
        stack: String(error?.stack || '')
    };
}

function authUserSummary(currentUser) {
    if (!currentUser) return null;
    return {
        uid: currentUser.uid || '',
        isAnonymous: Boolean(currentUser.isAnonymous),
        providerIds: Array.isArray(currentUser.providerData)
            ? currentUser.providerData.map((provider) => provider?.providerId).filter(Boolean)
            : [],
        emailVerified: Boolean(currentUser.emailVerified),
        displayName: currentUser.displayName || ''
    };
}

let firebaseApp = null;
let authReadyPromise = null;
let authObserverInstalled = false;
const accountListeners = new Set();

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
let lastProfileWrite = { ok: false, path: '', error: '' };
const reconnectStorageKey = 'topoboardgame:firebase-room';
const operationTimeoutMs = 10000;
const matchmakingBucketMs = 60000;
const matchmakingSlotCount = 8;
const identityBroadcastName = 'topoboardgame:firebase-identity';
const duplicateIdentityWaitMs = 220;
const tabInstanceId = globalThis.crypto?.randomUUID?.()
    || `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
let identityChannel = null;

const guestProfileStorageKey = 'topoboardgame:guest-profile';
const displayNameStorageKey = 'topoboardgame:display-name';
const displayNameMemory = new Map();

function safeLocalStorageGet(key) {
    try {
        return localStorage.getItem(key);
    } catch {
        return null;
    }
}

function safeLocalStorageSet(key, value) {
    try {
        localStorage.setItem(key, value);
    } catch {
        // Ignore blocked local storage.
    }
}
function safeLocalStorageRemove(key) {
    try {
        localStorage.removeItem(key);
    } catch {
        // Ignore blocked local storage.
    }
}

function sanitizeDisplayName(value) {
    const cleaned = String(value || '')
        .replace(/[\u0000-\u001f\u007f]/g, '')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 24);
    return cleaned || 'Player';
}

function userDisplayNameStorageKey(currentUser) {
    return currentUser?.uid ? `${displayNameStorageKey}:${currentUser.uid}` : displayNameStorageKey;
}

function localDisplayName(currentUser) {
    const key = userDisplayNameStorageKey(currentUser);
    return safeLocalStorageGet(key) || displayNameMemory.get(key) || '';
}

function setLocalDisplayName(currentUser, value) {
    const name = sanitizeDisplayName(value);
    const key = userDisplayNameStorageKey(currentUser);
    displayNameMemory.set(key, name);
    safeLocalStorageSet(key, name);
    return name;
}

function displayNameForUser(currentUser) {
    if (!currentUser) return 'Offline Guest';
    if (currentUser.isAnonymous) return guestDisplayName(currentUser);
    return sanitizeDisplayName(localDisplayName(currentUser) || currentUser.displayName || currentUser.email?.split('@')?.[0] || 'Player');
}


function shortUid(uid = '') {
    return String(uid).replace(/[^a-zA-Z0-9]/g, '').slice(0, 8) || Math.random().toString(36).slice(2, 10);
}

function guestDisplayName(currentUser) {
    const uid = currentUser?.uid || 'guest';
    const existing = safeLocalStorageGet(`${guestProfileStorageKey}:${uid}:name`);
    if (existing) return existing;
    const generated = 'Visitor';
    safeLocalStorageSet(`${guestProfileStorageKey}:${uid}:name`, generated);
    return generated;
}

function isGoogleUser(currentUser) {
    return Boolean(currentUser && !currentUser.isAnonymous);
}

function accountKindForUser(currentUser) {
    if (!currentUser) return 'offline-guest';
    return currentUser.isAnonymous ? 'visitor' : 'google';
}

function profilePathForUser(currentUser) {
    return currentUser?.uid ? `${usersPath}/${currentUser.uid}` : '';
}

function profileWriteStateForUser(currentUser) {
    const path = profilePathForUser(currentUser);
    if (!path) return { ok: false, path: '', error: '' };
    return lastProfileWrite.path === path
        ? { ...lastProfileWrite }
        : { ok: false, path, error: '' };
}

function getFirebaseAppInstance() {
    if (firebaseApp) return firebaseApp;
    firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
    return firebaseApp;
}

function notifyAccountListeners() {
    const state = getAccountState();
    for (const listener of accountListeners) {
        try {
            listener(state);
        } catch {
            // Account UI listeners should not break online gameplay.
        }
    }
    try {
        globalThis.dispatchEvent?.(new CustomEvent('topoboardgame:account-state', { detail: state }));
    } catch {
        // Ignore non-browser contexts.
    }
}

async function waitForInitialAuthState() {
    if (!auth) return null;
    if (authReadyPromise) return authReadyPromise;
    authReadyPromise = new Promise((resolve) => {
        const stop = onAuthStateChanged(auth, (nextUser) => {
            stop();
            user = nextUser || null;
            resolve(user);
        }, () => resolve(auth.currentUser || null));
    });
    return authReadyPromise;
}

function installAccountObserver() {
    if (!auth || authObserverInstalled) return;
    authObserverInstalled = true;
    onAuthStateChanged(auth, async (nextUser) => {
        user = nextUser || null;
        if (!nextUser) {
            lastProfileWrite = { ok: false, path: '', error: '' };
        }
        notifyAccountListeners();
        if (nextUser) {
            await upsertUserProfile(nextUser, { source: nextUser.isAnonymous ? 'visitor-auth-state' : 'auth-state' });
            notifyAccountListeners();
        }
    });
}

async function ensureFirebaseCore() {
    authLog('ensureFirebaseCore: entered', { hasConfig: hasFirebaseConfig(), hasAuth: Boolean(auth), hasDb: Boolean(db) });
    if (!hasFirebaseConfig()) {
        authWarn('ensureFirebaseCore: missing firebaseConfig.js values');
        return { ok: false, configured: false, error: 'Online service is not configured in this build.' };
    }
    const app = getFirebaseAppInstance();
    if (!auth) {
        try {
            auth = initializeAuth(app, {
                persistence: browserSessionPersistence,
                popupRedirectResolver: browserPopupRedirectResolver
            });
        } catch {
            auth = getAuth(app);
            try {
                await setPersistence(auth, browserSessionPersistence);
            } catch {
                // Fall back to Firebase's default persistence if local storage is blocked.
            }
        }
        installAccountObserver();
    }
    if (!db) {
        db = initializeFirestore(app, {
            experimentalAutoDetectLongPolling: true
        });
    }
    authLog('ensureFirebaseCore: ready', { hasAuth: Boolean(auth), hasDb: Boolean(db), currentUser: authUserSummary(auth?.currentUser || null) });
    return { ok: true, configured: true, auth, db };
}

function publicUserProfile(currentUser) {
    if (!currentUser) return null;
    const kind = accountKindForUser(currentUser);
    const displayName = displayNameForUser(currentUser);
    return {
        uid: currentUser.uid,
        displayName,
        photoURL: currentUser.photoURL || null,
        providerId: currentUser.providerData?.[0]?.providerId || (currentUser.isAnonymous ? 'anonymous' : 'firebase'),
        accountKind: kind,
        isAnonymous: Boolean(currentUser.isAnonymous),
        emailVerified: Boolean(currentUser.emailVerified)
    };
}

async function upsertUserProfile(currentUser, { source = 'session' } = {}) {
    if (!db || !currentUser) return null;
    const path = profilePathForUser(currentUser);
    const ref = doc(db, usersPath, currentUser.uid);
    lastProfileWrite = { ok: false, path, error: '' };
    let exists = false;
    try {
        exists = (await getDoc(ref)).exists();
    } catch (error) {
        // If rules are not deployed yet, login/visitor mode should still succeed,
        // but the account menu should reveal why users/{uid} is not visible.
        lastProfileWrite = { ok: false, path, error: String(error?.message || error || 'Profile read failed.') };
        return null;
    }
    const profile = publicUserProfile(currentUser);
    const data = {
        ...profile,
        source,
        lastSeenAt: serverTimestamp(),
        updatedAt: serverTimestamp()
    };
    if (!exists) {
        data.createdAt = serverTimestamp();
        data.stats = {
            gamesStarted: 0,
            roomsCreated: 0,
            lastGameKey: '',
            lastMatchKey: ''
        };
    }
    try {
        await setDoc(ref, data, { merge: true });
        lastProfileWrite = { ok: true, path, error: '' };
        return data;
    } catch (error) {
        // Profile writes are useful but should not block auth.
        lastProfileWrite = { ok: false, path, error: String(error?.message || error || 'Profile write failed.') };
        return null;
    }
}

async function upsertGoogleUserProfile(currentUser, { source = 'login' } = {}) {
    if (!db || !isGoogleUser(currentUser)) return null;
    return upsertUserProfile(currentUser, { source });
}

async function upsertVisitorUserProfile(currentUser, { source = 'visitor-login' } = {}) {
    if (!db || !currentUser || !currentUser.isAnonymous) return null;
    return upsertUserProfile(currentUser, { source });
}

async function completePendingGoogleRedirect() {
    if (!auth) return null;
    try {
        const result = await getRedirectResult(auth, browserPopupRedirectResolver);
        if (result?.user) {
            user = result.user;
            await upsertGoogleUserProfile(user, { source: 'google-redirect' });
            notifyAccountListeners();
            return result;
        }
    } catch (error) {
        authWarn('completePendingGoogleRedirect: redirect result failed', authErrorSummary(error));
        // Redirect result errors are shown only when the user explicitly tries login again.
    }
    return null;
}

export function getAccountState() {
    const currentUser = auth?.currentUser || user || null;
    const signedIn = isGoogleUser(currentUser);
    const isVisitor = Boolean(currentUser?.isAnonymous);
    const profileWrite = profileWriteStateForUser(currentUser);
    return {
        configured: hasFirebaseConfig(),
        ready: Boolean(auth),
        uid: currentUser?.uid || null,
        accountKind: accountKindForUser(currentUser),
        signedIn,
        isGoogle: signedIn,
        isVisitor,
        isGuest: !currentUser,
        isOfflineGuest: !currentUser,
        isAnonymous: Boolean(currentUser?.isAnonymous),
        displayName: displayNameForUser(currentUser),
        canEditDisplayName: Boolean(currentUser && !currentUser.isAnonymous),
        photoURL: signedIn ? (currentUser.photoURL || null) : null,
        emailVerified: signedIn ? Boolean(currentUser.emailVerified) : false,
        profilePath: profileWrite.path,
        profileSynced: profileWrite.ok,
        profileError: profileWrite.error
    };
}

export function subscribeAccountState(listener) {
    accountListeners.add(listener);
    listener(getAccountState());
    return () => accountListeners.delete(listener);
}

export async function initAccountSession({ autoVisitor = false } = {}) {
    const ready = await ensureFirebaseCore();
    if (!ready.ok) {
        notifyAccountListeners();
        return getAccountState();
    }
    await waitForInitialAuthState();
    await completePendingGoogleRedirect();
    if (autoVisitor && !auth.currentUser) {
        const result = await signInAnonymously(auth);
        user = result.user || auth.currentUser || await waitForAuth(auth);
    } else {
        user = auth.currentUser || null;
    }
    if (user?.isAnonymous) {
        await upsertVisitorUserProfile(user, { source: autoVisitor ? 'visitor-session' : 'account-session' });
    } else if (user) {
        await upsertGoogleUserProfile(user, { source: 'account-session' });
    }
    notifyAccountListeners();
    return getAccountState();
}

export async function signInAsVisitor() {
    authLog('signInAsVisitor: FIRST LINE', { currentUser: authUserSummary(auth?.currentUser || user || null) });
    const ready = await ensureFirebaseCore();
    if (!ready.ok) throw new Error(ready.error || 'Online sign-in is not configured.');
    await waitForInitialAuthState();
    if (!auth.currentUser || !auth.currentUser.isAnonymous) {
        if (auth.currentUser && !auth.currentUser.isAnonymous) await signOut(auth);
        const result = await signInAnonymously(auth);
        user = result.user || auth.currentUser || await waitForAuth(auth);
    } else {
        user = auth.currentUser || await waitForAuth(auth);
    }
    authLog('signInAsVisitor: signed in anonymously', { user: authUserSummary(user), path: profilePathForUser(user) });
    await upsertVisitorUserProfile(user, { source: 'visitor-button' });
    authLog('signInAsVisitor: online profile write finished', { lastProfileWrite });
    notifyAccountListeners();
    return getAccountState();
}

export async function signInWithGoogleAccount({ source = 'google-login' } = {}) {
    authLog('signInWithGoogleAccount: FIRST LINE', {
        source,
        href: globalThis.location?.href || '',
        hasAuth: Boolean(auth),
        hasDb: Boolean(db),
        currentUserBeforeCore: authUserSummary(auth?.currentUser || user || null)
    });

    const ready = await ensureFirebaseCore();
    authLog('signInWithGoogleAccount: after ensureFirebaseCore', {
        ok: Boolean(ready.ok),
        configured: Boolean(ready.configured),
        hasAuth: Boolean(auth),
        hasDb: Boolean(db),
        currentUser: authUserSummary(auth?.currentUser || user || null)
    });
    if (!ready.ok) throw new Error(ready.error || 'Online sign-in is not configured.');

    // Do not sign out the anonymous Visitor before opening the Google popup.
    // Signing out first makes the UI briefly become Offline Guest and can also
    // consume the browser's trusted click activation before the popup opens.
    // signInWithPopup(auth, provider) is the user-gesture action; when it
    // succeeds, Firebase Auth replaces the current session with the Google user.
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    authLog('signInWithGoogleAccount: provider created; calling signInWithPopup next', {
        source,
        previousAccountKind: accountKindForUser(auth?.currentUser || user || null),
        previousUser: authUserSummary(auth?.currentUser || user || null)
    });

    let result;
    try {
        result = await signInWithPopup(auth, provider, browserPopupRedirectResolver);
        authLog('signInWithGoogleAccount: signInWithPopup resolved', {
            user: authUserSummary(result?.user || null),
            providerId: result?.providerId || '',
            operationType: result?.operationType || ''
        });
    } catch (error) {
        authWarn('signInWithGoogleAccount: signInWithPopup threw', authErrorSummary(error));
        const codeOrMessage = String(error?.code || error?.message || '');
        if (/popup-blocked|popup-closed-by-user|cancelled-popup-request|operation-not-supported-in-this-environment/i.test(codeOrMessage)) {
            authWarn('signInWithGoogleAccount: attempting redirect fallback after popup failure', authErrorSummary(error));
            await signInWithRedirect(auth, provider, browserPopupRedirectResolver);
            authLog('signInWithGoogleAccount: signInWithRedirect returned without immediate navigation', {
                currentUser: authUserSummary(auth?.currentUser || user || null)
            });
            return getAccountState();
        }
        throw error;
    }

    user = result?.user || auth.currentUser || null;
    if (!user) {
        authError('signInWithGoogleAccount: popup resolved without a user');
        throw new Error('Google sign-in finished without returning an account.');
    }
    if (user.isAnonymous) {
        authError('signInWithGoogleAccount: popup returned an anonymous user, not a Google user', {
            user: authUserSummary(user)
        });
        throw new Error('Google sign-in did not return a Google account. Please try again.');
    }

    authLog('signInWithGoogleAccount: writing online profile', {
        path: profilePathForUser(user),
        accountKind: accountKindForUser(user),
        user: authUserSummary(user)
    });
    await upsertGoogleUserProfile(user, { source });
    authLog('signInWithGoogleAccount: online profile write finished', {
        lastProfileWrite,
        accountState: getAccountState()
    });
    notifyAccountListeners();
    return getAccountState();
}

export async function updateUserDisplayName(name) {
    const ready = await ensureFirebaseCore();
    if (!ready.ok) throw new Error(ready.error || 'Online sign-in is not configured.');
    await waitForInitialAuthState();
    const currentUser = auth?.currentUser || user || null;
    if (!currentUser) throw new Error('Sign in before setting a visible name.');
    if (currentUser.isAnonymous) throw new Error('Visible names are available after Google sign-in.');
    const displayName = setLocalDisplayName(currentUser, name);
    try {
        await updateProfile(currentUser, { displayName });
        user = auth?.currentUser || currentUser;
    } catch (error) {
        authWarn('updateUserDisplayName: updateProfile failed; saving Firestore/local name only', authErrorSummary(error));
    }
    await upsertGoogleUserProfile(currentUser, { source: 'display-name' });
    await refreshCurrentRoomPlayerProfile(currentUser);
    notifyAccountListeners();
    return getAccountState();
}

export async function signOutToGuest() {
    const ready = await ensureFirebaseCore();
    if (ready.ok && auth?.currentUser) {
        try {
            if (initialized && roomId) await leaveRoom({ updateRemote: true, forget: true });
        } catch {
            // The account switch should still complete if the room cleanup fails.
        }
        await signOut(auth);
    }
    user = null;
    lastProfileWrite = { ok: false, path: '', error: '' };
    notifyAccountListeners();
    return getAccountState();
}

function opposite(color) {
    return color === 'white' ? 'black' : 'white';
}

function randomPlayerColor() {
    return Math.random() < 0.5 ? 'white' : 'black';
}

function playerColorInRoom(room, uid = user?.uid) {
    if (!uid) return null;
    if (room?.players?.white === uid) return 'white';
    if (room?.players?.black === uid) return 'black';
    return null;
}

function waitingPlayerUid(room) {
    const players = room?.players || {};
    if (players.waiting) return players.waiting;
    const assigned = [players.white, players.black].filter(Boolean);
    if (assigned.length === 1 && room?.status === 'waiting') return assigned[0];
    return room?.hostUid || null;
}

function playerProfileForRoom(currentUser = user) {
    const profile = publicUserProfile(currentUser);
    if (!profile) return null;
    return {
        uid: profile.uid,
        displayName: profile.displayName,
        accountKind: profile.accountKind,
        photoURL: profile.photoURL || null
    };
}

function roomPlayerInfoForColor(color, currentUser = user) {
    return color ? { [color]: playerProfileForRoom(currentUser) } : {};
}

async function refreshCurrentRoomPlayerProfile(currentUser = user) {
    if (!db || !roomId || !currentUser) return;
    const room = latestRoom || {};
    const uid = currentUser.uid;
    const updates = {};
    const profile = playerProfileForRoom(currentUser);
    if (!profile) return;
    if (room.players?.white === uid) updates['playerInfo.white'] = profile;
    if (room.players?.black === uid) updates['playerInfo.black'] = profile;
    if (room.players?.waiting === uid) updates['playerInfo.waiting'] = profile;
    if (!Object.keys(updates).length) return;
    try {
        await updateDoc(roomReference(roomId), {
            ...updates,
            updatedAt: serverTimestamp()
        });
        latestRoom = {
            ...room,
            playerInfo: {
                ...(room.playerInfo || {}),
                ...(updates['playerInfo.white'] ? { white: updates['playerInfo.white'] } : {}),
                ...(updates['playerInfo.black'] ? { black: updates['playerInfo.black'] } : {}),
                ...(updates['playerInfo.waiting'] ? { waiting: updates['playerInfo.waiting'] } : {})
            }
        };
    } catch (error) {
        authWarn('refreshCurrentRoomPlayerProfile: room profile update failed', authErrorSummary(error));
    }
}

function waitingPlayerProfile(room) {
    const info = room?.playerInfo || {};
    return info.waiting || info.white || info.black || null;
}

function randomizeMatchedPlayerInfo(room, joiningProfile) {
    const waitingProfile = waitingPlayerProfile(room);
    if (!waitingProfile || !joiningProfile || waitingProfile.uid === joiningProfile.uid) return room?.playerInfo || {};
    const waitingColor = randomPlayerColor();
    return {
        white: waitingColor === 'white' ? waitingProfile : joiningProfile,
        black: waitingColor === 'black' ? waitingProfile : joiningProfile,
        waiting: null
    };
}

function randomizeMatchedPlayers(room, joiningUid) {
    const waitingUid = waitingPlayerUid(room);
    if (!waitingUid || waitingUid === joiningUid) return null;
    const waitingColor = randomPlayerColor();
    const joiningColor = opposite(waitingColor);
    return {
        color: joiningColor,
        players: {
            ...(room.players || {}),
            white: waitingColor === 'white' ? waitingUid : joiningUid,
            black: waitingColor === 'black' ? waitingUid : joiningUid,
            waiting: null
        }
    };
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

function boardStateFromRoom(room) {
    if (!room?.board) return null;
    const board = decodeBoardFromFirestore(room.board);
    if (board && typeof board === 'object' && room.turn) {
        board.currentPlayer = room.turn;
        if (board.go && typeof board.go === 'object') board.go.currentPlayer = room.turn;
    }
    return board;
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
    const waitingUid = waitingPlayerUid(room);
    const assignedPlayers = new Set([room?.players?.white, room?.players?.black].filter(Boolean));
    return room?.status === 'waiting'
        && room?.public === true
        && room?.matchKey === hooks.matchKey
        && room?.gameKey === hooks.gameKey
        && waitingUid
        && waitingUid !== user?.uid
        && !assignedPlayers.has(user?.uid)
        && assignedPlayers.size < 2;
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
        throw new Error('Online multiplayer is not initialized.');
    }
}

function withTimeout(promise, label = 'Online operation') {
    let timer = null;
    return Promise.race([
        promise,
        new Promise((_, reject) => {
            timer = window.setTimeout(() => {
                reject(new Error(`${label} timed out. Check that the online room service is available and permissions allow this request.`));
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

function getIdentityChannel() {
    if (identityChannel || !globalThis.BroadcastChannel) return identityChannel;
    identityChannel = new BroadcastChannel(identityBroadcastName);
    identityChannel.addEventListener('message', (event) => {
        const message = event.data || {};
        if (message.source !== 'topoboardgame' || message.tabId === tabInstanceId) return;
        if (message.type !== 'uid-presence-check') return;
        const currentUid = user?.uid || auth?.currentUser?.uid;
        if (!currentUid || currentUid !== message.uid) return;
        identityChannel.postMessage({
            source: 'topoboardgame',
            type: 'uid-present',
            uid: currentUid,
            tabId: tabInstanceId,
            to: message.tabId
        });
    });
    return identityChannel;
}

function waitMs(ms) {
    return new Promise((resolve) => window.setTimeout(resolve, ms));
}

async function ensureDistinctTabIdentity() {
    const channel = getIdentityChannel();
    if (!channel || !auth?.currentUser?.isAnonymous) return auth?.currentUser || null;

    for (let attempt = 0; attempt < 2; attempt += 1) {
        const uid = auth.currentUser?.uid;
        if (!uid) return auth.currentUser || null;
        let duplicateSeen = false;
        const onMessage = (event) => {
            const message = event.data || {};
            if (message.source !== 'topoboardgame'
                || message.type !== 'uid-present'
                || message.to !== tabInstanceId
                || message.uid !== uid
                || message.tabId === tabInstanceId) {
                return;
            }
            duplicateSeen = true;
        };
        channel.addEventListener('message', onMessage);
        channel.postMessage({
            source: 'topoboardgame',
            type: 'uid-presence-check',
            uid,
            tabId: tabInstanceId
        });
        await waitMs(duplicateIdentityWaitMs);
        channel.removeEventListener('message', onMessage);
        if (!duplicateSeen) return auth.currentUser;

        status('Refreshing online identity for this browser tab...');
        await signOut(auth);
        await signInAnonymously(auth);
        user = auth.currentUser || await waitForAuth(auth);
    }

    return auth.currentUser || null;
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
        throw new Error('Online rooms are unavailable because the online room database is not enabled for this project.');
    }
    if (/NOT_FOUND|database.*not.*found|Database does not exist/i.test(text)) {
        throw new Error('Online rooms are unavailable because the online room database has not been created yet.');
    }
    if (/PERMISSION_DENIED|Missing or insufficient permissions/i.test(text)) {
        throw new Error('Online rooms are unavailable because online room permissions are blocking this request.');
    }
    throw new Error(`Online room service check failed (${response.status}).`);
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
        status('Online service is not configured in this build.');
        return { ok: false, configured: false, error: 'Online service is not configured in this build.' };
    }
    if (initializationPromise) return initializationPromise;
    if (initialized) {
        if (!user && auth?.currentUser) user = auth.currentUser;
        if (!user) {
            initialized = false;
            firestoreReady = false;
            firestoreInitError = '';
        } else if (firestoreInitError) {
            status(firestoreInitError);
            return { ok: false, configured: true, error: firestoreInitError };
        } else {
            return { ok: true, user, roomId, playerColor };
        }
    }

    initializationPromise = (async () => {
        const core = await ensureFirebaseCore();
        if (!core.ok) {
            const error = core.error || 'Online service is not configured in this build.';
            status(error);
            return { ok: false, configured: core.configured, error };
        }
        await waitForInitialAuthState();
        await completePendingGoogleRedirect();
        status(auth.currentUser && !auth.currentUser.isAnonymous ? 'Using your Google account for online play...' : 'Preparing visitor mode for online play...');
        if (!auth.currentUser) {
            const result = await signInAnonymously(auth);
            user = result.user || auth.currentUser || await waitForAuth(auth);
        } else {
            user = auth.currentUser;
        }
        user = await ensureDistinctTabIdentity();
        if (user?.isAnonymous) {
            await upsertVisitorUserProfile(user, { source: 'online-init' });
        } else if (user) {
            await upsertGoogleUserProfile(user, { source: 'online-init' });
        }
        notifyAccountListeners();
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
    try {
        return await initializationPromise;
    } finally {
        initializationPromise = null;
    }
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
        playerInfo: {
            ...roomPlayerInfoForColor(initialTurn, user),
            [opposite(initialTurn)]: null,
            waiting: null
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
        if (room.public && room.players?.waiting === user.uid) return { room, color: null };
        if (room.public && room.status === 'waiting') {
            const assignment = randomizeMatchedPlayers(room, user.uid);
            if (!assignment) throw new Error('Room is full or already finished.');
            const nextPlayerInfo = randomizeMatchedPlayerInfo(room, playerProfileForRoom(user));
            const nextRoom = {
                ...room,
                status: 'playing',
                players: assignment.players,
                playerInfo: nextPlayerInfo,
                turn: room.turn || 'white'
            };
            transaction.update(ref, {
                players: assignment.players,
                playerInfo: nextPlayerInfo,
                status: 'playing',
                turn: nextRoom.turn,
                updatedAt: serverTimestamp()
            });
            return { room: nextRoom, color: assignment.color };
        }
        const openColor = room.players?.white == null
            ? 'white'
            : room.players?.black == null ? 'black' : null;
        if (room.status !== 'waiting' || !openColor) {
            throw new Error('Room is full or already finished.');
        }
        transaction.update(ref, {
            [`players.${openColor}`]: user.uid,
            [`playerInfo.${openColor}`]: playerProfileForRoom(user),
            status: 'playing',
            updatedAt: serverTimestamp()
        });
        return {
            room: {
                ...room,
                status: 'playing',
                players: { ...room.players, [openColor]: user.uid },
                playerInfo: { ...(room.playerInfo || {}), [openColor]: playerProfileForRoom(user) }
            },
            color: openColor
        };
    }), 'Join room');

    roomId = requestedRoom;
    playerColor = joined.color;
    lastLoadedMoveNumber = Number(joined.room.moveNumber) || 0;
    localStorage.setItem(reconnectStorageKey, roomId);
    const joinedBoard = boardStateFromRoom(joined.room);
    if (joinedBoard) {
        hooks.loadBoardState?.(joinedBoard);
        hooks.renderBoard?.();
    }
    status(playerColor
        ? `Joined room ${roomId} as ${playerColor}.`
        : `Room ${roomId}: waiting for an opponent.`);
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
        limit(200)
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
        limit(200)
    );
    const candidates = await withTimeout(getDocs(fallbackQuery), 'Find match');
    const match = candidates.docs.find((candidate) => roomMatchesCurrentBucket(candidate.data()));
    return match?.id || '';
}

async function claimPublicMatchRoom(id, board, initialTurn, { allowCreate = false } = {}) {
    const ref = roomReference(id);
    return withTimeout(runTransaction(db, async (transaction) => {
        const snapshot = await transaction.get(ref);
        if (!snapshot.exists()) {
            if (!allowCreate) return null;
            const room = {
                status: 'waiting',
                public: true,
                players: {
                    waiting: user.uid,
                    white: null,
                    black: null
                },
                playerInfo: {
                    waiting: playerProfileForRoom(user),
                    white: null,
                    black: null
                },
                hostUid: user.uid,
                turn: initialTurn,
                gameKey: hooks.gameKey,
                matchKey: hooks.matchKey,
                board: encodeBoardForFirestore(board),
                moveNumber: 0,
                lastMove: null,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            };
            transaction.set(ref, room);
            return { action: 'created', roomId: id, color: null, room };
        }

        const room = snapshot.data();
        if (room.gameKey !== hooks.gameKey || room.matchKey !== hooks.matchKey) return null;
        const existingColor = playerColorInRoom(room);
        if (existingColor) {
            return {
                action: room.status === 'playing' ? 'joined' : 'waiting',
                roomId: id,
                color: existingColor,
                room
            };
        }
        if (room.players?.waiting === user.uid) {
            return { action: 'waiting', roomId: id, color: null, room };
        }
        if (!roomMatchesCurrentBucket(room)) return null;
        const assignment = randomizeMatchedPlayers(room, user.uid);
        if (!assignment) return null;
        const nextPlayerInfo = randomizeMatchedPlayerInfo(room, playerProfileForRoom(user));
        const nextRoom = {
            ...room,
            status: 'playing',
            players: assignment.players,
            playerInfo: nextPlayerInfo,
            turn: room.turn || initialTurn
        };
        transaction.update(ref, {
            players: assignment.players,
            playerInfo: nextPlayerInfo,
            status: 'playing',
            turn: nextRoom.turn,
            updatedAt: serverTimestamp()
        });
        return {
            action: 'joined',
            roomId: id,
            color: assignment.color,
            room: nextRoom
        };
    }), 'Find match');
}

function enterPublicMatchResult(result) {
    if (!result) return null;
    roomId = result.roomId;
    playerColor = result.color || null;
    lastLoadedMoveNumber = Number(result.room?.moveNumber) || 0;
    localStorage.setItem(reconnectStorageKey, roomId);
    const matchedBoard = boardStateFromRoom(result.room);
    if (matchedBoard && result.action === 'joined') {
        hooks.loadBoardState?.(matchedBoard);
        hooks.renderBoard?.();
    }
    status(result.action === 'joined'
        ? `Matched in room ${roomId} as ${playerColor}.`
        : `Room ${roomId}: waiting for an opponent.`);
    listenToRoom(roomId);
    listenToChat(roomId);
    return { roomId, playerColor };
}

export async function findMatch(initialBoard) {
    requireReady();
    await leaveRoom({ updateRemote: false });
    status(`Looking for a public match (${hooks.matchKey})...`);

    const board = firestoreValue(initialBoard ?? hooks.getCurrentBoardState?.());
    const initialTurn = hooks.getCurrentTurn?.(board) || board?.currentPlayer || 'white';

    const existingRoomId = await findWaitingMatchCandidate();
    if (existingRoomId) {
        const result = await claimPublicMatchRoom(existingRoomId, board, initialTurn);
        const entered = enterPublicMatchResult(result);
        if (entered) return entered;
    }

    let lastSlotError = null;
    for (const id of publicMatchRoomIds()) {
        try {
            const result = await claimPublicMatchRoom(id, board, initialTurn, { allowCreate: true });
            if (!result) continue;
            const entered = enterPublicMatchResult(result);
            if (entered) return entered;
        } catch (error) {
            lastSlotError = error;
            // Try the next deterministic slot if this one races or fails.
        }
    }

    const retryRoomId = await findWaitingMatchCandidate();
    if (retryRoomId) {
        const result = await claimPublicMatchRoom(retryRoomId, board, initialTurn);
        const entered = enterPublicMatchResult(result);
        if (entered) return entered;
    }

    const reason = lastSlotError?.message ? ` Last slot error: ${lastSlotError.message}` : '';
    throw new Error(`Could not reserve or join a matchmaking slot.${reason}`);
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
        const previousRoom = latestRoom;
        latestRoom = room;
        const color = room.players?.white === user.uid
            ? 'white'
            : room.players?.black === user.uid ? 'black' : null;
        if (color) playerColor = color;

        const remoteMoveNumber = Number(room.moveNumber) || 0;
        const decodedBoard = boardStateFromRoom(room);
        const statusBecamePlaying = previousRoom?.status !== 'playing' && room.status === 'playing';
        if (decodedBoard && (remoteMoveNumber > lastLoadedMoveNumber || statusBecamePlaying)) {
            lastLoadedMoveNumber = remoteMoveNumber;
            hooks.loadBoardState?.(decodedBoard);
            hooks.renderBoard?.();
        }
        const hookRoom = decodedBoard
            ? { ...room, board: decodedBoard }
            : room;
        hooks.onRoomChanged?.({
            roomId,
            playerColor,
            room: hookRoom
        });

        if (room.status === 'waiting') {
            status(`Room ${roomId}: waiting for an opponent.`);
        } else if (room.status === 'playing') {
            const visibleName = playerColor && room.playerInfo?.[playerColor]?.displayName ? ` (${room.playerInfo[playerColor].displayName})` : '';
            status(`Connected as ${playerColor || 'spectator'}${visibleName}. ${room.turn} to move.`);
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
        const currentBoard = boardStateFromRoom(room);
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
        displayName: displayNameForUser(user),
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
                const waiting = room.players?.waiting === user.uid;
                if (!color && !waiting) return;
                const updates = {
                    status: 'finished',
                    updatedAt: serverTimestamp()
                };
                if (color) {
                    updates[`players.${color}`] = null;
                    updates[`playerInfo.${color}`] = null;
                }
                if (waiting) {
                    updates['players.waiting'] = null;
                    updates['playerInfo.waiting'] = null;
                }
                transaction.update(ref, updates);
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
        this.ready = null;
    }

    onlineOptions() {
        const game = this.game;
        return {
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
        };
    }

    async ensureReady() {
        this.ready = initOnline(this.onlineOptions());
        const ready = await this.ready;
        if (ready && !ready.ok) {
            this.game.showOnlineStatus(ready.error || 'Online rooms are not available yet.');
        }
        return ready;
    }

    async createRoom() {
        try {
            const ready = await this.ensureReady();
            if (!ready?.ok) return;
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
            const ready = await this.ensureReady();
            if (!ready?.ok) return;
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
            const ready = await this.ensureReady();
            if (!ready?.ok) return;
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
            const urlRoom = new URLSearchParams(window.location.search).get('room');
            let rememberedRoom = '';
            try {
                rememberedRoom = localStorage.getItem(reconnectStorageKey) || '';
            } catch {
                rememberedRoom = '';
            }
            if (!urlRoom && !rememberedRoom) return false;
            const ready = await this.ensureReady();
            if (!ready?.ok) return false;
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
        if (!state.configured) this.game.showOnlineStatus('Online service is not configured in this build.');
    }

    setStatus(_state, text) {
        this.game.showOnlineStatus(text);
    }

    sendMessage(data) {
        if (data?.type === 'newGame') {
            this.game.showOnlineStatus('Start a new online room for a rematch.');
        }
    }
}
